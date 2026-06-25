# Handoff — Run #14 P5 Gap Ledger 最小机制框架建立 + Phase 0b 采集受阻 + 候选 #24 登记

## 本会话决策

| 决策 | 状态 |
|------|------|
| 澄清「先开 run13」语义 → Run #13 已闭环密封评分 2/5，本会话实为**新建 Run #14** | ✅ 已澄清，不动 Run #13 任何产物 |
| 新建 Run #14：P5 **Gap Ledger 最小机制**双盲验证（剥离 Evidence Map 节点-边，仅追加一步强制证据缺口枚举） | ✅ 框架文件已建，状态 Phase 0b |
| Run #14 单变量隔离 + gap 密集证据集（GT gap ≥5，含显性/隐性各 ≥2）+ 主指标改为 Gap Detection Recall | ✅ 已写入框架 |
| Run #14 query 锚定 mechanism-candidates #22（Browser Fetch 反爬选型，项目后续真实用到 + 天然 gap 密集） | ✅ 已回填 §2.2/§5/§6.1 |
| 证据池策略：新建 gap 密集池（不复用 Run #13 池），query 由 agent 推定 | ✅ Phase 0a 确认 |
| Phase 0b DDG `BOT_DETECTED` 运行时故障处置 → 双轨：Run #14 用「冷却+降速」手动续跑，不停 | ✅ 用户拍板双轨 |
| 登记 **mechanism-candidates #24**：搜索 MCP 自适应反-bot 节流/退避（Class A，候选） | ✅ 新候选，未写决策、未动代码 |
| 写 handoff | ✅ 用户口头要求，触发 project-rules.md 4.a |

---

## 本会话净变化

### Run #14 框架建立（P5 Gap Ledger 最小机制）

权威文件：[run-14-p5-gap-ledger.md](search-orchestrator/experiments/run-14-p5-gap-ledger.md)

设计要点（与 Run #13 的关键区别）：

- **单变量隔离**：Run #13 的 Run B 是完整 Evidence Map（Nodes + Edges + Conflict Ledger + Gap Ledger）；Run #14 的 Run B **只保留 Gap Ledger 一步**（强制证据缺口枚举），剥离节点-边/Conflict Ledger，其余与 Run A 完全相同 → 单独测量 Run #13 唯一窄增量的边际贡献。
- **gap 密集证据集**：GT 要求 ≥5 个 gap（补 Run #13 gap 分母仅 3 的统计功效短板），含显性缺口 ≥2 + 隐性缺口 ≥2（隐性=看似被回答实为单源/过时/范围外推）。
- **主指标换轨**：从 Material Relation Recall 改为 **Gap Detection Recall + Implicit Gap Recall**；material relation/可追溯/False Gap/Unsupported Relation/Info Loss 转为安全指标。
- **query**：`评估无头浏览器抓取穿透 Cloudflare 等反爬的可行方案：Playwright / nodriver / Camoufox / FlareSolverr / cloudscraper 与托管云浏览器的有效性、被识别风险、住宅代理与 CAPTCHA 依赖、适用边界`
- **升级 active（仅 Gap Ledger 进 SKILL.md）触发条件**：≥4/5；≤3/5 则 P5 整条线收敛保持 proposed。

### mechanism-candidates #24 登记

