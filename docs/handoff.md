# Handoff — Handoff Plugin 全链路验证（Phase 2 通过 + VS Code Workaround）

## 本会话决策

| 决策 | 状态 |
|------|------|
| VS Code 扩展 4.0.0 plugin 不执行的根因：`plugin-sandbox-bootstrap.js` 缺失于 dist/ | ✅ 4 类证据交叉确认（[Update 6](decisions/ADR-002-project-shape.md)） |
| ALo 特性门控不是阻塞原因（plugins 默认开启） | ✅ 源码确认 |
| CLI 3.0.31 中 setup() 成功执行 | ✅ 实测（marker 11ms delta） |
| VS Code workaround 成功（复制 bootstrap + 依赖到扩展目录） | ✅ 实测（setup() 执行确认） |
| Phase 2 全链路验证通过：7 次 compact 事件，handoff.md + index.jsonl 双产物正确写入 | ✅ 实测 |
| collectTouchedFiles 质量问题已修复（FILEPATH_RE regex） | ✅ 用户修复 |

## 本会话净变化

### 1. 根因确认（[ADR-002 Update 6](decisions/ADR-002-project-shape.md)）

VS Code 扩展 4.0.0 的 esbuild 将 plugin loading 代码内联进 `dist/extension.js`，但未输出 `plugin-sandbox-bootstrap.js` 作为独立文件。

因果链：`loadSandboxedPlugins()` → `resolveBootstrap()` → 5 个候选路径全部失败 → jiti fallback 失败 → sandbox 子进程无法启动 → 4000ms 超时 → `setup()` 永不执行。

CLI 构建正确输出了 bootstrap（`@cline/core/dist/extensions/`），因此 CLI 中 plugin 正常。

### 2. VS Code Workaround

步骤（已验证）：
1. 复制 `plugin-sandbox-bootstrap.js`（从 CLI `@cline/core/dist/extensions/`）到扩展 `dist/extensions/`
2. 复制 `@cline/shared`、`@cline/core`、`jiti` 包到扩展 `node_modules/`
3. `setx CLINE_PLUGIN_IMPORT_TIMEOUT_MS 30000`
4. Reload VS Code window → setup() 执行确认

### 3. Phase 2 全链路验证

| 验证项 | 结果 |
|--------|------|
| setup() 执行 | ✅ marker 写入 |
| registerMessageBuilder 注册 | ✅ detect-compact builder 注册 |
| build() 被调用 | ✅ 7 次 compact 事件捕获 |
| shouldCompact() 判定 | ✅ 正确识别 token 超阈值 |
| handoff.md 写入 | ✅ 7 个文件（`~/.cline/data/handoff/`） |
| index.jsonl 追加 | ✅ 7 条记录 |
| collectToolNames() | ✅ 正确提取工具名 |
| collectTouchedFiles()（修复后）| ✅ FILEPATH_RE 过滤非路径字符串 |

### 4. 代码改进（用户执行）

- `collectTouchedFiles()`：原版用 `value.includes("/")` 匹配含 `/` 的源码文本 → 71KB 大文件。修复为 `FILEPATH_RE` regex（`/^[a-zA-Z]:(?:[/\\]|$)|^[/~]/`）+ `block.name === "editor"` 专项检查
- 架构文档 §9.3 已更新

## 未完成项 / 后续动作

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **决策抽取中文化** | `generateHandoffContent` 仅匹配英文关键字（decision/accept/reject 等），需加中文表达 | 中 |
| **index.jsonl file_count** | `generateIndexEntry` 中 `file_count: 0` 硬编码，应传 `files.length` | 低 |
| **测试产物清理** | `C:\handoff-plugin-debug.log` + 7 个测试 handoff.md + index.jsonl 旧记录 | 低 |
| **Git commit** | 本会话所有产出（plugin 源码 + 文档 + investigation notes）需提交 | 中 |
| **Cline 官方 Issue** | bootstrap 缺失是否已有 Issue / 是否需报告 | 低 |

## 权威源

[ADR-002 Update 6](decisions/ADR-002-project-shape.md)、[investigation-note-vscode-bootstrap-missing.md](decisions/investigation-note-vscode-bootstrap-missing.md)、[handoff-plugin-architecture.md](refs/handoff-plugin-architecture.md)、[dev-rules.md](dev-rules.md)

---

## Handoff（下次会话第一句话建议）

```text
先读 docs/dev-rules.md（注意 §1.5-§1.14 执行门控）与 docs/project-rules-search-orchestrator.md 各一次，遵守三份文档职责划分与防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：本会话完成 **Handoff Plugin Phase 2 全链路验证** + **VS Code 扩展 bootstrap 缺失根因确认** + **VS Code workaround 验证**。Plugin 在 CLI 和 VS Code（workaround）均可运行，7 次 compact 事件全部捕获，双产物正确写入。

**最大转折**：发现 VS Code 扩展 UI 显示 "Installed" ≠ sandbox 激活（Probe 5 V3 过度推断），根因是 esbuild 未输出 bootstrap 文件。

**下次首要动作**：
1. 决策抽取中文化 + index.jsonl file_count 补全
2. 清理测试产物 + git commit
