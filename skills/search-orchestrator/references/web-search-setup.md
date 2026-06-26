# Web Search MCP 装机指南

> 本项目的 `search-orchestrator` Skill 是**方法论**，不是搜索后端实现。
> 真正的搜索能力由外部 MCP server 提供。本文档说明如何接入。

> 文档与现状对齐说明（2026-06-23）：本指南原推荐 `uvx + nickclyde/duckduckgo-mcp-server`，但实测发现 npm 上的 `duckduckgo-websearch` 在能力上覆盖更广（分页、Bot 重试、高级查询语法）且无需追加运行时。主推方案已切换为 `npx + duckduckgo-websearch`，原 `uvx + nickclyde` 方案降级为备选（见第六节）。

> 文档与现状对齐说明（2026-06-26）：Run #14 Phase 0b 实测发现 `npx -y duckduckgo-websearch` 直连在 vqd 翻页连击下易触发 DDG bot detection（被封 cookie 进程级单例持续携带）。已落地项目内 wrapper（`search-mcp-wrapper/`，对应 D-2026-06-26-search-adopt-mcp-throttle-wrapper）实现：强制 `max_results≤10`（禁分页消除 vqd 连击）+ 3 次失败阈值熔断 + 指数退避 30s/2min/10min + 跨调用状态记忆。**主推方案切换为 wrapper**，原 `npx` 直连降级为回滚备选（见第二节 §2.2）。wrapper 11/11 集成测试通过。

---

## 推荐方案：duckduckgo-websearch（Node + npx）

**为什么选它**：

- ✅ **完全免费**——共享 DuckDuckGo 公共服务，无需任何 API key
- ✅ **零追加运行时**——只要装过 Node.js（≥ 18），`npx` 已自带；无需再装 Python/uv
- ✅ **社区主流**——`HeiSir2014/duckduckgo-mcp-server`（npm 包名 `duckduckgo-websearch`），v2.0.3（2026-03），MIT
- ✅ **双 tool**——同时提供 `search` 与 `fetch_content`
- ✅ **自动分页**——`max_results` > 10 时自动跨页拼接，支持 10~100+ 条
- ✅ **Bot 挑战重试**——内置 cookie jar + 3 次自动重试，对抗 DDG 反爬
- ✅ **高级查询语法**——`site:` / `OR` / `intitle:` / `filetype:` / `"…"` / `-word` 全部支持
- ✅ **Rate limit 内置**——30 次/分钟搜索 + 20 次/分钟抓取