[mechanism-candidates.md #24](mechanism-candidates.md)：搜索 MCP 自适应反-bot 节流/退避，Class A，候选。

- 触发证据：Run #14 Phase 0b DDG 被封运行时故障 + web-search-setup.md §七 分层（rate limit/bot 重试归 MCP 层）+ duckduckgo-websearch 源码实证。
- 根因（读 MCP 源码 + DDG 库文档确认）：`max_results>10` 触发 vqd 连续翻页放大 + 同 IP 短时高频 → 越过 DDG 服务端反爬阈值，封 IP/session 级。
- 理想机制四点：① `BOT_DETECTED` 指数退避 + 跨请求记忆被封状态主动降速；② vqd 翻页间 jitter；③ 会话级熔断（自动降 max_results/串行化）；④ 回退 lite/bing backend。需 fork 上游或包薄 wrapper（现为 `npx -y` 拉上游不可直接改）。
- 治理依据：与 #21 同理——确定性运行时节流应交给代码而非提示词（提示词靠 LLM 自觉，跨调用不可靠）。

---

## 本会话新增文件

| 文件 | 说明 |
|------|------|
| `docs/search-orchestrator/experiments/run-14-p5-gap-ledger.md` | Run #14 框架（假设 H14 / 单变量 / gap 密集证据集要求 / 主指标 Gap Detection Recall / 两档提示词 / 执行流程 / 结果区待填） |
| `docs/search-orchestrator/experiments/run-14-phase0-evidence.md` | Phase 0b evidence pool（Cline + SKILL 侧落盘，**非 TRAE agent 产出**；当前采集受 DDG 反爬中断，仅 Q1 Playwright 10 条结果，待续跑） |

## 本会话修改文件

| 文件 | 改动 |
|------|------|
| `docs/mechanism-candidates.md` | 新增 #24 行（搜索 MCP 自适应反-bot 节流，Class A，候选） |
| `docs/handoff.md` | 覆盖为本交接 |

注：git status 另显示 Run #13 全部文件仍 untracked、D-2026-06-25 等上一批 modified 未提交 —— 系上一会话 handoff commit 未实际落地的遗留，本次 commit 一并纳入以恢复完整快照。

---

## 当前路线图

权威源：

- [survey.md §9.3 最终路线状态](search-orchestrator/survey.md#L316)
- [mechanism-candidates.md](mechanism-candidates.md)

本会话净变化：

- P5：在 Run #13（v2 Evidence Map 2/5 证伪）之后，新建 Run #14 单独验证唯一窄增量「Gap Ledger 强制证据缺口枚举」最小机制。Run #14 尚未评分，P5 路线状态仍 proposed（§9.3 未跳终态）。
- #24：新登记候选（搜索 MCP 自适应反-bot 节流），未启动。

---

## 未完成项 / 后续动作

| 方向 | 说明 | 优先级 |
|------|------|--------|
| **Run #14 Phase 0b 续跑采集**（双轨A） | DDG 被封。动作：Q1 结果先落盘 → 冷却 3-5 分钟 → Q2-Q8 降速续跑（`max_results≤10` 规避翻页连击 + 串行 + 每条间隔 3-5 秒）。仍反复被封则缩小 query 方案对比面（六方案→主力 3-4 个），勿用单方案池硬凑（污染 gap 指标）。**这是 #24 未机制化前的人工 workaround，非实验变量** | 高 |
| Run #14 Phase 0c/1/2 | 采集完成后：agent 密封 GT（gap ≥5，显性/隐性各 ≥2）→ 用户在 Cline 盲态跑 Run A / Run B → agent 解封评分 | 高 |
| #24 落地评估（双轨B） | 独立推进，不阻塞 Run #14。评估 fork 上游 vs 薄 wrapper MCP，再定实验框架 | 中 |
| #22 Browser Fetch 启动评估 | 候选（暂缓）。仅当 Tier C snippet-only 被证明严重影响答案质量才启动 | 低 |
| run-10-output.md 去留确认 | 上一会话遗留 modified，本次 status 未再出现（疑已恢复/提交），可确认 | 低 |

---

## Handoff（下次会话第一句话建议）

首句话提示词：

```text
先读 docs/project-rules.md 一次，遵守里面的三份文档职责划分与五条防漂移约束。
然后读 docs/handoff.md，按下面的工作内容继续。
```

接续上下文：本会话新建 Run #14（P5 Gap Ledger 最小机制双盲验证），它从 Run #13（完整 Evidence Map 2/5 证伪）中剥离出唯一窄增量——「自由文本合成前追加一步强制证据缺口枚举」单独验证，Run B 不再做节点-边/Conflict Ledger。证据集要求 gap 密集（GT gap ≥5，显性/隐性各 ≥2），主指标为 Gap Detection Recall。query 锚定 #22 浏览器反爬选型（天然 gap 密集）。Phase 0a 已确认，Phase 0b 采集时 DDG 触发 BOT_DETECTED：定位根因为 vqd 翻页放大 + 同 IP 高频，已登记新候选 #24（搜索 MCP 自适应反-bot 节流，Class A）。采用双轨：Run #14 用「冷却+降速」手动续跑采集（Q1 已得 10 条），#24 独立评估不阻塞。下一步：在 Cline+SKILL 续跑 Phase 0b 采完 gap 密集证据池 → agent 密封 GT → 盲态跑 Run A/B → 评分。注意执行边界：Phase 0b/1 必须 Cline+SKILL 执行，TRAE agent 不用裸 WebSearch 替代；采集时不得动用代理/headless 等手段（那是被测对象 #22，会污染中立性）。
