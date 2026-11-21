import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { CodeScanner } from '../modules/ideation/code-scanner.js';
import { IdeationService } from '../modules/ideation/service.js';
import { IdeationStorage } from '../modules/ideation/storage.js';
import { IdeationModule } from '../modules/ideation/index.js';
import { RoadmapStorage } from '../modules/roadmap/storage.js';
import { RoadmapGenerator } from '../modules/roadmap/generator.js';
import { ProjectAnalyzer } from '../modules/roadmap/project-analyzer.js';
import { CompetitorService } from '../modules/roadmap/competitor-service.js';

test('CodeScanner scans workspace and discovers architecture patterns and security rules', async () => {
  const scanner = new CodeScanner();
  const result = await scanner.scanCodebase(process.cwd());

  assert.ok(result.totalFiles > 5);
  assert.ok(result.totalLines > 200);
  assert.ok(result.discoveredPatterns.length > 0);
  assert.ok(result.discoveredPatterns.some(p => p.includes('PluginModule')));
});

test('IdeationService produces 4-pillar report with health scores and markdown export', async () => {
  const service = new IdeationService();
  const report = await service.generateReport(process.cwd());

  assert.strictEqual(report.projectName, 'antigravity-tools');
  assert.ok(report.codeImprovements.length >= 3);
  assert.ok(report.performanceOptimizations.length >= 2);
  assert.ok(report.securityVulnerabilities.length >= 2);
  assert.ok(report.codeQualityIssues.length >= 2);

  // Health scores
  assert.ok(report.healthScores.securityScore >= 0 && report.healthScores.securityScore <= 100);
  assert.ok(report.healthScores.performanceScore >= 0 && report.healthScores.performanceScore <= 100);
  assert.ok(report.healthScores.qualityScore >= 0 && report.healthScores.qualityScore <= 100);
  assert.ok(report.healthScores.innovationIndex >= 0 && report.healthScores.innovationIndex <= 100);

  // Verify code improvement properties
  const firstCi = report.codeImprovements[0];
  assert.ok(firstCi.id.startsWith('ci-'));
  assert.ok(firstCi.builds_upon.length > 0);
  assert.ok(firstCi.affected_files.length > 0);
  assert.ok(firstCi.existing_patterns.length > 0);

  // Verify markdown export
  const md = service.exportToMarkdown(report);
  assert.ok(md.includes('# 💡 Codebase Ideation & Audit Report:'));
  assert.ok(md.includes('## 🩺 Project Health Dashboard'));
  assert.ok(md.includes('## 🚀 Code-Revealed Feature Discoveries'));
  assert.ok(md.includes('## 🛡️ Security Vulnerabilities & Hardening'));
});

test('IdeationStorage persists report and promotes ideation finding into active Roadmap', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-test-ideation-'));

  // 1. Setup a baseline roadmap in tmpDir
  const roadmapStorage = new RoadmapStorage();
  const analyzer = new ProjectAnalyzer();
  const compService = new CompetitorService();
  const generator = new RoadmapGenerator();

  const discovery = await analyzer.analyzeWorkspace(process.cwd());
  const comp = await compService.analyzeCompetitors(discovery);
  const roadmap = generator.generateRoadmap(discovery, comp);
  await roadmapStorage.saveRoadmap(roadmap, tmpDir);

  // 2. Setup Ideation
  const ideationStorage = new IdeationStorage(roadmapStorage);
  const service = new IdeationService();
  const report = await service.generateReport(process.cwd());
  await ideationStorage.saveReport(report, tmpDir);

  // 3. Promote ci-001 to Roadmap
  const promotion = await ideationStorage.promoteIdeaToRoadmap('ci-001', tmpDir);
  assert.ok(promotion.success);
  assert.ok(promotion.featureId.includes('CI-001'));

  // 4. Verify feature is now in Roadmap
  const updatedRoadmap = await roadmapStorage.getRoadmap(tmpDir);
  assert.ok(updatedRoadmap);
  const promotedFeat = updatedRoadmap!.features.find(f => f.id === promotion.featureId);
  assert.ok(promotedFeat, 'Promoted feature must exist in roadmap');
  assert.strictEqual(promotedFeat!.title, report.codeImprovements.find(i => i.id === 'ci-001')!.title);

  // 5. Delete a single ideation item
  const afterDelete = await ideationStorage.deleteIdea('ci-001', tmpDir);
  assert.ok(!afterDelete.codeImprovements.some(i => i.id === 'ci-001'), 'Deleted idea should be removed');

  // 6. Clear entire ideation report
  await ideationStorage.clearReport(tmpDir);
  const afterClear = await ideationStorage.getReport(tmpDir);
  assert.strictEqual(afterClear, null);

  // 7. Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('IdeationModule exposes MCP tools and dispatches execution', async () => {
  const module = new IdeationModule();
  const tools = module.getTools();
  const toolNames = tools.map(t => t.name);

  assert.ok(toolNames.includes('ideation_analyze'));
  assert.ok(toolNames.includes('ideation_get'));
  assert.ok(toolNames.includes('ideation_promote_to_roadmap'));
  assert.ok(toolNames.includes('ideation_export_markdown'));

  const result = await module.handleToolCall('ideation_analyze', { workspacePath: process.cwd() });
  assert.strictEqual(result.isError, undefined);
  assert.ok(result.content[0].text.includes('healthScores'));
});

test('IdeationService produces electrical-cad specific improvements and security checks for ProCal', async () => {
  const procalPath = path.resolve('..', 'ProCal');
  if (!fs.existsSync(procalPath)) return;

  const service = new IdeationService();
  const report = await service.generateReport(procalPath);

  assert.strictEqual(report.projectName.toLowerCase(), 'procal');
  assert.ok(report.codeImprovements.some(i => i.title.toLowerCase().includes('balancing') || i.title.toLowerCase().includes('phase')));
  assert.ok(report.securityVulnerabilities.some(s => s.title.toLowerCase().includes('math') || s.title.toLowerCase().includes('evaluator') || s.title.toLowerCase().includes('project authorization')));
});
