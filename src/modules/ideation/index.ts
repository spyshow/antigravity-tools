import { PluginModule, MCPToolDefinition, MCPToolResult } from '../../types.js';
import { IdeationService } from './service.js';
import { IdeationStorage } from './storage.js';
import { createIdeationTools, createIdeationToolHandler } from './tools.js';
import { normalizeWorkspacePath, getActiveWorkspace } from '../workspace.js';

export class IdeationModule implements PluginModule {
  public readonly id = 'ideation';
  public readonly name = 'Ideation & Codebase Audits';
  public readonly description = 'Autonomous code-revealed feature discovery, performance bottleneck identification, security vulnerability audits, and technical debt analysis.';

  private service: IdeationService;
  private storage: IdeationStorage;
  private tools: MCPToolDefinition[];
  private toolHandler: (name: string, args: Record<string, any>) => Promise<MCPToolResult>;

  constructor(service?: IdeationService, storage?: IdeationStorage) {
    this.service = service || new IdeationService();
    this.storage = storage || new IdeationStorage();
    this.tools = createIdeationTools();
    this.toolHandler = createIdeationToolHandler(this.service, this.storage);
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

    if (!pathname.startsWith('/api/ideation')) {
      return false;
    }

    const sendJson = (statusCode: number, data: any) => {
      res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(JSON.stringify(data));
    };

    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      const wsParam = url.searchParams.get('workspace') || url.searchParams.get('workspacePath');
      const wsPath = normalizeWorkspacePath(wsParam || getActiveWorkspace());

      // GET /api/ideation
      if (pathname === '/api/ideation' && method === 'GET') {
        const report = await this.storage.getReport(wsPath);
        sendJson(200, { report, workspace: wsPath });
        return true;
      }

      // POST /api/ideation/analyze
      if (pathname === '/api/ideation/analyze' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const report = await this.service.generateReport(targetPath);
        await this.storage.saveReport(report, targetPath);
        sendJson(200, report);
        return true;
      }

      // POST /api/ideation/promote
      if (pathname === '/api/ideation/promote' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const result = await this.storage.promoteIdeaToRoadmap(body.ideaId, targetPath);
        sendJson(200, result);
        return true;
      }

      // POST /api/ideation/export
      if (pathname === '/api/ideation/export' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        let report = await this.storage.getReport(targetPath);
        if (!report) {
          report = await this.service.generateReport(targetPath);
          await this.storage.saveReport(report, targetPath);
        }
        const md = this.service.exportToMarkdown(report);
        const filePath = await this.storage.exportMarkdownFile(md, targetPath);
        sendJson(200, { success: true, filePath, markdown: md });
        return true;
      }

      sendJson(404, { error: 'Ideation API route not found' });
      return true;
    } catch (err: any) {
      sendJson(500, { error: err?.message || String(err) });
      return true;
    }
  }
}
