# cline++

面向 Cline 用户的开箱即用工作流增强配置——沉淀真实使用经验，并逐步将经验机制化，持续改善长期使用体验。

> 本项目不是一个新的 Agent 框架，而是 **Cline 之上的扩展层**。Cline 已是相当完整的宿主（Plan/Act、Hooks、Memory Bank、Checkpoint、Rules、Subagents、Workflow、CLI），本项目只补 Cline 真正缺失的部分。

---

## 它解决什么问题

长期使用 Cline 后，真正难复制的不是 Skill 本身，而是踩坑经验——哪些规则有效、哪些导致上下文污染、哪些工作流容易失控、哪些操作应该机制化。

本项目把这些经验组织成可立即装机的工作流配置，并按 **A/B/C 分类纪律** 持续推动「经验 → 机制 → Cline 原生」的退休路径。

详见 [docs/PROJECT_DEV_OUTLINE.md](docs/PROJECT_DEV_OUTLINE.md) 与 [docs/ADR-002-project-shape.md](docs/ADR-002-project-shape.md)。

---

## 三层定位

| 层 | 内容 | 用户感知 |
|----|------|---------|
| **L1 开箱体验** | 薄 Skills + 默认规则 + WebSearch MCP | 安装后立即可用 |
| **L2 经验沉淀** | 长期使用 Cline 的踩坑经验（项目护城河） | 解释「为什么这样设计」 |
| **L3 经验机制化** | Plugin 作为实验线（NOT 默认交付） | 演化方向，不进 V1 |

> 注意：**Cline Plugin 当前不支持 VS Code 扩展**，因此 Plugin 不在 V1 默认交付路径上，仅在 CLI/SDK 环境作单点实验。

---

## V1 默认组成

```text
Core Package（默认分发）
├─ skills/              基础 Skill 集合（薄壳 + 经验沉淀）
├─ docs/                ADR、提纲、机制化清单
└─ WebSearch MCP        DuckDuckGo MCP（uvx 部署，免 API key）

Experimental Line（独立，不进默认包）
└─ Plugin 实验           CLI/SDK 环境，验证经验机制化可行性
```

---

## 当前已落地

- **search-orchestrator skill**：搜索编排器，强制「Plan → Search → Evaluate → Synthesize」四阶段，对抗盲搜与单源结论
- **WebSearch MCP 配置文档**：DuckDuckGo MCP（`nickclyde/duckduckgo-mcp-server`，uvx 部署），见 [skills/search-orchestrator/references/web-search-setup.md](skills/search-orchestrator/references/web-search-setup.md)
- **mechanism-candidates.md**：14 条种子经验，按 A/B/C 分类，状态可追踪

---

## 工作纪律（最高优先级）

1. **三轮收敛律**：同一任务发散不超过 3 轮，第 3 轮必收敛
2. **五问门控**：新机制必须通过——是否高频 / 是否可观测 / 是否有替代 / 是否破坏现有体验 / 是否可回退
3. **A/B/C 分类**：A → Plugin / B → 工程约束 / C → Skill 或文档
4. **Preferred Collaboration Pattern**：用户 → 外部评审 → Trae 收敛（非强制）
5. **编译 / IO 使用 UTF-8 编码**

详见 [docs/PROJECT_DEV_OUTLINE.md](docs/PROJECT_DEV_OUTLINE.md)。

---

## 安装与使用

当前阶段为 V1 早期，仅有一个组件可装机验证。

### WebSearch MCP（DuckDuckGo）

完整步骤见 [skills/search-orchestrator/references/web-search-setup.md](skills/search-orchestrator/references/web-search-setup.md)。

要点：
- 后端：`nickclyde/duckduckgo-mcp-server`
- 部署：`uvx duckduckgo-mcp-server`（免 API key）
- 工具：`search` / `fetch_content`

### Skill

将 `skills/` 目录中需要的 skill 复制 / 链接到 Cline 的 skill 加载路径即可。

---

## 文档地图

| 文档 | 用途 |
|------|------|
| [PROJECT_DEV_OUTLINE.md](docs/PROJECT_DEV_OUTLINE.md) | 项目纪律提纲（五问门控、A/B/C、停止条件） |
| [ADR-001-handoff-compact-memory.md](docs/ADR-001-handoff-compact-memory.md) | Handoff / Compact / Memory 决策 |
| [ADR-002-project-shape.md](docs/ADR-002-project-shape.md) | 项目形态与分层架构 |
| [mechanism-candidates.md](docs/mechanism-candidates.md) | 经验机制化清单（14 条种子） |
| [capability-probe.md](docs/capability-probe.md) | Cline 能力探针记录 |
| [plugin-dev-quick-reference.md](docs/plugin-dev-quick-reference.md) | Plugin 开发参考（实验线） |

---

## 项目状态

- V1 首个组件已落地，等待实际装机验证
- mechanism-candidates 14 条种子经验待逐项评估
- Plugin 实验线（P5）排期由 ADR-002 Validation Plan 控制

---

## 三个绝不

| 绝不 | 原因 |
|------|------|
| 绝不重复造 Cline 已有能力 | 避免「设计能力 > 调研能力」失败模式 |
| 绝不用规则解决运行时问题 | 提示词无法根治执行层缺陷 |
| 绝不让战略决断伪装成待办 | 避免「战略债」 |
