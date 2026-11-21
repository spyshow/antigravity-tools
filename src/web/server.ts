import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import { ModuleRegistry } from '../modules/registry.js';
import { getDefaultPort } from '../config.js';
import {
  getActiveWorkspace,
  setActiveWorkspace,
  normalizeWorkspacePath,
  getConversationMetadata,
  resolveWorkspaceFromConversation
} from '../modules/workspace.js';
import { describeAISettings, saveAISettings } from '../modules/ai/settings.js';
import { execAgentApi } from '../modules/ai/antigravity-agent.js';
import { copyToClipboard } from '../modules/prompts/clipboard.js';

export class WebDashboardServer {
  private server: http.Server | null = null;
  private registry: ModuleRegistry;
  private port: number;

  constructor(registry?: ModuleRegistry, port?: number) {
    this.registry = registry || new ModuleRegistry();
    this.port = port || getDefaultPort();
  }

  private resolvePreloadJs(): string {
    const userHome = process.env.USERPROFILE || process.env.HOME || os.homedir();
    const candidates = [
      path.join(userHome, '.gemini', 'antigravity', 'lib', 'node_modules', 'sidecar_sdk', 'preload.js'),
      path.join(userHome, '.gemini', 'config', 'node_modules', 'sidecar_sdk', 'preload.js'),
      path.join(process.env.ANTIGRAVITY_APP_DATA_DIR || '', 'lib', 'node_modules', 'sidecar_sdk', 'preload.js')
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf8');
      }
    }

