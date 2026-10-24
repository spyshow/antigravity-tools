import {
  ProjectDiscovery,
  CompetitorAnalysis,
  RoadmapDocument,
  RoadmapFeature,
  RoadmapPhase
} from '../roadmap/types.js';
import { ProjectContext } from './context-builder.js';
import { generateJson } from './gemini-client.js';

export const ROADMAP_SYSTEM_PROMPT = `You are a senior product strategist and staff software architect.
You are given a snapshot of ONE specific software project (docs, manifests, file tree and real source code).
Your job: understand what THIS project actually does from its code, then produce a project discovery,
a competitor analysis and a phased MoSCoW product roadmap for THIS project only.

Hard rules:
- Base every statement on evidence from the provided files. Never invent features the code does not have when
  describing the current state, and never reuse content from other products.
- Features marked "completed" must correspond to functionality that clearly exists in the code.
- Planned features must be concrete next steps for this codebase (reference real modules / files where useful).
- Competitors must be real products in the same market as this project.
- Respond with a single JSON object only, matching the requested schema exactly.`;

export const ROADMAP_JSON_SCHEMA = `{
  "discovery": {
    "projectName": string,
    "projectType": "web-app"|"mobile-app"|"cli"|"library"|"api"|"desktop-app"|"plugin"|"other",
    "oneLiner": string,
    "problemStatement": string,
    "valueProposition": string,
    "successMetrics": string[],
    "primaryPersona": string,
    "secondaryPersonas": string[],
    "painPoints": string[],
    "goals": string[],
    "usageContext": string,
    "maturity": "idea"|"prototype"|"mvp"|"growth"|"mature",
    "existingFeatures": string[],
    "knownGaps": string[],
    "technicalDebt": string[],
    "primaryLanguage": string,
    "frameworks": string[],
    "keyDependencies": string[],
    "tools": string[]
  },
  "competitors": {
    "competitors": [{ "id": "comp-1", "name": string, "url": string, "description": string,
      "relevance": "high"|"medium"|"low", "strengths": string[], "marketPosition": string,
      "painPoints": [{ "id": "CP-01", "description": string, "source": string,
        "severity": "high"|"medium"|"low", "frequency": string, "opportunity": string }] }],
    "marketGaps": [{ "id": "GAP-01", "description": string, "affectedCompetitors": string[],
      "opportunitySize": "high"|"medium"|"low", "suggestedFeature": string }],
    "insightsSummary": { "topPainPoints": string[], "differentiatorOpportunities": string[], "marketTrends": string[] }
  },
  "roadmap": {
    "vision": string,
    "phases": [{ "id": "phase-1", "name": string, "description": string, "status": "planned"|"in_progress"|"completed" }],
    "features": [{ "id": "FEAT-01", "title": string, "description": string, "rationale": string,
      "priority": "must"|"should"|"could"|"wont", "complexity": "low"|"medium"|"high", "impact": "low"|"medium"|"high",
      "phaseId": string, "dependencies": string[], "status": "idea"|"planned"|"in_progress"|"completed",
      "acceptanceCriteria": string[], "userStories": string[], "competitorInsightIds": string[] }]
  }
}`;

export function buildRoadmapUserPrompt(ctx: ProjectContext): string {
  return `Analyze the project below and return JSON with this exact schema:
${ROADMAP_JSON_SCHEMA}

Requirements:
- 3 phases (foundation/current core, differentiation, scale) named for THIS project's domain.
- 8 to 12 features total, each with 2-4 acceptance criteria and at least one user story.
- Painpoint IDs must be unique across competitors (CP-01, CP-02, ...). Link features to them via competitorInsightIds.
- 3 to 5 competitors.

PROJECT SNAPSHOT:
${ctx.text}`;
}

export interface AIRoadmapResult {
  discovery: ProjectDiscovery;
  competitors: CompetitorAnalysis;
  roadmap: RoadmapDocument;
}

export async function generateAIRoadmap(ctx: ProjectContext, modelLabel = 'Gemini'): Promise<AIRoadmapResult> {
  const payload = await generateJson(ROADMAP_SYSTEM_PROMPT, buildRoadmapUserPrompt(ctx));
  return normalizeRoadmapPayload(payload, ctx.workspacePath, ctx.projectName, `Antigravity AI (${modelLabel}, code-aware)`);
}

const arr = (v: any): string[] => (Array.isArray(v) ? v.map(x => String(x)).filter(Boolean) : []);
const str = (v: any, d = ''): string => (typeof v === 'string' && v.trim() ? v.trim() : d);
const oneOf = <T extends string>(v: any, allowed: readonly T[], d: T): T => (allowed.includes(v) ? v : d);

