import { PluginModule, MCPToolDefinition, MCPToolResult } from '../../types.js';
import { ProjectAnalyzer } from './project-analyzer.js';
import { CompetitorService } from './competitor-service.js';
import { RoadmapGenerator } from './generator.js';
import { RoadmapStorage } from './storage.js';
import { createRoadmapTools, createRoadmapToolHandler } from './tools.js';
import { normalizeWorkspacePath, getActiveWorkspace } from '../workspace.js';
import { runRoadmapPipeline } from './pipeline.js';

export class RoadmapModule implements PluginModule {
  public readonly id = 'roadmap';
  public readonly name = 'AI Roadmap & Competitor Planner';
  public readonly description = 'Autonomous project codebase discovery, competitor intelligence benchmarking, and phased MoSCoW roadmap generation.';

  private analyzer: ProjectAnalyzer;
  private competitorService: CompetitorService;
  private generator: RoadmapGenerator;
  private storage: RoadmapStorage;
  private tools: MCPToolDefinition[];
  private toolHandler: (name: string, args: Record<string, any>) => Promise<MCPToolResult>;

  constructor(
    analyzer?: ProjectAnalyzer,
    competitorService?: CompetitorService,
    generator?: RoadmapGenerator,
    storage?: RoadmapStorage
  ) {
    this.analyzer = analyzer || new ProjectAnalyzer();
    this.competitorService = competitorService || new CompetitorService();
    this.generator = generator || new RoadmapGenerator();
    this.storage = storage || new RoadmapStorage();

    this.tools = createRoadmapTools();
    this.toolHandler = createRoadmapToolHandler(
      this.analyzer,
      this.competitorService,
      this.generator,
      this.storage
    );
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

    if (!pathname.startsWith('/api/roadmap')) {
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

      // GET /api/roadmap
      if (pathname === '/api/roadmap' && method === 'GET') {
        const roadmap = await this.storage.getRoadmap(wsPath);
        const discovery = await this.storage.getDiscovery(wsPath);
        const competitors = await this.storage.getCompetitorAnalysis(wsPath);
        sendJson(200, { roadmap, discovery, competitors, workspace: wsPath });
        return true;
      }

      // POST /api/roadmap/discovery — scans code, extracts implemented functions/capabilities, and synthesizes new missing features
      if (pathname === '/api/roadmap/discovery' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const result = await runRoadmapPipeline(targetPath, {
          analyzer: this.analyzer,
          competitorService: this.competitorService,
          generator: this.generator,
          storage: this.storage
        });
        sendJson(200, {
          ...result.discovery,
          _competitors: result.competitors,
          _roadmap: result.roadmap,
          _mode: result.mode,
          _workspace: targetPath
        });
        return true;
      }

      // POST /api/roadmap/competitors
      if (pathname === '/api/roadmap/competitors' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        let discovery = await this.storage.getDiscovery(targetPath);
        if (!discovery) {
          discovery = await this.analyzer.analyzeWorkspace(targetPath);
          await this.storage.saveDiscovery(discovery, targetPath);
        }
        const competitors = await this.competitorService.analyzeCompetitors(discovery);
        await this.storage.saveCompetitorAnalysis(competitors, targetPath);
        sendJson(200, competitors);
        return true;
      }

      // POST /api/roadmap/generate — always re-reads the CURRENT workspace from scratch
      if (pathname === '/api/roadmap/generate' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const result = await runRoadmapPipeline(targetPath, {
          analyzer: this.analyzer,
          competitorService: this.competitorService,
          generator: this.generator,
          storage: this.storage
        });
        sendJson(200, { ...result.roadmap, _mode: result.mode, _workspace: targetPath });
        return true;
      }

      // POST /api/roadmap/feature/status
      if (pathname === '/api/roadmap/feature/status' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const updatedRoadmap = await this.storage.updateFeatureStatus(body.featureId, body.status, targetPath);
        sendJson(200, updatedRoadmap);
        return true;
      }

      // POST /api/roadmap/feature/delete
      if (pathname === '/api/roadmap/feature/delete' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const updatedRoadmap = await this.storage.deleteFeature(body.featureId, targetPath);
        sendJson(200, updatedRoadmap);
        return true;
      }

      // POST /api/roadmap/clear or DELETE /api/roadmap
      if ((pathname === '/api/roadmap/clear' && method === 'POST') || (pathname === '/api/roadmap' && method === 'DELETE')) {
        const body = method === 'POST' ? await parseBody() : {};
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        await this.storage.clearRoadmapData(targetPath);
        sendJson(200, { success: true, workspace: targetPath });
        return true;
      }

      // POST /api/roadmap/export
      if (pathname === '/api/roadmap/export' && method === 'POST') {
        const body = await parseBody();
        const targetPath = normalizeWorkspacePath(body.workspacePath || body.workspace || wsPath);
        const roadmap = await this.storage.getRoadmap(targetPath);
        if (!roadmap) {
          sendJson(404, { error: 'No roadmap exists to export' });
          return true;
        }
        const competitors = await this.storage.getCompetitorAnalysis(targetPath) || undefined;
        const md = this.generator.exportToMarkdown(roadmap, competitors);
        const filePath = await this.storage.exportMarkdownFile(md, targetPath);
        sendJson(200, { success: true, filePath, markdown: md });
        return true;
      }

      sendJson(404, { error: 'Roadmap API route not found' });
      return true;
    } catch (err: any) {
      sendJson(500, { error: err?.message || String(err) });
      return true;
    }
  }
}
