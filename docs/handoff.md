# Handoff — ADR-002 硬约束解除 + P5 两轮外部评审 + 决策文档全面事实审核

## 本会话决策

| 决策 | 状态 |
|------|------|
| 修正 mechanism-candidates #5/#6/#14 状态漂移（"实验中（P5）"→"候选"，P5 实验未启动） | ✅ 完成（commit `f1459db`） |
| 撰写 ADR-002 P5 实验停续外部评审材料（第一轮） | ✅ 完成 |
| 核查 Cline Plugin VS Code 支持状态——**重大事实变化**：ADR-002 Context §4 硬约束已解除 | ✅ 完成 |
| ADR-002 Update 1 落地（Cline Plugin VS Code 支持硬约束解除 + Plugin 能力补充） | ✅ 完成（commit `cc4f14e`） |
| 撰写第二轮外部评审材料（基于 Update 1 后事实） | ✅ 完成（commit `0b90f83`） |
| 接收第二轮评审意见：C→（Go 或 A），P5 重新定义为 Capability Spike，1 天实验 | ✅ 接收 |
| 决策文档全面事实审核（11 份 active/proposed/deferred 决策） | ✅ 完成 |
| 写 handoff | ✅ 用户口头要求，触发 project-rules.md 4.a |

---

## 本会话净变化

### 1. 机制清单状态漂移修正

[mechanism-candidates.md](mechanism-candidates.md) #5/#6/#14 误标"实验中（P5）"回退为"候选"——P5 实验从未启动，状态漂移违反维护规则"状态变更需触发动作"。

### 2. ADR-002 硬约束解除（本会话最重大发现）

2026-06-26 核查 Cline 官方 GitHub 文档，发现 ADR-002 (2026-06-23) Context §4 记录的硬约束已失效：

| 时间 | 官方文档原文 |
|------|------------|
| 2026-06-23（ADR-002 记录） | "This feature is not applicable on VSCode and JetBrains Extension for now." |
| 2026-06-26（今日核查） | "extends **any Cline agent — CLI, Kanban, VS Code, JetBrains**, or anything built on the Core SDK" |

**影响**：Plugin 现在是"一次写到处跑"——与 search-orchestrator 服务同一对象（VS Code Cline），不再割裂。`registerMessageBuilder` 是 Plugin 独占能力（文件 Hook / Wrapper MCP / 外部 watcher 均无法介入 model call 前消息重写层），#5（compact + handoff 双产物）必须 Plugin。

ADR-002 Update 1 已落地，记录事实变化 + 局部章节修正 + Plugin 能力补充说明。

### 3. P5 两轮外部评审闭环

**第一轮评审**（基于"VS Code 不可用"前提）：
- 推荐选项 C→B 组合（先 2-3 天最小闭环验证，再决定 A/B）
- 核心论据：退出证据是价值判断（ROI），ADR-002 退出标准要求技术判断
- #1–#4 不应降级永久C类，应改"等待 Runtime 能力"

**第二轮评审**（基于 Update 1 后事实）：
- 调整为 C→（Go 或 A），不默认暂缓
- P5 重新定义为 **Capability Spike**（能力验证，非产品实验）
- 只验证 #5（registerMessageBuilder + compact→handoff→index 闭环），不含 #6 session_start
- 时间窗口压缩至 **1 天**
- Go 标准：registerMessageBuilder 稳定接管 + compact 自动生成 handoff + index 自动更新
- No-Go 标准：API 无法稳定实现 / SDK 修改量超设想 / 无法形成稳定闭环 / 维护复杂度明显高于收益
- 退出理由要工程化（"独占能力不足以覆盖维护成本"而非"工作流舒服"）

### 4. 决策文档全面事实审核（11 份）

四组并行审核完成。**未发现动摇任何决策核心结论的事实性错误**。7 项需修订：

| # | 文档 | 问题 | 修订建议 |
|---|------|------|---------|
| 1 | capability-probe.md §4.2 | session_id "未在公开文档中直接列出"结论过时 | 更新——sessionId 现已是 SDK 公开 API 一等字段 |
| 2 | 搜索结论.md §10.4 | arXiv:2602.13862 标注"arXiv'25" | 更正为"arXiv'26"（2026 年 2 月提交） |
| 3 | survey §2 M6 | "5 倍"质量差异声明来源不可追溯 | 补出来源或改用 §10.1 的"NDCG 几个百分点/召回数量级"表述 |
| 4 | D-2026-06-24-search-defer-p2 §恢复条件 2 | Exa（neural search）列为"支持否定召回的引擎"与 NevIR 结论自相矛盾 | 收紧为"支持词项级否定/后置过滤的引擎" |
| 5 | survey M4 | Exa highlights 描述过时（"train models that condense... 4000 characters"） | 更新——当前 Exa highlights 为 extractive excerpts，无字符数参数 |
| 6 | mechanism-candidates.md #24 | "已有 token-bucket 限速"与源码不符 | 改为"已有 sliding window 限速"（决策文档已修正，源头条目未同步） |
| 7 | D-2026-06-24-search-infra-mcp-upgrade | "永久 Tier C"措辞与 wrapper 落地轻微张力 | 加注"（fetch 层；search 层反爬已由 #24 wrapper 机制化解决）" |

