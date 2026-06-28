import hashlib
import itertools
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "run-12b-output.md"
RESULT = ROOT / "run-12b-baseline-output.md"

SUCCESS_RE = re.compile(r"^### URL-(\d+): (.+)$", re.MULTILINE)

GT_POSITIVE = {
    tuple(sorted(pair))
    for pair in [(1, 6), (1, 10), (1, 9), (1, 11), (3, 7)]
}

GT_SUMMARY = {tuple(sorted(pair)) for pair in [(1, 6), (1, 11), (3, 7)]}
GT_REWRITE = {tuple(sorted(pair)) for pair in [(1, 10), (1, 9)]}

T_LEVEL = {
    1: "T1",
    2: "T1",
    3: "T1",
    4: "T2",
    5: "T1",
    6: "T3",
    7: "T3",
    8: "T2",
    9: "T3",
    10: "T3",
    11: "T3",
    12: "T4",
    13: "T1",
    14: "T4",
}

T_RANK = {"T1": 4, "T2": 3, "T3": 2, "T4": 1}


def normalize_url(url: str) -> str:
    parsed = urlparse(url.strip())
    host = parsed.netloc.lower()
    if host.startswith("www."):
        host = host[4:]
    path = re.sub(r"/+$", "", parsed.path)
    return f"{host}{path}"


def extract_url_blocks(text: str) -> dict[int, dict[str, str]]:
    matches = list(SUCCESS_RE.finditer(text))
    blocks = {}
    for index, match in enumerate(matches):
        number = int(match.group(1))
        url = match.group(2).strip()
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else text.find("\n## §3", start)
        if end == -1:
            end = len(text)
        block = text[start:end]
        if "**fetch 状态**: 成功" not in block:
            continue
        body_match = re.search(r"(?:\*\*正文\*\*[:：]|\*\*正文开头 1000 字\*\*[:：])\s*(.*)", block, re.DOTALL)
        body = body_match.group(1).strip() if body_match else block.strip()
        blocks[number] = {"url": url, "body": body}
    return blocks


def shingles(text: str, width: int = 5) -> set[str]:
    normalized = re.sub(r"\s+", "", text.lower())
    if len(normalized) <= width:
        return {normalized} if normalized else set()
    return {normalized[i : i + width] for i in range(len(normalized) - width + 1)}


def stable_hash64(token: str) -> int:
    return int.from_bytes(hashlib.blake2b(token.encode("utf-8"), digest_size=8).digest(), "big")


def simhash(tokens: set[str]) -> int:
    vector = [0] * 64
    for token in tokens:
        value = stable_hash64(token)
        for bit in range(64):
            vector[bit] += 1 if value & (1 << bit) else -1
    fingerprint = 0
    for bit, score in enumerate(vector):
        if score >= 0:
            fingerprint |= 1 << bit
    return fingerprint


def hamming(a: int, b: int) -> int:
    return (a ^ b).bit_count()


def jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 1.0
    union = len(a | b)
    return len(a & b) / union if union else 0.0


def retained_url(a: int, b: int) -> int:
    rank_a = T_RANK[T_LEVEL[a]]
    rank_b = T_RANK[T_LEVEL[b]]
    if rank_a != rank_b:
        return a if rank_a > rank_b else b
    return min(a, b)


def metrics(predicted: set[tuple[int, int]], positives: set[tuple[int, int]]) -> tuple[float, float, float]:
    tp = len(predicted & positives)
    precision = tp / len(predicted) if predicted else 1.0
    recall = tp / len(positives) if positives else 1.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return precision, recall, f1


