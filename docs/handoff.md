# Handoff — P5 Plugin Spike No-Go 误判已撤销：插件运行时实证可用，ADR-003 rolled-back

## 本会话决策

| 决策 | 状态 |
|------|------|
| P5 Spike No-Go 判定 | ❌ **撤销（误判）**——验证方法假阴性 |
| ADR-003（Plugin 退出）| **rolled-back**（当日撤销，保留审计） |
| Plugin 在 CLI 3.0.30 运行时可用性 | ✅ **实证成立**——发现+加载+hook 触发全链路打通 |
| #6 session_start hook | ✅ **已确认 Go**（`beforeRun` 实证触发，session-start.log 写入） |
| #5 compact 双产物 | ⏳ 待长任务触发 compact 实证 |
| P5 Spike 当前状态 | partial Go（最终决策待 #5 实证后另开 ADR-004） |
| 记录两条教训 + 回流规则层 | ✅ 完成 |

---

## 本会话净变化（重大纠错）

### 1. No-Go 是误判，根因=验证方法假阴性

上一轮判定 P5 Spike No-Go，核心证据是 `config plugins` 报 "No plugins found"（含"官方样例也加载不了"）。**该证据错误**：

- 我用 `cline -c <dir> config plugins`，**误以为 `-c` 能给 `config plugins` 指定发现根**；
- 实际 `config plugins` **只扫真实 cwd 的 `.cline/plugins`，不理会 `-c`**；
- 当时真实 cwd 是 `E:\cline++`（无插件）→ 必然 No plugins found → 假阴性；
- "官方样例也失败"是同一缺陷的重复，不是独立交叉验证。

用户用正确方式（`cd` 进目录再 `cline config plugins`）复测，插件被正常发现。

### 2. 修正后的实证事实

| 验证 | 结果 |
|------|------|
| config plugins（正确 cwd） | ✅ Discovered plugins: p5-spike-plugin / weather-metrics |
| cline -v 实跑（插件已装载） | ✅ 正常完成 |
| **#6 beforeRun hook** | ✅ **实证触发**：`handoff/session-start.log` 写入 `[2026-06-26T12:24:03.338Z] session_start hook fired (beforeRun)` |
| #5 compact 双产物 | ⏳ 待 token>90000 长任务触发 |

**结论**：Plugin 在 **CLI 3.0.30 运行时可用**（与误判相反）。VS Code 扩展无装载入口仍是另一独立事实，但 CLI 路径已跑通，恢复了 Plugin 作为运行时自动化层的技术可行性。

### 3. 两条教训（详见 run-p5-capability-spike.md §7）

- **教训 1（重大失误）**：用错误验证方法下否决结论。纪律：阴性结论须先用"已知应成功的对照"确认验证方法有效；共享同一前提的多条证据不算独立验证。
- **教训 2**：Agent 非交互终端无法跑 cline 交互式会话（`cline -v/-i` 报 `EBADF: bad file descriptor`，需 TTY）。纪律：此类命令必须交用户在真实终端执行。

两条均已回流 `docs/project-rules.md §约束 5` 新增子条款。

---

## 本会话修改文件

| 文件 | 改动 |
|------|------|
| `experiments/p5-spike/run-p5-capability-spike.md` | §5 全面修正（撤销 No-Go → partial Go，修正实跑表）；新增 §7 教训记录；状态行更新 |
| `docs/decisions/ADR-003-plugin-spike-exit.md` | 顶部加 ROLLED-BACK 撤销说明，status 改 rolled-back，原文保留审计 |
| `docs/mechanism-candidates.md` | #1–4/#14 恢复，#5/#6 改"实验中"（#6 已实证 hook 触发） |
| `docs/decisions/README.md` | ADR-003 行状态改 rolled-back + 撤销摘要 |
| `docs/project-rules.md` | §约束 5 新增两子条款（TTY 执行边界 / 阴性结论须排除验证方法错误） |
| `docs/handoff.md` | 覆盖为本交接 |

---

## 当前路线图

权威源：
- [survey.md §9.3 最终路线状态](search-orchestrator/survey.md)
- [mechanism-candidates.md](mechanism-candidates.md)

ADR-003 状态 active→rolled-back（触发 project-rules 4.b）。ADR-003 为全局 Plugin 决策，不进 survey.md §9.1。

search-orchestrator P 级机制 active（6 条，不变）：P1 / P1.5 / P3 / P4 / P5 Gap Ledger / P6。Infra（1 条）：#24 wrapper。

---

## 未完成项 / 后续动作

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **补全 #5 compact 双产物实证** | 用户在真实终端构造长任务触发 compact（token>90000），验证 handoff.md + index.jsonl 是否由 registerMessageBuilder 写出。命令需用户执行（TTY）。完成后据结果另开 **ADR-004**（最终 Go/No-Go） | 高 |
| ADR-004（最终决策） | #5 实证完成后撰写：若双产物成功→Plugin 作为运行时自动化层（CLI 路径）；明确 VS Code 载体约束下的交付定位 | 高（条件性） |
| 决策文档事实审核 7 项修订 | 见更早 handoff 修订表 | 中 |
| CSDN 博客发布 | 已写好待用户手动发布 | 中 |
| 消融实验（Ablation） | GPT 终评建议 | 中 |
| #22 Browser Fetch / #24 V2 backend | 暂缓，触发条件见 mechanism-candidates | 低 |

---

## Handoff（下次会话第一句话建议）

首句话提示词：

```text
先读 docs/project-rules.md 一次，遵守里面的三份文档职责划分与五条防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：本会话发生一次**重大纠错**——P5 Spike 的 No-Go 结论是误判，根因是验证 `config plugins` 时误用 `-c` 参数（它只扫真实 cwd，不理会 `-c`），在错误目录下取得"No plugins found"假阴性，还把"官方样例也失败"当成伪交叉验证。用户用正确方式复测后，插件被正常发现，且 `beforeRun`（session_start）hook 实证触发（session-start.log 写入成功）——证明 **Plugin 在 CLI 3.0.30 运行时可用**。已撤销 ADR-003（标 rolled-back，保留审计），mechanism #5/#6 改"实验中"、#1-4/#14 恢复候选，两条教训回流 project-rules §约束5。**下次首要动作**：让用户在真实终端构造长任务触发 compact，验证 #5 的 handoff.md + index.jsonl 双产物是否由 registerMessageBuilder 写出；完成后据结果写 ADR-004 作最终判定。注意：cline 交互式命令（-i/-v）必须用户在真实终端跑，Agent 跑会报 EBADF。（基于误判的 github-issue-draft.md 已删除。）
