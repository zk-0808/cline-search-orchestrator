# ADR-002: 项目承载形态与分层架构

- **Status**: Accepted（2026-06-23 二次修订，纳入 VS Code 不支持 Plugin 的硬约束 → Plugin 退出主交付路径）
- **Date**: 2026-06-23
- **Deciders**: 项目所有者
- **Supersedes**: 无
- **Related**: ADR-001（Handoff / Compact / Memory）、Capability Probe Phase 1、Plugin Dev Quick Reference

---

## Context

项目最初定位为一组围绕 Cline 的增强能力集合，包括：

- Skills
- MCP Server
- 外部脚本
- Handoff / Memory / Workflow 相关机制

Capability Probe Phase 1（2026-06-23）确认了三件事：

1. Cline 已开源 `@cline/sdk`（Apache-2.0，当前 v0.0.51），同一 SDK 内核驱动 VS Code 扩展 / CLI / JetBrains / Kanban
2. Plugin 体系提供：`registerTool` / `registerCommand` / `registerMessageBuilder` / 生命周期 `hooks`（含 `beforeModel` / `afterRun` / `tool_call_before` 等）+ Hook Policy（timeout / retry / fail_closed）
3. 原计划中的部分机制——尤其是 ADR-001 A 项"复用 Cline Compact"——更优雅的实现路径是**作为 Cline 流水线的一部分**通过 `registerMessageBuilder` 或 `beforeModel` 实现，而非"事后监听"

Plugin Dev Probe（2026-06-23）追加确认了一个**硬约束**：

4. **Cline Plugin 当前不适用于 VS Code / JetBrains 扩展**——官方文档原文："This feature currently only applies to Cline SDK, CLI, and Kanban. This feature is not applicable on VSCode and JetBrains Extension for now."
5. 社区目前无 Plugin 实战经验沉淀（SDK v0.0.51，刚推出）

由于用户主工作流位于 VS Code Cline，这条硬约束**直接改写**了"Plugin-first"路线的可行性。

### 用户画像

- 长期使用 Cline 的开发者
- 希望快速获得良好体验
- 不希望花大量时间搭建工作环境
- 当前不存在明确跨 Agent 诉求

### 已知数据

- 73% 任务为 resumed（恢复体验是主要痛点）
- 自研 compact 路线 `compaction_count = 0`，未形成使用闭环
- 已投入一定数量的 Skills 与工作流沉淀（C 类资产）
- Cline SDK 当前仍处于 0.x 阶段

---

## Problem

在已有 Plugin 体系的情况下，本项目应以什么形态承载未来能力？需明确：

- 什么能力进入 Plugin
- 什么能力保留为 Skill
- MCP 应承担什么职责
- 项目最终定位是什么

---

## Considered Alternatives

| ID | 方案 | 关键特征 |
|----|------|---------|
| P1 | 全面 Plugin 化 | 深度整合 / 强 SDK 依赖 / 现有投资折损 |
| P2 | 维持现状 | 零迁移 / 无法利用 Plugin / 违反"不重复造"原则 |
| P3 | Plugin + MCP 双轨 | 整合 + 通用性 / 复杂度翻倍 / 当前无双轨需求支撑 |
| P4 | 职责分层（运行机制 → Plugin，认知资产 → Skill） | 保留现有投资 / 边界需长期维护 |
| P5 | 技术探针（最小 Plugin 实验） | 风险低 / 推迟最终决策 |

---

## Decision

### 当前默认交付形态（Main Line）

```text
薄 Skills
+ 单点 WebSearch MCP
+ 经验文档与规则
+ Plugin 作为实验与未来迁移线（NOT 默认交付）
```

**理由**：
1. 主工作流位于 VS Code，而 Plugin 在 VS Code Cline 不可用
2. 现有 Skill 投入需保留
3. WebSearch 是当前最明确的能力缺口
4. Plugin 适合做"经验机制化"的后续验证，不适合作为当前默认交付

### Plugin 的当前角色定位

