import * as fs from 'fs';
import * as path from 'path';

/**
 * Builds a compact, prioritized snapshot of a project's docs, manifests, file tree
 * and source code so an LLM can reason about *this* project specifically.
 */

const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out', '.next', '.nuxt', '.turbo', '.cache',
  'coverage', '__pycache__', '.pytest_cache', '.mypy_cache', '.ruff_cache', '.venv', 'venv', 'env',
  'site-packages', 'target', 'bin', 'obj', '.idea', '.vscode', '.antigravity', '.agents', '.gemini',
  'vendor', 'Pods', '.gradle', '.dart_tool', 'migrations', 'versions', 'public', 'static', 'assets', '.svelte-kit'
]);

const SOURCE_EXT = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.rs', '.java', '.kt', '.cs', '.rb', '.php',
  '.swift', '.dart', '.vue', '.svelte', '.c', '.cpp', '.h', '.hpp', '.sql', '.prisma', '.graphql'
]);

const MANIFESTS = [
  'package.json', 'requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py', 'go.mod', 'Cargo.toml',
  'pom.xml', 'build.gradle', 'composer.json', 'Gemfile', 'pubspec.yaml', 'plugin.json', 'docker-compose.yml',
  'Dockerfile', 'tsconfig.json', 'next.config.js', 'next.config.ts', 'alembic.ini', 'schema.prisma'
];

const DOC_PATTERN = /^(readme|plan|roadmap|todo|todos|agents|architecture|design|spec|changelog|contributing)[^/]*\.(md|txt|rst)$/i;

export interface ProjectContext {
  projectName: string;
  workspacePath: string;
  fileTree: string[];
  totalSourceFiles: number;
  totalSourceLines: number;
  includedFiles: string[];
  text: string;
}

interface Candidate {
  rel: string;
  full: string;
  size: number;
  score: number;
}

export function buildProjectContext(workspacePath: string, budgetChars = 180000): ProjectContext {
  const root = path.resolve(workspacePath);
  if (!fs.existsSync(root)) throw new Error(`Workspace path does not exist: ${root}`);

  const tree: string[] = [];
  const docs: Candidate[] = [];
  const manifests: Candidate[] = [];
  const sources: Candidate[] = [];
  let totalSourceLines = 0;

  const walk = (dir: string, depth: number) => {
    if (depth > 8 || tree.length > 4000) return;
    let entries: fs.Dirent[] = [];
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (e.isDirectory()) {
        if (IGNORED_DIRS.has(e.name) || (e.name.startsWith('.') && e.name !== '.github')) continue;
        tree.push(rel + '/');
        walk(full, depth + 1);
        continue;
      }
      if (!e.isFile()) continue;
      let size = 0;
      try { size = fs.statSync(full).size; } catch { continue; }
      const ext = path.extname(e.name).toLowerCase();
      const isDoc = DOC_PATTERN.test(e.name) && depth <= 2;
      const isManifest = MANIFESTS.includes(e.name) && depth <= 2;
      const isSource = SOURCE_EXT.has(ext) && size < 400000 && !/\.(min|bundle)\.js$/.test(e.name) && !/\.d\.ts$/.test(e.name);

      if (isDoc || isManifest || isSource) tree.push(rel);
      if (isDoc) docs.push({ rel, full, size, score: /readme/i.test(e.name) ? 100 : 50 - depth * 10 });
      else if (isManifest) manifests.push({ rel, full, size, score: 50 - depth * 10 });
      else if (isSource) {
        sources.push({ rel, full, size, score: scoreSource(rel, size, depth) });
        totalSourceLines += Math.max(1, Math.round(size / 40));
      }
    }
  };
  walk(root, 0);

  const sections: string[] = [];
  const included: string[] = [];
  let used = 0;
  const push = (title: string, body: string) => {
    const block = `\n===== ${title} =====\n${body}\n`;
    sections.push(block);
    used += block.length;
  };
  const readTrunc = (full: string, max: number) => {
    try {
      const c = fs.readFileSync(full, 'utf8');
      return c.length > max ? c.slice(0, max) + `\n... [truncated, ${c.length - max} more chars]` : c;
    } catch { return ''; }
  };

  const projectName = detectName(root);
  push('PROJECT', `Name: ${projectName}\nRoot: ${root}\nSource files: ${sources.length} (~${totalSourceLines} lines)`);

  const treeText = tree.slice(0, 600).join('\n') + (tree.length > 600 ? `\n... (${tree.length - 600} more entries)` : '');
  push('FILE TREE (filtered)', treeText);

  for (const d of docs.sort((a, b) => b.score - a.score).slice(0, 6)) {
    if (used > budgetChars * 0.35) break;
    push(`DOC: ${d.rel}`, readTrunc(d.full, 14000));
    included.push(d.rel);
  }
  for (const m of manifests.sort((a, b) => b.score - a.score).slice(0, 10)) {
    if (used > budgetChars * 0.45) break;
    push(`MANIFEST: ${m.rel}`, readTrunc(m.full, 5000));
    included.push(m.rel);
  }

  for (const s of sources.sort((a, b) => b.score - a.score)) {
    if (used >= budgetChars) break;
    const remaining = budgetChars - used;
    if (remaining < 1500) break;
    const body = readTrunc(s.full, Math.min(9000, remaining - 200));
    if (!body.trim()) continue;
    push(`FILE: ${s.rel}`, body);
    included.push(s.rel);
  }

  return {
    projectName,
    workspacePath: root,
    fileTree: tree,
    totalSourceFiles: sources.length,
    totalSourceLines,
    includedFiles: included,
    text: sections.join('')
  };
}

function scoreSource(rel: string, size: number, depth: number): number {
  const lower = rel.toLowerCase();
  const base = path.basename(lower);
  let score = 20 - depth * 2;
  if (/^(main|app|server|index|cli|manage|wsgi|asgi)\.(py|ts|tsx|js|go|rs)$/.test(base)) score += 30;
  if (/(page|layout|route)\.(tsx|ts|jsx|js)$/.test(base)) score += 18;
  if (/(api|routes?|routers?|controllers?|endpoints?|handlers?)\b/.test(lower)) score += 20;
  if (/(models?|schemas?|entities|types|domain)\b/.test(lower)) score += 18;
  if (/(services?|engine|core|lib|calc|calculations?|utils?)\b/.test(lower)) score += 15;
  if (/(auth|security|db|database|config|settings)\b/.test(lower)) score += 14;
  if (/(test|spec|__tests__|fixtures?|mock)/.test(lower)) score -= 18;
  if (/(components\/ui\/|\.stories\.)/.test(lower)) score -= 12;
  if (size < 200) score -= 15;
  if (size > 60000) score -= 10;
  return score;
}

function detectName(root: string): string {
  for (const f of ['package.json', 'plugin.json']) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
      if (j.displayName) return j.displayName;
      if (j.name) return String(j.name).replace(/^@[^/]+\//, '');
    } catch {}
  }
  try {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    const h1 = readme.match(/^#\s+(.+)$/m);
    if (h1) return h1[1].split(/[:—–-]/)[0].replace(/[*_`]/g, '').trim() || path.basename(root);
  } catch {}
  return path.basename(root);
}
