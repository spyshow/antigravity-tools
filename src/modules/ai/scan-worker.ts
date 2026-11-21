import { parentPort, workerData } from 'worker_threads';
import { ProjectAnalyzer } from '../roadmap/project-analyzer.js';
import { CompetitorService } from '../roadmap/competitor-service.js';
import { RoadmapGenerator } from '../roadmap/generator.js';
import { IdeationService } from '../ideation/service.js';
import { buildProjectContext } from './context-builder.js';
import { generateAIRoadmap } from './ai-roadmap.js';
import { isAIConfigured, loadAISettings } from './settings.js';

export interface ScanWorkerInput {
  workspacePath: string;
  taskType: 'roadmap' | 'ideation';
}

async function runWorkerTask() {
  if (!parentPort || !workerData) return;

  const { workspacePath, taskType } = workerData as ScanWorkerInput;

  try {
    if (taskType === 'roadmap') {
      if (isAIConfigured()) {
        try {
          const ctx = buildProjectContext(workspacePath);
          const ai = await generateAIRoadmap(ctx, loadAISettings().model);
          parentPort.postMessage({
            ok: true,
            result: { mode: 'ai', ...ai, agentTriggered: false }
          });
          return;
        } catch {
          // Fall back to deep-code-scan if AI call fails
        }
      }

      const analyzer = new ProjectAnalyzer();
      const competitorService = new CompetitorService();
      const generator = new RoadmapGenerator();
      const discovery = await analyzer.analyzeWorkspace(workspacePath);
      const competitors = await competitorService.analyzeCompetitors(discovery);
      const roadmap = generator.generateRoadmap(discovery, competitors);
      parentPort.postMessage({
        ok: true,
        result: {
          mode: 'deep-code-scan',
          discovery,
          competitors,
          roadmap,
          agentTriggered: false
        }
      });
    } else if (taskType === 'ideation') {
      const service = new IdeationService();
      if (isAIConfigured()) {
        try {
          const aiReport = await service.generateReportAI(workspacePath);
          parentPort.postMessage({
            ok: true,
            result: aiReport
          });
          return;
        } catch {
          // Fall back to static/deep-code comprehension report
        }
      }
      const report = await service.generateReport(workspacePath);
      parentPort.postMessage({
        ok: true,
        result: report
      });
    } else {
      throw new Error(`Unknown worker taskType: ${String(taskType)}`);
    }
  } catch (err: any) {
    parentPort.postMessage({
      ok: false,
      error: err?.message || String(err)
    });
  }
}

runWorkerTask();
