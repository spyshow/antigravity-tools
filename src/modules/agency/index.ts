import { PluginModule, MCPToolDefinition, MCPToolResult } from '../../types.js';
import { AgencyService } from './service.js';
import { createAgencyTools, createAgencyToolHandler } from './tools.js';

export class AgencyModule implements PluginModule {
  public readonly id = 'agency';
  public readonly name = 'Agency Agents Integration';
  public readonly description = 'Multi-agent squad orchestrator and phonebook registry generator for Agency Agents (https://github.com/msitarzewski/agency-agents-app).';

  private service: AgencyService;
  private tools: MCPToolDefinition[];
  private toolHandler: (name: string, args: Record<string, any>) => Promise<MCPToolResult>;

  constructor(service?: AgencyService) {
    this.service = service || new AgencyService();
    this.tools = createAgencyTools();
    this.toolHandler = createAgencyToolHandler(this.service);
  }

  public getService(): AgencyService {
    return this.service;
  }

  public getTools(): MCPToolDefinition[] {
    return this.tools;
  }

  public async handleToolCall(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    return this.toolHandler(toolName, args);
  }

  public async handleHttpRequest(url: URL, req: any, res: any): Promise<boolean> {
    const pathname = url.pathname;
    const method = req.method;

    if (!pathname.startsWith('/api/agency')) {
      return false;
    }

    const sendJson = (statusCode: number, data: any) => {
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(JSON.stringify(data));
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return true;
    }

    const parseBody = async (): Promise<any> => {
      return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    try {
      const wsPath = url.searchParams.get('workspace') || process.cwd();

      // GET /api/agency/status
      if (pathname === '/api/agency/status' && method === 'GET') {
        const status = this.service.getStatus(wsPath);
        sendJson(200, status);
        return true;
      }

      // GET /api/agency/agents
      if (pathname === '/api/agency/agents' && method === 'GET') {
        const agents = this.service.listAgents(wsPath);
        sendJson(200, { count: agents.length, agents });
        return true;
      }

      // POST /api/agency/integrate
      if (pathname === '/api/agency/integrate' && method === 'POST') {
        const body = await parseBody();
        const targetPath = body.workspacePath || wsPath;
        const result = await this.service.integrate(targetPath);
        sendJson(200, result);
        return true;
      }

      sendJson(404, { error: 'Agency API route not found' });
      return true;
    } catch (err: any) {
      sendJson(500, { error: err?.message || String(err) });
      return true;
    }
  }
}
