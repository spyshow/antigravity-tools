import * as readline from 'readline';
import { ModuleRegistry } from './modules/registry.js';
import { JSONRPCRequest, JSONRPCResponse } from './types.js';

export class MCPServer {
  private registry: ModuleRegistry;
  private isInitialized: boolean = false;

  constructor(registry?: ModuleRegistry) {
    this.registry = registry || new ModuleRegistry();
  }

  public start(): void {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    // Stderr logging so standard output remains 100% clean JSON-RPC
    console.error('[Antigravity-Toolkit MCP] Server starting on stdio...');

    rl.on('line', async (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      try {
        const req: JSONRPCRequest = JSON.parse(trimmed);
        const res = await this.handleRequest(req);
        if (res) {
          process.stdout.write(JSON.stringify(res) + '\n');
        }
      } catch (err: any) {
        console.error('[Antigravity-Toolkit MCP] Parse error:', err);
        const errResponse: JSONRPCResponse = {
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: `Parse error: ${err?.message || err}`
          }
        };
        process.stdout.write(JSON.stringify(errResponse) + '\n');
      }
    });

    process.stdin.on('end', () => {
      console.error('[Antigravity-Toolkit MCP] Stdin closed, exiting.');
      process.exit(0);
    });
  }

  public async handleRequest(req: JSONRPCRequest): Promise<JSONRPCResponse | null> {
    const { id, method, params } = req;

    // Handle notifications (no id)
    if (id === undefined || id === null) {
      if (method === 'notifications/initialized') {
        this.isInitialized = true;
      }
      return null;
    }

    try {
      switch (method) {
        case 'initialize': {
          this.isInitialized = true;
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: {
                name: 'antigravity-toolkit',
                version: '1.0.0'
              },
              capabilities: {
                tools: {}
              }
            }
          };
        }

        case 'ping': {
          return {
            jsonrpc: '2.0',
            id,
            result: {}
          };
        }

        case 'tools/list': {
          const tools = this.registry.getAllTools();
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools
            }
          };
        }

        case 'tools/call': {
          const toolName = params?.name;
          const toolArgs = params?.arguments || {};

          if (!toolName) {
            return {
              jsonrpc: '2.0',
              id,
              error: {
                code: -32602,
                message: 'Invalid params: missing tool name'
              }
            };
          }

          const result = await this.registry.dispatchToolCall(toolName, toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            }
          };
      }
    } catch (err: any) {
      console.error(`[Antigravity-Toolkit MCP] Error in ${method}:`, err);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: `Internal error: ${err?.message || err}`
        }
      };
    }
  }
}

// If executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('mcp-server.js')) {
  const server = new MCPServer();
  server.start();
}
