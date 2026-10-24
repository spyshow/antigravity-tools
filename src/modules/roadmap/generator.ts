import { ProjectDiscovery, CompetitorAnalysis, RoadmapDocument, RoadmapPhase, RoadmapFeature } from './types.js';
import { analyzeProjectCodebase, synthesizeMissingFeaturesRoadmap } from '../ai/code-comprehension.js';

export class RoadmapGenerator {
  /**
   * Generates a strategic, phased, MoSCoW-prioritized roadmap linking competitor insights.
   */
  public generateRoadmap(discovery: ProjectDiscovery, competitorAnalysis: CompetitorAnalysis): RoadmapDocument {
    const roadmapId = `roadmap-${Date.now()}`;
    const { projectName, productVision, targetAudience, currentState, workspacePath } = discovery;
    const lowerName = projectName.toLowerCase();
    const isElectricalCad = lowerName === 'procal';
    const isSelf = lowerName === 'antigravity-tools' || lowerName === 'antigravity tools';
    if (!isElectricalCad && !isSelf) {
      if (workspacePath) {
        try {
          const deepAnalysis = analyzeProjectCodebase(workspacePath);
          return synthesizeMissingFeaturesRoadmap(deepAnalysis, discovery, competitorAnalysis);
        } catch {}
      }
      return this.generateDerivedRoadmap(discovery, competitorAnalysis);
    }

    // Define 3 standard strategic phases (matching Aperant's progressive architecture)
    const phases: RoadmapPhase[] = [
      {
        id: 'phase-1',
        name: 'Phase 1: Foundation & Core Experience',
        description: isElectricalCad
          ? 'Core calculation engines, international standard compliance (IEC/NEC), and primary visual diagramming.'
          : 'Core MVP architecture, primary user workflows, and essential reliability foundations.',
        order: 1,
        status: currentState.existingFeatures.length > 2 ? 'in_progress' : 'planned',
        features: ['FEAT-01', 'FEAT-02', 'FEAT-03']
      },
      {
        id: 'phase-2',
        name: 'Phase 2: Competitor Differentiation & Workflow Power',
        description: isElectricalCad
          ? 'Features addressing major competitor flaws (ETAP/Caneco): transparent math traces, dual IEC/NEC toggle, and selective TCC coordination.'
          : 'Features addressing major competitor user pain points and establishing clear market superiority.',
        order: 2,
        status: 'planned',
        features: ['FEAT-04', 'FEAT-05', 'FEAT-06']
      },
      {
        id: 'phase-3',
        name: 'Phase 3: Scale, Ecosystem & Autonomous Intelligence',
        description: isElectricalCad
          ? 'Multi-tenant cloud collaboration, role-based project review, and AI-assisted electrical design validation.'
          : 'Advanced ecosystem integrations, telemetry, automation, and team collaboration.',
        order: 3,
        status: 'planned',
        features: ['FEAT-07', 'FEAT-08']
      }
    ];

    const features: RoadmapFeature[] = isElectricalCad
      ? this.generateElectricalFeatures(projectName, targetAudience.primaryPersona)
      : this.generateDevToolsFeatures(projectName, targetAudience.primaryPersona);

    return {
      id: roadmapId,
      projectName,
      version: '1.0.0',
      vision: `${productVision.oneLiner} — ${productVision.valueProposition}`,
      targetAudience: {
        primary: targetAudience.primaryPersona,
        secondary: targetAudience.secondaryPersonas
      },
      phases,
      features,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedBy: 'Antigravity AI Roadmap Engine (Aperant-Inspired)',
        prioritizationFramework: 'MoSCoW',
        competitorAnalysisUsed: true
      }
    };
  }

  private generateElectricalFeatures(projectName: string, primaryPersona: string): RoadmapFeature[] {
    return [
      {
        id: 'FEAT-01',
        title: 'Multi-Standard Electrical Calculation Engine (IEC 60364 & NEC / NEMA)',
        description: `Harden core calculation engine for cable ampacity, voltage drop, short-circuit fault currents (IEC 60909), and true vector neutral balancing across L1/L2/L3.`,
        rationale: 'Core foundation ensures 100% calculation accuracy and eliminates manual engineering spreadsheet mistakes.',
        priority: 'must',
        complexity: 'high',
        impact: 'high',
        phaseId: 'phase-1',
        dependencies: [],
        status: 'completed',
        acceptanceCriteria: [
          'IEC 60364-5-52 installation method multipliers (A1-G), temperature and grouping derating pass all test suites',
          'Dual-standard toggle seamlessly maps metric cross-sections (1.5 - 300 mm²) to NEC AWG/kcmil trade sizes',
          'Short-circuit transformer impedance calculations reflect exact ANSI/IEEE C57.12 standard impedance curves'
        ],
        userStories: [
          `As an ${primaryPersona}, I want automated standards compliance calculations so that my cable and breaker schedules pass municipal inspections without manual spreadsheet errors.`
        ],
        competitorInsightIds: ['CP-05']
      },
      {
        id: 'FEAT-02',
        title: 'Interactive Single-Line Diagram (SLD) & Dynamic Riser Canvas',
        description: 'Interactive vector diagram designer generating Schematex DSL single-line diagrams and vertical risers directly from project loads.',
        rationale: 'Eliminates CAD drafting bottlenecks by keeping electrical calculations and schematics perfectly synchronized.',
        priority: 'must',
        complexity: 'high',
        impact: 'high',
        phaseId: 'phase-1',
        dependencies: ['FEAT-01'],
        status: 'completed',
        acceptanceCriteria: [
          'Multi-page zoomable SVG canvas with pan, export to high-resolution PNG and vector PDF',
          'Vertical riser diagram automatically bands per-floor demand, current, and voltage drop in warning/danger colors',
          'Synchronized feeder breaker annotations reflect exact catalog equipment choices'
        ],
        userStories: [
          `As an ${primaryPersona}, I want visual SLD and riser schematics generated automatically from my load boards so that I can deliver complete submittal drawings in minutes.`
        ],
        competitorInsightIds: ['CP-08']
      },
      {
        id: 'FEAT-03',
        title: 'Multi-Manufacturer Catalog Matching & Apartment Room Templates',
        description: 'Streamlined floor-level apartment templates with automated A/C density estimation and real ABB / Schneider breaker matching.',
        rationale: 'Accelerates project setup by over 70% compared to legacy manual desktop data entry.',
        priority: 'must',
        complexity: 'medium',
        impact: 'high',
        phaseId: 'phase-1',
        dependencies: ['FEAT-01'],
        status: 'completed',
        acceptanceCriteria: [
          'Room templates auto-calculate connected load and diversified maximum demand',
          'Breaker matcher selects preferred manufacturer models (ABB Emax 2 / Tmax XT, Schneider Masterpact / ComPacT)',
          'Recalculate / Rebalance all floors propagates template adjustments instantly across all circuits'
        ],
        userStories: [
          `As an ${primaryPersona}, I want real equipment part numbers and pre-built apartment templates so that my procurement bill of materials matches exact design specs.`
        ],
        competitorInsightIds: ['CP-03', 'CP-04']
      },
      {
        id: 'FEAT-04',
        title: 'Transparent Math Trace Engine ("Show Your Work" Submittal Proof)',
        description: 'Interactive diagnostic inspection drawer showing symbolic formulas, substituted numerical parameters, and governing standard citations.',
        rationale: 'Key differentiator against black-box competitor software (ETAP / Caneco); builds instant trust with municipal permit authorities.',
        priority: 'should',
        complexity: 'medium',
        impact: 'high',
        phaseId: 'phase-2',
        dependencies: ['FEAT-01'],
        status: 'in_progress',
        acceptanceCriteria: [
          'Clickable calculation cells open trace popover with exact governing citation (e.g. IEC 60364-5-52 §525, NEC 210.19(A))',
          'One-click copy of step-by-step mathematical derivation for permit authority submittals',
          'Safety margin badges (PASS / WARN / FAIL) with standard-framed thresholds'
        ],
        userStories: [
          `As an ${primaryPersona}, I want transparent calculation traces so that I can defend my cable sizing to reviewers and building authorities with mathematical certainty.`
        ],
        competitorInsightIds: ['CP-06']
      },
      {
        id: 'FEAT-05',
        title: 'Time-Current Coordination & Selective Protection Curves (TCC)',
        description: 'Interactive log-log Time-Current Characteristic (TCC) curve viewer with dynamic trip unit profiles and automated selectivity verification.',
        rationale: 'Solves the difficult engineering requirement of verifying downstream breakers clear faults before main breakers trip.',
        priority: 'should',
        complexity: 'high',
        impact: 'high',
        phaseId: 'phase-2',
        dependencies: ['FEAT-01', 'FEAT-03'],
        status: 'in_progress',
        acceptanceCriteria: [
          'Plot electronic and thermal-magnetic trip curves (Ir, Tr, Isd, Tsd, Ii) for upstream and downstream breakers',
          'Automated selectivity verdicts (FULL / PARTIAL / NONE) based on tested manufacturer coordination tables',
          'Cascading / backup protection ratings calculated for breaker family pairings'
        ],
        userStories: [
          `As an ${primaryPersona}, I want interactive TCC coordination curves so that I can eliminate nuisance tripping and ensure upstream breakers isolate faults selectively.`
        ],
        competitorInsightIds: ['CP-04']
      },
      {
        id: 'FEAT-06',
        title: 'Submittal-Ready Engineering Schedules & Multi-Tab Excel Exporter',
        description: 'Export publication-grade panel schedules, cable pull lists, and equipment bills of materials to multi-tab formatted Excel workbooks and watermarked PDFs.',
        rationale: 'Cuts final submittal package compilation time from hours to one click.',
        priority: 'should',
        complexity: 'medium',
        impact: 'medium',
        phaseId: 'phase-2',
        dependencies: ['FEAT-01', 'FEAT-02'],
        status: 'planned',
        acceptanceCriteria: [
          'Excel exporter generates styled multi-tab workbooks (Cover, Load Board, Feeders, Cable Schedule, BOM)',
          'PDF report generator includes project summary, single-line diagrams, and trace appendices',
          'Configurable company branding, project metadata, and revision block stamping'
        ],
        userStories: [
          `As an ${primaryPersona}, I want client-ready Excel and PDF deliverables so that our team doesn't spend hours reformatting raw calculation outputs.`
        ],
        competitorInsightIds: ['CP-01']
      },
      {
        id: 'FEAT-07',
        title: 'Multi-Tenant Team Collaboration & Role-Based Permissions',
        description: 'Enable multiple engineers to collaborate on building projects with real-time locking, revision history snapshots, and change audits.',
        rationale: 'Disrupts single-seat desktop licenses (ETAP dongles) by enabling modern cloud team engineering.',
        priority: 'could',
        complexity: 'high',
        impact: 'high',
        phaseId: 'phase-3',
        dependencies: ['FEAT-01'],
        status: 'planned',
        acceptanceCriteria: [
          'Granular roles (Admin, Lead Engineer, Designer, Viewer) with per-building editing permissions',
          'One-click project revision branching, comparison diffs, and instant rollback',
          'Multi-tenant credit gating and trial project onboarding workflow'
        ],
        userStories: [
          `As an ${primaryPersona}, I want centralized cloud project management so that senior engineers can review and stamp designs produced by junior staff.`
        ],
        competitorInsightIds: ['CP-02']
      },
      {
        id: 'FEAT-08',
        title: 'AI-Assisted Electrical Design Review & Anomaly Detection',
        description: 'Autonomous design review agent that inspects floor loads, detects phase unbalance anomalies, warns of cable derating pitfalls, and suggests optimized transformer sizing.',
        rationale: 'Acts as a senior QA peer reviewer before electrical submittals reach permit authorities.',
        priority: 'could',
        complexity: 'high',
        impact: 'high',
        phaseId: 'phase-3',
        dependencies: ['FEAT-04', 'FEAT-05'],
        status: 'planned',
        acceptanceCriteria: [
          'Automated check for neutral current overload and excessive voltage drop across all feeders',
          'Intelligent load redistribution recommendations to optimize transformer kVA utilization',
          'MCP tools allowing AI pair programming agents to query, update loads, and verify code compliance programmatically'
        ],
        userStories: [
          `As an ${primaryPersona}, I want automated AI design reviews so that edge-case compliance mistakes are flagged before plans are sent to city planning.`
        ],
        competitorInsightIds: ['CP-07']
      }
    ];
  }

  private generateDevToolsFeatures(projectName: string, primaryPersona: string): RoadmapFeature[] {
    return [
      {
        id: 'FEAT-01',
        title: 'Core Engine & Modular Architecture',
        description: `Establish modular extensible plugin system for ${projectName} with strict separation of concerns.`,
        rationale: 'Solid base prevents architectural debt and enables seamless module addition without regressions.',
        priority: 'must',
        complexity: 'medium',
        impact: 'high',
        phaseId: 'phase-1',
        dependencies: [],
        status: 'completed',
        acceptanceCriteria: [
          'All modules implement unified PluginModule lifecycle interface',
          'Automated registry dynamically loads tools and REST routes',
          'Unit test coverage exceeds 80% for core contracts'
        ],
        userStories: [
          `As a ${primaryPersona}, I want a modular architecture so that new tools can be added reliably.`
        ],
        competitorInsightIds: []
      },
      {
        id: 'FEAT-02',
        title: 'Interactive Sidecar & Web Pane UI',
        description: 'Provide an intuitive Sidecar Aux Pane and Web Dashboard for visual interactions and fast execution.',
        rationale: 'Solves the disjointed developer experience common in CLI-only and config-heavy tools.',
        priority: 'must',
        complexity: 'medium',
        impact: 'high',
        phaseId: 'phase-1',
        dependencies: ['FEAT-01'],
        status: 'completed',
        acceptanceCriteria: [
          'Sidecar loads seamlessly inside IDE aux pane with security token handshake',
          'Clean tabbed interface switching between Prompt Library and AI Roadmap',
          'Responsive design with dark mode support matching IDE theme'
        ],
        userStories: [
          `As a ${primaryPersona}, I want a visual sidecar UI so that I don\'t have to remember manual commands.`
        ],
        competitorInsightIds: ['CP-01', 'CP-05']
      },
      {
        id: 'FEAT-03',
        title: '1-Click Prompt Library & Clipboard Injection',
        description: 'Curated and customizable prompt templates with instant clipboard copy and parameter substitution.',
        rationale: 'Eliminates repetitive manual typing and elevates prompt engineering consistency across tasks.',
        priority: 'must',
        complexity: 'low',
        impact: 'high',
        phaseId: 'phase-1',
        dependencies: ['FEAT-01'],
        status: 'completed',
        acceptanceCriteria: [
          'Filter prompts by category, tags, and search query',
          'Dynamic parameter substitution before copying',
          'System clipboard injection completes in < 50ms'
        ],
        userStories: [
          `As a developer, I want to quickly paste battle-tested prompts so that I get higher quality AI responses instantly.`
        ],
        competitorInsightIds: ['CP-02']
      },
      {
        id: 'FEAT-04',
        title: 'Automated Codebase Introspection & Discovery',
        description: 'Deep AST & file scanning that automatically extracts tech stack, personas, vision, and gaps.',
        rationale: 'Removes manual setup friction by letting the AI immediately understand any repo context.',
        priority: 'should',
        complexity: 'medium',
        impact: 'high',
        phaseId: 'phase-2',
        dependencies: ['FEAT-01'],
        status: 'in_progress',
        acceptanceCriteria: [
          'Detects package.json, requirements.txt, pyproject.toml, Cargo.toml, go.mod',
          'Extracts README summaries and TODO/FIXME comments',
          'Outputs structured JSON compliant with Aperant-style discovery schema'
        ],
        userStories: [
          `As a tech lead, I want the tool to analyze our repository so that roadmap features are grounded in our actual stack.`
        ],
        competitorInsightIds: ['CP-03', 'CP-06']
      },
      {
        id: 'FEAT-05',
        title: 'Competitor Pain Point Benchmarking & MoSCoW Prioritization',
        description: 'Direct & indirect competitor intelligence mapping user complaints to strategic feature priorities.',
        rationale: 'Ensures roadmap builds what wins market share rather than random guesses.',
        priority: 'should',
        complexity: 'high',
        impact: 'high',
        phaseId: 'phase-2',
        dependencies: ['FEAT-04'],
        status: 'in_progress',
        acceptanceCriteria: [
          'Maps real user complaints (Reddit, GitHub, Reviews) with severity and frequency',
          'Links feature IDs directly to competitor pain point IDs',
          'Prioritizes features addressing high-severity competitor flaws with MoSCoW tags'
        ],
        userStories: [
          `As a product planner, I want feature suggestions tied to competitor shortcomings so that our product has a clear competitive edge.`
        ],
        competitorInsightIds: ['CP-01', 'CP-03', 'CP-06']
      },
      {
        id: 'FEAT-06',
        title: 'ROADMAP.md One-Click Git Export',
        description: 'Export rich, formatted markdown roadmap with phase progress checkboxes directly into the project root.',
        rationale: 'Keeps roadmap committed alongside code for transparent team-wide tracking.',
        priority: 'should',
        complexity: 'low',
        impact: 'medium',
        phaseId: 'phase-2',
        dependencies: ['FEAT-05'],
        status: 'planned',
        acceptanceCriteria: [
          'Writes ROADMAP.md to project root or downloads via web dashboard',
          'Preserves user story details, acceptance criteria, and competitor links',
          'Interactive checkbox markers matching completion state'
        ],
        userStories: [
          `As a repository owner, I want a committed ROADMAP.md file so that our whole team and contributors stay aligned.`
        ],
        competitorInsightIds: ['CP-06']
      },
      {
        id: 'FEAT-07',
        title: 'MCP Protocol Tool Bridge for Autonomous Execution',
        description: 'Expose all roadmap and prompt operations as Model Context Protocol (MCP) tools for AI agents.',
        rationale: 'Allows AI pair programmers (Antigravity, Claude Code, Cursor) to autonomously plan and execute.',
        priority: 'could',
        complexity: 'medium',
        impact: 'high',
        phaseId: 'phase-3',
        dependencies: ['FEAT-01'],
        status: 'completed',
        acceptanceCriteria: [
          'Full MCP tool registry adhering to JSON-RPC specification',
          'Agent can query roadmap, update feature progress, and request competitor gaps',
          'Graceful error handling and input validation'
        ],
        userStories: [
          `As an autonomous coding agent, I want MCP tools to inspect and update roadmap status during coding tasks.`
        ],
        competitorInsightIds: ['CP-02', 'CP-04']
      },
      {
        id: 'FEAT-08',
        title: 'Multi-Project Analytics & Cloud Sync',
        description: 'Cross-repository workspace management, trend analytics, and team roadmap sharing.',
        rationale: 'Extends utility across multi-repo organizations and team workflows.',
        priority: 'could',
        complexity: 'high',
        impact: 'medium',
        phaseId: 'phase-3',
        dependencies: ['FEAT-06', 'FEAT-07'],
        status: 'planned',
        acceptanceCriteria: [
          'Aggregate progress across multiple workspaces',
          'Export roadmap to JSON/CSV for external PM tools (Linear/Jira)',
          'Optional cloud synchronization with team permission control'
        ],
        userStories: [
          `As an engineering director, I want to see roadmap progress across multiple repositories in a single view.`
        ],
        competitorInsightIds: ['CP-06']
      }
    ];
  }

  /**
   * Offline roadmap derived strictly from the analyzed project: README features become
   * completed foundation items, PLAN/TODO gaps become planned work, and competitor market
   * gaps become differentiators. No content from other projects is reused.
   */
  private generateDerivedRoadmap(discovery: ProjectDiscovery, competitorAnalysis: CompetitorAnalysis): RoadmapDocument {
    const { projectName, productVision, targetAudience, currentState, techStack } = discovery;
    const persona = targetAudience.primaryPersona || 'user';
    const painIds = competitorAnalysis.competitors.flatMap(c => c.painPoints.map(p => p.id));
    let painCursor = 0;
    const nextPain = (): string[] => (painIds.length ? [painIds[painCursor++ % painIds.length]] : []);
    const clean = (s: string) => s.replace(/^Phase step:\s*/i, '').replace(/\s+/g, ' ').trim();

    type Draft = Omit<RoadmapFeature, 'id' | 'dependencies'>;
    const drafts: Draft[] = [];

    for (const feat of currentState.existingFeatures.slice(0, 3)) {
      const t = clean(feat);
      drafts.push({
        title: t,
        description: `Existing capability detected in ${projectName}: ${t}. Harden, document and cover it with tests.`,
        rationale: 'Already implemented according to the project documentation — forms the foundation the rest of the roadmap builds on.',
        priority: 'must', complexity: 'medium', impact: 'high', phaseId: 'phase-1', status: 'completed',
        acceptanceCriteria: [`${t} works end-to-end with the current ${techStack.primaryLanguage} stack`, `Automated tests cover the main ${t} flows`],
        userStories: [`As a ${persona}, I want ${t.toLowerCase()} to work reliably so that I can depend on ${projectName} daily.`],
        competitorInsightIds: []
      });
    }

    for (const gap of currentState.knownGaps.slice(0, 4)) {
      const t = clean(gap);
      drafts.push({
        title: t.length > 90 ? t.slice(0, 87) + '…' : t,
        description: `Planned work found in the project's own plan/TODO notes: ${t}`,
        rationale: 'Explicitly listed by the project as outstanding work.',
        priority: drafts.length < 5 ? 'must' : 'should', complexity: 'medium', impact: 'high', phaseId: 'phase-2', status: 'planned',
        acceptanceCriteria: [`"${t.slice(0, 80)}" is implemented and verified`, 'Documentation and tests updated accordingly'],
        userStories: [`As a ${persona}, I want ${t.slice(0, 80).toLowerCase()} so that the product covers my workflow completely.`],
        competitorInsightIds: nextPain()
      });
    }

    for (const gap of competitorAnalysis.marketGaps.slice(0, 3)) {
      drafts.push({
        title: gap.suggestedFeature || gap.description.slice(0, 80),
        description: gap.description,
        rationale: `Market gap affecting ${gap.affectedCompetitors.join(', ') || 'competitors'} — an opportunity for ${projectName} to differentiate.`,
        priority: 'could', complexity: 'high', impact: gap.opportunitySize, phaseId: 'phase-3', status: 'idea',
        acceptanceCriteria: [`${gap.suggestedFeature || 'Feature'} shipped behind a feature flag`, 'Validated with at least one real user workflow'],
        userStories: [`As a ${persona}, I want ${(gap.suggestedFeature || 'this capability').toLowerCase()} so that I don't need a competing tool.`],
        competitorInsightIds: nextPain()
      });
    }

    const engineering: Array<[string, string]> = [
      ['Automated test suite & CI pipeline', `Add automated tests and a CI workflow for the ${techStack.primaryLanguage} codebase${techStack.frameworks.length ? ` (${techStack.frameworks.join(', ')})` : ''}.`],
      ['Error handling, logging & observability', 'Consistent error handling, structured logs and basic runtime metrics across the application.'],
      ['Packaging, deployment & onboarding docs', `One-command setup and deployment for ${projectName}, with a step-by-step getting-started guide.`]
    ];
    for (const [title, description] of engineering) {
      if (drafts.length >= 9) break;
      drafts.push({
        title, description,
        rationale: 'Engineering foundation required to scale the project safely.',
        priority: 'should', complexity: 'medium', impact: 'medium', phaseId: 'phase-2', status: 'planned',
        acceptanceCriteria: [`${title} implemented for the main code paths`, 'Documented in the README'],
        userStories: [`As a maintainer of ${projectName}, I want ${title.toLowerCase()} so that releases are predictable.`],
        competitorInsightIds: nextPain()
      });
    }

    while (drafts.length < 8) {
      const n = drafts.length + 1;
      drafts.push({
        title: `User feedback iteration ${n}`,
        description: `Collect feedback from ${persona}s and prioritize the top requested improvement.`,
        rationale: 'Keeps the roadmap anchored to real user needs.',
        priority: 'could', complexity: 'low', impact: 'medium', phaseId: 'phase-3', status: 'idea',
        acceptanceCriteria: ['Feedback collected from at least 3 users', 'Top request scoped and scheduled'],
        userStories: [`As a ${persona}, I want my feedback acted on so that ${projectName} fits my workflow.`],
        competitorInsightIds: nextPain()
      });
    }

    const features: RoadmapFeature[] = drafts.map((d, i) => ({
      ...d,
      id: `FEAT-${String(i + 1).padStart(2, '0')}`,
      dependencies: d.phaseId === 'phase-1' || i === 0 ? [] : ['FEAT-01']
    }));
    if (!features.some(f => f.priority === 'must')) features[0].priority = 'must';
    if (!features.some(f => f.priority === 'should')) features[features.length - 1].priority = 'should';

    const phaseMeta: Array<[string, string, string]> = [
      ['phase-1', 'Phase 1: Current Foundation', `Capabilities ${projectName} already provides, hardened for production.`],
      ['phase-2', 'Phase 2: Planned Work & Engineering Quality', "Outstanding items from the project's own plan plus engineering foundations."],
      ['phase-3', 'Phase 3: Differentiation & Growth', 'Opportunities from competitor gaps and user feedback.']
    ];
    const phases: RoadmapPhase[] = phaseMeta.map(([id, name, description], i) => {
      const ids = features.filter(f => f.phaseId === id).map(f => f.id);
      const done = features.filter(f => f.phaseId === id && f.status === 'completed').length;
      return {
        id, name, description, order: i + 1,
        status: ids.length && done === ids.length ? 'completed' : done > 0 ? 'in_progress' : 'planned',
        features: ids
      };
    });

    return {
      id: `roadmap-${Date.now()}`,
      projectName,
      version: '1.0.0',
      vision: `${productVision.oneLiner}${productVision.valueProposition ? ' — ' + productVision.valueProposition : ''}`,
      targetAudience: { primary: targetAudience.primaryPersona, secondary: targetAudience.secondaryPersonas },
      phases,
      features,
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        generatedBy: 'Offline heuristic (derived from README/PLAN/TODOs — add a Gemini key for code-aware AI roadmap)',
        prioritizationFramework: 'MoSCoW',
        competitorAnalysisUsed: competitorAnalysis.competitors.length > 0
      }
    };
  }

  /**
   * Renders the roadmap as a clean, publication-ready GitHub Flavored Markdown document.
   */
  public exportToMarkdown(roadmap: RoadmapDocument, competitorAnalysis?: CompetitorAnalysis): string {
    const lines: string[] = [];

    lines.push(`# 🗺️ Strategic Product Roadmap: ${roadmap.projectName}`);
    lines.push(``);
    lines.push(`> **Vision:** ${roadmap.vision}`);
    lines.push(``);
    lines.push(`**Generated:** ${new Date(roadmap.metadata.createdAt).toLocaleDateString()} | **Framework:** ${roadmap.metadata.prioritizationFramework} | **Version:** ${roadmap.version}`);
    lines.push(``);

    // Target Audience
    lines.push(`## 🎯 Target Audience`);
    lines.push(`- **Primary Persona:** ${roadmap.targetAudience.primary}`);
    if (roadmap.targetAudience.secondary.length > 0) {
      lines.push(`- **Secondary Personas:** ${roadmap.targetAudience.secondary.join(', ')}`);
    }
    lines.push(``);

    // Competitor Intelligence Overview if present
    if (competitorAnalysis && competitorAnalysis.competitors.length > 0) {
      lines.push(`## 🥊 Competitor Intelligence & Market Gaps`);
      lines.push(``);
      lines.push(`| Competitor | Market Position | Key Flaw / User Complaint | Addressed By |`);
      lines.push(`| :--- | :--- | :--- | :--- |`);

      for (const comp of competitorAnalysis.competitors) {
        const topFlaw = comp.painPoints[0]?.description || 'Feature stagnation';
        const addressingFeatures = roadmap.features
          .filter(f => f.competitorInsightIds?.some(id => comp.painPoints.some(p => p.id === id)))
          .map(f => `\`${f.id}\``)
          .join(', ') || 'Phase 2 Differentiation';

        lines.push(`| **${comp.name}** | ${comp.marketPosition} | ${topFlaw.slice(0, 75)}... | ${addressingFeatures} |`);
      }
      lines.push(``);

      if (competitorAnalysis.marketGaps.length > 0) {
        lines.push(`### 🚀 Identified Market Gaps`);
        for (const gap of competitorAnalysis.marketGaps) {
          lines.push(`- **[${gap.opportunitySize.toUpperCase()} OPPORTUNITY]** ${gap.description} *(Feature: ${gap.suggestedFeature})*`);
        }
        lines.push(``);
      }
    }

    // MoSCoW Prioritization Summary
    const mustCount = roadmap.features.filter(f => f.priority === 'must').length;
    const shouldCount = roadmap.features.filter(f => f.priority === 'should').length;
    const couldCount = roadmap.features.filter(f => f.priority === 'could').length;
    const wontCount = roadmap.features.filter(f => f.priority === 'wont').length;

    lines.push(`## 📊 MoSCoW Feature Distribution`);
    lines.push(`- **Must Have (MVP Critical):** ${mustCount} features`);
    lines.push(`- **Should Have (Competitive Parity):** ${shouldCount} features`);
    lines.push(`- **Could Have (Market Differentiators):** ${couldCount} features`);
    lines.push(`- **Won't Have (Post-Launch Scope):** ${wontCount} features`);
    lines.push(``);

    // Detailed Phases
    lines.push(`## 📅 Phased Execution Plan`);
    lines.push(``);

    for (const phase of roadmap.phases) {
      const phaseFeatures = roadmap.features.filter(f => f.phaseId === phase.id);
      const completedCount = phaseFeatures.filter(f => f.status === 'completed').length;
      const progressPercent = phaseFeatures.length > 0 ? Math.round((completedCount / phaseFeatures.length) * 100) : 0;

      lines.push(`### ${phase.name} (${progressPercent}% complete)`);
      lines.push(`*${phase.description}*`);
      lines.push(``);

      for (const feat of phaseFeatures) {
        const check = feat.status === 'completed' ? '[x]' : '[ ]';
        const priorityBadge = feat.priority.toUpperCase();
        lines.push(`#### ${check} [${feat.id}] ${feat.title} \`(${priorityBadge})\``);
        lines.push(`${feat.description}`);
        lines.push(``);
        lines.push(`- **Status:** \`${feat.status}\` | **Complexity:** \`${feat.complexity}\` | **Impact:** \`${feat.impact}\``);
        if (feat.competitorInsightIds && feat.competitorInsightIds.length > 0) {
          lines.push(`- **Addresses Competitor Pain Points:** ${feat.competitorInsightIds.map(id => `\`${id}\``).join(', ')}`);
        }
        lines.push(`- **Rationale:** ${feat.rationale}`);
        lines.push(`- **User Story:**`);
        for (const story of feat.userStories) {
          lines.push(`  - *"${story}"*`);
        }
        lines.push(`- **Acceptance Criteria:**`);
        for (const crit of feat.acceptanceCriteria) {
          lines.push(`  - [ ] ${crit}`);
        }
        lines.push(``);
      }
    }

    lines.push(`---`);
    lines.push(`*Generated autonomously by Antigravity Tools — Built with MoSCoW & Competitor Analysis Architecture.*`);

    return lines.join('\n');
  }
}
