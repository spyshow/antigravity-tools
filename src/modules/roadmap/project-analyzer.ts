import * as fs from 'fs';
import * as path from 'path';
import { ProjectDiscovery, TechStackInfo, TargetAudience, ProductVision, CurrentStateAssessment } from './types.js';

export class ProjectAnalyzer {
  /**
   * Performs automated deep discovery of a project repository.
   */
  public async analyzeWorkspace(workspacePath: string = process.cwd()): Promise<ProjectDiscovery> {
    const resolvedPath = path.resolve(workspacePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Workspace path does not exist: ${resolvedPath}`);
    }

    const projectName = this.detectProjectName(resolvedPath);
    const techStack = await this.detectTechStack(resolvedPath);
    const projectType = this.detectProjectType(resolvedPath, techStack);
    const readmeContent = this.readReadme(resolvedPath);
    const existingFeatures = this.extractExistingFeatures(readmeContent, resolvedPath);
    const knownGaps = this.extractGapsAndTodos(resolvedPath);

    const productVision = this.inferProductVision(projectName, projectType, readmeContent, techStack);
    const targetAudience = this.inferTargetAudience(projectType, techStack, readmeContent);
    const currentState = this.inferCurrentState(resolvedPath, existingFeatures, knownGaps);

    return {
      projectName,
      projectType,
      workspacePath: resolvedPath,
      techStack,
      targetAudience,
      productVision,
      currentState,
      createdAt: new Date().toISOString()
    };
  }

  private detectProjectName(dir: string): string {
    // 1. package.json
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name) return pkg.name.replace(/^@[^/]+\//, '');
      } catch {}
    }

    // 2. plugin.json
    const pluginPath = path.join(dir, 'plugin.json');
    if (fs.existsSync(pluginPath)) {
      try {
        const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
        if (plugin.displayName) return plugin.displayName;
        if (plugin.name) return plugin.name;
      } catch {}
    }

    // 3. Fallback to folder name
    return path.basename(dir);
  }

  private async detectTechStack(dir: string): Promise<TechStackInfo> {
    let primaryLanguage = 'Unknown';
    const frameworks: string[] = [];
    const keyDependencies: string[] = [];
    const tools: string[] = [];

    // Node / JS / TS
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

        primaryLanguage = allDeps['typescript'] || fs.existsSync(path.join(dir, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript';

        if (allDeps['react']) frameworks.push('React');
        if (allDeps['next']) frameworks.push('Next.js');
        if (allDeps['vue']) frameworks.push('Vue');
        if (allDeps['express']) frameworks.push('Express');
        if (allDeps['electron']) frameworks.push('Electron');
        if (allDeps['tailwindcss'] || allDeps['tailwind']) tools.push('TailwindCSS');
        if (allDeps['vite']) tools.push('Vite');

        // Extract key deps
        for (const dep of Object.keys(allDeps).slice(0, 8)) {
          if (!frameworks.includes(dep) && !tools.includes(dep)) {
            keyDependencies.push(dep);
          }
        }
      } catch {}
    }

    // Python
    if (fs.existsSync(path.join(dir, 'pyproject.toml')) || fs.existsSync(path.join(dir, 'requirements.txt'))) {
      primaryLanguage = 'Python';
      const reqPath = path.join(dir, 'requirements.txt');
      if (fs.existsSync(reqPath)) {
        const reqs = fs.readFileSync(reqPath, 'utf8').toLowerCase();
        if (reqs.includes('fastapi')) frameworks.push('FastAPI');
        if (reqs.includes('django')) frameworks.push('Django');
        if (reqs.includes('flask')) frameworks.push('Flask');
        if (reqs.includes('pytorch') || reqs.includes('torch')) keyDependencies.push('PyTorch');
      }
    }

    // Rust
    if (fs.existsSync(path.join(dir, 'Cargo.toml'))) {
      primaryLanguage = 'Rust';
    }

    // Go
    if (fs.existsSync(path.join(dir, 'go.mod'))) {
      primaryLanguage = 'Go';
    }

    // Git
    if (fs.existsSync(path.join(dir, '.git'))) {
      tools.push('Git');
    }

    return {
      primaryLanguage,
      frameworks: Array.from(new Set(frameworks)),
      keyDependencies: Array.from(new Set(keyDependencies)),
      tools: Array.from(new Set(tools))
    };
  }

  private detectProjectType(dir: string, stack: TechStackInfo): ProjectDiscovery['projectType'] {
    if (fs.existsSync(path.join(dir, 'plugin.json')) || fs.existsSync(path.join(dir, 'mcp_config.json'))) {
      return 'plugin';
    }
    if (stack.frameworks.includes('Electron')) {
      return 'desktop-app';
    }
    if (stack.frameworks.includes('Next.js') || stack.frameworks.includes('React') || stack.frameworks.includes('Vue')) {
      return 'web-app';
    }
    if (fs.existsSync(path.join(dir, 'bin')) || fs.existsSync(path.join(dir, 'cmd'))) {
      return 'cli';
    }
    if (stack.frameworks.includes('FastAPI') || stack.frameworks.includes('Express')) {
      return 'api';
    }
    return 'library';
  }

  private readReadme(dir: string): string {
    const candidates = ['README.md', 'readme.md', 'README', 'Readme.md'];
    for (const c of candidates) {
      const full = path.join(dir, c);
      if (fs.existsSync(full)) {
        return fs.readFileSync(full, 'utf8');
      }
    }
    return '';
  }

  private extractExistingFeatures(readme: string, dir: string): string[] {
    const features: string[] = [];

    if (readme) {
      // Look for bullet points under ## Features or similar
      const match = readme.match(/##\s+(?:Features|Capabilities|Overview)([\s\S]*?)(?:##|\Z)/i);
      if (match && match[1]) {
        const lines = match[1].split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const feat = trimmed.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim();
            if (feat.length > 5 && feat.length < 120) {
              features.push(feat);
            }
          }
        }
      }
    }

    if (features.length === 0) {
      // Fallback heuristics based on directories
      const srcDir = path.join(dir, 'src');
      if (fs.existsSync(srcDir)) {
        try {
          const items = fs.readdirSync(srcDir);
          for (const item of items) {
            if (!item.startsWith('.')) {
              features.push(`${item.replace(/\.[^/.]+$/, '')} module`);
            }
          }
        } catch {}
      }
    }

    return features.slice(0, 8);
  }

  private extractGapsAndTodos(dir: string): string[] {
    const gaps: string[] = [];

    // Scan top-level and src for TODO comments
    const scanDir = (target: string, depth = 0) => {
      if (depth > 2) return;
      try {
        const files = fs.readdirSync(target, { withFileTypes: true });
        for (const f of files) {
          if (f.name.startsWith('.') || f.name === 'node_modules' || f.name === 'dist') continue;
          const full = path.join(target, f.name);
          if (f.isDirectory()) {
            scanDir(full, depth + 1);
          } else if (f.isFile() && /\.(ts|js|py|rs|go|md)$/.test(f.name)) {
            try {
              const content = fs.readFileSync(full, 'utf8');
              const lines = content.split('\n');
              for (const l of lines) {
                if (/TODO|FIXME/i.test(l)) {
                  const cleaned = l.replace(/^.*(?:TODO|FIXME):?\s*/i, '').trim();
                  if (cleaned && cleaned.length > 5 && cleaned.length < 100) {
                    gaps.push(cleaned);
                    if (gaps.length >= 5) return;
                  }
                }
              }
            } catch {}
          }
        }
      } catch {}
    };

    scanDir(dir);

    if (gaps.length === 0) {
      gaps.push('Automated end-to-end integration tests');
      gaps.push('Comprehensive telemetry and observability');
      gaps.push('Multi-environment deployment configuration');
    }

    return Array.from(new Set(gaps)).slice(0, 6);
  }

  private inferProductVision(name: string, type: string, readme: string, stack: TechStackInfo): ProductVision {
    let oneLiner = `${name}: A modern ${type} built with ${stack.primaryLanguage}.`;
    let problemStatement = `Developers and teams need an efficient, high-performance way to solve workflow bottlenecks in ${type} development.`;
    let valueProposition = `Provides an autonomous, developer-friendly experience with first-class ${stack.primaryLanguage} integration and modular architecture.`;

    if (readme) {
      // Find first non-header sentence
      const lines = readme.split('\n');
      for (const l of lines) {
        const t = l.trim();
        if (t && !t.startsWith('#') && !t.startsWith('!') && !t.startsWith('[') && t.length > 20) {
          oneLiner = t.slice(0, 150);
          break;
        }
      }
    }

    return {
      oneLiner,
      problemStatement,
      valueProposition,
      successMetrics: [
        'User workflow completion speed (< 1s execution)',
        'Active daily adoption across developer workflows',
        'Zero-regression test coverage (> 90%)'
      ]
    };
  }

  private inferTargetAudience(type: string, stack: TechStackInfo, readme: string): TargetAudience {
    let primaryPersona = 'Full-Stack Software Engineers & AI Pair Programmers';
    let secondaryPersonas = ['Technical Leads', 'DevOps / Platform Engineers', 'Product Developers'];

    if (type === 'plugin' || type === 'cli') {
      primaryPersona = 'Developers & AI Engineers looking for automated agent extensions';
      secondaryPersonas = ['Open-Source Contributors', 'Workflow Automation Engineers'];
    } else if (type === 'api') {
      primaryPersona = 'Backend Engineers & API Consumers';
      secondaryPersonas = ['System Architects', 'Integration Specialists'];
    }

    return {
      primaryPersona,
      secondaryPersonas,
      painPoints: [
        'Repetitive manual prompts and fragmented development context',
        'Lack of real competitor insight and structured feature prioritization',
        'Context switching between editor, terminal, and browser tools'
      ],
      goals: [
        'Accelerate feature development cycle with AI assistance',
        'Maintain structured, battle-tested software roadmaps',
        'Streamline prompt and workflow execution with zero friction'
      ],
      usageContext: `Used continuously inside IDEs and terminals while building, testing, and planning features.`
    };
  }

  private inferCurrentState(dir: string, existingFeatures: string[], knownGaps: string[]): CurrentStateAssessment {
    let maturity: CurrentStateAssessment['maturity'] = 'mvp';

    if (fs.existsSync(path.join(dir, '.git'))) {
      if (existingFeatures.length > 5) {
        maturity = 'growth';
      }
    }

    return {
      maturity,
      existingFeatures,
      knownGaps,
      technicalDebt: [
        'Needs automated CI/CD pipeline integration',
        'Documentation for advanced plugin customizations'
      ]
    };
  }
}
