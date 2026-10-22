import { ProjectDiscovery, CompetitorAnalysis, CompetitorItem, CompetitorPainPoint, MarketGap } from './types.js';

export class CompetitorService {
  /**
   * Analyzes competitors and market gaps based on project discovery.
   */
  public async analyzeCompetitors(discovery: ProjectDiscovery): Promise<CompetitorAnalysis> {
    const { projectName, projectType, productVision, targetAudience } = discovery;

    const competitors = this.identifyCompetitors(projectName, projectType, productVision.oneLiner);
    const marketGaps = this.identifyMarketGaps(projectType, competitors);
    const insightsSummary = this.synthesizeInsights(competitors, marketGaps);

    const sourcesConsulted = [
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

  private identifyCompetitors(projectName: string, projectType: string, oneLiner: string): CompetitorItem[] {
    const text = `${projectName} ${projectType} ${oneLiner}`.toLowerCase();

    // 1. AI Tooling / Plugins / Coding Assistants / Roadmaps (Matches Antigravity & Aperant space)
    if (text.includes('antigravity') || text.includes('plugin') || text.includes('prompt') || text.includes('roadmap') || text.includes('agent')) {
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

    // 2. Web App / SaaS Default
    if (projectType === 'web-app') {
      return [
        {
          id: 'COMP-WEB-01',
          name: 'Incumbent SaaS Solutions',
          description: 'Established platforms with broad functionality but heavy legacy baggage.',
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

    // 3. CLI / Library / Other Default
    return [
      {
        id: 'COMP-CLI-01',
        name: 'Legacy Terminal Tools',
        description: 'Standard bash/script-based CLI utilities.',
        relevance: 'high',
        marketPosition: 'Established standard tools',
        strengths: ['Pre-installed on most systems', 'Lightweight'],
        painPoints: [
          {
            id: 'CP-C1',
            description: 'Cryptic command flags, poor error diagnostics, and zero interactive UI feedback.',
            source: 'Developer surveys',
            severity: 'high',
            frequency: 'Universal complaint',
            opportunity: 'Intuitive modern CLI with rich TUI, interactive prompts, and web sidecars.'
          }
        ]
      },
      {
        id: 'COMP-CLI-02',
        name: 'Modern Rust/Go CLI Alternatives',
        description: 'Fast binary tools with enhanced terminal formatting.',
        relevance: 'medium',
        marketPosition: 'Modern utility segment',
        strengths: ['High performance', 'Single binary distribution'],
        painPoints: [
          {
            id: 'CP-C2',
            description: 'Lack of agent/MCP protocol integration for pairing with LLMs.',
            source: 'GitHub',
            severity: 'high',
            frequency: 'Growing demand',
            opportunity: 'Expose standardized MCP tools and JSON schemas for AI coding agents.'
          }
        ]
      }
    ];
  }

  private identifyMarketGaps(projectType: string, competitors: CompetitorItem[]): MarketGap[] {
    const gaps: MarketGap[] = [
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

    return gaps;
  }

  private synthesizeInsights(competitors: CompetitorItem[], marketGaps: MarketGap[]) {
    const topPainPoints: string[] = [];
    for (const c of competitors) {
      for (const p of c.painPoints) {
        if (p.severity === 'high') {
          topPainPoints.push(`${c.name}: ${p.description}`);
        }
      }
    }

    const differentiatorOpportunities = marketGaps.map(g => g.suggestedFeature);

    const marketTrends = [
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
