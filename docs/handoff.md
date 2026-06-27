# Handoff — VS Code 扩展原生能力调研 + 决策文档全面修正

## 本会话决策

| 决策 | 状态 |
|------|------|
| ADR-002 Update 3 写入——颠覆 Update 2 发现 3「registerMessageBuilder 仍未在 VS Code 扩展实现」| ✅ 已写 |
| VS Code 扩展 4.0.0 原生能力完整调研（commands/skill/hook/plugin/MCP）| ✅ 已完成 |
| dev-rules.md 新增 §1.4（Windows 文件核查用 PowerShell）+ §4（方向启动门控）| ✅ 已写 |
| ADR-001 Update 1 写入——Capability Probe 实测计划（5 项，Probe 5 优先）| ✅ 已写 |
| mechanism-candidates #5/#7 备注更新（基于 Update 3 新发现）| ✅ 已同步 |
| decisions/README.md ADR-002 行追加 Update 2/3 标记 | ✅ 已同步 |

> 本会话由用户要求"全面修正+启动 Probe"触发（触发器 a）。用户核心反馈："决策文档频繁出现问题，跟初期调查没搞清楚项目意图有很大关系，我说调查 cline 的原生能力，handoff 与 compact 结合等都是基于插件说的，结果调研方向歪了……以后启动大方向时，把开发指向的对象明确出来让我确认。"

---

## 本会话净变化

### 1. 颠覆性发现：VS Code 扩展代码层有完整 plugin 注册系统

用户质疑 Update 1/2 调查方向偏离（偏离到 CLI 载体），要求聚焦 VS Code 扩展本身。完整调研 `dist/extension.js`（22MB minified）后发现：

| 能力 | Update 1/2 结论 | Update 3 修正 |
|------|----------------|--------------|
| `registerMessageBuilder` | Update 2 发现 3：VS Code 扩展未实现 | **错误**——第 543 行有完整 plugin 注册系统，含 `registerMessageBuilder` |
| Plugin 装载入口 | Update 1：VS Code 未集成 | UI 层仍无命令，但代码层有 `Mch`（install）/ `SOd`（uninstall），可能通过 `cline.marketplaceButtonClicked` 触发 |
| Skill 装载 | 未完整调研 | **6 路径自动发现**：`.clinerules/skills` / `.cline/skills` / `.claude/skills` / `.agents/skills`（项目级）+ `~/.cline/skills` + `~/.agents/skills`（全局级）|
| 文件 Hook | Update 2：待实测 | **确认可用**——Windows `<hooksDir>/<event>.ps1`，全局目录匹配 `/cline/Hooks/i` |

### 2. VS Code 扩展 4.0.0 原生能力完整清单（20 commands + 6 skill 路径 + 文件 hook + plugin 注册系统 + MCP + gRPC + 其他）

详见 [ADR-002 Update 3](decisions/ADR-002-project-shape.md)。关键证据：
- 第 543 行：plugin 注册系统（registerTool/registerCommand/registerRule/registerMessageBuilder/registerProvider/registerAutomationEventType/registerMcpServer）
- 第 2649 行：skill 装载路径（`u1n` 函数 + `MNt` 配置）
- 第 3351 行：文件 Hook 发现系统（`dQ` 类 + `findWindowsHook` + `isGlobalHooksDir`）
- 第 3803 行：plugin install 函数 `Mch`
- 第 2060 行：plugin uninstall 函数 `SOd`

### 3. 核查方法错误纠正（写入 dev-rules.md §1.4）

| 错误 | 教训 |
|------|------|
| Glob `saoudrizwan.claude-dev-*\package.json` 零命中 | Windows 文件核查禁用 Glob/LS |
| LS `.vscode\extensions` 40000 字符截断 | 必须用 PowerShell `Get-ChildItem -Recurse` |
| extensions.json 注册表未同步 | 已知精确路径单文件读取 Read 工具仍可用 |

### 4. 方向启动门控规则（写入 dev-rules.md §4）

用户要求"以后启动大方向时，把开发指向的对象明确出来让我确认"。新规则要求启动大方向前必须明确 4 维度：载体 / 范围 / 排除 / 成功标准。

### 5. Capability Probe 实测计划（写入 ADR-001 Update 1）

5 项 Probe，**Probe 5 优先**（手动放 plugin 文件能否触发 setup 函数）——这是 #5 能否在 VS Code 直接可用的关键。

---

## 本会话修改文件

