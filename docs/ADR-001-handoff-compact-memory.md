# ADR-001: Handoff / Compact / Memory 架构方向

- **Status**: Accepted
- **Date**: 2026-06-23
- **Deciders**: 项目所有者
- **Supersedes**: 无
- **Related**: 后续 Capability Probe / Handoff-v2 Design Doc

---

## Context

本项目定位为 Cline 扩展层。在做 Handoff / Compact / Memory 三层模型的实际数据复盘后，得到以下事实：

- 任务分析样本中 `resumed = 73%`（24 / 33），跨会话续作是主流场景
- 自研 Compact 机制的 `compaction_count = 0`，从未实际触发
- Cline 原生已具备自动上下文压缩能力，与本项目 Compact 层职责重叠
- 用户主要工作流位于 Cline 内，跨 IDE 迁移不是当前优先级
- Handoff 设计已被验证有效，承担了主要的状态交接职责

候选方案曾经被展开为 A-F 六种，详见下方 Alternatives 摘要。

---

## Alternatives

| ID | 方案 | 关键特征 |
|----|------|---------|
| A | Handoff 复用 Cline 原生 Compact | 依赖 Cline 能力，零自研压缩 |
| B' | 自动分级 Handoff（inline / crosswindow / silent） | 命中 73% resumed，自动判定 |
| C | 摘要压缩 + 滑动窗口结合 | 精细控制但与 Cline 冲突风险高 |
| D' | 可版本化索引层（JSONL + schema_version + source） | 索引可重建、不做死基础设施 |
| E | 分层记忆 + 短期工作集（Letta/MemGPT 风格） | 与 Cline 模型冲突 |
| F | Cline-native compact 事件钩子 | 自动化的能力前提 |

---

## Decision

```text
采用：
  A   复用 Cline Compact
  B'  自动分级 Handoff
  D'  可版本化索引层

并以前置能力探测（F）确定自动化路径。

暂缓：
  C   摘要压缩 + 滑动窗口（待 A+B'+D' 实测不足时再启动）

拒绝：
  E   分层记忆（与 Cline 模型冲突，违背差异化定位）
```

实现细节（inline commit 策略、session 判定、index schema、source 字段、`/where`、stash 规则、fallback、freshness、task template 分化等）属于 Implementation-level，不在本 ADR 范围，进入后续 Handoff-v2 Design Doc。

---

## Consequences

### 正面

- 删除自研 Compact 路线，消除"零次触发"的死代码债务
- 针对 73% resumed 场景做主线优化，体感改进直接
- 保留 git 可追溯性，符合 "handoff into git" 的差异化哲学
- 与 Cline 原生能力协作而非竞争，长期维护成本下降

### 负面

- 对 Cline 能力边界形成依赖，Cline 接口变化会冲击实现
- 自动化程度取决于 hook / session_id 等能力的可获得性，存在降级风险
- 跨 IDE 迁移成本上升，本项目越来越像 Cline 专属扩展

### 退休条件

- 整体方向：当 Cline 原生提供同等的"分级 handoff + 索引 + 状态可见性"时
- A：当 Cline Compact 接口出现破坏性变更且没有等价替代时
- B'：当 Cline 暴露 session 语义级 hook 让 inline 判定无需启发式时
- D'：当 Cline 原生提供 task slug + 时间戳 + commit 引用的索引能力时

---

## Next Steps

1. **Capability Probe**（ADR 的直接后续任务）
   - 探测 Cline 是否暴露 PostCompact / 等价 hook
   - 探测 Cline 是否暴露 session_id 或等价标识
   - 探测 Cline 的 compact 是否可程序化调用
   - 探测 Cline 的 condense 消息是否可被外部 watcher 检测
2. **Handoff-v2 Design Doc**
   - 基于 Probe 结果落实所有 Implementation-level 决策

```text
ADR-001 (Accepted)
        ↓
Capability Probe
        ↓
Handoff-v2 Design Doc
        ↓
Implementation
```
