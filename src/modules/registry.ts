import { PluginModule, MCPToolDefinition, MCPToolResult } from '../types.js';
import { PromptsModule } from './prompts/index.js';
import { RoadmapModule } from './roadmap/index.js';
import { IdeationModule } from './ideation/index.js';
import { AgencyModule } from './agency/index.js';

export class ModuleRegistry {
  private modules: Map<string, PluginModule> = new Map();

  constructor() {
    // Register Function 1: Prompts Library
    this.register(new PromptsModule());

    // Register Function 2: AI-Assisted Roadmap & Competitor Planner
    this.register(new RoadmapModule());

    // Register Function 3: Ideation & Codebase Audits (Aperant Model)
    this.register(new IdeationModule());

    // Register Function 4: Agency Agents Integration
    this.register(new AgencyModule());
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
