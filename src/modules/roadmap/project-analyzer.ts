import * as fs from 'fs';
import * as path from 'path';
import { ProjectDiscovery, TechStackInfo, TargetAudience, ProductVision, CurrentStateAssessment } from './types.js';

export type ProjectDomain = 'electrical-cad' | 'devtools-ai' | 'ecommerce' | 'fintech' | 'healthcare' | 'software-platform';

export class ProjectAnalyzer {
  /**
   * Performs automated deep discovery of a project repository.
   */
  public async analyzeWorkspace(workspacePath: string = process.cwd()): Promise<ProjectDiscovery> {
    const resolvedPath = path.resolve(workspacePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`Workspace path does not exist: ${resolvedPath}`);
    }

    const pkgInfo = this.readPackageInfo(resolvedPath);
    const projectName = this.detectProjectName(resolvedPath, pkgInfo);
    const techStack = await this.detectTechStack(resolvedPath, pkgInfo);
    const projectType = this.detectProjectType(resolvedPath, techStack);
    const readmeContent = this.readReadme(resolvedPath);
    const domain = this.detectDomain(projectName, projectType, readmeContent, pkgInfo);

    const existingFeatures = this.extractExistingFeatures(readmeContent, resolvedPath);
    const knownGaps = this.extractGapsAndTodos(resolvedPath);

    const productVision = this.inferProductVision(projectName, projectType, domain, readmeContent, techStack, pkgInfo);
    const targetAudience = this.inferTargetAudience(domain, projectType, techStack, readmeContent);
    const currentState = this.inferCurrentState(resolvedPath, existingFeatures, knownGaps);