```text
Plugin = 实验线 + 未来迁移线
Plugin ≠ 当前主交付
```

P5（最小 Plugin 实验）继续做，但**目的转变**：
- 原目的：验证 Plugin 是否能承担主交付
- 新目的：**在 CLI / SDK 自建环境中验证 Plugin 是否值得成为未来主线**

### 终局走向（保留但非强承诺）

```text
P4（Skill 主体 + Plugin 增强）→ 未来可能形态，前提是：
  - Plugin 在 VS Code Cline 中获得支持，或
  - 用户主工作流迁移到 CLI / Kanban，或
  - P5 实验证明 Plugin 收益显著高于 Skill 路径
```

不预设时间表，由 P5 实验数据 + Cline 路线图共同推动。

### 项目定位（自此固化）

> **面向 Cline 用户的开箱即用工作流增强配置——沉淀真实使用经验，并逐步将经验机制化，持续改善长期使用体验。**

定位拆为三层（按用户感知顺序）：

**L1 开箱体验**（用户首先感知）
用户安装后立刻得到：基础 Skill 集合 + 合理默认规则 + WebSearch MCP + 一套经过验证的工作流。这是项目的**入口价值**。

**L2 经验沉淀**（项目差异化）
真正难复制的不是 Skill 本身，而是长期使用 Cline 的踩坑经验——哪些规则有效、哪些导致上下文污染、哪些工作流容易失控、哪些操作应该机制化。这是项目的**护城河**。

**L3 经验机制化**（长期演化方向）
经验不是最终形态，只是机制缺失时的补丁。演化路径：
```
V1: 提示词告诉模型"终端卡死怎么办"
V2: Skill 提醒模型检测终端状态
V3: Plugin 自动检测并恢复
V4: Cline 原生支持
```
最终目标：**经验不断退出，机制不断接管。** 这与 OUTLINE §1 A 类纪律完全一致。

不追求全面 Plugin 化，不追求跨 Agent 通用，不建设通用平台。

### 分层职责

**Plugin（运行机制）**
承担运行时切入点，A 类机制化的主战场。包括：
- Handoff（基于 `registerMessageBuilder` 在 compact 时双产物输出）
- Resume（基于 `session_start` / `run_start` hook）
- Compact 集成（参与 Cline 流水线，不自建独立 compact）
- 状态检测、Workflow Guard、运行时提醒与防错

原则：**将踩坑经验尽可能转化为运行时约束与自动化能力。**

**Skill（认知资产）**
承担 C 类资产沉淀，提供方法论默认值。包括：
- 工作流模板
- 调研框架
- ADR 模板
- Handoff 模板
- 常见实践指南

原则：**Skill 提供默认方法论，而非追求完整知识库。用户应能够自行扩展与替换。**

**MCP（补缺工具）**
仅解决 Cline 当前明确缺失的能力。V1 默认范围：
- **WebSearch**（项目唯一默认附带的 MCP）

为什么是 WebSearch：Cline 当前确实缺搜索能力 / 用户价值立即可见 / 实现成本低 / 不依赖 Plugin 稳定性。

原则：**MCP 只解决明确缺口，不建设通用平台。**

**文档**
沉淀项目经验。包括踩坑记录、设计决策、最佳实践、迁移说明。

原则：**优先解释"为什么这样设计"，而不是堆积操作说明。**

### V1 项目默认组成

```text
Core Package（默认分发）
├─ 基础 Skills          (L1 开箱体验 + L2 经验沉淀)
├─ 默认规则             (L1 + L2)
└─ WebSearch MCP        (L1 缺口补齐)

Experimental Line（独立、不进默认包）
└─ Plugin              (L3 机制化探路，CLI/SDK 环境)
```

V1 显式**不包含**：
- 大规模 Plugin 重构
- Plugin 进入默认交付包
- MCP 双轨体系
- 跨 Agent 兼容层
- 完整知识管理体系（经验库不做全盘点）

### Plugin Hook vs 文件 Hook 共存说明

