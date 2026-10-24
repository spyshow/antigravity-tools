import { ProjectAnalyzer } from './project-analyzer.js';
import { CompetitorService } from './competitor-service.js';
import { RoadmapGenerator } from './generator.js';
import { RoadmapStorage } from './storage.js';
import { ProjectDiscovery, CompetitorAnalysis, RoadmapDocument } from './types.js';
import { buildProjectContext } from '../ai/context-builder.js';
import { generateAIRoadmap } from '../ai/ai-roadmap.js';
import { isAIConfigured, loadAISettings } from '../ai/settings.js';
import { triggerBackgroundAntigravityAnalysis } from '../ai/antigravity-agent.js';

export interface RoadmapPipelineResult {
  mode: 'ai' | 'deep-code-scan';
  discovery: ProjectDiscovery;
  competitors: CompetitorAnalysis;
  roadmap: RoadmapDocument;
  agentTriggered?: boolean;
}

/**
 * Always analyzes the given workspace from scratch by reading its actual source code,
 * then generates the roadmap with Gemini when configured or the Deep Code Analyzer + Antigravity Agent otherwise.
 */
export async function runRoadmapPipeline(
  workspacePath: string,
  deps?: { analyzer?: ProjectAnalyzer; competitorService?: CompetitorService; generator?: RoadmapGenerator; storage?: RoadmapStorage },
  options: { save?: boolean } = {}
): Promise<RoadmapPipelineResult> {
  const analyzer = deps?.analyzer || new ProjectAnalyzer();
  const competitorService = deps?.competitorService || new CompetitorService();
  const generator = deps?.generator || new RoadmapGenerator();
  const storage = deps?.storage || new RoadmapStorage();
  const save = options.save !== false;
  let result: RoadmapPipelineResult;

  if (isAIConfigured()) {
    const ctx = buildProjectContext(workspacePath);
    const ai = await generateAIRoadmap(ctx, loadAISettings().model);
    result = { mode: 'ai', ...ai };
  } else {
    const discovery = await analyzer.analyzeWorkspace(workspacePath);
    const competitors = await competitorService.analyzeCompetitors(discovery);
    const roadmap = generator.generateRoadmap(discovery, competitors);
    const bg = await triggerBackgroundAntigravityAnalysis({ workspacePath, taskType: 'roadmap' }).catch(() => ({ triggered: false }));
    result = { mode: 'deep-code-scan', discovery, competitors, roadmap, agentTriggered: bg.triggered };
  }

  if (save) {
    await storage.saveDiscovery(result.discovery, workspacePath);
    await storage.saveCompetitorAnalysis(result.competitors, workspacePath);
    await storage.saveRoadmap(result.roadmap, workspacePath);
  }
  return result;
}