def main() -> None:
    text = OUTPUT.read_text(encoding="utf-8")
    blocks = extract_url_blocks(text)
    token_sets = {number: shingles(data["url"] + "\n" + data["body"]) for number, data in blocks.items()}
    simhashes = {number: simhash(tokens) for number, tokens in token_sets.items()}
    normalized_urls = {number: normalize_url(data["url"]) for number, data in blocks.items()}

    rows = []
    predicted = set()
    sensitivity_extra = set()

    for a, b in itertools.combinations(sorted(blocks), 2):
        url_equal = normalized_urls[a] == normalized_urls[b]
        distance = hamming(simhashes[a], simhashes[b])
        jac = jaccard(token_sets[a], token_sets[b])
        simhash_hit = distance <= 3
        jaccard_hit = jac >= 0.90
        sensitivity_hit = jac >= 0.80
        decision = url_equal or simhash_hit or jaccard_hit
        pair = tuple(sorted((a, b)))
        if decision:
            predicted.add(pair)
        elif sensitivity_hit:
            sensitivity_extra.add(pair)
        rows.append((a, b, url_equal, distance, jac, sensitivity_hit, decision, retained_url(a, b)))

    p, r, f1 = metrics(predicted, GT_POSITIVE)
    summary_recall = len(predicted & GT_SUMMARY) / len(GT_SUMMARY)
    rewrite_recall = len(predicted & GT_REWRITE) / len(GT_REWRITE)
    false_merge = len(predicted - GT_POSITIVE)
    info_loss = false_merge

    lines = [
        "# Run #12b Baseline — SimHash/Jaccard + URL 规范化",
        "",
        "## 算法参数",
        "",
        "| 参数 | 值 |",
        "|------|----|",
        "| URL 规范化 | scheme 去除，host 小写，去 www，path 去尾部斜杠 |",
        "| SimHash | title/url + 正文归档文本，字符 5-shingle，64-bit，汉明距离 ≤ 3 |",
        "| Jaccard 主阈值 | 字符 5-shingle，Jaccard ≥ 0.90 |",
        "| Jaccard sensitivity | 字符 5-shingle，Jaccard ≥ 0.80，仅报告，不计主合并 |",
        "| 输入 URL 数 | %d 个成功 fetch URL |" % len(blocks),
        "",
        "## 合并决策表",
        "",
        "| #A | #B | URL 规范化 | SimHash 汉明距 | Jaccard | Jaccard 0.80 sensitivity | 合并决策 | 保留 |",
        "|----|----|------------|----------------|---------|---------------------------|----------|------|",
    ]

    for a, b, url_equal, distance, jac, sensitivity_hit, decision, retain in rows:
        if decision or sensitivity_hit or tuple(sorted((a, b))) in GT_POSITIVE:
            lines.append(
                f"| #{a} | #{b} | {'是' if url_equal else '否'} | {distance} | {jac:.3f} | {'是' if sensitivity_hit else '否'} | {'合并' if decision else '不合并'} | #{retain if decision else '—'} |"
            )

    lines.extend(
        [
            "",
            "## 统计",
            "",
            f"- URL 规范化合并对数：{sum(1 for row in rows if row[2])}",
            f"- SimHash 合并对数：{sum(1 for row in rows if row[3] <= 3)}",
            f"- Jaccard 0.90 合并对数：{sum(1 for row in rows if row[4] >= 0.90)}",
            f"- 总合并对数（去重）：{len(predicted)}",
            f"- Jaccard 0.80 sensitivity 额外命中：{len(sensitivity_extra)}",
            "",
            "## 与 Ground Truth 对比",
            "",
            f"- GT 主指标 positive pair：{len(GT_POSITIVE)}",
            f"- Baseline 命中 positive pair：{len(predicted & GT_POSITIVE)}",
            f"- Precision：{p:.2f}",
            f"- Recall：{r:.2f}",
            f"- F1：{f1:.2f}",
            f"- Summary Recall：{summary_recall:.2f}",
            f"- Rewrite Recall：{rewrite_recall:.2f}",
            f"- False Merge Count：{false_merge}",
            f"- Information Loss：{info_loss}",
            "",
            "## 命中/漏检主指标 pair",
            "",
            "| Pair | GT 类型 | Baseline 决策 |",
            "|------|---------|---------------|",
        ]
    )

    for pair in sorted(GT_POSITIVE):
        category = "summary" if pair in GT_SUMMARY else "rewrite"
        lines.append(f"| #{pair[0]}-#{pair[1]} | {category} | {'命中' if pair in predicted else '漏检'} |")

    RESULT.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
