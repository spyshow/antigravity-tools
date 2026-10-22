import { PluginModule, MCPToolDefinition, MCPToolResult } from '../../types.js';
import { PromptService } from './service.js';
import { createPromptTools, handlePromptToolCall } from './tools.js';

export class PromptsModule implements PluginModule {
  public readonly id = 'prompts';
  public readonly name = 'Prompt Library';
  public readonly description = 'Save, organize, interpolate template variables, and paste prompts directly to the system clipboard.';

  private service: PromptService;
  private tools: MCPToolDefinition[];

  constructor(service?: PromptService) {
    this.service = service || new PromptService();
    this.tools = createPromptTools();
  }

  public getService(): PromptService {
    return this.service;
  }

  public getTools(): MCPToolDefinition[] {
    return this.tools;
  }

  public async handleToolCall(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    return handlePromptToolCall(this.service, toolName, args);
  }

  public async handleHttpRequest(url: URL, req: any, res: any): Promise<boolean> {
    const pathname = url.pathname;
    const method = req.method;

    // Helper to send JSON
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

    // Helper to parse JSON body
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

    // API Routes:
    // GET /api/prompts
    if (method === 'GET' && pathname === '/api/prompts') {
      const category = url.searchParams.get('category') || undefined;
      const tag = url.searchParams.get('tag') || undefined;
      const search = url.searchParams.get('search') || undefined;
      const favoriteOnly = url.searchParams.get('favoriteOnly') === 'true';

      const prompts = await this.service.listPrompts({ category, tag, search, favoriteOnly });
      sendJson(200, { success: true, prompts });
      return true;
    }

    // GET /api/prompts/meta
    if (method === 'GET' && pathname === '/api/prompts/meta') {
      const meta = await this.service.getCategoriesAndTags();
      sendJson(200, { success: true, ...meta });
      return true;
    }

    // GET /api/prompts/:id
    if (method === 'GET' && pathname.startsWith('/api/prompts/')) {
      const id = decodeURIComponent(pathname.replace('/api/prompts/', ''));
      const prompt = await this.service.getPrompt(id);
      if (!prompt) {
        sendJson(404, { success: false, error: 'Prompt not found' });
      } else {
        sendJson(200, { success: true, prompt });
      }
      return true;
    }

    // POST /api/prompts
    if (method === 'POST' && pathname === '/api/prompts') {
      const body = await parseBody();
      if (!body.title || !body.template) {
        sendJson(400, { success: false, error: 'Title and template are required' });
        return true;
      }
      const saved = await this.service.savePrompt(body);
      sendJson(201, { success: true, prompt: saved });
      return true;
    }

    // POST /api/prompts/:id/paste
    if (method === 'POST' && pathname.endsWith('/paste')) {
      const id = decodeURIComponent(pathname.replace('/api/prompts/', '').replace('/paste', ''));
      const body = await parseBody();
      try {
        const result = await this.service.pastePrompt(id, body.variables || {});
        sendJson(200, { success: true, result });
      } catch (err: any) {
        sendJson(400, { success: false, error: err.message });
      }
      return true;
    }

    // POST /api/prompts/:id/favorite
    if (method === 'POST' && pathname.endsWith('/favorite')) {
      const id = decodeURIComponent(pathname.replace('/api/prompts/', '').replace('/favorite', ''));
      const prompt = await this.service.toggleFavorite(id);
      if (!prompt) {
        sendJson(404, { success: false, error: 'Prompt not found' });
      } else {
        sendJson(200, { success: true, prompt });
      }
      return true;
    }

    // DELETE /api/prompts/:id
    if (method === 'DELETE' && pathname.startsWith('/api/prompts/')) {
      const id = decodeURIComponent(pathname.replace('/api/prompts/', ''));
      const ok = await this.service.deletePrompt(id);
      sendJson(200, { success: ok });
      return true;
    }

    // POST /api/prompts/import
    if (method === 'POST' && pathname === '/api/prompts/import') {
      const body = await parseBody();
      const resData = await this.service.importJson(JSON.stringify(body.prompts || body), body.mode || 'merge');
      sendJson(200, { success: true, ...resData });
      return true;
    }

    // GET /api/prompts/export
    if (method === 'GET' && pathname === '/api/prompts/export') {
      const json = await this.service.exportJson();
      sendJson(200, JSON.parse(json));
      return true;
    }

    return false;
  }
}
