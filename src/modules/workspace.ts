import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
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

const metadataCache = new Map<string, any>();

export async function getConversationMetadata(conversationId: string): Promise<any> {
  const convId = conversationId?.trim();
  if (!convId || !/^[a-zA-Z0-9_-]+$/.test(convId)) {
    return null;
  }

  if (metadataCache.has(convId)) {
    return metadataCache.get(convId);
  }

  return new Promise((resolve) => {
    exec(`agentapi get-conversation-metadata ${convId}`, { timeout: 8000 }, (err, stdout) => {
      if (err || !stdout) {
        resolve(null);
        return;
      }

      try {
        const data = JSON.parse(stdout);
        metadataCache.set(convId, data);

        const meta = data?.response?.conversationMetadata?.metadata;
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

  const meta = data?.response?.conversationMetadata?.metadata;
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
