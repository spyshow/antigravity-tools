import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { ProjectAnalyzer } from '../modules/roadmap/project-analyzer.js';
import { CompetitorService } from '../modules/roadmap/competitor-service.js';
import { RoadmapGenerator } from '../modules/roadmap/generator.js';
import { RoadmapStorage } from '../modules/roadmap/storage.js';
import { RoadmapModule } from '../modules/roadmap/index.js';

test('ProjectAnalyzer extracts accurate tech stack and project characteristics', async () => {
  const analyzer = new ProjectAnalyzer();
  const discovery = await analyzer.analyzeWorkspace(process.cwd());

  assert.ok(discovery.projectName);
  assert.strictEqual(discovery.techStack.primaryLanguage, 'TypeScript');
  assert.ok(discovery.targetAudience.primaryPersona.length > 0);
  assert.ok(discovery.productVision.oneLiner.length > 0);
  assert.ok(discovery.currentState.existingFeatures.length > 0);
});

test('CompetitorService identifies relevant competitors and pain point opportunities', async () => {
  const analyzer = new ProjectAnalyzer();
  const discovery = await analyzer.analyzeWorkspace(process.cwd());

  const competitorService = new CompetitorService();
  const analysis = await competitorService.analyzeCompetitors(discovery);

  assert.ok(analysis.competitors.length >= 2);
  const aperant = analysis.competitors.find(c => c.name.toLowerCase().includes('aperant'));
  assert.ok(aperant, 'Should identify Aperant as a key competitor in this space');
  assert.ok(aperant!.painPoints.length > 0);
  assert.ok(aperant!.painPoints[0].opportunity.length > 0);
  assert.ok(analysis.marketGaps.length > 0);
  assert.ok(analysis.insightsSummary.topPainPoints.length > 0);
});

test('RoadmapGenerator produces 3 MoSCoW phases with acceptance criteria and competitor links', async () => {
  const analyzer = new ProjectAnalyzer();
  const discovery = await analyzer.analyzeWorkspace(process.cwd());
  const competitorService = new CompetitorService();
  const compAnalysis = await competitorService.analyzeCompetitors(discovery);

  const generator = new RoadmapGenerator();
  const roadmap = generator.generateRoadmap(discovery, compAnalysis);

  assert.strictEqual(roadmap.phases.length, 3);
  assert.ok(roadmap.features.length >= 6);

  // Check MoSCoW prioritization
  const priorities = new Set(roadmap.features.map(f => f.priority));
  assert.ok(priorities.has('must'));
  assert.ok(priorities.has('should'));

  // Verify feature acceptance criteria and user stories
  for (const feat of roadmap.features) {
    assert.ok(feat.acceptanceCriteria.length > 0, `Feature ${feat.id} must have acceptance criteria`);
    assert.ok(feat.userStories.length > 0, `Feature ${feat.id} must have user stories`);
  }

  // Verify competitor insight IDs linking
  const linkedFeats = roadmap.features.filter(f => f.competitorInsightIds && f.competitorInsightIds.length > 0);
  assert.ok(linkedFeats.length >= 3, 'At least 3 features should link directly to competitor pain points');

  // Test Markdown export
  const md = generator.exportToMarkdown(roadmap, compAnalysis);
  assert.ok(md.includes('# 🗺️ Strategic Product Roadmap:'));
  assert.ok(md.includes('## 🥊 Competitor Intelligence & Market Gaps'));
  assert.ok(md.includes('## 📊 MoSCoW Feature Distribution'));
  assert.ok(md.includes('### Phase 1:'));
});

test('RoadmapStorage persists, updates feature status, and exports ROADMAP.md', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-test-roadmap-'));
  const storage = new RoadmapStorage();

  const analyzer = new ProjectAnalyzer();
  const discovery = await analyzer.analyzeWorkspace(process.cwd());
  const competitorService = new CompetitorService();
  const compAnalysis = await competitorService.analyzeCompetitors(discovery);
  const generator = new RoadmapGenerator();
  const roadmap = generator.generateRoadmap(discovery, compAnalysis);

  // Save roadmap
  const savedPath = await storage.saveRoadmap(roadmap, tmpDir);
  assert.ok(fs.existsSync(savedPath));

  // Retrieve roadmap
  const loaded = await storage.getRoadmap(tmpDir);
  assert.ok(loaded);
  assert.strictEqual(loaded!.projectName, roadmap.projectName);

  // Update feature status
  const updated = await storage.updateFeatureStatus('FEAT-06', 'completed', tmpDir);
  const feat06 = updated.features.find(f => f.id === 'FEAT-06');
  assert.strictEqual(feat06!.status, 'completed');

  // Export ROADMAP.md
  const md = generator.exportToMarkdown(updated, compAnalysis);
  const mdPath = await storage.exportMarkdownFile(md, tmpDir);
  assert.ok(fs.existsSync(mdPath));
  const readMd = fs.readFileSync(mdPath, 'utf8');
  assert.ok(readMd.includes('[FEAT-06]'));

  // Delete a single feature
  const afterDelete = await storage.deleteFeature('FEAT-06', tmpDir);
  assert.ok(!afterDelete.features.some(f => f.id === 'FEAT-06'), 'Deleted feature should be removed from features');
  assert.ok(!afterDelete.phases.some(p => p.features.includes('FEAT-06')), 'Deleted feature should be removed from phase feature lists');

  // Clear entire roadmap data
  await storage.clearRoadmapData(tmpDir);
  const afterClear = await storage.getRoadmap(tmpDir);
  assert.strictEqual(afterClear, null);

  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('RoadmapModule exposes MCP tools and handles tool calls', async () => {
  const module = new RoadmapModule();
  const tools = module.getTools();

  const toolNames = tools.map(t => t.name);
  assert.ok(toolNames.includes('roadmap_analyze_project'));
  assert.ok(toolNames.includes('roadmap_analyze_competitors'));
  assert.ok(toolNames.includes('roadmap_generate'));
  assert.ok(toolNames.includes('roadmap_get'));
  assert.ok(toolNames.includes('roadmap_update_feature'));
  assert.ok(toolNames.includes('roadmap_export_markdown'));

  // Test roadmap_analyze_project tool call
  const result = await module.handleToolCall('roadmap_analyze_project', { workspacePath: process.cwd() });
  assert.strictEqual(result.isError, undefined);
  assert.ok(result.content[0].text.includes('primaryLanguage'));
});

test('RoadmapGenerator produces domain-specific features and competitors for electrical-cad projects', async () => {
  const procalPath = path.resolve('..', 'ProCal');
  if (!fs.existsSync(procalPath)) return;

  const analyzer = new ProjectAnalyzer();
  const discovery = await analyzer.analyzeWorkspace(procalPath);

  assert.strictEqual(discovery.domain, 'electrical-cad');
  assert.ok(discovery.targetAudience.primaryPersona.toLowerCase().includes('electrical'));

  const competitorService = new CompetitorService();
  const comp = await competitorService.analyzeCompetitors(discovery);
  assert.ok(comp.competitors.some(c => c.name.includes('ETAP') || c.name.includes('Caneco')));

  const generator = new RoadmapGenerator();
  const roadmap = generator.generateRoadmap(discovery, comp);
  assert.ok(roadmap.features.some(f => f.title.toLowerCase().includes('electrical') || f.title.toLowerCase().includes('iec 60364') || f.title.toLowerCase().includes('single-line')));
});
