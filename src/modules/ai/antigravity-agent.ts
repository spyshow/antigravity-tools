import { execFile } from 'child_process';

export interface AgentTaskOptions {
  workspacePath: string;
  taskType: 'roadmap' | 'ideation';
  port?: number;
}

/**
 * Checks if Antigravity's native agentapi executable is available in the environment.
 */
export function isAntigravityAgentAvailable(): boolean {
  return Boolean(
    process.env.ANTIGRAVITY_AGENTAPI_EXE ||
    (process.env.ANTIGRAVITY_LS_ADDRESS && process.env.ANTIGRAVITY_CSRF_TOKEN)
  );
}

/**
 * Executes an agentapi CLI command using ANTIGRAVITY_AGENTAPI_EXE (matching sidecar_sdk).
 */
export function execAgentApi(args: string[], projectId?: string): Promise<any> {
  return new Promise((resolve) => {
    const env = { ...process.env };
    if (projectId) {
      env.ANTIGRAVITY_PROJECT_ID = projectId;
    }
    const exe = process.env.ANTIGRAVITY_AGENTAPI_EXE;
    const file = exe || 'agentapi';
    const execArgs = exe ? ['agentapi', ...args] : args;

    execFile(file, execArgs, { env, timeout: 15000 }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        resolve({ raw: stdout.trim() });
      }
    });
  });
}

/**
 * Dispatches a background Antigravity AI conversation to read the opened project's code
 * and save an enriched Roadmap or Ideation report back into the plugin via MCP tools.
 */
export async function triggerBackgroundAntigravityAnalysis(options: AgentTaskOptions): Promise<{
  triggered: boolean;
  conversationId?: string;
}> {
  if (!isAntigravityAgentAvailable()) {
    return { triggered: false };
  }

  const ws = options.workspacePath;
  const prompt = options.taskType === 'roadmap'
    ? `Read the source code of the project at "${ws}". Understand its existing functions, API routes, database models, and UI views. Then call the "roadmap_save_generated" MCP tool for workspacePath="${ws}" with a tailored ProjectDiscovery (listing actual existing features found in the code), CompetitorAnalysis, and a MoSCoW RoadmapDocument containing 8 NEW features that are NOT yet implemented in "${ws}". Do NOT modify any project source files.`
    : `Read the source code of the project at "${ws}". Inspect its real files, functions, routes, and models. Then call the "ideation_save_generated" MCP tool for workspacePath="${ws}" with code-revealed new feature ideas (codeImprovements), performanceOptimizations, securityVulnerabilities, and codeQualityIssues referencing real file paths in "${ws}". Do NOT modify any project source files.`;

  const res = await execAgentApi([
    'new-conversation',
    '--model',
    'flash',
    '--title',
    `[Antigravity Tools] ${options.taskType === 'roadmap' ? 'Roadmap' : 'Ideation'} Code Scan: ${ws.split(/[\\/]/).pop()}`,
    prompt
  ]);

  if (res && (res.conversationId || res.response?.conversationId)) {
    return {
      triggered: true,
      conversationId: res.conversationId || res.response?.conversationId
    };
  }
  return { triggered: Boolean(res) };
}