    return {
      projectName,
      projectType,
      domain,
      workspacePath: resolvedPath,
      techStack,
      targetAudience,
      productVision,
      currentState,
      createdAt: new Date().toISOString()
    };
  }

  private readPackageInfo(dir: string): any {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      } catch {}
    }
    return null;
  }

  private detectProjectName(dir: string, pkgInfo: any): string {
    if (pkgInfo && pkgInfo.name) {
      return pkgInfo.name.replace(/^@[^/]+\//, '');
    }

    const pluginPath = path.join(dir, 'plugin.json');
    if (fs.existsSync(pluginPath)) {
      try {
        const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
        if (plugin.displayName) return plugin.displayName;
        if (plugin.name) return plugin.name;
      } catch {}
    }

    return path.basename(dir);
  }

  private async detectTechStack(dir: string, pkgInfo: any): Promise<TechStackInfo> {
    let primaryLanguage = 'Unknown';
    const frameworks: string[] = [];
    const keyDependencies: string[] = [];
    const tools: string[] = [];

    if (pkgInfo) {
      const allDeps = { ...(pkgInfo.dependencies || {}), ...(pkgInfo.devDependencies || {}) };
      primaryLanguage = allDeps['typescript'] || fs.existsSync(path.join(dir, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript';

      if (allDeps['react']) frameworks.push('React');
      if (allDeps['next']) frameworks.push('Next.js');
      if (allDeps['vue']) frameworks.push('Vue');
      if (allDeps['express']) frameworks.push('Express');
      if (allDeps['electron']) frameworks.push('Electron');
      if (allDeps['@prisma/client'] || allDeps['prisma']) tools.push('Prisma');
      if (allDeps['tailwindcss'] || allDeps['tailwind']) tools.push('TailwindCSS');
      if (allDeps['vite']) tools.push('Vite');
      if (allDeps['vitest']) tools.push('Vitest');

      for (const dep of Object.keys(allDeps).slice(0, 8)) {
        if (!frameworks.includes(dep) && !tools.includes(dep)) {
          keyDependencies.push(dep);
        }
      }
    }

    // Python
    if (fs.existsSync(path.join(dir, 'pyproject.toml')) || fs.existsSync(path.join(dir, 'requirements.txt'))) {
      primaryLanguage = 'Python';
      const reqPath = path.join(dir, 'requirements.txt');
      if (fs.existsSync(reqPath)) {
        try {
          const reqs = fs.readFileSync(reqPath, 'utf8').toLowerCase();
          if (reqs.includes('fastapi')) frameworks.push('FastAPI');
          if (reqs.includes('django')) frameworks.push('Django');
          if (reqs.includes('flask')) frameworks.push('Flask');
          if (reqs.includes('pytorch') || reqs.includes('torch')) keyDependencies.push('PyTorch');
        } catch {}
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

  private detectDomain(name: string, type: string, readme: string, pkgInfo: any): ProjectDomain {
    const combined = [
      name,
      type,
      pkgInfo?.description || '',
      Array.isArray(pkgInfo?.keywords) ? pkgInfo.keywords.join(' ') : '',
      readme.slice(0, 4000)
    ].join(' ').toLowerCase();

    if (/(electrical|voltage|breaker|cable|transformer|power-distribution|phasebalance|sub-panel|single-line|riser diagram|iec 60364|nec \/ nfpa|short-circuit|ampacity|switchgear)/i.test(combined)) {
      return 'electrical-cad';
    }
    if (/(prompt library|antigravity tool|ide plugin|mcp server|agent ecosystem|copilot extension)/i.test(combined)) {
      return 'devtools-ai';
    }
    if (/(checkout|shopping cart|ecommerce|e-commerce|storefront|shopify)/i.test(combined)) {
      return 'ecommerce';
    }
    if (/(invoice|payroll|ledger|fintech|billing|accounting)/i.test(combined)) {
      return 'fintech';
    }
    if (/(clinical|patient|hospital|healthcare|ehr|telehealth)/i.test(combined)) {
      return 'healthcare';
    }
    return 'software-platform';
  }

  private readReadme(dir: string): string {
    const candidates = ['README.md', 'readme.md', 'README', 'Readme.md'];
    for (const c of candidates) {
      const full = path.join(dir, c);
      if (fs.existsSync(full)) {
        try {
          return fs.readFileSync(full, 'utf8');
        } catch {}
      }
    }
    return '';
  }

  private extractExistingFeatures(readme: string, dir: string): string[] {
    const features: string[] = [];

    if (readme) {
      // 1. Look for features inside ## Features or ## Capabilities
      const match = readme.match(/##\s+(?:Features|Capabilities|Overview|Modules)([\s\S]*?)(?:\r?\n##\s+(?!#)|\$)/i);
      if (match && match[1]) {
        const section = match[1];

        // 1a. Subheadings (### Feature Title)
        const subHeadings = section.match(/###\s+([^\r\n]+)/g);
        if (subHeadings && subHeadings.length > 0) {
          for (const sh of subHeadings) {
            const clean = sh.replace(/^###\s+/, '')
              .replace(/\([^)]*\)/g, '')
              .replace(/<[^>]*>/g, '')
              .replace(/[*_`]/g, '')
              .trim();
            if (clean.length > 3 && clean.length < 100) {
              features.push(clean);
            }
          }
        }

        // 1b. Bold bullets (- **Feature Title**: Description)
        const boldBullets = section.match(/(?:^|\r?\n)[-*]\s+\*\*([^*:\r\n]+)\*\*/g);
        if (boldBullets && boldBullets.length > 0) {
          for (const b of boldBullets) {
            const clean = b.replace(/[\r\n]/g, '')
              .replace(/^[-*]\s+\*\*/, '')
              .replace(/\*\*$/, '')
              .replace(/<[^>]*>/g, '')
              .trim();
            if (clean.length > 3 && clean.length < 100 && !features.includes(clean)) {
              features.push(clean);
            }
          }
        }
      }

      // 2. If features are still empty, scan top-level ### headings across README
      if (features.length === 0) {
        const allSubHeadings = readme.match(/###\s+([^\r\n]+)/g);
        if (allSubHeadings) {
          for (const sh of allSubHeadings.slice(0, 8)) {
            const clean = sh.replace(/^###\s+/, '')
              .replace(/\([^)]*\)/g, '')
              .replace(/<[^>]*>/g, '')
              .replace(/[*_`]/g, '')
              .trim();
            if (clean.length > 3 && clean.length < 100) {
              features.push(clean);
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

    return Array.from(new Set(features)).slice(0, 8);
  }

  private extractGapsAndTodos(dir: string): string[] {
    const gaps: string[] = [];

    // 1. Check TODOS.md or TODO.md
    for (const file of ['TODOS.md', 'TODO.md', 'todos.md', 'todo.md']) {
      const p = path.join(dir, file);
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf8');
          const matches = content.match(/##\s+TODO-[0-9]+:\s*([^\r\n]+)/gi) ||
                          content.match(/[-*]\s+\[ \]\s+([^\r\n]+)/g);
          if (matches) {
            for (const m of matches) {
              const cleaned = m.replace(/^##\s+TODO-[0-9]+:\s*/i, '')
                               .replace(/^[-*]\s+\[ \]\s+/, '')
                               .replace(/[*_`]/g, '')
                               .trim();
              if (cleaned.length > 5) gaps.push(cleaned);
            }
          }
        } catch {}
      }
    }

    // 2. Check PLAN.md
    const planPath = path.join(dir, 'PLAN.md');
    if (fs.existsSync(planPath)) {
      try {
        const content = fs.readFileSync(planPath, 'utf8');
        const matches = content.match(/[0-9]+\.\s+\*\*([^*]+)\*\*/g);
        if (matches) {
          for (const m of matches) {
            const cleaned = m.replace(/^[0-9]+\.\s+\*\*/, '').replace(/\*\*$/, '').trim();
            if (cleaned.length > 3) gaps.push(`Phase step: ${cleaned}`);
          }
        }
      } catch {}
    }

    // 3. Scan code for TODO comments if gaps still low
    if (gaps.length < 3) {
      const scanDir = (target: string, depth = 0) => {
        if (depth > 2) return;
        try {
          const files = fs.readdirSync(target, { withFileTypes: true });
          for (const f of files) {
            if (f.name.startsWith('.') || f.name === 'node_modules' || f.name === 'dist') continue;
            const full = path.join(target, f.name);
            if (f.isDirectory()) {
              scanDir(full, depth + 1);
            } else if (f.isFile() && /\.(ts|tsx|js|jsx|py|rs|go)$/.test(f.name)) {
              try {
                const content = fs.readFileSync(full, 'utf8');
                const lines = content.split('\n');
                for (const l of lines) {
                  if (/TODO|FIXME/i.test(l)) {
                    const cleaned = l.replace(/^.*(?:TODO|FIXME):?\s*/i, '').trim();
                    if (cleaned && cleaned.length > 5 && cleaned.length < 100) {
                      gaps.push(cleaned);
                      if (gaps.length >= 6) return;
                    }
                  }
                }
              } catch {}
            }
          }
        } catch {}
      };
      scanDir(dir);
    }

    if (gaps.length === 0) {
      gaps.push('Automated end-to-end integration test coverage');
      gaps.push('Comprehensive telemetry and observability infrastructure');
      gaps.push('Production multi-region deployment automation');
    }

    return Array.from(new Set(gaps)).slice(0, 6);
  }

  private inferProductVision(
    name: string,
    type: string,
    domain: ProjectDomain,
    readme: string,
    stack: TechStackInfo,
    pkgInfo: any
  ): ProductVision {
    // 1. Detect clean oneLiner
    let oneLiner = `${name}: A modern ${type} built with ${stack.primaryLanguage}.`;

    if (pkgInfo && pkgInfo.description) {
      oneLiner = pkgInfo.description.replace(/<[^>]*>/g, '').replace(/[*_`]/g, '').trim();
    } else if (readme) {
      const lines = readme.split('\n');
      for (const l of lines) {
        const t = l.trim().replace(/^>\s*/, '').replace(/<[^>]*>/g, '').replace(/[*_`]/g, '').trim();
        if (t && !t.startsWith('#') && !t.startsWith('!') && !t.startsWith('[') && t.length > 25) {
          oneLiner = t.slice(0, 160);
          break;
        }
      }
    }

    // 2. Domain-tailored problem statement & value proposition
    let problemStatement = `Users and teams need an efficient, high-performance way to manage workflows in ${name} without manual friction.`;
    let valueProposition = `Provides an autonomous, reliable platform with first-class ${stack.primaryLanguage} integration and modular architecture.`;

    if (domain === 'electrical-cad') {
      problemStatement = 'Designing compliant low-voltage power distribution systems involves complex, error-prone manual calculations across conflicting international standards (IEC / NEC).';
      valueProposition = 'Automates end-to-end electrical load calculations, per-phase balancing, breaker sizing, and single-line diagram generation with full mathematical provenance.';
    } else if (domain === 'devtools-ai') {
      problemStatement = 'Developers and AI pair programming agents struggle with fragmented prompt management, lack of real competitor insight, and friction in roadmap execution.';
      valueProposition = 'Provides an autonomous developer assistant embedding prompt libraries, MoSCoW roadmaps, and multi-agent workflows directly into IDE sidecars.';
    } else if (domain === 'ecommerce') {
      problemStatement = 'Merchants need a friction-free checkout, rapid catalog management, and unified inventory tracking to reduce cart abandonment.';
      valueProposition = 'Delivers a high-conversion e-commerce storefront with instant checkout and real-time inventory synchronization.';
    } else if (domain === 'fintech') {
      problemStatement = 'Financial teams face audit reconciliation bottlenecks, manual ledger sync, and compliance risks across multiple payment rails.';
      valueProposition = 'Automates end-to-end transaction processing, double-entry ledger audits, and real-time financial reporting.';
    }

    return {
      oneLiner,
      problemStatement,
      valueProposition,
      successMetrics: domain === 'electrical-cad' ? [
        'Calculation accuracy matching benchmarked standards (IEC 60364 & IEC 60909)',
        'Significant time savings per building submittal (> 70% faster)',
        'Zero-error protection coordination and breaker selectivity validation'
      ] : [
        'User workflow completion speed (< 1s execution)',
        'Active daily adoption across developer workflows',
        'Zero-regression test coverage (> 90%)'
      ]
    };
  }

  private inferTargetAudience(
    domain: ProjectDomain,
    type: string,
    stack: TechStackInfo,
    readme: string
  ): TargetAudience {
    if (domain === 'electrical-cad') {
      return {
        primaryPersona: 'Electrical Design Engineers & Building Systems (MEP) Consultants',
        secondaryPersonas: [
          'Lead Electrical Contractors',
          'Facility Compliance Officers',
          'Structural/MEP Project Managers'
        ],
        painPoints: [
          'Manual cable and breaker sizing calculations across conflicting standards (IEC vs NEC)',
          'Complex per-phase load imbalance leading to neutral conductor overheating and oversized transformers',
          'Time-consuming drafting and updating of Single-Line (SLD) and Riser diagrams across revision cycles'
        ],
        goals: [
          'Automate end-to-end electrical design from room-level load estimation to single-line diagrams',
          'Ensure 100% compliance with governing standards (IEC 60364, IEC 60909, NEC/NEMA) with verifiable mathematical traces',
          'Generate submittal-ready calculation schedules and equipment bills of materials in minutes'
        ],
        usageContext: 'Used in engineering offices and design consultancies to design, calculate, and verify low-voltage electrical systems for residential, commercial, and industrial facilities.'
      };
    }

    if (domain === 'devtools-ai') {
      return {
        primaryPersona: 'Full-Stack Software Engineers & AI Pair Programmers',
        secondaryPersonas: [
          'Technical Leads',
          'DevOps / Platform Engineers',
          'Product Developers'
        ],
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
        usageContext: 'Used continuously inside IDEs and terminals while building, testing, and planning features.'
      };
    }

    return {
      primaryPersona: 'Product Developers & System Architects',
      secondaryPersonas: ['Technical Leads', 'Operations Engineers', 'QA Analysts'],
      painPoints: [
        'Complex manual operations and fragmented data workflows',
        'Lack of real-time visibility and automated validation',
        'High latency under scaling workloads'
      ],
      goals: [
        'Streamline core domain workflows with automated processing',
        'Ensure system reliability, auditability, and data integrity',
        'Scale operations with modular cloud architecture'
      ],
      usageContext: `Used in production web and cloud environments to coordinate domain workflows.`
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
