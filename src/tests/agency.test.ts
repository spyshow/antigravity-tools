import { test } from 'node:test';
import * as assert from 'node:assert';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { AgencyDetector } from '../modules/agency/detector.js';
import { AgencyGenerator } from '../modules/agency/generator.js';
import { AgencyService } from '../modules/agency/service.js';
import { AgencyModule } from '../modules/agency/index.js';
import { PromptStorage } from '../modules/prompts/storage.js';
import { PromptService } from '../modules/prompts/service.js';

test('AgencyDetector discovers installed agency skills across system directories', () => {
  const detector = new AgencyDetector();
  const agents = detector.discoverAgencySkills(process.cwd());

  assert.ok(Array.isArray(agents));
  // In the user's environment, 282 skills are installed
  if (agents.length > 0) {
    const first = agents[0];
    assert.ok(first.slug.startsWith('agency-'));
    assert.ok(first.description.length > 0);
    assert.ok(fs.existsSync(first.skillPath));
  }
});

test('AgencyGenerator generates registry table, pipeline workflow, rules, and readme', () => {
  const generator = new AgencyGenerator();
  const mockAgents = [
    {
      slug: 'agency-backend-architect',
      displayName: 'Backend Architect',
      description: 'Senior backend and database engineer',
      skillPath: '/path/to/SKILL.md',
      directoryName: 'agency-backend-architect',
      sourceDir: '/path/to'
    },
    {
      slug: 'agency-agents-orchestrator',
      displayName: 'Agents Orchestrator',
      description: 'Autonomous pipeline manager',
      skillPath: '/path/to/orchestrator/SKILL.md',
      directoryName: 'agents-orchestrator',
      sourceDir: '/path/to'
    }
  ];

  const registryMd = generator.generateRegistryMarkdown(mockAgents);
  assert.ok(registryMd.includes('# Agency Agents Master Registry'));
  assert.ok(registryMd.includes('`agency-backend-architect`'));
  assert.ok(registryMd.includes('`agency-agents-orchestrator`'));

  const pipelineMd = generator.generatePipelineWorkflow();
  assert.ok(pipelineMd.includes('/agency-pipeline'));
  assert.ok(pipelineMd.includes('Phase 1: Triage & Squad Assembly'));
  assert.ok(pipelineMd.includes('[CALL_AGENT: agency-<target-slug>'));

  const ruleMd = generator.generateInterAgentCallingRule();
  assert.ok(ruleMd.includes('trigger: always_on'));
  assert.ok(ruleMd.includes('[CALL_AGENT: agency-<target-slug>]'));

  const readmeMd = generator.generateAgencyReadme(mockAgents.length);
  assert.ok(readmeMd.includes("# Complete Beginner's Guide to Agency Agents"));
  assert.ok(readmeMd.includes('Scenario A: Build a Whole New Project from Scratch'));
});

test('AgencyService integrates files and injects prompts into prompt library', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-test-agency-'));
  const promptStorage = new PromptStorage(path.join(tmpDir, 'prompts.json'));
  const promptService = new PromptService(promptStorage);

  const service = new AgencyService(undefined, undefined, promptService);

  const result = await service.integrate(tmpDir);
  assert.ok(result.success);
  assert.ok(fs.existsSync(result.generatedFiles.registryPath));
  assert.ok(fs.existsSync(result.generatedFiles.pipelinePath));
  assert.ok(fs.existsSync(result.generatedFiles.rulePath));
  assert.ok(fs.existsSync(result.generatedFiles.readmePath));
  assert.ok(result.injectedPromptsCount >= 4);

  // Verify status reports integrated
  const status = service.getStatus(tmpDir);
  assert.strictEqual(status.isIntegrated, true);
  assert.strictEqual(status.filesPresent.registry, true);
  assert.strictEqual(status.filesPresent.pipeline, true);

  // Verify prompts in library
  const agencyPrompts = await promptService.listPrompts({ category: 'Agency Agents' });
  assert.ok(agencyPrompts.length >= 4);
  const orchestratorPrompt = agencyPrompts.find(p => p.title.includes('Orchestrator'));
  assert.ok(orchestratorPrompt);

  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test('AgencyModule exposes MCP tools and handles requests', async () => {
  const module = new AgencyModule();
  const tools = module.getTools();
  const toolNames = tools.map(t => t.name);

  assert.ok(toolNames.includes('agency_integrate'));
  assert.ok(toolNames.includes('agency_list_agents'));
  assert.ok(toolNames.includes('agency_status'));

  const result = await module.handleToolCall('agency_status', { workspacePath: process.cwd() });
  assert.strictEqual(result.isError, undefined);
  assert.ok(result.content[0].text.includes('isIntegrated'));
});
