import {
  IdeationReport,
  CodeImprovementIdea,
  PerformanceOptimization,
  SecurityVulnerability,
  CodeQualityItem,
  EffortLevel
} from '../ideation/types.js';
import { ProjectContext } from './context-builder.js';
import { generateJson } from './gemini-client.js';

export const IDEATION_SYSTEM_PROMPT = `You are a principal engineer performing a code review and ideation session on ONE specific project.
You are given the project's docs, manifests, file tree and real source code.

Hard rules:
- Every finding must be grounded in the provided code. Reference real file paths that appear in the snapshot.
- Do not produce generic boilerplate advice that would apply to any project; be specific to this codebase,
  its domain and its actual implementation choices.
- Security findings must cite a concrete CWE and explain where in the code the risk is.
- Respond with a single JSON object only, matching the requested schema exactly.`;

export const IDEATION_JSON_SCHEMA = `{
  "projectName": string,
  "codeImprovements": [{ "title": string, "description": string, "rationale": string, "builds_upon": string[],
    "estimated_effort": "trivial"|"small"|"medium"|"large"|"complex", "affected_files": string[],
    "existing_patterns": string[], "implementation_approach": string }],
  "performanceOptimizations": [{ "title": string, "description": string, "rationale": string,
    "category": "bundle_size"|"runtime"|"memory"|"network"|"io", "impact": "high"|"medium"|"low",
    "affectedAreas": string[], "currentMetric": string, "expectedImprovement": string, "implementation": string,
    "tradeoffs": string, "estimatedEffort": "trivial"|"small"|"medium"|"large"|"complex" }],
  "securityVulnerabilities": [{ "title": string, "description": string, "rationale": string,
    "category": "auth"|"authorization"|"input_validation"|"data_protection"|"dependencies"|"secrets",
    "severity": "critical"|"high"|"medium"|"low", "affectedFiles": string[], "vulnerability": string,
    "currentRisk": string, "remediation": string, "references": string[], "compliance": string[] }],
  "codeQualityIssues": [{ "title": string, "description": string, "rationale": string,
    "category": "large_files"|"duplication"|"anti_pattern"|"test_coverage"|"typing",
    "severity": "critical"|"major"|"minor", "affectedFiles": string[], "currentState": string,
    "proposedChange": string, "codeExample": string, "bestPractice": string,
    "estimatedEffort": "trivial"|"small"|"medium"|"large"|"complex", "breakingChange": boolean }]
}`;

export function buildIdeationUserPrompt(ctx: ProjectContext): string {
  return `Review the project below and return JSON with this exact schema:
${IDEATION_JSON_SCHEMA}

Requirements:
- 4 to 6 codeImprovements: new feature ideas / improvements that build on what the code already does.
- 3 to 5 performanceOptimizations, 3 to 6 securityVulnerabilities, 3 to 5 codeQualityIssues.
- Use file paths exactly as they appear in the FILE TREE.

PROJECT SNAPSHOT:
${ctx.text}`;
}

const arr = (v: any): string[] => (Array.isArray(v) ? v.map(x => String(x)).filter(Boolean) : []);
const str = (v: any, d = ''): string => (typeof v === 'string' && v.trim() ? v.trim() : d);
const oneOf = <T extends string>(v: any, allowed: readonly T[], d: T): T => (allowed.includes(v) ? v : d);
const EFFORT = ['trivial', 'small', 'medium', 'large', 'complex'] as const;
const pad = (n: number) => String(n).padStart(3, '0');

export async function generateAIIdeation(ctx: ProjectContext, modelLabel = 'Gemini'): Promise<Omit<IdeationReport, 'healthScores'>> {
  const payload = await generateJson(IDEATION_SYSTEM_PROMPT, buildIdeationUserPrompt(ctx));
  return normalizeIdeationPayload(payload, ctx, `Antigravity AI (${modelLabel}, code-aware)`);
}

