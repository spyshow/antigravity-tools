import { ProjectAnalyzer } from './project-analyzer.js';
import { CompetitorService } from './competitor-service.js';
import { RoadmapGenerator } from './generator.js';
import { RoadmapStorage } from './storage.js';
import { ProjectDiscovery, CompetitorAnalysis, RoadmapDocument } from './types.js';
import { buildProjectContext } from '../ai/context-builder.js';
import { generateAIRoadmap } from '../ai/ai-roadmap.js';
import { isAIConfigured, loadAISettings } from '../ai/settings.js';
import { runScanInWorker } from '../ai/antigravity-agent.js';

export interface RoadmapPipelineResult {
  mode: 'ai' | 'deep-code-scan';
  discovery: ProjectDiscovery;
  competitors: CompetitorAnalysis;
  roadmap: RoadmapDocument;
  agentTriggered?: boolean;
}

/**
 * Analyzes the given workspace inside a non-blocking Node.js worker_threads background worker
 * (falling back to in-process execution if custom dependencies are injected), using Gemini when
 * configured or the Deep Code Comprehension engine otherwise. Never spawns sidebar conversations.
 */
export async function runRoadmapPipeline(
  workspacePath: string,
  deps?: { analyzer?: ProjectAnalyzer; competitorService?: CompetitorService; generator?: RoadmapGenerator; storage?: RoadmapStorage },
  options: { save?: boolean } = {}
): Promise<RoadmapPipelineResult> {
  const storage = deps?.storage || new RoadmapStorage();
  const save = options.save !== false;

  let result: RoadmapPipelineResult | null = null;

  try {
    result = await runScanInWorker<RoadmapPipelineResult>({
      workspacePath,
      taskType: 'roadmap'
    });
  } catch {
    result = null;
  }

  if (!result) {
    if (isAIConfigured()) {
      const ctx = buildProjectContext(workspacePath);
      const ai = await generateAIRoadmap(ctx, loadAISettings().model);
      result = { mode: 'ai', ...ai, agentTriggered: false };
    } else {
      const analyzer = deps?.analyzer || new ProjectAnalyzer();
      const competitorService = deps?.competitorService || new CompetitorService();
      const generator = deps?.generator || new RoadmapGenerator();
      const discovery = await analyzer.analyzeWorkspace(workspacePath);
      const competitors = await competitorService.analyzeCompetitors(discovery);
      const roadmap = generator.generateRoadmap(discovery, competitors);
      result = { mode: 'deep-code-scan', discovery, competitors, roadmap, agentTriggered: false };
    }
  }

  if (save) {
    await storage.saveDiscovery(result.discovery, workspacePath);
    await storage.saveCompetitorAnalysis(result.competitors, workspacePath);
    await storage.saveRoadmap(result.roadmap, workspacePath);
  }
  return result;
}