OUTLINE §6 "Windows Hook 替代"原假设需要修正——**两者并存，非替代**：

| Hook 类型 | 适用场景 | 当前可用性 |
|----------|---------|-----------|
| **文件 Hook**（`.cline/hooks/*`） | 用户/工作区级自定义脚本 | 跨 OS（含 Windows）由 Cline 实现而定 |
| **Plugin Hook**（typed runtime callback） | 可复用扩展、类型化访问 | **仅 CLI/SDK/Kanban**，VS Code 不可用 |

### Mechanism Principle（经验机制化原则）

经验按 A/B/C 分类管理：

| 类别 | 处置 | 载体 |
|------|------|------|
| **A 类** | 优先机制化 | Plugin |
| **B 类** | 工程约束 | Plugin / 配置 + 退休标记 |
| **C 类** | 保留 | Skill / 文档 |

> **经验库的首要目标不是归档，而是发现可机制化经验并推动其退休。**

具体载体见 [`mechanism-candidates.md`](mechanism-candidates.md)——以"现存经验 → 当前位置 → 类别 → 理想机制 → 状态"五列简表组织，不做更复杂分类。

### 与 ADR-001 的对齐

- ADR-001 A 项（复用 Cline Compact）→ 在本 ADR 下具体化为：**通过 `registerMessageBuilder` 实现"compact + handoff 文件"双产物**，由 Plugin 层承载
- ADR-001 D 项（可版本化索引层）→ Plugin 写入 `.cline/index.jsonl`，Skill 提供索引使用模板
- ADR-001 F 项（capability probe prerequisite）→ Phase 1 已完成主要回答，剩余 session_id 等细节降级为 Design Doc 的实现待确认项

---

## Consequences

### 正面

- 项目定位更加聚焦，"开箱即用 + 体验增强"成为单一目标
- 保留现有 Skill 投资（C 类资产不被冲掉）
- 避免重复建设 Cline 已有能力（符合 OUTLINE §0.2）
- Plugin 只承担高价值运行时能力，表面积受控
- MCP 范围收敛到 Web Search，维护成本低
- 与 Cline 的整合路径官方化，跨 IDE（VS Code / JetBrains / CLI）一次实现

### 负面

- Plugin 与 Skill 的边界需要长期维护，存在边界漂移风险
- SDK 0.x 变化仍可能带来适配成本（实验阶段将测量这一成本）
- 部分能力可能需要经历二次重构（实验 → 固化）
- "跨 Agent 通用性"被显式放弃，未来若产生此需求需重开 ADR

### 退休条件 / Review Trigger

满足任一条件时本 ADR 应重新评审：

- **SDK 达到 v1.0+**（SDK 稳定后 P1 风险骤降）
- **Plugin 能力覆盖项目主要需求**（Plugin 已能替代多数 Skill 职责）
- **出现明确跨 Agent 诉求**（P3 双轨开始有用户支撑）
- **Plugin 代码规模超过 Skill 规模**（信号：Plugin 行数 > Skill 行数；P4 边界已漂移）
- Cline 原生集成 Handoff / Resume / Workflow Guard（整个项目部分能力可退休）
- SDK 架构发生重大变化（破坏性升级）

届时重新评估 P1 / P3 的必要性，或考虑项目整体退休。

---

## Validation Plan（P5 实验范围）

### 实验环境（硬约束）

P5 实验**不能**在 VS Code Cline 中运行（Plugin 不支持）。可选环境：

| 选项 | 描述 | 推荐度 |
|------|------|--------|
| **a. Cline CLI** | `npm i -g cline`，独立进程跑实验，VS Code Cline 继续主用 | ✅ 首选（双轨最自然） |
| **b. SDK 自建 Agent** | 用 `@cline/sdk` 写最小宿主跑实验 | 备选（隔离最干净，但要写宿主代码） |
| **c. 独立实验仓** | 单独建一个 git repo，专门承载 P5 | 配套手段（不与 a/b 互斥） |