export function normalizeIdeationPayload(
  payload: any,
  ctx: Pick<ProjectContext, 'projectName' | 'workspacePath' | 'totalSourceFiles' | 'totalSourceLines' | 'fileTree'>,
  generatedBy: string
): Omit<IdeationReport, 'healthScores'> {
  const now = new Date().toISOString();

  const codeImprovements: CodeImprovementIdea[] = (payload?.codeImprovements || []).map((x: any, i: number) => ({
    id: `ci-${pad(i + 1)}`,
    type: 'code_improvements',
    title: str(x?.title, `Improvement ${i + 1}`),
    description: str(x?.description),
    rationale: str(x?.rationale),
    builds_upon: arr(x?.builds_upon),
    estimated_effort: oneOf(x?.estimated_effort, EFFORT, 'medium') as EffortLevel,
    affected_files: arr(x?.affected_files),
    existing_patterns: arr(x?.existing_patterns),
    implementation_approach: str(x?.implementation_approach),
    status: 'draft',
    created_at: now
  }));

  const performanceOptimizations: PerformanceOptimization[] = (payload?.performanceOptimizations || []).map((x: any, i: number) => ({
    id: `perf-${pad(i + 1)}`,
    type: 'performance_optimizations',
    title: str(x?.title, `Optimization ${i + 1}`),
    description: str(x?.description),
    rationale: str(x?.rationale),
    category: oneOf(x?.category, ['bundle_size', 'runtime', 'memory', 'network', 'io'] as const, 'runtime'),
    impact: oneOf(x?.impact, ['high', 'medium', 'low'] as const, 'medium'),
    affectedAreas: arr(x?.affectedAreas),
    currentMetric: str(x?.currentMetric),
    expectedImprovement: str(x?.expectedImprovement),
    implementation: str(x?.implementation),
    tradeoffs: str(x?.tradeoffs) || undefined,
    estimatedEffort: oneOf(x?.estimatedEffort, EFFORT, 'medium') as EffortLevel,
    status: 'draft'
  }));

  const securityVulnerabilities: SecurityVulnerability[] = (payload?.securityVulnerabilities || []).map((x: any, i: number) => ({
    id: `sec-${pad(i + 1)}`,
    type: 'security_hardening',
    title: str(x?.title, `Security finding ${i + 1}`),
    description: str(x?.description),
    rationale: str(x?.rationale),
    category: oneOf(x?.category, ['auth', 'authorization', 'input_validation', 'data_protection', 'dependencies', 'secrets'] as const, 'input_validation'),
    severity: oneOf(x?.severity, ['critical', 'high', 'medium', 'low'] as const, 'medium'),
    affectedFiles: arr(x?.affectedFiles),
    vulnerability: str(x?.vulnerability),
    currentRisk: str(x?.currentRisk),
    remediation: str(x?.remediation),
    references: arr(x?.references),
    compliance: arr(x?.compliance),
    status: 'draft'
  }));

  const codeQualityIssues: CodeQualityItem[] = (payload?.codeQualityIssues || []).map((x: any, i: number) => ({
    id: `cq-${pad(i + 1)}`,
    type: 'code_quality',
    title: str(x?.title, `Quality issue ${i + 1}`),
    description: str(x?.description),
    rationale: str(x?.rationale),
    category: oneOf(x?.category, ['large_files', 'duplication', 'anti_pattern', 'test_coverage', 'typing'] as const, 'anti_pattern'),
    severity: oneOf(x?.severity, ['critical', 'major', 'minor'] as const, 'minor'),
    affectedFiles: arr(x?.affectedFiles),
    currentState: str(x?.currentState),
    proposedChange: str(x?.proposedChange),
    codeExample: str(x?.codeExample) || undefined,
    bestPractice: str(x?.bestPractice),
    estimatedEffort: oneOf(x?.estimatedEffort, EFFORT, 'medium') as EffortLevel,
    breakingChange: !!x?.breakingChange,
    status: 'draft'
  }));

  const total = codeImprovements.length + performanceOptimizations.length + securityVulnerabilities.length + codeQualityIssues.length;
  if (total === 0) throw new Error('AI response did not contain any ideation findings.');

  const topDirs = Array.from(new Set(ctx.fileTree.filter(f => f.endsWith('/') && !f.slice(0, -1).includes('/')))).slice(0, 8);

  return {
    projectName: str(payload?.projectName, ctx.projectName),
    workspacePath: ctx.workspacePath,
    codeImprovements,
    performanceOptimizations,
    securityVulnerabilities,
    codeQualityIssues,
    metadata: {
      filesScanned: ctx.totalSourceFiles,
      linesOfCodeEstimated: ctx.totalSourceLines,
      generatedAt: now,
      scannedPaths: topDirs.length ? topDirs : ['./'],
      generatedBy
    }
  };
}
