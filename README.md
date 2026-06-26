# search-orchestrator

把「商业 agent 搜索体系的工程动作」转译为「Cline + DuckDuckGo MCP 栈上的提示词层机制」，使零 API key、零付费后端的开源 agent 搜索能力接近商业 agent（Perplexity / Tavily / Exa）的工程质量。

> 本项目是 Cline 之上的搜索编排扩展层，不是新的 Agent 框架。Cline 已是相当完整的宿主（Plan/Act、Hooks、Memory Bank、Checkpoint、Rules、Subagents、Workflow、CLI），本项目只补 Cline 在 web search 上真正缺失的部分。

---

## 它解决什么问题

Cline 自身没有内置 web search，依赖外部 MCP（默认 DuckDuckGo）。直接装好 DDG MCP 后的能力位置是「裸 search + LLM 自行处理」——与商业 agent 的差距是**结构性**的。

但调研发现：差距的 **80% 不在搜索引擎本身**，而在围绕搜索的 5~7 个工程动作（域名过滤、citation 强制、query 改写、压缩、结构化、失败处理）。其中绝大多数可以**靠提示词补齐，不需要新依赖、不需要 API key、不需要换后端**。

详见 [docs/research/01-background.md](docs/research/01-background.md)。

---

## 主要成果

2026-06-23 ~ 2026-06-26 共 4 天，完成 **14 轮双盲 A/B 实验**，验证了 **6 个提示词层机制 + 1 个基础设施层机制**，全部升级 active；同期通过 4 轮证伪实验否决了 4 条候选路径。

### 已升级 active 的机制（6 + 1）

| ID | 机制 | 关键数据 | 落地位置 |
|----|------|---------|---------|
| **P1** | Domain Goggles（域名级软过滤 + 排序） | 垃圾站清除率 100%；评分 4/5 | [SKILL.md §3.5](skills/search-orchestrator/SKILL.md) |
| **P1.5** | FinalScore 联动（Goggle × SourceWeighting） | Top-5 中至少 1 条升入 T1/T2 | [SKILL.md §3.5.5](skills/search-orchestrator/SKILL.md) |
| **P3** | Evidence-bound Citation（三档模式 Tier A/B/C） | 机制分 5/5；误引用 0 | [SKILL.md §4.3](skills/search-orchestrator/SKILL.md) |
| **P4** | Evidence Deduplication（同源合并） | Merge Precision 100%、False Merge 0、Info Loss 0 | [SKILL.md §1.4.5](skills/search-orchestrator/SKILL.md) |
| **P5 Gap Ledger** | 合成前强制枚举证据缺口 | Gap Detection Recall +55.6%（33.3% → 88.9%） | [SKILL.md §4.1](skills/search-orchestrator/SKILL.md) |
| **P6** | Highlights（fetch 后 verbatim 抽取 ≤500 token） | Extractive Fidelity 92.3%，Untraceable 0 | [SKILL.md Phase 1.bis](skills/search-orchestrator/SKILL.md) |
| **#24** | MCP 反-bot 节流 wrapper（强制 max_results≤10 + 熔断指数退避） | 11/11 集成测试 + 功能性验证通过 | [search-mcp-wrapper/](search-mcp-wrapper/) |

### 被证伪 / 回退的候选路径（4 + 2）

证伪本身是方法论成功的证据——识别了结构化中间表示的收益天花板。

| 路径 | 证伪实验 | 教训 |
|------|---------|------|
| P2 Query Rewrite + Fanout | Run #2 / #3 | LLM 提示词层算分不可靠；负向 query 召回差属后端能力限制 |
| P5 v1 字段对齐 schema | Run #9 / #9b / #9c | 字段表锁住执行者只填同维度，削弱跨维度冲突发现 |
| P5 v2 Evidence Map / Claim Graph | Run #13 | Material Relation Recall Δ=+6.3% < +15% 门槛；唯一增量是 Gap Ledger |
| MCP 后端切换（TLS 指纹） | Run #8a | TLS 指纹假设 disproven；HTTP Success ≠ Content Success |

---

## 安装与使用

### 三种使用形态

| 形态 | 内容 | 适用场景 |
|------|------|---------|
| **A 仅 SKILL** | 复制 `skills/search-orchestrator/` 到 Cline skill 加载路径 | 只想要搜索编排方法论，后端自己解决 |
| **B 仅 wrapper** | 装 `search-mcp-wrapper/`，配 MCP JSON | 只想要反-bot 节流，不要 SKILL 流程 |
| **C 完整**（推荐） | SKILL + wrapper | 复现本研究栈 |

### 前置依赖

- Cline（CLI 或 SDK 环境）
- Node.js（wrapper 构建用）
- DuckDuckGo 网络可达

### 完整安装步骤

**1. 装 wrapper（反-bot 节流）**

```bash
cd search-mcp-wrapper
npm install
npm run build
npm test  # 11/11 通过
```

**2. 配置 Cline MCP**

完整配置见 [skills/search-orchestrator/references/web-search-setup.md](skills/search-orchestrator/references/web-search-setup.md)。要点：

```json
{
  "mcpServers": {
    "duckduckgo": {
      "autoApprove": ["search"],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["../../../search-mcp-wrapper/build/index.js"]
    }
  }
}
```

