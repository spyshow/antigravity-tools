import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ProjectDiscovery, CompetitorAnalysis, RoadmapDocument, RoadmapFeature } from './types.js';

export class RoadmapStorage {
  private globalStorageDir: string;

  constructor() {
    this.globalStorageDir = path.join(os.homedir(), '.gemini', 'antigravity-toolkit', 'roadmaps');
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

  public async saveRoadmap(roadmap: RoadmapDocument, workspaceDir: string = process.cwd()): Promise<string> {
    roadmap.metadata.updatedAt = new Date().toISOString();

    // 1. Save to workspace .antigravity/roadmap.json
    const wsDir = this.getWorkspaceConfigDir(workspaceDir);
    const wsFilePath = path.join(wsDir, 'roadmap.json');
    fs.writeFileSync(wsFilePath, JSON.stringify(roadmap, null, 2), 'utf8');

    // 2. Also save to global cache for easy multi-project retrieval
    const safeName = roadmap.projectName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const globalFilePath = path.join(this.globalStorageDir, `${safeName}.json`);
    fs.writeFileSync(globalFilePath, JSON.stringify(roadmap, null, 2), 'utf8');

    return wsFilePath;
  }

  public async getRoadmap(workspaceDir: string = process.cwd()): Promise<RoadmapDocument | null> {
    // 1. Try workspace .antigravity/roadmap.json
    const wsFilePath = path.join(workspaceDir, '.antigravity', 'roadmap.json');
    if (fs.existsSync(wsFilePath)) {
      try {
        const raw = fs.readFileSync(wsFilePath, 'utf8');
        return JSON.parse(raw);
      } catch {}
    }

    // 2. Try global cache matching directory name
    const folderName = path.basename(path.resolve(workspaceDir)).replace(/[^a-zA-Z0-9_-]/g, '_');
    const globalFilePath = path.join(this.globalStorageDir, `${folderName}.json`);
    if (fs.existsSync(globalFilePath)) {
      try {
        const raw = fs.readFileSync(globalFilePath, 'utf8');
        return JSON.parse(raw);
      } catch {}
    }

    return null;
  }

  public async saveDiscovery(discovery: ProjectDiscovery, workspaceDir: string = process.cwd()): Promise<string> {
    const wsDir = this.getWorkspaceConfigDir(workspaceDir);
    const filePath = path.join(wsDir, 'discovery.json');
    fs.writeFileSync(filePath, JSON.stringify(discovery, null, 2), 'utf8');
    return filePath;
  }

  public async getDiscovery(workspaceDir: string = process.cwd()): Promise<ProjectDiscovery | null> {
    const filePath = path.join(workspaceDir, '.antigravity', 'discovery.json');
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    return null;
  }

  public async saveCompetitorAnalysis(analysis: CompetitorAnalysis, workspaceDir: string = process.cwd()): Promise<string> {
    const wsDir = this.getWorkspaceConfigDir(workspaceDir);
    const filePath = path.join(wsDir, 'competitors.json');
    fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2), 'utf8');
    return filePath;
  }

  public async getCompetitorAnalysis(workspaceDir: string = process.cwd()): Promise<CompetitorAnalysis | null> {
    const filePath = path.join(workspaceDir, '.antigravity', 'competitors.json');
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {}
    }
    return null;
  }

  public async updateFeatureStatus(
    featureId: string,
    status: RoadmapFeature['status'],
    workspaceDir: string = process.cwd()
  ): Promise<RoadmapDocument> {
    const roadmap = await this.getRoadmap(workspaceDir);
    if (!roadmap) {
      throw new Error('No active roadmap found to update.');
    }

    const feature = roadmap.features.find(f => f.id === featureId);
    if (!feature) {
      throw new Error(`Feature with id "${featureId}" not found in roadmap.`);
    }

    feature.status = status;

    // Recalculate phase statuses
    for (const phase of roadmap.phases) {
      const phaseFeats = roadmap.features.filter(f => f.phaseId === phase.id);
      const allDone = phaseFeats.length > 0 && phaseFeats.every(f => f.status === 'completed');
      const anyProgress = phaseFeats.some(f => f.status === 'in_progress' || f.status === 'completed');
      if (allDone) {
        phase.status = 'completed';
      } else if (anyProgress) {
        phase.status = 'in_progress';
      } else {
        phase.status = 'planned';
      }
    }

    await this.saveRoadmap(roadmap, workspaceDir);
    return roadmap;
  }

  public async exportMarkdownFile(content: string, workspaceDir: string = process.cwd()): Promise<string> {
    const targetPath = path.join(workspaceDir, 'ROADMAP.md');
    fs.writeFileSync(targetPath, content, 'utf8');
    return targetPath;
  }
}
