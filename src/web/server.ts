import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ModuleRegistry } from '../modules/registry.js';
import { getDefaultPort } from '../config.js';

export class WebDashboardServer {
  private server: http.Server | null = null;
  private registry: ModuleRegistry;
  private port: number;

  constructor(registry?: ModuleRegistry, port?: number) {
    this.registry = registry || new ModuleRegistry();
    this.port = port || getDefaultPort();
  }

  public async start(listenPort?: number): Promise<number> {
    const desiredPort = listenPort || this.port;

    // Resolve public assets directory
    let publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
    if (!fs.existsSync(publicDir)) {
      // Check relative to cwd or src
      const altDir = path.join(process.cwd(), 'src', 'web', 'public');
      if (fs.existsSync(altDir)) {
        publicDir = altDir;
      }
    }

    this.server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

        // Antigravity sidecar bridge endpoints
        if (url.pathname === '/preload.js') {
          res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
          res.end('// Antigravity Sidecar Preload Bridge\n');
          return;
        }

        if (url.pathname === '/shell.css') {
          res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
          res.end('/* Antigravity Sidecar Shell Styles */\n');
          return;
        }

        // Try API dispatch first
        if (url.pathname.startsWith('/api/')) {
          const handled = await this.registry.dispatchHttpRequest(url, req, res);
          if (handled) return;

          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Endpoint not found' }));
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
          // Retry on next port
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
