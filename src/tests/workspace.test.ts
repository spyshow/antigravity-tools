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

  it('reads multi-folder codebase (FastAPI + Next.js), stays 100% read-only on target project, and generates code-specific features (never ProCal templates)', async () => {
    // Set up tempDir2 as a multi-folder FastAPI + Next.js engineering project (like AutoTray-Router, no root package.json)
    fs.rmSync(path.join(tempDir2, 'package.json'), { force: true });
    fs.mkdirSync(path.join(tempDir2, 'backend', 'app'), { recursive: true });
    fs.mkdirSync(path.join(tempDir2, 'frontend', 'src', 'app'), { recursive: true });

    fs.writeFileSync(
      path.join(tempDir2, 'README.md'),
      `# AutoTray-Router: Industrial Cable Tray & Multi-Level Riser Sizing Engine\n\nAutomated cable tray fill calculation and graph-based Dijkstra routing engine.\n`
    );
    fs.writeFileSync(
      path.join(tempDir2, 'backend', 'requirements.txt'),
      `fastapi\nuvicorn\nsqlalchemy\nnetworkx\nopenpyxl\n`
    );
    fs.writeFileSync(
      path.join(tempDir2, 'backend', 'app', 'main.py'),
      `from fastapi import FastAPI\napp = FastAPI(title="AutoTray-Router API")\n\n@app.post("/projects/{project_id}/calculate")\ndef run_calculation(project_id: int):\n    return {"status": "ok"}\n\n@app.get("/projects/{project_id}/export")\ndef export_schedule(project_id: int):\n    return {"file": "export.xlsx"}\n`
    );
    fs.writeFileSync(
      path.join(tempDir2, 'backend', 'app', 'engine.py'),
      `import networkx as nx\n\ndef calculate_tray_fill_ratio(cables, tray_width):\n    return sum(c.diameter for c in cables) / tray_width\n\ndef route_cables_dijkstra(graph, source, target):\n    return nx.shortest_path(graph, source, target)\n`
    );
    fs.writeFileSync(
      path.join(tempDir2, 'frontend', 'package.json'),
      JSON.stringify({
        name: 'autotray-frontend',
        dependencies: { next: '16.0.0', react: '19.0.0', '@tanstack/react-table': '^8.0.0', xlsx: '^0.18.5' }
      })
    );

    // 1. Trigger Scan (/api/roadmap/discovery) for tempDir2
    const scanRes = await fetch(`http://localhost:${serverPort}/api/roadmap/discovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspacePath: tempDir2 })
    });
    assert.strictEqual(scanRes.status, 200);
    const discovery = await scanRes.json() as any;

    assert.ok(discovery.projectName.includes('AutoTray-Router'), `Expected AutoTray-Router, got ${discovery.projectName}`);
    assert.ok(
      discovery.currentState.existingFeatures.some((f: string) => f.includes('calculate') || f.includes('route_cables_dijkstra')),
      'Reads actual endpoints and functions from backend/app/*.py'
    );

    // 2. Verify roadmap generated for tempDir2 has ZERO ProCal hardcoded features
    const roadmapRes = await fetch(`http://localhost:${serverPort}/api/roadmap?workspace=${encodeURIComponent(tempDir2)}`);
    const roadmapBundle = await roadmapRes.json() as any;
    assert.ok(roadmapBundle.roadmap, 'Roadmap was generated during scan');
    const allTitles = roadmapBundle.roadmap.features.map((f: any) => f.title).join(' | ');
    assert.ok(!allTitles.includes('IEC 60364'), `Must not contain ProCal IEC 60364 feature, got: ${allTitles}`);
    assert.ok(!allTitles.includes('Apartment Room Templates'), `Must not contain ProCal Apartment Room Templates, got: ${allTitles}`);
    assert.ok(!allTitles.includes('Single-Line Diagram (SLD)'), `Must not contain ProCal SLD feature, got: ${allTitles}`);

    // 3. Trigger Ideation (/api/ideation/analyze) for tempDir2
    const ideationRes = await fetch(`http://localhost:${serverPort}/api/ideation/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspacePath: tempDir2 })
    });
    assert.strictEqual(ideationRes.status, 200);
    const ideation = await ideationRes.json() as any;
    const allIdeationTitles = [
      ...ideation.codeImprovements.map((i: any) => i.title),
      ...ideation.performanceOptimizations.map((i: any) => i.title)
    ].join(' | ');
    assert.ok(!allIdeationTitles.includes('phaseBalance.ts'), 'Must not reference ProCal phaseBalance.ts');
    assert.ok(
      ideation.codeImprovements.some((i: any) =>
        i.affected_files.some((f: string) => f.includes('backend/app/'))
      ),
      'Ideation items reference actual files in the scanned project'
    );

    // 4. Verify target project directory was NOT modified (no .antigravity folder created inside tempDir2)
    assert.strictEqual(
      fs.existsSync(path.join(tempDir2, '.antigravity')),
      false,
      'Target project must remain 100% untouched (.antigravity stored only in plugin global directory)'
    );
  });
});
