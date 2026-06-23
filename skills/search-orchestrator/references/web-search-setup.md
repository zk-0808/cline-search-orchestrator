# Web Search MCP 装机指南

> 本项目的 `search-orchestrator` Skill 是**方法论**，不是搜索后端实现。
> 真正的搜索能力由外部 MCP server 提供。本文档说明如何接入。

---

## 推荐方案：DuckDuckGo MCP Server

**为什么选它**：

- ✅ **完全免费**——共享 DuckDuckGo 公共服务，无需任何 API key
- ✅ **零成本起步**——`uvx` 一条命令拉起，无 Docker、无后端
- ✅ **社区主流**——`nickclyde/duckduckgo-mcp-server`，v0.4.0（2026-05），MIT 许可
- ✅ **双 tool**——同时提供 `search` 和 `fetch_content`（搜完之后能读具体页面）
- ✅ **LLM 友好**——内置内容清洗、广告剥离、长度截断
- ✅ **rate limit 内置**——30 次/分钟搜索 + 20 次/分钟抓取，避免被 ban

仓库：[github.com/nickclyde/duckduckgo-mcp-server](https://github.com/nickclyde/duckduckgo-mcp-server)

---

## 一、前置：安装 `uv`

`uv` 是 Python 包/进程管理器，比 pip 快。`uvx` 是它附带的"零安装运行"命令。

**Windows（PowerShell）**：
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**macOS / Linux**：
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

验证：
```bash
uvx --version
```

---

## 二、在 Cline 中配置 MCP

打开 Cline 的 MCP 配置文件（`cline_mcp_settings.json`），加入：

### 基础配置（无 SafeSearch、无默认区域）

```json
{
  "mcpServers": {
    "ddg-search": {
      "command": "uvx",
      "args": ["duckduckgo-mcp-server"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 中文环境推荐配置

```json
{
  "mcpServers": {
    "ddg-search": {
      "command": "uvx",
      "args": ["duckduckgo-mcp-server"],
      "env": {
        "DDG_SAFE_SEARCH": "MODERATE",
        "DDG_REGION": "cn-zh"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

**环境变量说明**：

| 变量 | 含义 | 可选值 |
|------|------|--------|
| `DDG_SAFE_SEARCH` | 内容过滤 | `STRICT` / `MODERATE`（默认） / `OFF` |
| `DDG_REGION` | 区域语言 | `cn-zh` / `us-en` / `jp-ja` / `de-de` / `wt-wt`（无指定） |

---

## 三、验证装机

重启 Cline 后，让它跑一次测试：

```
请用 ddg-search MCP 搜索 "model context protocol"，返回前 3 条结果。
```

预期输出：3 条结果，每条含 title / url / snippet。

如果失败：
- `uvx not found` → 第一步 uv 没装好，重开终端再试
- `connection refused` → 检查 JSON 语法、重启 Cline
- 结果为空 → DuckDuckGo 当前区域可能受限，试 `DDG_REGION=us-en`

---

## 四、暴露的两个工具

### `search`
```
search(query: str, max_results: int = 10, region: str = "") -> str
```
返回 markdown 格式的搜索结果列表。

### `fetch_content`
```
fetch_content(url: str, start_index: int = 0, max_length: int = 8000, backend: str = None) -> str
```
抓取并清洗指定 URL 的网页内容。`backend` 可选 `httpx` / `curl` / `auto`（绕过 Cloudflare 等反爬）。

---

## 五、与本项目 `search-orchestrator` Skill 的关系

```
search-orchestrator/SKILL.md      ← 教 LLM 怎么搜（方法论）
        ↓ requires_mcp: ["duckduckgo"]
ddg-search MCP（本指南配置）       ← 真实执行（实现）
```

两层职责分离：
- **Skill 层**（项目内）：Plan / Search / Evaluate / Synthesize 流程，可信度分级，反证搜索
- **MCP 层**（外部）：实际 HTTP 请求、HTML 解析、rate limit

如需替换为其他搜索后端（如 Tavily / Brave / SearXNG），只需替换本指南的 MCP 配置，Skill 层不动。

---

## 六、备选方案（仅在 DDG 不够用时考虑）

| 方案 | 何时选 | 代价 |
|------|--------|------|
| **SearXNG 自托管 + MCP** | DDG 速率不够 / 想聚合多引擎 | 需 Docker，自维护 |
| **Tavily MCP** | AI 原生结果质量更好 | 免费额度 1000/月，需 API key |
| **Brave Search MCP** | DDG 区域受限 | 免费额度 2000/月，需 API key |
| **Exa MCP** | 语义搜索场景 | 免费额度 1000/月，需 API key |

V1 默认推荐 DDG。其余作为 V2+ 可选扩展，不进默认包。

---

## 七、卸载

如果想换方案或不再使用：
1. 从 `cline_mcp_settings.json` 删除 `ddg-search` 节
2. 重启 Cline
3. `uvx` 会在不再调用时自动清理缓存

---

## 八、维护说明

- 本指南推荐版本：`duckduckgo-mcp-server` v0.4.0 或更新
- 上游变更监控：偶尔查 [Releases](https://github.com/nickclyde/duckduckgo-mcp-server/releases)
- 若上游废弃 → 评估 SearXNG 自托管路径，本文件更新推荐