包：[npmjs.com/package/duckduckgo-websearch](https://www.npmjs.com/package/duckduckgo-websearch)
源码：[github.com/HeiSir2014/duckduckgo-mcp-server](https://github.com/HeiSir2014/duckduckgo-mcp-server)

---

## 一、前置：Node.js ≥ 18

验证：

```powershell
node --version
npx --version
```

如未安装，建议从 [nodejs.org](https://nodejs.org/) 下载 LTS 版本。

> 项目内已存在的 npm 工具链（如 `@playwright/mcp`）说明环境通常已具备，无需重复安装。

---

## 二、在 Cline 中配置 MCP

打开 Cline 的 MCP 配置文件（`cline_mcp_settings.json`），加入：

### §2.1 推荐配置：项目内 wrapper（含反-bot 节流）

**前提**：项目内 `search-mcp-wrapper/` 已 build（`cd search-mcp-wrapper && npm install && npm run build`）。

```json
{
  "mcpServers": {
    "duckduckgo": {
      "autoApprove": ["search"],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": ["e:/cline++/search-mcp-wrapper/build/index.js"]
    }
  }
}
```

**wrapper 行为**（对应 D-2026-06-26-search-adopt-mcp-throttle-wrapper）：

| 行为 | 说明 |
|------|------|
| 强制 `max_results ≤ 10` | 禁分页，从根上消除 vqd 翻页连击（SKILL §1.4.1 每路只用 10，零损失） |
| 3 次失败阈值熔断 | 1h 滑动窗口内 3 次 `BOT_DETECTED` 触发熔断，熔断期内返回 `CIRCUIT_OPEN` |
| 指数退避 | 熔断时长按熔断次数递增：30s → 2min → 10min（封顶） |
| 跨调用状态 | 熔断状态在 wrapper 进程内持久（重启 Cline 才清） |
| 成功完全恢复 | 一次成功调用清空 recentFailures + blockedUntil + circuitBreakCount |
| fetch_content 透传 | 不加节流（fetch 与 search 反爬正交） |

> ⚠️ 路径用正斜杠 `/`（Cline JSON 兼容），绝对路径指向项目内 build 产物。

### §2.2 回滚配置：直连 npx（无节流）

若 wrapper 引入新问题需回滚：

```json
{
  "mcpServers": {
    "duckduckgo": {
      "autoApprove": ["search"],
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "duckduckgo-websearch"]
    }
  }
}
```

**字段说明**（两配置通用）：

| 字段 | 含义 | 建议 |
|------|------|------|
| `autoApprove` | 自动授权的工具列表 | `search` 可自动；`fetch_content` 建议保持手动确认 |
| `disabled` | 是否禁用 | `false` |
| `timeout` | stdio 超时（秒） | `60` 足够 |
| `command` / `args` | 拉起方式 | wrapper 用 `node <path>/index.js`；直连用 `npx -y duckduckgo-websearch` |

> ⚠️ **注意**：当前版本不支持通过环境变量配置 SafeSearch / Region。如果你需要严格内容过滤或区域指定，参考第六节备选方案。

---

## 三、验证装机

重启 Cline 后，让它跑一次测试：

```
请用 duckduckgo MCP 搜索 "model context protocol"，返回前 3 条结果。
```

预期：3 条结果，每条含 title / url / snippet。

如果失败：

| 现象 | 排查 |
|------|------|
| `npx not found` | Node.js 未安装或未加入 PATH，重开终端再试 |
| `MCP server failed to start` | 检查 JSON 语法（用 `Get-Content settings.json -Raw \| ConvertFrom-Json` 校验） |
| `BOT_DETECTED` | DDG 反爬触发，等几分钟再试 |
| 结果为空 | 查询过冷门，换关键词；或上游服务暂时受限 |

---

## 四、暴露的两个工具

### `search`

```
search(query: string, max_results: integer = 25) -> string
```

参数：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `query` | string | 必填 | 搜索查询，支持高级语法（见下文） |
| `max_results` | integer | 25 | 结果条数；> 10 时触发自动分页 |

**响应格式**（markdown）：

```
Found 25 search results:

1. Page Title
   URL: https://example.com/page
   Summary: Brief description...

2. ...
```

### `fetch_content`

```
fetch_content(url: string, max_content_length: integer = 8000) -> string
```

参数：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `url` | string | 必填 | 要抓取的 URL |
| `max_content_length` | integer | 8000 | 返回内容的最大字符数 |

返回清洗后的 LLM 友好文本（HTML 标签剥离 + 主内容提取）。

---

## 五、高级查询语法（实战利器）

搜索质量的差距常常不在搜索引擎，而在 query 的精细程度。`duckduckgo-websearch` 原生支持 Google 风格运算符：

| 语法 | 示例 | 作用 |
|------|------|------|
| `site:domain` | `site:github.com mcp server` | 限定域名 |
| `site:a.com OR site:b.com` | `site:docs.python.org OR site:realpython.com async` | 多域名并集 |
| `"exact phrase"` | `"model context protocol"` | 精确匹配 |
| `-word` | `python -snake` | 排除关键词 |
| `intitle:word` | `intitle:tutorial python` | 标题命中 |
| `filetype:ext` | `filetype:pdf machine learning` | 文件类型筛选 |
| `OR` / `AND` | `python OR javascript async` | 布尔运算 |

> 与 `search-orchestrator` Skill 的 Phase 1.4 "Design Search Paths" 配合使用：每个 sub-question 都应至少写一条带 `site:` 或 `"…"` 的精确查询，而不是只丢自然语言。

---

## 六、备选方案

| 方案 | 何时选 | 代价 |
|------|--------|------|
| **`uvx + nickclyde/duckduckgo-mcp-server`** | 需要 `DDG_SAFE_SEARCH` / `DDG_REGION` 显式开关 | 需要装 `uv`（Python 工具链） |
| **SearXNG 自托管 + MCP** | DDG 速率不够 / 想聚合多引擎 | 需 Docker，自维护 |
| **Tavily MCP** | AI 原生结果质量更好 | 免费额度 1000/月，需 API key |
| **Brave Search MCP** | DDG 区域受限 | 免费额度 2000/月，需 API key |
| **Exa MCP** | 语义搜索场景 | 免费额度 1000/月，需 API key |

V1 默认推荐 `duckduckgo-websearch`。其余作为 V2+ 可选扩展，不进默认包。

### 附：`uvx + nickclyde` 备选配置

如确需 SafeSearch / Region 显式控制：

```powershell
# 装 uv
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

```json
{
  "mcpServers": {
    "duckduckgo": {
      "command": "uvx",
      "args": ["duckduckgo-mcp-server"],
      "env": {
        "DDG_SAFE_SEARCH": "MODERATE",
        "DDG_REGION": "cn-zh"
      },
      "disabled": false
    }
  }
}
```

注意：该方案的 `fetch_content` 参数名为 `max_length` 而非 `max_content_length`，Skill 中如硬编码请按实际后端调整。

---

## 七、与本项目 `search-orchestrator` Skill 的关系

```
search-orchestrator/SKILL.md      ← 教 LLM 怎么搜（方法论）
        ↓ requires_mcp: ["duckduckgo"]
search-mcp-wrapper（项目内，§2.1）  ← 反-bot 节流（cap/熔断/退避）
        ↓ require('duckduckgo-websearch')
duckduckgo-websearch 上游          ← 真实执行（HTTP/HTML/rate limit/bot 重试）
```

三层职责分离：

- **Skill 层**（项目内）：Plan / Search / Evaluate / Synthesize 流程，可信度分级，反证搜索
- **Wrapper 层**（项目内，2026-06-26 新增）：强制 cap、跨调用状态、熔断、指数退避
- **MCP 上游层**（外部）：实际 HTTP 请求、HTML 解析、rate limit、bot 重试

如需替换为其他搜索后端，只需替换 wrapper 的上游依赖（或回滚到 §2.2 直连），Skill 层不动。

---

## 八、卸载

如果想换方案或不再使用：

1. 从 `cline_mcp_settings.json` 删除 `duckduckgo` 节
2. 重启 Cline
3. `npx` 缓存会在不再调用时由 npm 自动清理（如想立即清理：`npm cache clean --force`）

---

## 九、维护说明

- 本指南推荐版本：`duckduckgo-websearch` v2.0.3 或更新
- 上游变更监控：偶尔查 [npmjs.com/package/duckduckgo-websearch](https://www.npmjs.com/package/duckduckgo-websearch) 或 [Releases](https://github.com/HeiSir2014/duckduckgo-mcp-server/releases)
- 若上游废弃 → 评估第六节备选，本文件更新推荐
- **wrapper 维护**（2026-06-26 新增）：`search-mcp-wrapper/` 源码在项目内，对应决策 D-2026-06-26-search-adopt-mcp-throttle-wrapper；若 wrapper 行为需调整（如熔断阈值、退避时长），改 `search-mcp-wrapper/src/index.ts` 后 `npm run build`，Cline 重启生效；测试用 `npm test`（11 场景，mock 上游不触真实 DDG）
