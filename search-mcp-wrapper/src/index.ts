#!/usr/bin/env node
// MCP 反-bot 节流 wrapper（方案 C）
// 对应决策：D-2026-06-26-search-adopt-mcp-throttle-wrapper
// 包裹 duckduckgo-websearch，实现：
//   1. 强制 max_results <= 10（从根上消除 vqd 翻页连击）
//   2. 跨调用状态记忆（blockedUntil + recentFailures 滑动窗口 + circuitBreakCount）
//   3. 指数退避熔断（3 次失败触发熔断，熔断时长按熔断次数指数递增：30s/2min/10min）
//   4. 会话级熔断（熔断期内拒绝 search 调用，返回 CIRCUIT_OPEN）
//
// 设计说明（整合决策文档 §决策第 3 点与 §wrapper 行为规约伪代码）：
//   决策文档伪代码"3 次失败 → 5min 熔断 + 清空 recentFailures"与 §决策第 3 点"指数退避 [30s,2min,10min]"
//   存在表述差异。本实现整合为：
//   - recentFailures 滑动窗口累计失败，>=3 次触发熔断（符合伪代码）
//   - 熔断触发后清空 recentFailures（符合伪代码），circuitBreakCount++ 记录熔断次数
//   - 熔断时长 = BACKOFF_DELAYS[min(circuitBreakCount-1, 2)]，实现指数退避（符合 §决策第 3 点）
//   - 成功调用清空 recentFailures + circuitBreakCount（完全恢复）
//   wrapper 不做同步重试（上游内部已有 3 次重试，避免双重重试放大延迟）。

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// ===== 类型定义 =====

// 与上游 duckduckgo-websearch 的 SearchResult 兼容（鸭子类型，便于测试 mock）
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

// 上游 searcher 最小契约（依赖注入，便于测试）
export interface UpstreamSearcher {
  search(query: string, options?: { maxResults?: number }): Promise<SearchResult[]>;
}

// 上游 fetcher 最小契约
export interface UpstreamFetcher {
  fetchAndParse(url: string, maxContentLength?: number): Promise<string>;
}

// 错误 code 兼容上游（BOT_DETECTED | HTTP_ERROR | TIMEOUT | UNKNOWN）+ wrapper 新增 CIRCUIT_OPEN
export type SearchErrorCode = 'BOT_DETECTED' | 'HTTP_ERROR' | 'TIMEOUT' | 'UNKNOWN' | 'CIRCUIT_OPEN';

export class SearchError extends Error {
  code: SearchErrorCode;
  blockedUntil?: Date;
  constructor(message: string, code: SearchErrorCode, blockedUntil?: Date) {
    super(message);
    this.name = 'SearchError';
    this.code = code;
    if (blockedUntil) this.blockedUntil = blockedUntil;
  }
}

// 类型守卫：从 unknown 错误中提取 code
function getErrorCode(e: unknown): SearchErrorCode | undefined {
  if (e && typeof e === 'object' && 'code' in e) {
    const code = (e as { code: unknown }).code;
    if (typeof code === 'string') return code as SearchErrorCode;
  }
  return undefined;
}

// ===== ThrottledSearchWrapper =====

export class ThrottledSearchWrapper {
  // 强制 cap：SKILL §1.4.1 的 R1/R2/R3 每路 max_results=10，项目从不分页，禁分页零损失
  private static readonly MAX_RESULTS_CAP = 10;

  // 指数退避熔断时长（毫秒）。索引 = circuitBreakCount - 1（封顶在索引 2）
  // 第 1 次熔断 → 30s
  // 第 2 次熔断 → 2min
  // 第 3+ 次熔断 → 10min（封顶）
  private static readonly BACKOFF_DELAYS = [30_000, 120_000, 600_000];

  // 触发熔断的失败次数阈值（决策伪代码：3 次）
  private static readonly FAILURE_THRESHOLD = 3;

  // 滑动窗口时长（1 小时）
  private static readonly FAILURE_WINDOW_MS = 3600_000;

  // 滑动窗口：1 小时内的失败时间戳
  private recentFailures: Date[] = [];
  private blockedUntil: Date | null = null;
  // 熔断次数（用于指数退避递增；成功后清零）
  private circuitBreakCount = 0;

  // 串行化链：避免并发请求同时穿透熔断检查（MCP server 支持并发调用）
  private chain: Promise<void> = Promise.resolve();

  constructor(
    private upstreamSearch: UpstreamSearcher,
    private upstreamFetch: UpstreamFetcher,
  ) {}

