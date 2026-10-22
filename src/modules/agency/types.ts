export interface AgencySkillItem {
  slug: string; // e.g. "agency-agents-orchestrator"
  displayName: string;
  description: string;
  skillPath: string; // Absolute or normalized path to SKILL.md
  directoryName: string;
  sourceDir: string;
}

export interface AgencyIntegrationResult {
  success: boolean;
  agentsDetected: number;
  agents: AgencySkillItem[];
  generatedFiles: {
    registryPath: string;
    pipelinePath: string;
    rulePath: string;
    readmePath: string;
    ps1Path?: string;
    shPath?: string;
  };
  injectedPromptsCount: number;
  timestamp: string;
}

export interface AgencyStatus {
  isIntegrated: boolean;
  agentCount: number;
  filesPresent: {
    registry: boolean;
    pipeline: boolean;
    rule: boolean;
    readme: boolean;
  };
  sampleAgents: Array<{ slug: string; description: string }>;
  lastIntegrated?: string;
}
