import { execFile } from 'child_process';
import { Worker } from 'worker_threads';

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
 * Runs a Roadmap or Ideation scan in an isolated Node.js worker_threads background worker
 * so file I/O and AI requests never block the sidecar HTTP server event loop and never
 * spawn visible conversations in the Antigravity sidebar.
 */
export function runScanInWorker<T = any>(options: AgentTaskOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const workerUrl = new URL('./scan-worker.js', import.meta.url);
      const worker = new Worker(workerUrl, {
        workerData: {
          workspacePath: options.workspacePath,
          taskType: options.taskType
        }
      });

      let settled = false;

      worker.on('message', (msg: { ok: boolean; result?: T; error?: string }) => {
        if (settled) return;
        settled = true;
        if (msg && msg.ok) {
          resolve(msg.result as T);
        } else {
          reject(new Error(msg?.error || 'Background scan worker failed'));
        }
      });

      worker.on('error', (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      });

      worker.on('exit', (code) => {
        if (settled) return;
        settled = true;
        if (code !== 0) {
          reject(new Error(`Scan worker stopped with exit code ${code}`));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Runs background analysis purely inside a Node.js worker thread without calling
 * `agentapi new-conversation` (so it never clutters the Antigravity sidebar).
 */
export async function triggerBackgroundAntigravityAnalysis(options: AgentTaskOptions): Promise<{
  triggered: boolean;
  conversationId?: string;
}> {
  try {
    await runScanInWorker(options);
    return { triggered: true };
  } catch {
    return { triggered: false };
  }
}
