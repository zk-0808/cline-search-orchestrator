# Handoff — P5 Output Schema 三轮验证终态（双盲证伪）

## 本会话总账

### 会话起点

上会话完成 Run #8a（MCP TLS 指纹假设 disproven），启动 P5 Output Schema 评估（proposed）。handoff 列出下次动作：写 run-9 实验框架 + 执行 Run #9。

### 本会话决策

| 决策 | 状态 |
|------|------|
| 执行 Run #9（单源列表型证据集） | ✅ 1/5 设计失败 — 指标天花板被自由文本顶满 |
| 执行 Run #9b（多实体对比 Gin/Echo/Fiber × 5 维度） | ✅ 3/5 有条件 — Conflict ID +40% 仅方向性信号（非双盲） |
| 外部评审 Run #9b | ✅ 决策 C：有条件 active，Run #9c 须双盲 + 非结构化证据集 |
| 执行 Run #9c（双盲 + 非结构化证据集） | ✅ 2/5 双盲证伪 — Conflict ID Δ=-20%，自由文本反超 schema |
| P5 Output Schema 降回 proposed | ✅ 降回触发条件已满足（Δ < +15%） |
| 新增 project-rules.md §约束 5（执行主体边界） | ✅ 已落地 |
| 新增 mechanism-candidates #23（TRAE/Cline 边界混淆） | ✅ 已落地 |
| handoff 进入 git | ✅ 本会话起执行 |

### 关键发现

```
P5 Output Schema 三轮验证终态:

Run #9  (单源列表型, 非双盲)
  → 1/5 设计失败
  → 指标天花板被自由文本顶满，schema 无提升空间
  → 根因：单源列表型证据集不触发 P5 核心收益场景

Run #9b (多实体对比, 非双盲)
  → 3/5 有条件
  → Conflict ID +40%（方向性信号）
  → 但非双盲偏差严重高估机制收益
  → 外部评审决策 C：有条件 active

Run #9c (双盲 + 非结构化证据集)
  → 2/5 双盲证伪
  → Conflict ID Δ=-20%（自由文本 100% > schema 80%）
  → Field Alignment Δ=-7%（自由文本 100% > schema 93%）
  → Schema 幻觉=0（护栏有效，但不足以挽救机制收益）
                ↓
终态结论:
  P5 Output Schema 双盲证伪，降回 proposed
  schema 结构可能限制跨维度冲突发现
  （执行者倾向只报告 schema 内字段间冲突，
   自由文本叙事流允许更灵活地连接不同维度信息）
                ↓
方法论教训:
  非双盲偏差不仅高估了幅度，甚至高估了方向
  Run #9b 的 +40% 在双盲验证中变为 -20%
  → 此后所有 A/B 实验默认双盲
```

### 执行主体边界事件

本会话发现并修复了一个严重的执行边界问题：

```
Run #9b Phase 0 执行时:
  TRAE agent 直接用 WebSearch/WebFetch 替代 SKILL 流程
  → 绕过了 Goggle / P3 / 三档模式全部机制
  → 产出的证据不合规
                ↓
根因:
  project-rules.md 四条防漂移约束全部针对文档同步
  没有一条针对执行主体边界
  session memory 两次记录该教训但从未机制化
                ↓
修复:
  新增 project-rules.md §约束 5（执行主体边界）
  新增 mechanism-candidates #23（永久C类，半机制化辅助）
  run-9b-p5-output-schema-v2.md §1.1.1 声明各 Phase 的 designated_executor
  run-9c 框架继承 designated_executor 声明
```

### 本会话产生的文件

