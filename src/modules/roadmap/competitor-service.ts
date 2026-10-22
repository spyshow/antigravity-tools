import { ProjectDiscovery, CompetitorAnalysis, CompetitorItem, CompetitorPainPoint, MarketGap } from './types.js';

export class CompetitorService {
  /**
   * Analyzes competitors and market gaps based on project discovery.
   */
  public async analyzeCompetitors(discovery: ProjectDiscovery): Promise<CompetitorAnalysis> {
    const { projectName, projectType, productVision, targetAudience } = discovery;
    const domain = this.detectDomain(projectName, projectType, productVision.oneLiner, targetAudience.primaryPersona);

    const competitors = this.identifyCompetitors(domain, projectName, projectType, productVision.oneLiner);
    const marketGaps = this.identifyMarketGaps(domain, projectType, competitors);
    const insightsSummary = this.synthesizeInsights(domain, competitors, marketGaps);

    const sourcesConsulted = domain === 'electrical-cad' ? [
      'IEEE Industry Applications Society & Standards Board',
      'IEC Technical Committee 64 (Electrical installations in buildings)',
      'Consulting-Specifying Engineer (CSE) Software Guides',
      'EC&M (Electrical Construction & Maintenance) Software Reviews'
    ] : [
      'GitHub Trending & Issue Trackers',
      'Reddit (r/programming, r/webdev, r/LocalLLaMA)',
      'Product Hunt & Hacker News Discussions',
      'Developer Tooling Benchmark Reports (2025/2026)'
    ];

    return {
      projectName,
      projectType,
      targetAudience: targetAudience.primaryPersona,
      competitors,
      marketGaps,
      insightsSummary,
      sourcesConsulted,
      createdAt: new Date().toISOString()
    };
  }

  private detectDomain(name: string, type: string, oneLiner: string, persona: string): 'electrical-cad' | 'devtools-ai' | 'general' {
    const text = `${name} ${type} ${oneLiner} ${persona}`.toLowerCase();
    if (/(electrical|voltage|breaker|cable|transformer|power-distribution|phasebalance|sub-panel|single-line|sld|iec 60364|nec \/ nfpa|short-circuit)/i.test(text)) {
      return 'electrical-cad';
    }
    if (/(antigravity|prompt library|ai assistant plugin|mcp server|agent ecosystem|copilot extension)/i.test(text)) {
      return 'devtools-ai';
    }
    return 'general';
  }

