import * as fs from 'fs';
import * as path from 'path';
import { IdeationReport } from './types.js';
import { RoadmapStorage } from '../roadmap/storage.js';
import { RoadmapFeature } from '../roadmap/types.js';
import { getPluginWorkspaceStorageDir, normalizeWorkspacePath } from '../workspace.js';

export class IdeationStorage {
  private roadmapStorage: RoadmapStorage;

  constructor(roadmapStorage?: RoadmapStorage) {
    this.roadmapStorage = roadmapStorage || new RoadmapStorage();
  }

  private getStorageDir(workspaceDir: string = process.cwd()): string {
    return getPluginWorkspaceStorageDir(workspaceDir);
  }

  private isLegacyProCalTainted(report: IdeationReport, workspaceDir: string): boolean {
    const folder = path.basename(normalizeWorkspacePath(workspaceDir)).toLowerCase();
    if (folder === 'procal') return false;
    return report.codeImprovements?.some(i =>
      i.title.includes('Per-Phase Balancing Optimizer') ||
      i.affected_files?.some(f => f.includes('phaseBalance.ts'))
    ) ?? false;
  }

  public async saveReport(report: IdeationReport, workspaceDir: string = process.cwd()): Promise<string> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'ideation.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');
    return filePath;
  }

  public async getReport(workspaceDir: string = process.cwd()): Promise<IdeationReport | null> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'ideation.json');
    if (fs.existsSync(filePath)) {
      try {
        const parsed: IdeationReport = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (this.isLegacyProCalTainted(parsed, workspaceDir)) {
          return null;
        }
        return parsed;
      } catch {}
    }
    return null;
  }

  public async exportMarkdownFile(content: string, workspaceDir: string = process.cwd()): Promise<string> {
    const targetPath = path.join(workspaceDir, 'IDEATION.md');
    fs.writeFileSync(targetPath, content, 'utf8');
    return targetPath;
  }

  /**
   * Promotes an ideation item into an active feature on the MoSCoW Roadmap!
   */
  public async promoteIdeaToRoadmap(ideaId: string, workspaceDir: string = process.cwd()): Promise<{
    success: boolean;
    featureId: string;
    message: string;
  }> {
    const report = await this.getReport(workspaceDir);
    if (!report) {
      throw new Error('No active ideation report found for this workspace.');
    }

    const ci = report.codeImprovements.find(i => i.id === ideaId);
    const perf = report.performanceOptimizations.find(i => i.id === ideaId);
    const sec = report.securityVulnerabilities.find(i => i.id === ideaId);
    const cq = report.codeQualityIssues.find(i => i.id === ideaId);

    const item = ci || perf || sec || cq;
    if (!item) {
      throw new Error(`Ideation item with ID "${ideaId}" not found in report.`);
    }

    const roadmap = await this.roadmapStorage.getRoadmap(workspaceDir);
    if (!roadmap) {
      throw new Error('No active roadmap found to promote into. Please generate a roadmap first.');
    }

    const newFeatureId = `FEAT-IDEATION-${item.id.toUpperCase()}`;
    if (roadmap.features.some(f => f.id === newFeatureId)) {
      return {
        success: true,
        featureId: newFeatureId,
        message: `Feature ${newFeatureId} is already on the roadmap!`
      };
    }

    let priority: RoadmapFeature['priority'] = 'should';
    let phaseId = 'phase-2';

    if (sec && (sec.severity === 'critical' || sec.severity === 'high')) {
      priority = 'must';
      phaseId = 'phase-1';
    } else if (perf && perf.impact === 'high') {
      priority = 'must';
      phaseId = 'phase-2';
    }

    const newFeature: RoadmapFeature = {
      id: newFeatureId,
      title: item.title,
      description: item.description,
      rationale: item.rationale,
      priority,
      complexity: 'medium',
      impact: 'high',
      phaseId,
      dependencies: [],
      status: 'planned',
      acceptanceCriteria: [
        `Resolves ideation item ${item.id}`,
        `Verify zero regressions in affected files`
      ],
      userStories: [
        `As a developer, I want to implement "${item.title}" to improve project quality and robustness.`
      ],
      competitorInsightIds: []
    };

    roadmap.features.push(newFeature);
    const targetPhase = roadmap.phases.find(p => p.id === phaseId);
    if (targetPhase && !targetPhase.features.includes(newFeatureId)) {
      targetPhase.features.push(newFeatureId);
    }

    await this.roadmapStorage.saveRoadmap(roadmap, workspaceDir);

    item.status = 'promoted_to_roadmap';
    await this.saveReport(report, workspaceDir);

    return {
      success: true,
      featureId: newFeatureId,
      message: `Successfully promoted [${item.id}] to Roadmap as [${newFeatureId}] in ${phaseId}!`
    };
  }

  public async deleteIdea(ideaId: string, workspaceDir: string = process.cwd()): Promise<IdeationReport> {
    const report = await this.getReport(workspaceDir);
    if (!report) {
      throw new Error('No active ideation report found for this workspace.');
    }

    const totalBefore =
      report.codeImprovements.length +
      report.performanceOptimizations.length +
      report.securityVulnerabilities.length +
      report.codeQualityIssues.length;

    report.codeImprovements = report.codeImprovements.filter(i => i.id !== ideaId);
    report.performanceOptimizations = report.performanceOptimizations.filter(i => i.id !== ideaId);
    report.securityVulnerabilities = report.securityVulnerabilities.filter(i => i.id !== ideaId);
    report.codeQualityIssues = report.codeQualityIssues.filter(i => i.id !== ideaId);

    const totalAfter =
      report.codeImprovements.length +
      report.performanceOptimizations.length +
      report.securityVulnerabilities.length +
      report.codeQualityIssues.length;

    if (totalAfter === totalBefore) {
      throw new Error(`Ideation item with ID "${ideaId}" not found in report.`);
    }

    report.metadata.generatedAt = new Date().toISOString();
    await this.saveReport(report, workspaceDir);
    return report;
  }

  public async clearReport(workspaceDir: string = process.cwd()): Promise<void> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'ideation.json');
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {}
    }
  }
}
