# Handoff — Run #12b P4 summary/rewrite 补评测完成

## 本会话决策

| 决策 | 状态 |
|------|------|
| Run #12 初次 Attempt（Python 3.13 free-threaded JIT） | N/A：样本不足 + 全文归档不合格 |
| Run #12b 重跑（Next.js 15 async request APIs） | ✅ 完成，评分 5/5 |
| P4 Same-Source Merge 证据范围 | ✅ 从逐字 + translation 扩展到 summary/rewrite |
| P4 active 状态 | ✅ 保持 active，语义同源合并证据闭环 |
| 长期文档同步 | ✅ 已同步 survey.md 与 mechanism-candidates.md #19 |
| 写 handoff | ✅ 用户显式要求，触发 project-rules.md 4.a |

---

## 本会话净变化

### Run #12 / Run #12b

权威文件：

- [run-12-p4-summary-rewrite.md](search-orchestrator/experiments/run-12-p4-summary-rewrite.md)
- [run-12-output.md](search-orchestrator/experiments/run-12-output.md)
- [run-12b-output.md](search-orchestrator/experiments/run-12b-output.md)
- [run-12b-ground-truth.md](search-orchestrator/experiments/run-12b-ground-truth.md)
- [run-12b-baseline.py](search-orchestrator/experiments/run-12b-baseline.py)
- [run-12b-baseline-output.md](search-orchestrator/experiments/run-12b-baseline-output.md)

Run #12 初次 Attempt 结论：

- query：`Python 3.13 free-threaded JIT 新特性 迁移影响`
- 结果：N/A
- 原因：summary/rewrite 主样本只有 2 对，低于 ≥3 门槛；§2 仍是摘要式归档；fallback 未完整执行。

Run #12b 结论：

- query：`Next.js 15 async request APIs breaking changes 迁移`
- Ground truth 主指标 positive pair：5 对
  - semantic-summary：3 对
  - semantic-rewrite：2 对
- Baseline（URL normalization + SimHash + Jaccard）：P=1.00, R=0.00, F1=0.00
- P4 LLM：P=1.00, R=1.00, F1=1.00
- Net Gain：+1.00
- False Merge：0
- Information Loss：0
- 评分：5/5

重要执行教训：Run #12b 第一次产出时样本已达标但 §2 仍不合格；用户要求 Cline 只补 §2 全文归档后，14 个成功 URL 均补齐完整正文或合规分块，才允许进入 ground truth / baseline。

### 长期文档同步

- [survey.md §9.2](search-orchestrator/survey.md#L300)：新增 Run #12b 实验行。
- [survey.md §9.3](search-orchestrator/survey.md#L314)：P4 状态更新为逐字、translation、summary、rewrite 均有证据覆盖。
- [survey.md §10.2](search-orchestrator/survey.md#L356)：P4 现成结论影响补 Run #12b。
- [mechanism-candidates.md #19](mechanism-candidates.md#L41)：#19 更新为逐字 + translation + summary/rewrite 语义子类均验证通过。

---

## 本会话新增文件

| 文件 | 说明 |
|------|------|
| `docs/search-orchestrator/experiments/run-12-output.md` | Run #12 初次 Phase 0 输出，最终 N/A |
| `docs/search-orchestrator/experiments/run-12-p4-summary-rewrite.md` | Run #12/12b 实验框架、重跑协议、结果与评分 |
| `docs/search-orchestrator/experiments/run-12b-output.md` | Run #12b Phase 0 Cline + SKILL 输出 |
| `docs/search-orchestrator/experiments/run-12b-ground-truth.md` | Run #12b ground truth 标注 |
| `docs/search-orchestrator/experiments/run-12b-baseline.py` | Run #12b SimHash/Jaccard baseline 脚本 |
| `docs/search-orchestrator/experiments/run-12b-baseline-output.md` | Run #12b baseline 输出 |

## 本会话修改文件

| 文件 | 改动 |
|------|------|
| `docs/search-orchestrator/survey.md` | §9.2 新增 Run #12b；§9.3 / §10.2 更新 P4 证据范围 |
| `docs/mechanism-candidates.md` | #19 更新 Run #12b evidence 与状态说明 |
| `docs/handoff.md` | 覆盖为本交接 |

---

## 当前路线图

权威源：

- [survey.md §9.3 最终路线状态](search-orchestrator/survey.md#L314)
- [mechanism-candidates.md](mechanism-candidates.md)

本会话净变化：

- P4：从“逐字 + translation 有证据；summary/rewrite 待补” → “逐字 + translation + summary + rewrite 均有证据”。
- #19：保持已机制化，并扩展为逐字 + translation + summary/rewrite 语义子类均验证通过。
- P4 后续不再需要继续补 summary/rewrite；除非出现 false merge 或信息损失案例，否则可视为证据闭环。

---

## 未完成项 / 后续可选方向

| 方向 | 说明 | 优先级 |
|------|------|--------|
| P5 Output Schema 重设计 | Run #9c 双盲证伪后，若继续应换新设计：非结构化证据集 + 非字段对齐 schema，避免重复字段对齐天花板场景 | 中 |
| #22 Browser Fetch 启动评估 | 当前候选（暂缓）。只有 Tier C snippet-only 被证明严重影响答案质量时才启动 | 低 |
| 审查 / 整理已机制化提示词残留 | #17 / #19 已机制化后，可后续检查是否存在可删除或收敛的提示词冗余 | 低 |

---

## Handoff（下次会话第一句话建议）

首句话提示词：

```text
先读 docs/project-rules.md 一次，遵守里面的三份文档职责划分与五条防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：本会话完成 Run #12b P4 summary/rewrite 子类补评测（5/5），并同步 survey.md 与 mechanism-candidates.md #19。P4 证据已覆盖逐字、translation、summary、rewrite，除非未来出现 false merge / 信息损失案例，否则 P4 可视为证据闭环。下一步建议优先推进 P5 Output Schema 重设计，注意不要复用 Run #9c 已证伪的字段对齐天花板场景。