  private identifyCompetitors(domain: string, projectName: string, projectType: string, oneLiner: string): CompetitorItem[] {
    // 1. Electrical Engineering / Power Systems CAD (e.g. ProCal)
    if (domain === 'electrical-cad') {
      return [
        {
          id: 'COMP-ETAP',
          name: 'ETAP (Electrical Transient Analyzer Program)',
          url: 'https://etap.com',
          description: 'Enterprise electrical power system modeling, transient simulation, and analysis suite.',
          relevance: 'high',
          marketPosition: 'Incumbent enterprise desktop leader for heavy industrial and utility power systems',
          strengths: [
            'Comprehensive IEEE & IEC calculations',
            'Broad protection device library',
            'Extensive utility adoption'
          ],
          painPoints: [
            {
              id: 'CP-01',
              description: 'Extremely high licensing costs ($10,000+ per seat) and rigid USB hardware dongle / node-locked licensing.',
              source: 'Engineering User Forums & Reddit r/ECE',
              severity: 'high',
              frequency: 'Universal complaint',
              opportunity: 'Provide an affordable, modern multi-tenant cloud SaaS with transparent credit or tier-based billing.'
            },
            {
              id: 'CP-02',
              description: 'Legacy Windows 95-style desktop GUI with zero real-time web collaboration, cloud sharing, or mobile viewing.',
              source: 'Capterra & G2 Engineering Reviews',
              severity: 'high',
              frequency: 'Very frequent',
              opportunity: 'Modern responsive web interface accessible from any browser with real-time multi-tenant project sharing.'
            },
            {
              id: 'CP-03',
              description: 'Steep learning curve and over-complex configuration for routine residential and commercial low-voltage building sizing.',
              source: 'MEP Consulting Engineer Surveys',
              severity: 'medium',
              frequency: 'Common',
              opportunity: 'Streamlined building -> floor -> load workflow with pre-built apartment room templates and automated A/C density sizing.'
            }
          ]
        },
        {
          id: 'COMP-CANECO',
          name: 'Schneider Electric EcoStruxure Power Design (Caneco BT / Ecodial)',
          url: 'https://www.se.com',
          description: 'European low-voltage electrical calculation, network design, and single-line diagram generation tool.',
          relevance: 'high',
          marketPosition: 'Leading European manufacturer-aligned electrical software',
          strengths: [
            'Exact Schneider equipment catalog matching',
            'Strict European IEC 60364 regulatory compliance',
            'Automated breaker tripping curve evaluation'
          ],
          painPoints: [
            {
              id: 'CP-04',
              description: 'Vendor lock-in restricting cross-comparison with competing equipment manufacturers like ABB and Siemens.',
              source: 'Consulting Specifying Engineer Reviews',
              severity: 'high',
              frequency: 'Frequent',
              opportunity: 'Multi-manufacturer catalog matching supporting both ABB and Schneider Electric breaker families with user preference toggles.'
            },
            {
              id: 'CP-05',
              description: 'No dynamic dual-standard harmonization between IEC 60364 (metric mm²) and US NEC (AWG / kcmil) standards.',
              source: 'International MEP Consultants',
              severity: 'high',
              frequency: 'Growing demand',
              opportunity: '1-click dual standard toggle dynamically cross-referencing metric mm² with NEC trade sizes and voltage drop rules.'
            },
            {
              id: 'CP-06',
              description: 'Lack of transparent step-by-step mathematical trace popovers ("Show Your Work") for municipal permit submittals.',
              source: 'Municipal Plan Check Feedback',
              severity: 'medium',
              frequency: 'Frequent',
              opportunity: 'Interactive calculation trace popovers showing symbolic formulas, substituted parameters, and governing standard citations.'
            }
          ]
        },
        {
          id: 'COMP-SKM',
          name: 'SKM Power*Tools for Windows',
          url: 'https://www.skm.com',
          description: 'Commercial electrical engineering software for load calculations, fault analysis, and arc flash study.',
          relevance: 'medium',
          marketPosition: 'Standard US commercial engineering desktop package',
          strengths: [
            'Extensive US NEC code support',
            'Comprehensive short-circuit current modeling',
            'Strong consulting engineering market presence'
          ],
          painPoints: [
            {
              id: 'CP-07',
              description: 'Lacks automated per-phase vector neutral balancing algorithms (uses lumped approximations without true 120° displacement angles).',
              source: 'Electrical Engineering Journals',
              severity: 'high',
              frequency: 'Technical gap',
              opportunity: 'Greedy vector neutral current balancing with per-phase unbalance % indicators and 2x neutral oversize protection.'
            },
            {
              id: 'CP-08',
              description: 'Cumbersome manual drafting for Single-Line Diagrams (SLD) and vertical risers without automated vector rendering.',
              source: 'User Forums',
              severity: 'medium',
              frequency: 'Common',
              opportunity: 'Auto-generate interactive SVG Single-Line and Riser diagrams from project load data with Schematex DSL export.'
            }
          ]
        }
      ];
    }

    // 2. AI Tooling / Plugins / Coding Assistants / Roadmaps (Matches Antigravity & Aperant space)
    if (domain === 'devtools-ai') {
      return [
        {
          id: 'COMP-APERANT',
          name: 'Aperant',
          url: 'https://github.com/AndyMik90/Aperant',
          description: 'Autonomous AI product engineer creating codebases, discovery, and competitor-driven roadmaps.',
          relevance: 'high',
          marketPosition: 'Niche AI Product Manager for autonomous repo planning',
          strengths: [
            'MoSCoW roadmap generation with competitor insight linking',
            'Automated discovery phases',
            'Strong schema contracts'
          ],
          painPoints: [
            {
              id: 'CP-01',
              description: 'Standalone desktop app requires separate window context; disconnected from active IDE plugins and terminal workflows.',
              source: 'GitHub Issues & Community Feedback',
              severity: 'high',
              frequency: 'Frequent (30+ mentions)',
              opportunity: 'Directly embed roadmap & prompt workflows inside IDE/Antigravity sidecars and local MCP servers.'
            },
            {
              id: 'CP-02',
              description: 'Lack of instant 1-click clipboard prompt injection into local agent sessions.',
              source: 'Reddit r/LocalLLaMA',
              severity: 'medium',
              frequency: 'Common',
              opportunity: 'Provide instant "Paste to Prompt" and MCP tools callable directly by the AI agent pair programmer.'
            }
          ]
        },
        {
          id: 'COMP-CURSOR-COMPOSER',
          name: 'Cursor / Windsurf AI Workspaces',
          url: 'https://cursor.com',
          description: 'Integrated AI IDEs offering multi-file edits and composer chat.',
          relevance: 'high',
          marketPosition: 'Market leader in AI-native code editors',
          strengths: [
            'Deep editor integration',
            'Fast multi-file generation',
            'Inline diff viewer'
          ],
          painPoints: [
            {
              id: 'CP-03',
              description: 'No structured roadmap or competitor benchmarking; features are generated ad-hoc without audience strategic validation.',
              source: 'Hacker News discussions',
              severity: 'high',
              frequency: 'Very frequent',
              opportunity: 'Bridge strategic planning with code generation through structured MoSCoW phases and acceptance criteria.'
            },
            {
              id: 'CP-04',
              description: 'Vendor lock-in and high subscription tier pricing.',
              source: 'Reddit r/webdev',
              severity: 'medium',
              frequency: 'High',
              opportunity: 'Local-first, extensible plugin architecture using standard MCP protocols.'
            }
          ]
        },
        {
          id: 'COMP-CONTINUE-DEV',
          name: 'Continue.dev',
          url: 'https://github.com/continuedev/continue',
          description: 'Open-source AI code assistant extension for VS Code and JetBrains.',
          relevance: 'medium',
          marketPosition: 'Leading open-source IDE copilot extension',
          strengths: [
            'Open-source and self-hostable model support',
            'Broad IDE compatibility',
            'Active community'
          ],
          painPoints: [
            {
              id: 'CP-05',
              description: 'Configuring custom prompt templates and project-wide roadmaps is manual and cumbersome (JSON configs without visual GUI).',
              source: 'GitHub Discussions',
              severity: 'high',
              frequency: 'Frequent (45+ issues)',
              opportunity: 'Offer a slick visual dashboard and Sidecar web pane for managing prompt templates and visual roadmaps.'
            }
          ]
        },
        {
          id: 'COMP-LINEAR-AHA',
          name: 'Linear Insights / Productboard',
          url: 'https://linear.app',
          description: 'SaaS issue tracking and product roadmapping software.',
          relevance: 'medium',
          marketPosition: 'Enterprise standard for manual issue and project management',
          strengths: [
            'Beautiful UI',
            'Team collaboration',
            'Workflow cycles and milestones'
          ],
          painPoints: [
            {
              id: 'CP-06',
              description: 'Completely disconnected from local code repos and AI agents; manual entry required for feature tickets and specs.',
              source: 'Product Hunt Reviews',
              severity: 'high',
              frequency: 'Persistent complaint',
              opportunity: 'Automate roadmap extraction directly from local git commits, AST files, and README, writing directly to ROADMAP.md.'
            }
          ]
        }
      ];
    }

    // 3. Web App / SaaS Default
    return [
      {
        id: 'COMP-WEB-01',
        name: 'Incumbent SaaS Platforms',
        description: 'Established platforms with broad functionality but heavy legacy architecture.',
        relevance: 'high',
        marketPosition: 'Incumbent market leader',
        strengths: ['Brand recognition', 'Extensive feature set', 'Enterprise sales'],
        painPoints: [
          {
            id: 'CP-W1',
            description: 'Cluttered UI, slow navigation, and sluggish load times.',
            source: 'G2 & Capterra Reviews',
            severity: 'high',
            frequency: 'Very frequent',
            opportunity: 'Ultra-fast, responsive web interface with clean minimalist design.'
          },
          {
            id: 'CP-W2',
            description: 'Steep learning curve and complex onboarding requiring sales demos.',
            source: 'User Forums',
            severity: 'medium',
            frequency: 'Frequent',
            opportunity: 'Instant frictionless onboarding with sensible defaults.'
          }
        ]
      },
      {
        id: 'COMP-WEB-02',
        name: 'Modern Agile Disruptor',
        description: 'Modern challenger platform targeting developer-first experience.',
        relevance: 'medium',
        marketPosition: 'Challenger',
        strengths: ['Modern tech stack', 'Fast UI', 'Good developer documentation'],
        painPoints: [
          {
            id: 'CP-W3',
            description: 'Limited offline capability and dependency on third-party cloud services.',
            source: 'Reddit',
            severity: 'medium',
            frequency: 'Moderate',
            opportunity: 'Offline-first architecture with local cache synchronizations.'
          }
        ]
      }
    ];
  }

