import * as fs from 'fs';
import * as path from 'path';

export interface ScannedFileInfo {
  relativePath: string;
  absolutePath: string;
  extension: string;
  lineCount: number;
  sizeBytes: number;
  content: string;
}

export interface CodebaseScanResult {
  projectName: string;
  files: ScannedFileInfo[];
  totalFiles: number;
  totalLines: number;
  packageDependencies: Record<string, string>;
  discoveredPatterns: string[];
  largeFiles: ScannedFileInfo[];
  securityFindings: Array<{
    file: string;
    line: number;
    rule: string;
    vulnerability: string;
    snippet: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  performanceFindings: Array<{
    file: string;
    line: number;
    category: 'bundle_size' | 'runtime' | 'memory' | 'network' | 'io';
    description: string;
    impact: 'high' | 'medium' | 'low';
    snippet: string;
  }>;
  todosAndGaps: Array<{
    file: string;
    line: number;
    text: string;
  }>;
}

export class CodeScanner {
  private ignoredDirs = new Set([
    'node_modules',
    'dist',
    '.git',
    '.gstack',
    'build',
    'coverage',
    '.next',
    '__pycache__',
    '.pytest_cache',
    'venv',
    '.venv'
  ]);

  private supportedExtensions = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.py', '.rs', '.go', '.json', '.html', '.css', '.md'
  ]);

  public async scanCodebase(workspaceDir: string = process.cwd()): Promise<CodebaseScanResult> {
    const root = path.resolve(workspaceDir);
    const files: ScannedFileInfo[] = [];
    let totalLines = 0;

    const walk = (dir: string, depth = 0) => {
      if (depth > 6) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (this.ignoredDirs.has(entry.name) || entry.name.startsWith('.')) {
            // Keep .antigravity if present, ignore other hidden
            if (entry.name !== '.antigravity') continue;
          }

          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath, depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (this.supportedExtensions.has(ext)) {
              try {
                const stat = fs.statSync(fullPath);
                if (stat.size > 500 * 1024) continue; // Skip massive files > 500KB

                const content = fs.readFileSync(fullPath, 'utf8');
                const lineCount = content.split('\n').length;
                totalLines += lineCount;

                const rel = path.relative(root, fullPath).replace(/\\/g, '/');
                files.push({
                  relativePath: rel,
                  absolutePath: fullPath,
                  extension: ext,
                  lineCount,
                  sizeBytes: stat.size,
                  content
                });
              } catch {}
            }
          }
        }
      } catch {}
    };

    walk(root);

    // Read package dependencies
    const packageDependencies: Record<string, string> = {};
    const pkgPath = path.join(root, 'package.json');
    let projectName = path.basename(root);
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name) projectName = pkg.name.replace(/^@[^/]+\//, '');
        Object.assign(packageDependencies, pkg.dependencies || {}, pkg.devDependencies || {});
      } catch {}
    }

    const largeFiles = files.filter(f => f.lineCount > 250 && !f.relativePath.includes('.test.'));
    const discoveredPatterns = this.extractPatterns(files);
    const securityFindings = this.scanSecurity(files);
    const performanceFindings = this.scanPerformance(files, packageDependencies);
    const todosAndGaps = this.extractTodos(files);

    return {
      projectName,
      files,
      totalFiles: files.length,
      totalLines,
      packageDependencies,
      discoveredPatterns,
      largeFiles,
      securityFindings,
      performanceFindings,
      todosAndGaps
    };
  }

  private extractPatterns(files: ScannedFileInfo[]): string[] {
    const patterns = new Set<string>();

    for (const f of files) {
      if (f.content.includes('implements PluginModule') || f.content.includes('interface PluginModule')) {
        patterns.add('PluginModule Lifecycle & Dynamic Extension Contract');
      }
      if (f.content.includes('createRoadmapTools') || f.content.includes('createPromptTools') || f.content.includes('MCPToolDefinition')) {
        patterns.add('Standard Model Context Protocol (MCP) Tool Factory Pattern');
      }
      if (f.content.includes('handleHttpRequest') || f.content.includes('/api/')) {
        patterns.add('RESTful JSON Service & HTTP Bridge Architecture');
      }
      if (f.content.includes('JSON.parse(fs.readFileSync') || f.content.includes('fs.writeFileSync')) {
        patterns.add('Local-First Atomic JSON Document Persistence');
      }
      if (f.content.includes('exportToMarkdown') || f.content.includes('ROADMAP.md')) {
        patterns.add('Markdown Document Generation & Export Workflow');
      }
      if (f.content.includes('showToast') || f.content.includes('modal-overlay')) {
        patterns.add('Sidecar Responsive Aux Pane Web Dashboard UI');
      }
    }

    if (patterns.size === 0) {
      patterns.add('Modular Service & Class Architecture');
    }

    return Array.from(patterns);
  }

  private scanSecurity(files: ScannedFileInfo[]): CodebaseScanResult['securityFindings'] {
    const findings: CodebaseScanResult['securityFindings'] = [];

    for (const f of files) {
      // Skip test files for security alerts
      if (f.relativePath.includes('.test.') || f.relativePath.includes('tests/')) continue;

      const lines = f.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // 1. Hardcoded Secrets / Tokens
        if (/(api[_-]?key|secret|password|bearer|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i.test(line)) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            rule: 'hardcoded-credentials',
            vulnerability: 'CWE-798: Use of Hard-coded Credentials',
            snippet: line.trim().slice(0, 80),
            severity: 'critical'
          });
        }

        // 2. Unsafe eval or new Function
        if (/\beval\s*\(|new\s+Function\s*\(/.test(line)) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            rule: 'unsafe-code-execution',
            vulnerability: 'CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code (Eval Injection)',
            snippet: line.trim().slice(0, 80),
            severity: 'critical'
          });
        }

        // 3. Child Process / Command Execution without validation
        if (/\b(execSync|exec|spawn)\s*\(/.test(line) && !line.includes('// safe')) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            rule: 'command-injection-risk',
            vulnerability: 'CWE-78: Improper Neutralization of Special Elements used in an OS Command (Command Injection)',
            snippet: line.trim().slice(0, 80),
            severity: 'high'
          });
        }

        // 4. Insecure innerHTML assignments
        if (/\.innerHTML\s*=[^=]/.test(line) && !line.includes('escapeHtml')) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            rule: 'unsafe-dom-xss',
            vulnerability: 'CWE-79: Improper Neutralization of Input During Web Page Generation (DOM XSS)',
            snippet: line.trim().slice(0, 80),
            severity: 'medium'
          });
        }

        // 5. Wildcard CORS
        if (/Access-Control-Allow-Origin['"]?\s*:\s*['"]\*['"]/.test(line)) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            rule: 'permissive-cors',
            vulnerability: 'CWE-942: Permissive Cross-Domain Policy with Wildcard (*)',
            snippet: line.trim().slice(0, 80),
            severity: 'low'
          });
        }
      }
    }

    return findings;
  }

  private scanPerformance(
    files: ScannedFileInfo[],
    deps: Record<string, string>
  ): CodebaseScanResult['performanceFindings'] {
    const findings: CodebaseScanResult['performanceFindings'] = [];

    // 1. Dependency checks (moment, lodash without lodash-es, etc.)
    if (deps['moment']) {
      findings.push({
        file: 'package.json',
        line: 1,
        category: 'bundle_size',
        description: 'moment.js dependency detected (300KB+ uncompressed). Replace with date-fns or native Intl/Temporal.',
        impact: 'high',
        snippet: `"moment": "${deps['moment']}"`
      });
    }

    // 2. Synchronous file I/O in non-startup paths
    for (const f of files) {
      if (f.relativePath.includes('test') || f.relativePath.includes('cli.ts') || f.relativePath.includes('config.ts')) continue;

      const lines = f.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (/\bfs\.(readFileSync|writeFileSync|appendFileSync)\b/.test(line)) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            category: 'io',
            description: 'Synchronous file I/O blocks the Node.js event loop during active request handling.',
            impact: 'medium',
            snippet: line.trim().slice(0, 80)
          });
          break; // Flag once per file to avoid noise
        }
      }
    }

    // 3. Expensive regex in loops
    for (const f of files) {
      const lines = f.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/for\s*\(.*\)\s*\{.*new RegExp\(/i.test(line)) {
          findings.push({
            file: f.relativePath,
            line: i + 1,
            category: 'runtime',
            description: 'RegExp instantiated inside a loop causes repeated regex recompilation overhead.',
            impact: 'medium',
            snippet: line.trim().slice(0, 80)
          });
        }
      }
    }

    return findings;
  }

  private extractTodos(files: ScannedFileInfo[]): CodebaseScanResult['todosAndGaps'] {
    const todos: CodebaseScanResult['todosAndGaps'] = [];

    for (const f of files) {
      const lines = f.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/\b(TODO|FIXME|OPTIMIZE|HACK)\b/i.test(line)) {
          todos.push({
            file: f.relativePath,
            line: i + 1,
            text: line.replace(/^.*(?:TODO|FIXME|OPTIMIZE|HACK):?\s*/i, '').trim().slice(0, 100)
          });
        }
      }
    }

    return todos.slice(0, 10);
  }
}