**3. 装 SKILL**

将 `skills/search-orchestrator/` 复制或软链到 Cline 的 skill 加载路径。

### 场景选择指引

| 场景 | 推荐机制组合 |
|------|-------------|
| 中文技术查询 | P1 Goggles + P1.5（过滤 CSDN/toutiao 农场） |
| 通用技术调研 | P1 + P3 Tier A + P6（完整 citation + 压缩） |
| 学术 / 论文 | P1（BOOST arxiv/*.edu）+ P3 + P5 Gap Ledger |
| 安全研究 | P1 + P3 + P5（反证缺口必查） |
| 产品调研 | P4 同源去重 + P6（多源转载压缩） |

详见 [docs/research/06-usage.md](docs/research/06-usage.md)。

---

## 三层职责分离

```
┌─────────────────────────────────────────────┐
│  Skill 层（方法论）                          │
│  skills/search-orchestrator/SKILL.md          │
│  P1/P1.5/P3/P4/P5/P6 — 提示词层机制          │
└──────────────────┬──────────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────────┐
│  Wrapper 层（节流）                          │
│  search-mcp-wrapper/                         │
│  #24 — 强制 cap + 熔断 + 串行化             │
└──────────────────┬──────────────────────────┘
                   │ 调用
┌──────────────────▼──────────────────────────┐
│  上游（DDG 后端）                            │
│  duckduckgo-websearch                        │
│  原始 search / fetch_content                │
└─────────────────────────────────────────────┘
```

不在错误的层做错误的事——提示词层不做基础设施层的事，基础设施层不做提示词层的事。

---

## 文档地图

### 研究文档（论文式分层，中文为主）

| # | 文件 | 主题 |
|---|------|------|
| 00 | [docs/research/00-overview.md](docs/research/00-overview.md) | 摘要 + 问题 + 主要结论（如果只读一份，读这份） |
| 01 | [docs/research/01-background.md](docs/research/01-background.md) | 背景：Cline 搜索现状 vs 商业 agent 12 手法对照 |
| 02 | [docs/research/02-methodology.md](docs/research/02-methodology.md) | 方法论：A/B 双盲框架 + 评分阈值体系 + Ground Truth 密封 |
| 03 | [docs/research/03-mechanisms.md](docs/research/03-mechanisms.md) | 机制设计：6 active + #24 wrapper + 证伪路径详解 |
| 04 | [docs/research/04-experiments.md](docs/research/04-experiments.md) | 实验：14 轮 Run 综述与关键数据 |
| 05 | [docs/research/05-results.md](docs/research/05-results.md) | 结果：active 清单 + 失败模式 + 与现成学术结论对比 |
| 06 | [docs/research/06-usage.md](docs/research/06-usage.md) | 使用：如何在 Cline 中应用 |
| — | [docs/research/references.md](docs/research/references.md) | 参考文献与外部链接 |

### 工程产物

| 用途 | 路径 |
|------|------|
| Skill 主体（6 active 机制落地形态） | [skills/search-orchestrator/SKILL.md](skills/search-orchestrator/SKILL.md) |
| 节流 wrapper 实现 | [search-mcp-wrapper/](search-mcp-wrapper/) |
| A/B 测试模板（可复用产物） | [skills/search-orchestrator/examples/ab-test-template.md](skills/search-orchestrator/examples/ab-test-template.md) |
| MCP 配置说明 | [skills/search-orchestrator/references/web-search-setup.md](skills/search-orchestrator/references/web-search-setup.md) |

### 决策与实验归档

| 用途 | 路径 |
|------|------|
| 完整调研报告（决策表 / 实验表 / 路线状态） | [docs/search-orchestrator/survey.md](docs/search-orchestrator/survey.md) |
| 决策文档（含证据链） | [docs/decisions/](docs/decisions/) |
| 14 轮实验原始数据 | [docs/search-orchestrator/experiments/](docs/search-orchestrator/experiments/) |

---

## 核心方法论贡献

把「提示词改造是否有效」从主观判断升级为**可量化评测**：

- A 跑基线、B 跑改造、共用同一份 ground truth
- 按预设评分阈值裁定升级 / 回退（不事后调阈值）
- 4 种评分体系：通用尺度 / P3 双维度 / P4 三层核心 / P5 双盲
- GT 密封流程：实验设计 → GT 密封 → 盲态双轨 → 揭盲评分

本框架已固化为 [ab-test-template.md](skills/search-orchestrator/examples/ab-test-template.md)，可被其他 agent 提示词工程研究复用。

---

## 数字一览

| 维度 | 值 |
|------|-----|
| 研究周期 | 2026-06-23 ~ 2026-06-26（4 天） |
| A/B 实验轮数 | 14（Run #1 ~ Run #14） |
| active 机制数 | 6 P 级 + 1 Infra = 7 |
| 证伪 / 回退路径数 | 4 条主路径 + 2 条衍生 |
| 引入新依赖数 | 1（`@modelcontextprotocol/sdk`，wrapper 用） |
| 引入付费 API key 数 | 0 |
| 换搜索后端次数 | 0（DDG 始终） |

---

## License

[MIT](LICENSE)