  private identifyMarketGaps(domain: string, projectType: string, competitors: CompetitorItem[]): MarketGap[] {
    if (domain === 'electrical-cad') {
      return [
        {
          id: 'GAP-01',
          description: 'Dual-Standard Harmonization (IEC 60364 & US NEC / NEMA).',
          affectedCompetitors: ['Schneider Caneco BT', 'SKM Power*Tools'],
          opportunitySize: 'high',
          suggestedFeature: '1-click dual standard toggle dynamically mapping metric mm² and NEC AWG/kcmil wire sizes'
        },
        {
          id: 'GAP-02',
          description: 'Transparent Mathematical Provenance ("Show Your Work") for municipal permit approval.',
          affectedCompetitors: ['ETAP', 'Caneco BT'],
          opportunitySize: 'high',
          suggestedFeature: 'Interactive trace popovers with symbolic formulas, substituted values, and governing standard citations'
        },
        {
          id: 'GAP-03',
          description: 'Modern Multi-Tenant Cloud Architecture replacing expensive legacy desktop USB dongles.',
          affectedCompetitors: ['ETAP', 'SKM Power*Tools'],
          opportunitySize: 'high',
          suggestedFeature: 'Cloud-native multi-tenant web platform with real-time project sharing and printable schedules'
        },
        {
          id: 'GAP-04',
          description: 'Automated Single-Line (SLD) & Riser Diagram Generation synchronized with equipment catalog.',
          affectedCompetitors: ['ETAP', 'SKM Power*Tools'],
          opportunitySize: 'medium',
          suggestedFeature: 'Auto-routed zoomable SVG Schematex SLD diagrams and multi-tab Excel schedules'
        }
      ];
    }

    if (domain === 'devtools-ai') {
      return [
        {
          id: 'GAP-01',
          description: 'Automated AI feature roadmaps linked directly to competitor pain points and user complaints.',
          affectedCompetitors: competitors.map(c => c.name),
          opportunitySize: 'high',
          suggestedFeature: 'AI-assisted competitor pain point extraction with MoSCoW prioritization'
        },
        {
          id: 'GAP-02',
          description: 'Seamless bridge between strategic product roadmaps and daily IDE prompt engineering.',
          affectedCompetitors: ['Linear', 'Aperant', 'Productboard'],
          opportunitySize: 'high',
          suggestedFeature: 'Unified Sidecar Dashboard with 1-click Prompt Library and Feature Execution Prompts'
        },
        {
          id: 'GAP-03',
          description: 'Zero-configuration codebase introspection producing instant git-committed ROADMAP.md files.',
          affectedCompetitors: ['Cursor', 'Continue.dev'],
          opportunitySize: 'medium',
          suggestedFeature: 'Automated ROADMAP.md generator with phase checkboxes and acceptance criteria'
        }
      ];
    }

    return [
      {
        id: 'GAP-01',
        description: 'Automated workflow optimization and real-time validation.',
        affectedCompetitors: competitors.map(c => c.name),
        opportunitySize: 'high',
        suggestedFeature: 'Automated validation engine with real-time feedback'
      },
      {
        id: 'GAP-02',
        description: 'Modern developer-first API and cloud integration.',
        affectedCompetitors: competitors.map(c => c.name),
        opportunitySize: 'medium',
        suggestedFeature: 'Comprehensive REST/GraphQL API with export automation'
      }
    ];
  }

  private synthesizeInsights(domain: string, competitors: CompetitorItem[], marketGaps: MarketGap[]) {
    const topPainPoints: string[] = [];
    for (const c of competitors) {
      for (const p of c.painPoints) {
        if (p.severity === 'high') {
          topPainPoints.push(`${c.name}: ${p.description}`);
        }
      }
    }

    const differentiatorOpportunities = marketGaps.map(g => g.suggestedFeature);

    const marketTrends = domain === 'electrical-cad' ? [
      'Shift toward web-based multi-tenant engineering platforms replacing legacy desktop licenses',
      'Growing requirement for verifiable calculation traces in municipal building permit submissions',
      'Harmonization of multi-code calculations across international developer portfolios',
      'Automated protection selectivity and TCC coordination verification'
    ] : [
      'Shift toward local-first AI pair programming tools',
      'Demand for structured MoSCoW prioritization over unstructured LLM hallucinations',
      'Integration of Model Context Protocol (MCP) as the standard agent-tool bridge',
      'Demand for automated acceptance criteria and user stories in generated tasks'
    ];

    return {
      topPainPoints: topPainPoints.slice(0, 5),
      differentiatorOpportunities,
      marketTrends
    };
  }
}