默认走 **a + c**：CLI 跑实验 + 独立仓承载产物。

### 最小可行 Plugin 范围（避免实验飘移）

实验仅实现一个 plugin 文件，**以官方 `custom-compaction.ts` 为母本 fork 改造**：
> 来源：[github.com/cline/cline/blob/main/sdk/examples/plugins/custom-compaction.ts](https://github.com/cline/cline/blob/main/sdk/examples/plugins/custom-compaction.ts)

**包含**：
- 一个 `registerMessageBuilder`（沿用母本逻辑）：在 token 估算超阈值时，将中间历史压缩为 summary message
- 在压缩同时，**同步写出** `handoff/auto-{timestamp}-{slug}.md`
- 在 `.cline/index.jsonl` 追加一条索引记录（含 `schema_version` / `slug` / `ts` / `ref` / `source: auto`）
- 一个 `session_start` 类 hook（具体注册方式 Phase 2 待确认）：检测最近 handoff 并向 console 输出"上次到哪里"

**不包含**（避免实验吃成饭）：
- inline / crosswindow / silent 三档判定
- `/where` slash command
- task_type 模板分化
- 任何 UI 集成
- 安装包发布
- 进入默认交付包

### 验证目标（重新对齐"实验线"定位）

实验目的不再是"是否能承担主交付"，而是 **"是否值得成为未来主线"**。验证目标相应调整：

| # | 验证目标 | 度量方式 | 通过标准 |
|---|---------|---------|---------|
| 1 | `custom-compaction.ts` 母本能否稳定改造 | fork + 安装 + 触发一次有效压缩 | 至少触发 1 次有效压缩，无类型错误 |
| 2 | compact → handoff → index 最小闭环是否成立 | 单次 build 内同时产出 summary + handoff.md + index.jsonl 行 | 三个产物齐全 |
| 3 | 实验体验是否**明显优于**纯 Skill / 文档方案 | 同任务在 VS Code（Skill）vs CLI（Plugin）对照，主观打分 + 续作 token 节省 | Plugin 路径中位数提升 ≥ 1 档（5 档量表）|
| 4 | SDK 1–2 周内变更与适配成本 | 记录实验期 SDK 版本变更次数 + 破坏性影响 | 适配工作量 ≤ 半天 |
| 5 | Plugin 与 Skill 的职责边界是否自然清晰 | 实验中是否反复纠结"该 Plugin 还是 Skill" | 决策犹豫次数 ≤ 2 次 |

### 实验结束硬性出口

1–2 周后**必须**产出 ADR-002 Update（或 ADR-003），明确以下之一：
- **未来主线候选**：若实验证明 Plugin 收益显著高于 Skill 路径 → 标记为"等待 VS Code 支持后进入主交付"
- **保留实验线**：若收益不明显 → Plugin 继续在 CLI/SDK 实验线，不进默认包
- **退出**：若 SDK 0.x 风险过高或核心闭环跑不通 → P5 终止，从 mechanism-candidates 移除 Plugin 选项

不允许继续观望（OUTLINE §10.3 战略债清理规则）。

### 启动步骤（来自 plugin-dev-quick-reference §11）

```bash
# 1. 安装 Cline CLI
npm i -g cline

# 2. 在独立实验仓创建工作目录
mkdir -p experiments/handoff-probe-plugin
cd experiments/handoff-probe-plugin

# 3. fork 官方 custom-compaction.ts 作为起点
curl -O https://raw.githubusercontent.com/cline/cline/main/sdk/examples/plugins/custom-compaction.ts
mv custom-compaction.ts handoff-probe.ts

# 4. 改造：加 handoff.md 写出 + index.jsonl 追加

# 5. 本地安装
cline plugin install ./handoff-probe.ts --cwd .

# 6. 验证装载
cline config

# 7. 实跑长任务触发 compact
cline -i "..."
```

---

## Next Steps

```text
ADR-002 (Accepted)
        ↓
P5 最小实验 Plugin 启动（独立沙盒，不影响主项目）
        ↓
1–2 周实验 + 数据收集
        ↓
ADR-002 Update / ADR-003：固化 P4 或转 P1/P2
        ↓
Handoff v2 Design Doc（基于实验结果落实现细节）
        ↓
Implementation
```

---

## Update 1 (2026-06-26): Cline Plugin VS Code 支持状态核查（含修正）

### 事实变化（经多源核查，含矛盾证据裁定）

2026-06-26 核查 Cline 官方文档时发现**矛盾证据**，经深入核查后裁定如下：

| 来源 | 原文 | 语义层面 | 核查结果 |
|------|------|---------|---------|
| [sdk/examples/plugins](https://github.com/cline/cline/tree/main/sdk/examples/plugins)（GitHub，2026-06-03 更新，Cline 创建者提交） | "extends **any Cline agent — CLI, Kanban, VS Code, JetBrains**, or anything built on the Core SDK" | **SDK 设计能力范围**——plugin 代码可扩展任何基于 Core SDK 的 agent 内核 | 描述准确，但指 SDK 层 |
| [customization/plugins](https://docs.cline.bot/customization/plugins)（docs.cline.bot） | "This feature currently only applies to Cline SDK, CLI, and Kanban. **This feature is not applicable on VSCode and JetBrains Extension for now.**" | **用户操作可用性**——`cline plugin install` 命令与 UI 入口在 VS Code 扩展中不可用 | **裁定为准**——VS Code 扩展未集成装载入口 |
| VS Code Marketplace Cline v3.89.2（2026-06-11）CHANGELOG | 无 "plugin" 相关条目（Grep 零匹配） | **版本历史佐证**——VS Code 扩展从未集成 plugin 装载 UI | 决定性证据 |

**裁定结论**：Context §4 记录的硬约束**仍成立**——VS Code Cline 扩展（v3.89.2）尚未集成 plugin 装载入口。GitHub sdk/examples/plugins 描述的是 @cline/core SDK 内核的设计能力范围（plugin 代码层面确实可跨形态扩展任何基于 Core SDK 的 agent），但 VS Code 扩展的前端 UI 层尚未暴露装载入口。

**准确事实**：
- ✅ Plugin **代码层面**跨形态可用（@cline/core SDK 支持，一次写到处跑的设计成立）
- ❌ VS Code 扩展（v3.89.2）**尚未集成 plugin 装载入口**（无 UI、无命令、CHANGELOG 无记录）
- 实验仍需 **CLI 方式**（`npm i -g cline` + `cline plugin install`），不能在 VS Code 直接实验

### 对本 ADR 的影响

| 章节 | 原内容 | Update 后状态 |
|------|--------|--------------|
| Context §4（VS Code 不可用硬约束） | Plugin 不适用于 VS Code / JetBrains | **仍成立**——VS Code 扩展未集成 plugin 装载入口（v3.89.2 CHANGELOG 零 plugin 条目） |
| Context §5（社区无实战沉淀） | SDK v0.0.51，刚推出 | 部分成立（SDK 仍 0.x；plugin 代码层跨形态可用但 VS Code 扩展未开放，社区沉淀待观察） |
| Decision §当前默认交付形态 | Plugin 作为实验与未来迁移线（NOT 默认交付） | 不变——Plugin 仍非默认交付，实验线前提未变 |
| Decision §Plugin 的当前角色定位 | P5 实验目的："在 CLI / SDK 自建环境中验证 Plugin 是否值得成为未来主线" | 不变——实验环境仍为 CLI / SDK 自建环境 |
| Validation Plan §实验环境（硬约束） | "P5 实验**不能**在 VS Code Cline 中运行（Plugin 不支持）" | **仍成立**——P5 实验仍需 CLI 方式，不能在 VS Code Cline 中运行 |
| Validation Plan §最小可行 Plugin 范围 | fork custom-compaction.ts，CLI 环境跑 | 不变——fork custom-compaction.ts，CLI 环境跑 |
| Validation Plan §启动步骤 | `npm i -g cline` + 独立实验仓 | 不变——`npm i -g cline` + 独立实验仓 |

### 对外部评审材料的影响

[ADR-002-p5-experiment-exit-review.md](ADR-002-p5-experiment-exit-review.md)（2026-06-26 撰写）基于"VS Code 不可用"前提，该前提**经核查仍成立**：

| 评审材料章节 | 原论据 | Update 后状态 |
|-------------|--------|--------------|
| §2.3 VS Code 不可用硬约束未解除 | 支持舍弃 | **仍成立**（VS Code 扩展 v3.89.2 未集成 plugin 装载入口） |
| §2.4 SDK 0.x 风险 | 支持舍弃 | 仍成立（SDK 仍 0.x，且 VS Code 扩展未开放，风险未降低） |
| §3.3 实验环境与生产环境分离 | 反对舍弃 | **仍成立**（实验环境 CLI 与生产环境 VS Code 仍分离） |
| §4 选项 C（CLI 独立沙盒最小验证） | 中间路径推荐 | 不变——仍为 CLI 独立沙盒最小验证 |
| §5 Q4/Q6 中间路径推荐 | C→B 组合 | 不变——C 的执行环境仍为 CLI |

评审核心结论（"先做最小闭环验证再决定"）仍成立。第二轮评审基于"VS Code 已支持"的乐观假设需修正——实验环境回到 CLI 方式，验证成本未下降。

### Plugin 能力补充说明（核查所得）

官方文档明确了 Plugin 与其它手段的能力边界，对 mechanism-candidates #1–#6、#14 的归宿判定至关重要：

| 能力 | Plugin | 文件 Hook（.cline/hooks/*） | Wrapper MCP | 外部 watcher |
|------|--------|---------------------------|-------------|-------------|
| `registerMessageBuilder`（compact 关键） | ✅ | ❌ | ❌ | ❌ |
| `registerTool` | ✅ | ❌ | ✅（等价） | ❌ |
| runtime hooks（8 种，含 onEvent） | ✅ | 部分（9 种文件事件适配） | ❌ | ❌ |
| typed in-process callbacks | ✅ | ❌（JSON 序列化外部脚本） | ❌（跨进程） | ❌（跨进程） |
| 跨形态复用（CLI/Kanban/VSCode/JetBrains） | ✅ | 依赖 Cline 实现 | ✅ | 系统级 |

**关键发现**：#5（compact + handoff 双产物）的 `registerMessageBuilder` 是 Plugin 独有能力，文件 Hook / Wrapper MCP / 外部 watcher 均无法介入 model call 前的消息重写层。这直接回答了评审材料 §3.1/§3.3 的"运行时任务是否必须 Plugin"——**至少 compact 自动化必须 Plugin**。

### 后续动作

1. **本 Update 落地后**：评审材料前提仍成立，用户需决定是否重新评审或直接进入选项 C（CLI 最小闭环验证）
2. **机制清单 #1–#4 归宿**：VS Code 扩展未集成 plugin 装载入口，#1–#4 的理想机制（plugin）可行路径未恢复，维持"等待 Runtime 能力"暂缓标记
3. **P5 实验环境**：仍为 CLI 独立沙盒（`npm i -g cline` + `cline plugin install`），成本未下降
4. **survey.md §9.1 同步**：本 Update 非 status 变更（ADR-002 仍 active），不触发 project-rules.md 约束 1/2，无需加新行

### 本 Update 不变更的内容

- ADR-002 整体方向（薄 Skills + 单点 WebSearch MCP + 经验文档 + Plugin 实验线）不变
- ADR-002 §项目定位（L1/L2/L3 三层）不变
- ADR-002 §退休条件 / Review Trigger 不变（SDK v1.0+ 等仍适用）
- ADR-002 status 仍为 active（非 superseded，非新 ADR-003）

本 Update 记录外部事实核查（Cline Plugin VS Code 支持状态的矛盾证据裁定）及其对本 ADR 局部章节的修正，不构成整体决策推翻。