**关键正面发现**：
- ADR-001 的 4 个能力探查项已全部被回答且对项目有利（registerMessageBuilder 参与 compact > 事后监听；sessionId 已公开；compact 可程序化；condense 以 tool_call 可见）
- #24 wrapper 决策文档源码逐字准确，质量高于 mechanism-candidates #24 与 npm README
- rolled-back 决策否决理由（TLS 模拟解不了 JS Challenge）仍是不可逆技术事实，2026 年 Cloudflare 防御升级反而强化

---

## 本会话新增文件

| 文件 | 说明 |
|------|------|
| `docs/decisions/ADR-002-p5-experiment-exit-review.md` | P5 实验停续外部评审材料（含第一轮 §0–§6 + 第二轮评审输入） |

## 本会话修改文件

| 文件 | 改动 |
|------|------|
| `docs/mechanism-candidates.md` | #5/#6/#14 状态回退为"候选" |
| `docs/decisions/ADR-002-project-shape.md` | 追加 Update 1 章节（硬约束解除 + Plugin 能力补充） |
| `docs/decisions/README.md` | ADR-002 索引行加 Update 1 标记 |
| `docs/handoff.md` | 覆盖为本交接 |

---

## 当前路线图

权威源：

- [survey.md §9.3 最终路线状态](search-orchestrator/survey.md)
- [mechanism-candidates.md](mechanism-candidates.md)

本会话无 P 级路线状态变化（ADR-002 status 仍 active，非路线项跳转）。

P 级机制 active 清单（6 条，与上次 handoff 一致）：P1 / P1.5 / P3 / P4 / P5 Gap Ledger / P6。
Infra 机制 active（1 条）：#24 wrapper。

---

## 未完成项 / 后续动作

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **P5 Capability Spike** | 第二轮评审推荐。1 天实验：fork custom-compaction.ts + 改造 registerMessageBuilder + handoff/index 双产物 + VS Code 装载验证。产物路径：`experiments/p5-spike/`。Go→ADR-003（Plugin 定位为 Runtime 自动化能力层）/ No-Go→退出（工程性退出理由） | 高 |
| 决策文档事实审核 7 项修订 | 见本 handoff §4 修订表。低成本，可批量修正 | 中 |
| CSDN 博客发布 | 博客已写好（`docs/blog/csdn-search-orchestrator.md`），待用户手动复制到 CSDN 编辑器发布 | 中 |
| 消融实验（Ablation） | GPT 终评建议。按计划推进，不作为主任务 | 中 |
| SKILL 平台化拆分 | 触发条件：SKILL > 1200 行 或 单 Phase > 300 行。当前 ~800 行，未达触发线 | 低 |
| Goggle 域名表数据化 | 触发条件：Goggle >10 或单表 >20 行。当前 5 个，未达触发线 | 低 |
| #22 Browser Fetch 启动评估 | 候选（暂缓）。仅当 Tier C snippet-only 被证明严重影响答案质量才启动 | 低 |
| #24 V2 backend 切换 | 暂缓。DDG 持续不可用时启动 | 低 |

---

## Handoff（下次会话第一句话建议）

首句话提示词：

```text
先读 docs/project-rules.md 一次，遵守里面的三份文档职责划分与五条防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：本会话完成三件大事——① 发现 ADR-002 Context §4 硬约束（Cline Plugin 不支持 VS Code）已于 2026-06-26 解除，Plugin 现支持全形态（CLI/Kanban/VSCode/JetBrains），`registerMessageBuilder` 确认为 Plugin 独占能力（#5 compact+handoff 双产物必须 Plugin）；② P5 两轮外部评审闭环，第二轮推荐 C→（Go 或 A），P5 重新定义为 Capability Spike（1 天实验，只验证 #5，Go→ADR-003 / No-Go→工程性退出）；③ 决策文档全面事实审核（11 份），未发现动摇核心结论的错误，但发现 7 项需修订（capability-probe session_id 过时 / arXiv 年份笔误 / 5倍声明无源 / Exa 否定召回自相矛盾 / Exa highlights 描述过时 / mechanism-candidates #24 token-bucket 错误 / 永久 Tier C 措辞张力）。下次会话首要任务是启动 P5 Capability Spike（产物路径 `experiments/p5-spike/`），或先批量修正 7 项事实审核修订。注意执行边界：P5 Capability Spike 涉及 registerMessageBuilder（model call 前消息重写层），属 Plugin 层技术验证，非 SKILL 层机制执行，TRAE agent 可直接执行（project-rules.md §约束 5 不适用）。