| 文件 | 说明 |
|------|------|
| `docs/search-orchestrator/experiments/run-9-p5-output-schema.md` | Run #9 实验框架（单源列表型） |
| `docs/search-orchestrator/experiments/run-9b-p5-output-schema-v2.md` | Run #9b 实验框架（多实体对比） |
| `docs/search-orchestrator/experiments/run-9b-phase0-evidence.md` | Run #9b Phase 0 证据集（从 research/ 迁移） |
| `docs/search-orchestrator/experiments/run-9b-external-review.md` | Run #9b 外部评审材料 |
| `docs/search-orchestrator/experiments/run-9c-p5-output-schema-v3.md` | Run #9c 实验框架（双盲 + 非结构化证据集） |
| `docs/search-orchestrator/experiments/run-9c-ground-truth-sealed.md` | Run #9c 密封 GT |
| `docs/search-orchestrator/experiments/run-9c-run-a-output.md` | Run #9c Run A 输出（Cline 双盲执行） |
| `docs/search-orchestrator/experiments/run-9c-run-b-output.md` | Run #9c Run B 输出（Cline 双盲执行） |

### 本会话修改的文件

| 文件 | 改动 |
|------|------|
| `docs/project-rules.md` | 新增 §约束 5（执行主体边界）+ 子条款（执行产出归档路径）+ 标题"四条"→"五条" |
| `docs/mechanism-candidates.md` | #16 降回候选；新增 #23（TRAE/Cline 边界混淆，永久C类） |
| `docs/search-orchestrator/survey.md` | §9.2 Run #9/#9b/#9c 三行填入；§9.3 P5 降回 proposed |
| `docs/handoff.md` | 本文件 |

### 明确不做的事

- ✅ 不再为 P5 Output Schema 设计 Run #9d — 三轮验证已充分，双盲证伪是终态结论
- ✅ 不在非双盲条件下引用 Conflict ID +40% 作为量化依据 — 仅可作方向性历史记录
- ✅ 不用 TRAE agent 的 WebSearch/WebFetch 替代 Cline SKILL 流程（约束 5）

### 当前路线图

> **不在此处展开**。权威源：[survey.md §9.3 最终路线状态](search-orchestrator/survey.md#L311-L321)。
>
> 本会话对路线的净变化：
> - `P5 Output Schema`：proposed → active（有条件）→ **proposed**（双盲证伪降回）
> - 新增 `约束 5`（执行主体边界）+ `#23`（TRAE/Cline 边界混淆）

### 未完成项

> **不在此处展开**。权威源：
> - 机制候选清单：[mechanism-candidates.md](mechanism-candidates.md)
> - 决策与实验进度：[survey.md §9](search-orchestrator/survey.md#L277)
>
> 下次会话的**可选方向**（P5 已终态，需选下一项）：
>
> | 方向 | 关联条目 | 说明 |
> |------|---------|------|
> | P6 Highlights / Relevance Compression | mechanism-candidates #17 | 候选（V2 P6） |
> | M-22 Browser-backed Fetch | mechanism-candidates #22 | 候选（暂缓），需触发条件 |
> | #20 反证检索 | mechanism-candidates #20 | 候选（P2 失败遗产） |
> | #21 多样性排序 | mechanism-candidates #21 | 候选（P2 失败遗产） |
> | 其它长期候选 #1~#15 | mechanism-candidates.md | 见全表 |
>
> 长期候选（暂不动）：mechanism-candidates #1~#15、#17、#18、#20、#21、#22。

### Handoff（下次会话第一句话建议）

> **首句话提示词**（复制到新会话开头使用）：
>
> ```
> 先读 docs/project-rules.md 一次，遵守里面的三份文档职责划分与五条防漂移约束。
> 然后读 docs/handoff.md，按下面的工作内容继续。
> ```
>
> ---
>
> **接续上下文**：上会话完成 P5 Output Schema 三轮验证终态。Run #9 1/5 设计失败（单源列表型），Run #9b 3/5 有条件（非双盲 +40% 方向性信号），Run #9c 2/5 双盲证伪（Conflict ID Δ=-20%，自由文本反超 schema）。P5 降回 proposed，不再做 Run #9d。本会话新增约束 5（执行主体边界：TRAE agent 不得用 WebSearch/WebFetch 替代 Cline SKILL 流程）+ mechanism-candidates #23（永久C类）。方法论教训：非双盲偏差不仅高估幅度，甚至高估方向；此后所有 A/B 实验默认双盲。**下一步**：从 P6 / M-22 / #20 / #21 中选一项推进，或处理其它长期候选。