    // High-fidelity fallback if sidecar_sdk is not found on disk
    return `
/**
 * Standalone Antigravity Sidecar Bridge Fallback
 */
(function() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const conversationId = params.get('conversationId');

  let currentWorkspaceUris = [];
  let hasInitialWorkspace = false;
  const workspaceListeners = new Set();

  function notifyWorkspaceListener(listener) {
    try {
      listener([...currentWorkspaceUris]);
    } catch (err) {
      console.error('workspace-change listener failed:', err);
    }
  }

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'workspace-change') {
      const payload = event.data.payload ?? {};
      const nextUris = Array.isArray(payload.workspaceUris) ? [...payload.workspaceUris] : [];
      currentWorkspaceUris = nextUris;
      hasInitialWorkspace = true;
      for (const listener of workspaceListeners) {
        notifyWorkspaceListener(listener);
      }
    }
  });

  window.sidecar = {
    conversationId,
    getWorkspaceUris: async () => [...currentWorkspaceUris],
    onWorkspaceChange(listener) {
      if (typeof listener !== 'function') return () => {};
      workspaceListeners.add(listener);
      if (hasInitialWorkspace) {
        queueMicrotask(() => notifyWorkspaceListener(listener));
      }
      return () => workspaceListeners.delete(listener);
    }
  };
})();
`;
  }

  public async start(listenPort?: number): Promise<number> {
    const desiredPort = listenPort || this.port;

    // Resolve public assets directory
    let publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
    if (!fs.existsSync(publicDir)) {
      const altDir = path.join(process.cwd(), 'src', 'web', 'public');
      if (fs.existsSync(altDir)) {
        publicDir = altDir;
      }
    }

    this.server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const method = (req.method || 'GET').toUpperCase();

        const sendJson = (statusCode: number, data: any) => {
          res.writeHead(statusCode, {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Sidecar-Token'
          });
          res.end(JSON.stringify(data));
        };

        if (method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Sidecar-Token'
          });
          res.end();
          return;
        }

        const parseBody = async (): Promise<any> => {
          return new Promise((resolve) => {
            let body = '';
            req.on('data', (chunk: any) => { body += chunk; });
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        // Antigravity sidecar bridge endpoints
        if (url.pathname === '/preload.js') {
          res.writeHead(200, {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(this.resolvePreloadJs());
          return;
        }

        if (url.pathname === '/shell.css') {
          res.writeHead(200, {
            'Content-Type': 'text/css; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
          });
          res.end('/* Antigravity Sidecar Shell Styles */\n');
          return;
        }

        // Bridge: /_sidecar/get-conversation-metadata
        if (url.pathname === '/_sidecar/get-conversation-metadata') {
          const body = await parseBody();
          const convId = body.conversationId || url.searchParams.get('conversationId');
          if (convId) {
            const meta = await getConversationMetadata(convId);
            if (meta) {
              sendJson(200, meta);
              return;
            }
          }
          sendJson(200, { response: { conversationMetadata: { metadata: { workspaceUris: [getActiveWorkspace()] } } } });
          return;
        }

        // Bridge: /_sidecar/send-message
        if (url.pathname === '/_sidecar/send-message' && method === 'POST') {
          const body = await parseBody();
          const convId = body.conversationId || url.searchParams.get('conversationId');
          const args = ['send-message'];
          if (convId) args.push('--conversation-id', String(convId));
          if (body.wait) args.push('--wait');
          if (typeof body.message === 'string') args.push(body.message);
          const resp = await execAgentApi(args);
          sendJson(200, resp || { error: 'agentapi unavailable' });
          return;
        }

        // Bridge: /_sidecar/new-conversation
        if (url.pathname === '/_sidecar/new-conversation' && method === 'POST') {
          const body = await parseBody();
          const args = ['new-conversation'];
          if (Array.isArray(body.workspaces)) {
            for (const ws of body.workspaces) {
              if (ws) args.push('--workspace', String(ws));
            }
          }
          if (body.wait) args.push('--wait');
          if (body.agentMode) args.push('--agent-mode', String(body.agentMode));
          if (typeof body.message === 'string') args.push(body.message);
          const resp = await execAgentApi(args);
          sendJson(200, resp || { error: 'agentapi unavailable' });
          return;
        }

        // Workspace management endpoints
        if (url.pathname === '/api/workspace') {
          if (method === 'GET') {
            const convId = url.searchParams.get('conversationId');
            if (convId) {
              await resolveWorkspaceFromConversation(convId);
            }
            const queryWs = url.searchParams.get('workspace');
            if (queryWs) {
              setActiveWorkspace(queryWs);
            }
            const current = getActiveWorkspace();
            sendJson(200, {
              success: true,
              workspace: current,
              name: path.basename(current)
            });
            return;
          }

          if (method === 'POST') {
            const body = await parseBody();
            if (body.workspace) {
              setActiveWorkspace(body.workspace);
            }
            const current = getActiveWorkspace();
            sendJson(200, {
              success: true,
              workspace: current,
              name: path.basename(current)
            });
            return;
          }
        }

        // AI settings endpoint (Gemini API key & model)
        if (url.pathname === '/api/ai/settings') {
          if (method === 'GET') {
            sendJson(200, describeAISettings());
            return;
          }
          if (method === 'POST') {
            const body = await parseBody();
            saveAISettings(body);
            sendJson(200, describeAISettings());
            return;
          }
        }

        // System clipboard bridge endpoint (works inside sandboxed sidecar iframes)
        if (url.pathname === '/api/clipboard' && method === 'POST') {
          const body = await parseBody();
          const text = typeof body.text === 'string' ? body.text : '';
          if (!text) {
            sendJson(400, { success: false, error: 'Missing text to copy' });
            return;
          }
          const result = await copyToClipboard(text);
          sendJson(result.success ? 200 : 500, result);
          return;
        }

        // Auto-synchronize workspace if passed as query parameter
        if (url.searchParams.has('workspace')) {
          setActiveWorkspace(url.searchParams.get('workspace')!);
        }

        // Try API dispatch first
        if (url.pathname.startsWith('/api/')) {
          const handled = await this.registry.dispatchHttpRequest(url, req, res);
          if (handled) return;

          sendJson(404, { error: 'Endpoint not found' });
          return;
        }

        // Static file serving
        let filePath = path.join(publicDir, url.pathname === '/' ? 'index.html' : url.pathname);

        // Security check
        if (!filePath.startsWith(publicDir)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Forbidden');
          return;
        }

        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.html': 'text/html; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.svg': 'image/svg+xml',
            '.png': 'image/png'
          };

          const contentType = mimeTypes[ext] || 'application/octet-stream';
          res.writeHead(200, { 'Content-Type': contentType });
          fs.createReadStream(filePath).pipe(res);
          return;
        }

        // Fallback to index.html for SPA routes
        const indexHtml = path.join(publicDir, 'index.html');
        if (fs.existsSync(indexHtml)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(indexHtml).pipe(res);
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err?.message || 'Server error' }));
      }
    });

    return new Promise((resolve, reject) => {
      this.server!.listen(desiredPort, () => {
        const address = this.server!.address();
        const actualPort = typeof address === 'object' && address ? address.port : desiredPort;
        this.port = actualPort;
        resolve(actualPort);
      });

      this.server!.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.server!.listen(0, () => {
            const address = this.server!.address();
            const actualPort = typeof address === 'object' && address ? address.port : desiredPort + 1;
            this.port = actualPort;
            resolve(actualPort);
          });
        } else {
          reject(err);
        }
      });
    });
  }

  public getPort(): number {
    return this.port;
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