export function normalizeRoadmapPayload(
  payload: any,
  workspacePath: string,
  fallbackName: string,
  generatedBy: string
): AIRoadmapResult {
  const now = new Date().toISOString();
  const d = payload?.discovery || {};
  const c = payload?.competitors || {};
  const r = payload?.roadmap || {};
  const projectName = str(d.projectName, fallbackName);

  const discovery: ProjectDiscovery = {
    projectName,
    projectType: oneOf(d.projectType, ['web-app', 'mobile-app', 'cli', 'library', 'api', 'desktop-app', 'plugin', 'other'] as const, 'other'),
    domain: 'software-platform',
    workspacePath,
    techStack: {
      primaryLanguage: str(d.primaryLanguage, 'Unknown'),
      frameworks: arr(d.frameworks),
      keyDependencies: arr(d.keyDependencies),
      tools: arr(d.tools)
    },
    targetAudience: {
      primaryPersona: str(d.primaryPersona, 'Primary users'),
      secondaryPersonas: arr(d.secondaryPersonas),
      painPoints: arr(d.painPoints),
      goals: arr(d.goals),
      usageContext: str(d.usageContext)
    },
    productVision: {
      oneLiner: str(d.oneLiner, projectName),
      problemStatement: str(d.problemStatement),
      valueProposition: str(d.valueProposition),
      successMetrics: arr(d.successMetrics)
    },
    currentState: {
      maturity: oneOf(d.maturity, ['idea', 'prototype', 'mvp', 'growth', 'mature'] as const, 'mvp'),
      existingFeatures: arr(d.existingFeatures),
      knownGaps: arr(d.knownGaps),
      technicalDebt: arr(d.technicalDebt)
    },
    createdAt: now
  };

  const competitors: CompetitorAnalysis = {
    projectName,
    projectType: discovery.projectType,
    targetAudience: discovery.targetAudience.primaryPersona,
    competitors: (Array.isArray(c.competitors) ? c.competitors : []).map((x: any, i: number) => ({
      id: str(x?.id, `comp-${i + 1}`),
      name: str(x?.name, `Competitor ${i + 1}`),
      url: str(x?.url) || undefined,
      description: str(x?.description),
      relevance: oneOf(x?.relevance, ['high', 'medium', 'low'] as const, 'medium'),
      strengths: arr(x?.strengths),
      marketPosition: str(x?.marketPosition),
      painPoints: (Array.isArray(x?.painPoints) ? x.painPoints : []).map((p: any, j: number) => ({
        id: str(p?.id, `CP-${i + 1}${j + 1}`),
        description: str(p?.description),
        source: str(p?.source, 'AI market analysis'),
        severity: oneOf(p?.severity, ['high', 'medium', 'low'] as const, 'medium'),
        frequency: str(p?.frequency, 'common'),
        opportunity: str(p?.opportunity)
      }))
    })),
    marketGaps: (Array.isArray(c.marketGaps) ? c.marketGaps : []).map((g: any, i: number) => ({
      id: str(g?.id, `GAP-0${i + 1}`),
      description: str(g?.description),
      affectedCompetitors: arr(g?.affectedCompetitors),
      opportunitySize: oneOf(g?.opportunitySize, ['high', 'medium', 'low'] as const, 'medium'),
      suggestedFeature: str(g?.suggestedFeature)
    })),
    insightsSummary: {
      topPainPoints: arr(c.insightsSummary?.topPainPoints),
      differentiatorOpportunities: arr(c.insightsSummary?.differentiatorOpportunities),
      marketTrends: arr(c.insightsSummary?.marketTrends)
    },
    sourcesConsulted: ['Project source code & documentation', 'AI market knowledge'],
    createdAt: now
  };

  const features: RoadmapFeature[] = (Array.isArray(r.features) ? r.features : []).map((f: any, i: number) => ({
    id: str(f?.id, `FEAT-${String(i + 1).padStart(2, '0')}`),
    title: str(f?.title, `Feature ${i + 1}`),
    description: str(f?.description),
    rationale: str(f?.rationale),
    priority: oneOf(f?.priority, ['must', 'should', 'could', 'wont'] as const, 'should'),
    complexity: oneOf(f?.complexity, ['low', 'medium', 'high'] as const, 'medium'),
    impact: oneOf(f?.impact, ['low', 'medium', 'high'] as const, 'medium'),
    phaseId: str(f?.phaseId, 'phase-1'),
    dependencies: arr(f?.dependencies),
    status: oneOf(f?.status, ['idea', 'planned', 'in_progress', 'completed'] as const, 'planned'),
    acceptanceCriteria: arr(f?.acceptanceCriteria),
    userStories: arr(f?.userStories),
    competitorInsightIds: arr(f?.competitorInsightIds)
  }));

  let phases: RoadmapPhase[] = (Array.isArray(r.phases) ? r.phases : []).map((p: any, i: number) => ({
    id: str(p?.id, `phase-${i + 1}`),
    name: str(p?.name, `Phase ${i + 1}`),
    description: str(p?.description),
    order: i + 1,
    status: oneOf(p?.status, ['planned', 'in_progress', 'completed'] as const, 'planned'),
    features: []
  }));
  if (phases.length === 0) {
    phases = [1, 2, 3].map(n => ({ id: `phase-${n}`, name: `Phase ${n}`, description: '', order: n, status: 'planned' as const, features: [] }));
  }
  const phaseIds = new Set(phases.map(p => p.id));
  for (const f of features) {
    if (!phaseIds.has(f.phaseId)) f.phaseId = phases[0].id;
  }
  for (const p of phases) p.features = features.filter(f => f.phaseId === p.id).map(f => f.id);

  const roadmap: RoadmapDocument = {
    id: `roadmap-${Date.now()}`,
    projectName,
    version: '1.0.0',
    vision: str(r.vision, `${discovery.productVision.oneLiner} — ${discovery.productVision.valueProposition}`),
    targetAudience: {
      primary: discovery.targetAudience.primaryPersona,
      secondary: discovery.targetAudience.secondaryPersonas
    },
    phases,
    features,
    metadata: {
      createdAt: now,
      updatedAt: now,
      generatedBy,
      prioritizationFramework: 'MoSCoW',
      competitorAnalysisUsed: competitors.competitors.length > 0
    }
  };

  if (features.length === 0) throw new Error('AI response did not contain any roadmap features.');
  return { discovery, competitors, roadmap };
}
