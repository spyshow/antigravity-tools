import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as crypto from 'crypto';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';

let activeWorkspace: string = process.cwd();

export function normalizeWorkspacePath(input?: string | null): string {
  if (!input || !input.trim()) {
    return activeWorkspace;
  }

  let clean = decodeURIComponent(input.trim());

  // Handle file:// URIs
  if (clean.startsWith('file://')) {
    try {
      clean = fileURLToPath(clean);
    } catch {
      if (clean.startsWith('file:///')) {
        clean = clean.slice(8);
      } else {
        clean = clean.slice(7);
      }
    }
  }

  // Handle leading slash on Windows drive letters, e.g. /D:/... or /d:/...
  if (/^\/?[a-zA-Z]:[\\\/]/.test(clean)) {
    if (clean.startsWith('/')) {
      clean = clean.slice(1);
    }
    clean = clean.replace(/\//g, '\\');
  }

  return path.resolve(clean);
}

export function getActiveWorkspace(): string {
  return activeWorkspace;
}

export function setActiveWorkspace(newPath: string): string {
  const normalized = normalizeWorkspacePath(newPath);
  activeWorkspace = normalized;
  return activeWorkspace;
}

/**
 * Returns a dedicated storage directory inside the plugin's own global data folder
 * (~/.gemini/antigravity-toolkit/workspaces/<slug>-<hash>) for the given project path.
 * This ensures the plugin NEVER creates or modifies files inside the user's project directory.
 */
export function getPluginWorkspaceStorageDir(workspaceDir: string = activeWorkspace): string {
  const normalized = normalizeWorkspacePath(workspaceDir);
  const normalizedLower = process.platform === 'win32' ? normalized.toLowerCase() : normalized;
  const hash = crypto.createHash('sha1').update(normalizedLower).digest('hex').slice(0, 10);
  const slug = path.basename(normalized).replace(/[^a-zA-Z0-9_-]/g, '_') || 'workspace';
  const dir = path.join(os.homedir(), '.gemini', 'antigravity-toolkit', 'workspaces', `${slug}_${hash}`);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function getConversationMetadata(conversationId: string): Promise<any> {
  const convId = conversationId?.trim();
  if (!convId || !/^[a-zA-Z0-9_-]+$/.test(convId)) {
    return null;
  }

  return new Promise((resolve) => {
    const exe = process.env.ANTIGRAVITY_AGENTAPI_EXE;
    const file = exe || 'agentapi';
    const args = exe ? ['agentapi', 'get-conversation-metadata', convId] : ['get-conversation-metadata', convId];

    execFile(file, args, { timeout: 8000, env: process.env }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const meta = data?.response?.conversationMetadata?.metadata || data?.response?.conversation_metadata?.metadata;
        const uris = meta?.workspaceUris || [];
        const workspaces = meta?.workspaces || [];

        let targetUri: string | null = null;
        if (workspaces.length > 0 && workspaces[0].workspaceFolderAbsoluteUri) {
          targetUri = workspaces[0].workspaceFolderAbsoluteUri;
        } else if (uris.length > 0) {
          targetUri = uris[0];
        }

        if (targetUri) {
          const resolvedPath = normalizeWorkspacePath(targetUri);
          setActiveWorkspace(resolvedPath);
        }

        resolve(data);
      } catch {
        resolve(null);
      }
    });
  });
}

export async function resolveWorkspaceFromConversation(conversationId: string): Promise<string | null> {
  const data = await getConversationMetadata(conversationId);
  if (!data) return null;

  const meta = data?.response?.conversationMetadata?.metadata || data?.response?.conversation_metadata?.metadata;
  const uris = meta?.workspaceUris || [];
  const workspaces = meta?.workspaces || [];

  let targetUri: string | null = null;
  if (workspaces.length > 0 && workspaces[0].workspaceFolderAbsoluteUri) {
    targetUri = workspaces[0].workspaceFolderAbsoluteUri;
  } else if (uris.length > 0) {
    targetUri = uris[0];
  }

  if (targetUri) {
    const resolved = normalizeWorkspacePath(targetUri);
    setActiveWorkspace(resolved);
    return resolved;
  }
  return null;
}
