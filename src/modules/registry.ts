import { PluginModule, MCPToolDefinition, MCPToolResult } from '../types.js';
import { PromptsModule } from './prompts/index.js';

export class ModuleRegistry {
  private modules: Map<string, PluginModule> = new Map();

  constructor() {
    // Register Function 1: Prompts Library
    this.register(new PromptsModule());
  }

  public register(module: PluginModule): void {
    this.modules.set(module.id, module);
  }

  public getModule<T extends PluginModule = PluginModule>(id: string): T | undefined {
    return this.modules.get(id) as T | undefined;
  }

  public getAllModules(): PluginModule[] {
    return Array.from(this.modules.values());
  }

  public getAllTools(): MCPToolDefinition[] {
    const tools: MCPToolDefinition[] = [];
    for (const mod of this.modules.values()) {
      tools.push(...mod.getTools());
    }
    return tools;
  }

  public async dispatchToolCall(toolName: string, args: Record<string, any>): Promise<MCPToolResult> {
    for (const mod of this.modules.values()) {
      const match = mod.getTools().find(t => t.name === toolName);
      if (match) {
        return mod.handleToolCall(toolName, args);
      }
    }

    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `No module found to handle tool "${toolName}"`
        }
      ]
    };
  }

  public async dispatchHttpRequest(url: URL, req: any, res: any): Promise<boolean> {
    for (const mod of this.modules.values()) {
      if (mod.handleHttpRequest) {
        const handled = await mod.handleHttpRequest(url, req, res);
        if (handled) return true;
      }
    }
    return false;
  }
}
