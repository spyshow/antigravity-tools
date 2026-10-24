import * as fs from 'fs';
import * as path from 'path';
import { ProjectDiscovery, CompetitorAnalysis, RoadmapDocument, RoadmapFeature } from './types.js';
import { getPluginWorkspaceStorageDir, normalizeWorkspacePath } from '../workspace.js';

export class RoadmapStorage {
  private getStorageDir(workspaceDir: string = process.cwd()): string {
    return getPluginWorkspaceStorageDir(workspaceDir);
  }

  private isLegacyProCalTainted(roadmap: RoadmapDocument, workspaceDir: string): boolean {
    const folder = path.basename(normalizeWorkspacePath(workspaceDir)).toLowerCase();
    if (folder === 'procal') return false;
    return roadmap.features?.some(f =>
      f.title.includes('IEC 60364 & NEC / NEMA') ||
      f.title.includes('Apartment Room Templates') ||
      f.title.includes('Single-Line Diagram (SLD)')
    ) ?? false;
  }

  public async saveRoadmap(roadmap: RoadmapDocument, workspaceDir: string = process.cwd()): Promise<string> {
    roadmap.metadata.updatedAt = new Date().toISOString();
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'roadmap.json');
    fs.writeFileSync(filePath, JSON.stringify(roadmap, null, 2), 'utf8');
    return filePath;
  }

  public async getRoadmap(workspaceDir: string = process.cwd()): Promise<RoadmapDocument | null> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'roadmap.json');
    if (fs.existsSync(filePath)) {
      try {
        const parsed: RoadmapDocument = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (this.isLegacyProCalTainted(parsed, workspaceDir)) {
          return null;
        }
        return parsed;
      } catch {}
    }
    return null;
  }

  public async saveDiscovery(discovery: ProjectDiscovery, workspaceDir: string = process.cwd()): Promise<string> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'discovery.json');
    fs.writeFileSync(filePath, JSON.stringify(discovery, null, 2), 'utf8');
    return filePath;
  }

  public async getDiscovery(workspaceDir: string = process.cwd()): Promise<ProjectDiscovery | null> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'discovery.json');
    if (fs.existsSync(filePath)) {
      try {
        const parsed: ProjectDiscovery = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const folder = path.basename(normalizeWorkspacePath(workspaceDir)).toLowerCase();
        if (folder !== 'procal' && parsed.productVision?.valueProposition?.includes('single-line diagram generation')) {
          return null;
        }
        return parsed;
      } catch {}
    }
    return null;
  }

  public async saveCompetitorAnalysis(analysis: CompetitorAnalysis, workspaceDir: string = process.cwd()): Promise<string> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'competitors.json');
    fs.writeFileSync(filePath, JSON.stringify(analysis, null, 2), 'utf8');
    return filePath;
  }

  public async getCompetitorAnalysis(workspaceDir: string = process.cwd()): Promise<CompetitorAnalysis | null> {
    const dir = this.getStorageDir(workspaceDir);
    const filePath = path.join(dir, 'competitors.json');
    if (fs.existsSync(filePath)) {
      try {
        const parsed: CompetitorAnalysis = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const folder = path.basename(normalizeWorkspacePath(workspaceDir)).toLowerCase();
        if (folder !== 'procal' && parsed.competitors?.some(c => c.id === 'COMP-CANECO')) {
          return null;
        }
        return parsed;
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
