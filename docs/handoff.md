# Handoff — 项目结构与文档体系定型

## 本会话决策

| 决策 | 状态 |
|------|------|
| docs/ 按产品线分组（search/ + plugin/），治理层集中 | ✅ 已执行（commit `e83958a`） |
| `git mv` 权限错误改用 `cp -r` + `rm -rf` 绕过 | ✅ 解决 |
| .gitignore 排除路径同步更新 | ✅ `!docs/search/search-orchestrator/experiments/` |
| 80 个文件的内部链接批量修正 | ✅ 验证无残留断链 |
| dev-rules.md §5 目录树更新 | ✅ 反映新结构 |

## 跨会话累计成果

### Phase 1 — 搜索编排器（search-orchestrator）

14 轮 A/B 双盲实验，6 个机制 active（P1 Goggles / P1.5 FinalScore 联动 / P3 Citation / P4 Same-Source Merge / P6 Highlights / #24 MCP Throttle Wrapper），Gap Ledger Δ=+55.6%。成果沉淀于 `skills/search-orchestrator/SKILL.md`。

### Phase 2 — Handoff Plugin

- VS Code 扩展 4.0.0 bootstrap 缺失根因确认（esbuild 不输出独立 bootstrap 文件，4 类证据交叉验证）
- CLI 3.0.31 + VS Code workaround 验证通过
- 7 次 compact 事件全捕获，handoff.md + index.jsonl 双产物正确写入
- 代码改进：i18n 中文化 + file_count 修复 + FILEPATH_RE 质量修复

### Phase 3 — 文档与项目治理

- 社区文档（双语 plugin dev guide）+ 跨平台 patch 脚本（ps1 + sh）
- Architecture Atlas（7 层 Plugin 生命周期地图）
- Architecture Recon QoderWork Skill（可复用方法论）
- 文件存放规范（dev-rules.md §5）
- **docs/ 按产品线重组**（本次）

## 当前项目结构

```
E:\cline++\
├── docs/
│   ├── dev-rules.md              跨功能治理规则
│   ├── evidence-governance.md    证据状态机
│   ├── reviewer-personas.md      评审人格
│   ├── mechanism-candidates.md   机制候选清单
│   ├── handoff.md                本文件
│   ├── decisions/                ADR + 调查笔记（集中）
│   ├── search/                   搜索产品线
│   │   ├── project-rules.md      开发期防漂移约束
│   │   ├── search-orchestrator/  实验记录（40+ runs）
│   │   ├── research/             搜索质量研究（8 篇）
│   │   └── blog/                 社区博文
│   └── plugin/                   Plugin 产品线
│       ├── design.md             handoff-plugin 设计文档
│       └── refs/                 架构参考（5 篇）
├── scripts/                      patch 脚本（ps1 + sh）
├── handoff-plugin/               Plugin 源码（子模块，dirty — README.md 链接待提交）
├── search-mcp-wrapper/           MCP wrapper
├── skills/                       Cline skills
└── experiments/p5-spike/         P5 Spike 实验
```

## 未完成项 / 后续动作

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **handoff-plugin 子模块提交** | README.md 链接已更新（`docs/plugin/design.md`），需在子模块内 `git commit` 然后父仓库更新引用 | 高 |
| **Cline 官方 Issue** | VS Code 扩展 bootstrap 缺失是否已有 Issue / 是否需报告 | 低 |
| **Plugin 功能迭代** | detect-compact 之外的 message builder（如 session-start / error-summary） | 中 |
| **测试产物清理** | `C:\handoff-plugin-debug.log` + 7 个测试 handoff.md + index.jsonl 旧记录 | 低 |

## 权威源

[dev-rules.md](dev-rules.md) · [evidence-governance.md](evidence-governance.md) · [ADR-002 Update 6](decisions/ADR-002-project-shape.md) · [investigation-note-vscode-bootstrap-missing.md](decisions/investigation-note-vscode-bootstrap-missing.md) · [plugin/refs/handoff-plugin-architecture.md](plugin/refs/handoff-plugin-architecture.md) · [plugin/refs/cline-plugin-architecture-atlas.md](plugin/refs/cline-plugin-architecture-atlas.md)

---

## Handoff（下次会话第一句话建议）

```text
先读 docs/dev-rules.md（注意 §1.5-§1.14 执行门控）与 docs/search/project-rules.md 各一次，遵守三份文档职责划分与防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：项目已完成搜索编排器 14 轮实验 + Handoff Plugin 全链路验证 + docs/ 产品线重组。当前状态——Plugin 源码与文档结构均已定型，子模块有一处未提交的 README.md 链接更新。

**下次首要动作**：
1. 在 `handoff-plugin/` 子模块内 commit README.md 变更，父仓库更新 submodule 引用
2. 评估 Plugin 功能迭代方向（新 message builder 类型）
3. 考虑是否向 Cline 官方报告 VS Code bootstrap 缺失