| 文件 | 改动 |
|------|------|
| `docs/decisions/ADR-002-project-shape.md` | 追加 Update 3（VS Code 扩展 4.0.0 原生能力完整调研，颠覆 Update 2 发现 3）|
| `docs/decisions/ADR-001-handoff-compact-memory.md` | 追加 Update 1（Capability Probe 实测计划，5 项，Probe 5 优先）|
| `docs/decisions/ADR-004-p5-spike-pause.md` | 恢复条件 2 后追加 Update 注释（手动放 plugin 文件可能触发 setup）|
| `docs/mechanism-candidates.md` | #5 备注追加 Update 3 颠覆性发现 / #7 备注更新为确认 Windows hook 可用 |
| `docs/decisions/README.md` | ADR-002 行追加 Update 2/3 标记 |
| `docs/dev-rules.md` | 新增 §1.4（Windows 文件核查用 PowerShell）+ §4（方向启动门控）|

---

## 未完成项 / 后续动作

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **Capability Probe 5 实测** | 验证手动放 plugin 文件到 `<workspace>/.cline/<pluginName>/` 能否触发 VS Code 扩展执行 setup 函数。TRAE agent 准备文件，用户在 VS Code reload window 后检查 `plugin-loaded.log` + 测试工具可用性。详见 [ADR-001 Update 1](decisions/ADR-001-handoff-compact-memory.md) | **高**（直接决定 #5 能否在 VS Code 可用）|
| Capability Probe 1-4 | PostCompact hook / session_id / compact 程序化调用 / condense 消息 watcher | 中（Probe 5 后）|
| **P5 Spike 恢复等待** | 恢复条件见 [ADR-004](decisions/ADR-004-p5-spike-pause.md)：① CLI 载体稳定性恢复 ② 实验环境与生产环境对齐（VS Code 支持 plugin 或主工作流迁移 CLI）③ #5 仍为未解问题。**Probe 5 通过 → 条件 2 满足** | 低（等待 Probe 5 结果）|
| research/06-usage.md 断链 | 旧链接指向 project-rules.md，是否更新待定 | 低 |

> **注意**：ADR-004 仍为 deferred。Probe 5 实测结果是恢复路径的关键——若通过，P5 Spike 可在 VS Code 扩展环境重启，无需 CLI 载体。

权威源：[ADR-002 Update 3](decisions/ADR-002-project-shape.md)、[ADR-001 Update 1](decisions/ADR-001-handoff-compact-memory.md)、[ADR-004](decisions/ADR-004-p5-spike-pause.md)、[mechanism-candidates.md](mechanism-candidates.md)、[dev-rules.md §1.4/§4](dev-rules.md)、[project-rules-search-orchestrator.md](project-rules-search-orchestrator.md)

---

## Handoff（下次会话第一句话建议）

```text
先读 docs/dev-rules.md（通用永久规则，注意新增 §1.4 Windows 文件核查 + §4 方向启动门控）与 docs/project-rules-search-orchestrator.md（search-orchestrator 功能专属规则）各一次，遵守三份文档职责划分与防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：本会话完成 **VS Code 扩展 4.0.0 原生能力完整调研 + 决策文档全面修正**。起因是用户质疑 ADR-002 Update 1/2 调查方向偏离（偏离到 CLI 载体），要求聚焦 VS Code 扩展本身。完整调研 `dist/extension.js` 后发现**颠覆性事实**：VS Code 扩展代码层第 543 行有完整 plugin 注册系统（含 `registerMessageBuilder`），Update 2 发现 3「registerMessageBuilder 仍未在 VS Code 扩展实现」错误。同时确认 VS Code 扩展原生支持 skill 装载（6 路径自动发现）+ 文件 Hook（Windows `.ps1`）+ plugin install/uninstall 代码层存在（UI 未暴露）。已写 [ADR-002 Update 3](decisions/ADR-002-project-shape.md) + [ADR-001 Update 1](decisions/ADR-001-handoff-compact-memory.md)（Capability Probe 实测计划，5 项，**Probe 5 优先**——验证手动放 plugin 文件能否触发 setup）+ [dev-rules.md §1.4/§4](dev-rules.md)（Windows 文件核查用 PowerShell + 方向启动门控明确开发指向对象）+ mechanism-candidates #5/#7 备注更新。下次首要动作：**Capability Probe 5 实测**——TRAE agent 准备最小 plugin 文件（`managed.json` + `index.js` 含 setup 注册 messageBuilder/tool + 写日志），用户在 VS Code reload window 后检查 `plugin-loaded.log` 是否生成。若通过，#5 可在 VS Code 直接可用，ADR-004 恢复条件 2 满足。
