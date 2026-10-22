export type EffortLevel = 'trivial' | 'small' | 'medium' | 'large' | 'complex';
export type SeverityLevel = 'critical' | 'high' | 'major' | 'medium' | 'minor' | 'low';
export type ImpactLevel = 'high' | 'medium' | 'low';

export interface CodeImprovementIdea {
  id: string; // e.g. "ci-001"
  type: 'code_improvements';
  title: string;
  description: string;
  rationale: string;
  builds_upon: string[];
  estimated_effort: EffortLevel;
  affected_files: string[];
  existing_patterns: string[];
  implementation_approach: string;
  status: 'draft' | 'approved' | 'promoted_to_roadmap' | 'rejected';
  created_at: string;
}

export interface PerformanceOptimization {
  id: string; // e.g. "perf-001"
  type: 'performance_optimizations';
  title: string;
  description: string;
  rationale: string;
  category: 'bundle_size' | 'runtime' | 'memory' | 'network' | 'io';
  impact: ImpactLevel;
  affectedAreas: string[];
  currentMetric: string;
  expectedImprovement: string;
  implementation: string;
  tradeoffs?: string;
  estimatedEffort: EffortLevel;
  status: 'draft' | 'approved' | 'promoted_to_roadmap' | 'resolved';
}

export interface SecurityVulnerability {
  id: string; // e.g. "sec-001"
  type: 'security_hardening';
  title: string;
  description: string;
  rationale: string;
  category: 'auth' | 'authorization' | 'input_validation' | 'data_protection' | 'dependencies' | 'secrets';
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedFiles: string[];
  vulnerability: string; // e.g. "CWE-79: Cross-Site Scripting (XSS)", "CWE-798: Hardcoded Credentials"
  currentRisk: string;
  remediation: string;
  references: string[];
  compliance: string[];
  status: 'draft' | 'investigating' | 'resolved' | 'promoted_to_roadmap';
}

export interface CodeQualityItem {
  id: string; // e.g. "cq-001"
  type: 'code_quality';
  title: string;
  description: string;
  rationale: string;
  category: 'large_files' | 'duplication' | 'anti_pattern' | 'test_coverage' | 'typing';
  severity: 'critical' | 'major' | 'minor';
  affectedFiles: string[];
  currentState: string;
  proposedChange: string;
  codeExample?: string;
  bestPractice: string;
  metrics?: {
    lineCount?: number;
    duplicateLines?: number;
    testCoverage?: number;
  };
  estimatedEffort: EffortLevel;
  breakingChange: boolean;
  status: 'draft' | 'in_progress' | 'resolved' | 'promoted_to_roadmap';
}

export interface HealthScores {
  securityScore: number;     // 0 - 100
  performanceScore: number;  // 0 - 100
  qualityScore: number;      // 0 - 100
  innovationIndex: number;   // 0 - 100
}

export interface IdeationReport {
  projectName: string;
  workspacePath: string;
  healthScores: HealthScores;
  codeImprovements: CodeImprovementIdea[];
  performanceOptimizations: PerformanceOptimization[];
  securityVulnerabilities: SecurityVulnerability[];
  codeQualityIssues: CodeQualityItem[];
  metadata: {
    filesScanned: number;
    linesOfCodeEstimated: number;
    generatedAt: string;
    scannedPaths: string[];
  };
}
