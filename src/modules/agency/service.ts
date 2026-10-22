import * as fs from 'fs';
import * as path from 'path';
import { AgencyDetector } from './detector.js';
import { AgencyGenerator } from './generator.js';
import { AgencyIntegrationResult, AgencyStatus, AgencySkillItem } from './types.js';
import { getAgencyDefaultPrompts } from './prompts.js';
import { PromptService } from '../prompts/service.js';

export class AgencyService {
  private detector: AgencyDetector;
  private generator: AgencyGenerator;
  private promptService: PromptService;

  constructor(detector?: AgencyDetector, generator?: AgencyGenerator, promptService?: PromptService) {
    this.detector = detector || new AgencyDetector();
    this.generator = generator || new AgencyGenerator();
    this.promptService = promptService || new PromptService();
  }

  public getStatus(workspaceDir: string = process.cwd()): AgencyStatus {
    const registryPath = path.join(workspaceDir, 'docs', 'agency-registry.md');
    const pipelinePath = path.join(workspaceDir, '.agents', 'workflows', 'agency-pipeline.md');
    const rulePath = path.join(workspaceDir, '.agents', 'rules', 'inter-agent-calling.md');
    const readmePath = path.join(workspaceDir, 'agency-readme.md');

    const filesPresent = {
      registry: fs.existsSync(registryPath),
      pipeline: fs.existsSync(pipelinePath),
      rule: fs.existsSync(rulePath),
      readme: fs.existsSync(readmePath)
    };

    const isIntegrated = filesPresent.registry && filesPresent.pipeline && filesPresent.rule;

    // Detect installed skills
    const agents = this.detector.discoverAgencySkills(workspaceDir);

    const sampleAgents = agents.slice(0, 10).map(a => ({
      slug: a.slug,
      description: a.description
    }));

    return {
      isIntegrated,
      agentCount: agents.length,
      filesPresent,
      sampleAgents
    };
  }

  public async integrate(workspaceDir: string = process.cwd()): Promise<AgencyIntegrationResult> {
    const agents = this.detector.discoverAgencySkills(workspaceDir);

    // 1. Ensure required target directories exist
    const docsDir = path.join(workspaceDir, 'docs');
    const workflowsDir = path.join(workspaceDir, '.agents', 'workflows');
    const rulesDir = path.join(workspaceDir, '.agents', 'rules');

    [docsDir, workflowsDir, rulesDir].forEach(d => {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    });

    // 2. Write docs/agency-registry.md
    const registryPath = path.join(docsDir, 'agency-registry.md');
    const registryContent = this.generator.generateRegistryMarkdown(agents);
    fs.writeFileSync(registryPath, registryContent, 'utf8');

    // 3. Write .agents/workflows/agency-pipeline.md
    const pipelinePath = path.join(workflowsDir, 'agency-pipeline.md');
    const pipelineContent = this.generator.generatePipelineWorkflow();
    fs.writeFileSync(pipelinePath, pipelineContent, 'utf8');

    // 4. Write .agents/rules/inter-agent-calling.md
    const rulePath = path.join(rulesDir, 'inter-agent-calling.md');
    const ruleContent = this.generator.generateInterAgentCallingRule();
    fs.writeFileSync(rulePath, ruleContent, 'utf8');

    // 5. Write agency-readme.md
    const readmePath = path.join(workspaceDir, 'agency-readme.md');
    const readmeContent = this.generator.generateAgencyReadme(agents.length);
    fs.writeFileSync(readmePath, readmeContent, 'utf8');

    // 6. Inject default Agency Prompts into Prompt Library
    let injectedPromptsCount = 0;
    try {
      const defaultPrompts = getAgencyDefaultPrompts();
      for (const p of defaultPrompts) {
        await this.promptService.savePrompt(p);
        injectedPromptsCount++;
      }
    } catch (e) {
      console.warn('Could not inject agency prompts into prompt library:', e);
    }

    return {
      success: true,
      agentsDetected: agents.length,
      agents,
      generatedFiles: {
        registryPath,
        pipelinePath,
        rulePath,
        readmePath
      },
      injectedPromptsCount,
      timestamp: new Date().toISOString()
    };
  }

  public listAgents(workspaceDir: string = process.cwd()): AgencySkillItem[] {
    return this.detector.discoverAgencySkills(workspaceDir);
  }
}
