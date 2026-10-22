import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IdeationReport } from './types.js';
import { RoadmapStorage } from '../roadmap/storage.js';
import { RoadmapFeature } from '../roadmap/types.js';

export class IdeationStorage {
  private globalStorageDir: string;
  private roadmapStorage: RoadmapStorage;

  constructor(roadmapStorage?: RoadmapStorage) {
    this.globalStorageDir = path.join(os.homedir(), '.gemini', 'antigravity-toolkit', 'ideation');
    this.roadmapStorage = roadmapStorage || new RoadmapStorage();
    this.ensureDir(this.globalStorageDir);
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private getWorkspaceConfigDir(workspaceDir: string = process.cwd()): string {
    const antigravityDir = path.join(workspaceDir, '.antigravity');
    this.ensureDir(antigravityDir);
    return antigravityDir;
  }

  public async saveReport(report: IdeationReport, workspaceDir: string = process.cwd()): Promise<string> {
    const wsDir = this.getWorkspaceConfigDir(workspaceDir);
    const filePath = path.join(wsDir, 'ideation.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf8');

    // Also persist in global cache
    const safeName = report.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const globalFilePath = path.join(this.globalStorageDir, `${safeName}.json`);
    fs.writeFileSync(globalFilePath, JSON.stringify(report, null, 2), 'utf8');

    return filePath;
  }

  public async getReport(workspaceDir: string = process.cwd()): Promise<IdeationReport | null> {
    const filePath = path.join(workspaceDir, '.antigravity', 'ideation.json');
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }

    const folderName = path.basename(path.resolve(workspaceDir)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const globalFilePath = path.join(this.globalStorageDir, `${folderName}.json`);
    if (fs.existsSync(globalFilePath)) {
      try {
        return JSON.parse(fs.readFileSync(globalFilePath, 'utf8'));
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
      throw new Error('No active ideation report found in workspace.');
    }

    // Find the item across all 4 categories
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

    // Map to RoadmapFeature
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

    // Update item status in ideation report
    item.status = 'promoted_to_roadmap';
    await this.saveReport(report, workspaceDir);

    return {
      success: true,
      featureId: newFeatureId,
      message: `Successfully promoted [${item.id}] to Roadmap as [${newFeatureId}] in ${phaseId}!`
    };
  }
}
