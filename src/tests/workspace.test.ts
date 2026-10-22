import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  normalizeWorkspacePath,
  getActiveWorkspace,
  setActiveWorkspace
} from '../modules/workspace.js';
import { WebDashboardServer } from '../web/server.js';
import { ModuleRegistry } from '../modules/registry.js';

describe('Workspace Switcher & Multi-Project Isolation', () => {
  let tempDir1: string;
  let tempDir2: string;
  let server: WebDashboardServer;
  let serverPort: number;

  before(async () => {
    tempDir1 = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-ws1-'));
    tempDir2 = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-ws2-'));

    // Create dummy package.json in tempDir1
    fs.writeFileSync(
      path.join(tempDir1, 'package.json'),
      JSON.stringify({ name: 'project-one', version: '1.0.0' })
    );

    // Create dummy package.json in tempDir2
    fs.writeFileSync(
      path.join(tempDir2, 'package.json'),
      JSON.stringify({ name: 'project-two', version: '2.0.0' })
    );

    const registry = new ModuleRegistry();
    server = new WebDashboardServer(registry, 0);
    serverPort = await server.start(0);
  });

  after(async () => {
    await server.stop();
    fs.rmSync(tempDir1, { recursive: true, force: true });
    fs.rmSync(tempDir2, { recursive: true, force: true });
  });

  it('normalizes various workspace URI formats into valid absolute paths', () => {
    const rawUri = 'file:///c%3A/test/my_project';
    const normalized = normalizeWorkspacePath(rawUri);
    assert.ok(normalized.toLowerCase().includes('test'), 'Contains path segments');
    assert.ok(!normalized.startsWith('file:'), 'Strips file URI scheme');
    assert.ok(!normalized.includes('%3A'), 'Decodes URI encoding');
  });

  it('sets and gets the global active workspace correctly', () => {
    setActiveWorkspace(tempDir1);
    assert.strictEqual(getActiveWorkspace().toLowerCase(), path.resolve(tempDir1).toLowerCase());

    setActiveWorkspace(tempDir2);
    assert.strictEqual(getActiveWorkspace().toLowerCase(), path.resolve(tempDir2).toLowerCase());
  });

  it('serves real preload.js bridge with workspace change support', async () => {
    const res = await fetch(`http://localhost:${serverPort}/preload.js`);
    assert.strictEqual(res.status, 200);
    const body = await res.text();
    assert.ok(body.includes('workspace-change') || body.includes('getWorkspaceUris'));
  });

  it('exposes GET and POST /api/workspace for dynamic project switching', async () => {
    // 1. Post to switch to tempDir1
    const postRes = await fetch(`http://localhost:${serverPort}/api/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace: tempDir1 })
    });
    const postData = await postRes.json() as any;
    assert.strictEqual(postData.success, true);
    assert.strictEqual(postData.workspace.toLowerCase(), path.resolve(tempDir1).toLowerCase());

    // 2. Get current workspace
    const getRes = await fetch(`http://localhost:${serverPort}/api/workspace`);
    const getData = await getRes.json() as any;
    assert.strictEqual(getData.success, true);
    assert.strictEqual(getData.workspace.toLowerCase(), path.resolve(tempDir1).toLowerCase());

    // 3. Switch to tempDir2
    await fetch(`http://localhost:${serverPort}/api/workspace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace: tempDir2 })
    });
    const checkRes = await fetch(`http://localhost:${serverPort}/api/workspace`);
    const checkData = await checkRes.json() as any;
    assert.strictEqual(checkData.workspace.toLowerCase(), path.resolve(tempDir2).toLowerCase());
  });
});
