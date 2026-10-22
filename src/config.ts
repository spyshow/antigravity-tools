import * as path from 'path';
import * as os from 'os';

export function getPluginHomeDir(): string {
  const baseDir = process.env.USERPROFILE || process.env.HOME || os.homedir();
  return path.join(baseDir, '.gemini', 'antigravity-toolkit');
}

export function getPromptsStoragePath(): string {
  if (process.env.AGY_PROMPTS_PATH) {
    return process.env.AGY_PROMPTS_PATH;
  }
  return path.join(getPluginHomeDir(), 'prompts.json');
}

export function getDefaultPort(): number {
  const envPort = process.env.ANTIGRAVITY_SIDECAR_WEB_PORT || process.env.AGY_TOOLKIT_PORT;
  if (envPort && !isNaN(Number(envPort))) {
    return Number(envPort);
  }
  return 4321;
}