  /**
   * 节流 search：串行化排队 → 熔断检查 → cap max_results → 调用上游 → 成功清空 / 失败记录
   * 失败后不做同步重试（避免双重重试放大延迟），直接抛给调用方
   */
  async search(query: string, maxResults: number = 10): Promise<SearchResult[]> {
    const run = () => this._searchImpl(query, maxResults);
    // 把 run 排到 chain 末尾；chain 自身只跟踪完成状态，吞掉错误防止断裂
    const result = this.chain.then(run);
    this.chain = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async _searchImpl(query: string, maxResults: number): Promise<SearchResult[]> {
    // 1. 熔断检查
    if (this.blockedUntil && new Date() < this.blockedUntil) {
      throw new SearchError(
        `Circuit open: blocked until ${this.blockedUntil.toISOString()}`,
        'CIRCUIT_OPEN',
        this.blockedUntil,
      );
    }

    // 2. 强制 cap（从根上消除 vqd 翻页连击）
    const capped = Math.min(maxResults, ThrottledSearchWrapper.MAX_RESULTS_CAP);

    // 3. 调用上游（内部已有 3 次重试）
    try {
      const results = await this.upstreamSearch.search(query, { maxResults: capped });
      // 成功 → 完全恢复
      this.recentFailures = [];
      this.blockedUntil = null;
      this.circuitBreakCount = 0;
      return results;
    } catch (e) {
      const code = getErrorCode(e);
      if (code === 'BOT_DETECTED') {
        this.recordFailure();
      }
      // 直接抛给调用方（不做同步重试）
      throw e;
    }
  }

  /**
   * fetch_content 透传：fetch 是独立 HTTP 通道，不受 DDG search 后端 bot detection 影响
   * 不加节流（见决策文档"不影响 #22 Browser Fetch"——fetch 层反爬是正交问题）
   */
  async fetchContent(url: string, maxContentLength: number = 8000): Promise<string> {
    return this.upstreamFetch.fetchAndParse(url, maxContentLength);
  }

  // 记录失败 + 触发熔断（3 次失败才熔断，熔断后清空 recentFailures + circuitBreakCount++）
  private recordFailure(): void {
    const now = new Date();
    this.recentFailures.push(now);
    // 滑动窗口清理：移除 1h 外的失败
    this.recentFailures = this.recentFailures.filter(
      (t) => now.getTime() - t.getTime() < ThrottledSearchWrapper.FAILURE_WINDOW_MS,
    );

    // 达到阈值才触发熔断
    if (this.recentFailures.length < ThrottledSearchWrapper.FAILURE_THRESHOLD) {
      return;
    }

    // 触发熔断：清空 recentFailures（决策伪代码）+ circuitBreakCount++（指数退避）
    this.recentFailures = [];
    this.circuitBreakCount++;
    const idx = Math.min(
      this.circuitBreakCount - 1,
      ThrottledSearchWrapper.BACKOFF_DELAYS.length - 1,
    );
    const delay = ThrottledSearchWrapper.BACKOFF_DELAYS[idx];
    this.blockedUntil = new Date(now.getTime() + delay);
  }

  // 测试/调试用：查看当前状态
  getState(): {
    blockedUntil: Date | null;
    recentFailures: number;
    circuitBreakCount: number;
  } {
    return {
      blockedUntil: this.blockedUntil,
      recentFailures: this.recentFailures.length,
      circuitBreakCount: this.circuitBreakCount,
    };
  }
}

// ===== MCP Server =====

class ThrottledMCPServer {
  private server: Server;
  private wrapper: ThrottledSearchWrapper;

  constructor() {
    this.server = new Server(
      { name: 'search-mcp-wrapper', version: '0.1.0' },
      { capabilities: { tools: {} } },
    );
    // 生产环境：注入真实的上游实例
    this.wrapper = new ThrottledSearchWrapper(
      this.createUpstreamSearcher(),
      this.createUpstreamFetcher(),
    );
    this.setupToolHandlers();
  }

  // 生产环境创建上游 searcher（延迟 require，避免测试时 import 失败）
  private createUpstreamSearcher(): UpstreamSearcher {
    const { WebSearch } = require('duckduckgo-websearch');
    return new WebSearch();
  }

  private createUpstreamFetcher(): UpstreamFetcher {
    const { WebFetcher } = require('duckduckgo-websearch');
    return new WebFetcher();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search',
          description:
            'Search DuckDuckGo (throttled wrapper). max_results 强制 <= 10（禁分页，消除 vqd 连击）。连续 3 次 BOT_DETECTED 后触发指数退避熔断（30s/2min/10min）。',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              query: {
                type: 'string',
                description:
                  'Search query. 支持 DDG 高级语法：site:domain / "exact phrase" / -exclude / OR / intitle: / filetype:',
              },
              max_results: {
                type: 'integer',
                description: '结果条数（默认 10，强制 cap 到 10，>10 也会被截断）',
                default: 10,
                minimum: 1,
                maximum: 10,
              },
            },
            required: ['query'],
          },
        } as Tool,
        {
          name: 'fetch_content',
          description: 'Fetch and parse webpage content（透传上游，不加节流）',
          inputSchema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              url: { type: 'string', description: '要抓取的 URL' },
              max_content_length: {
                type: 'integer',
                description: '最大返回字符数（默认 8000）',
                default: 8000,
                minimum: 1,
              },
            },
            required: ['url'],
          },
        } as Tool,
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      try {
        if (name === 'search') {
          const { query, max_results = 10 } = args as {
            query: string;
            max_results?: number;
          };
          const results = await this.wrapper.search(query, max_results);
          return {
            content: [{ type: 'text', text: this.formatResults(results) }],
          };
        } else if (name === 'fetch_content') {
          const { url, max_content_length = 8000 } = args as {
            url: string;
            max_content_length?: number;
          };
          const content = await this.wrapper.fetchContent(url, max_content_length);
          return { content: [{ type: 'text', text: content }] };
        }
        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = getErrorCode(error) || 'UNKNOWN';
        return {
          content: [
            {
              type: 'text',
              text: `[${code}] ${message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private formatResults(results: SearchResult[]): string {
    if (!results || results.length === 0) {
      return 'No results were found.';
    }
    const out: string[] = [`Found ${results.length} search results:\n`];
    for (const r of results) {
      out.push(`${r.position}. ${r.title}`);
      out.push(`   URL: ${r.link}`);
      out.push(`   Summary: ${r.snippet}`);
      out.push('');
    }
    return out.join('\n');
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// ===== 入口 =====

async function main(): Promise<void> {
  const server = new ThrottledMCPServer();
  await server.run();
}

// 仅在直接运行时启动 MCP server（测试 import 时不启动）
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { ThrottledMCPServer };
