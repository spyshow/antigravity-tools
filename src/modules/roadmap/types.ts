export interface TechStackInfo {
  primaryLanguage: string;
  frameworks: string[];
  keyDependencies: string[];
  tools: string[];
}

export interface TargetAudience {
  primaryPersona: string;
  secondaryPersonas: string[];
  painPoints: string[];
  goals: string[];
  usageContext: string;
}

export interface ProductVision {
  oneLiner: string;
  problemStatement: string;
  valueProposition: string;
  successMetrics: string[];
}

export interface CurrentStateAssessment {
  maturity: 'idea' | 'prototype' | 'mvp' | 'growth' | 'mature';
  existingFeatures: string[];
  knownGaps: string[];
  technicalDebt: string[];
}

export interface ProjectDiscovery {
  projectName: string;
  projectType: 'web-app' | 'mobile-app' | 'cli' | 'library' | 'api' | 'desktop-app' | 'plugin' | 'other';
  domain?: 'electrical-cad' | 'devtools-ai' | 'ecommerce' | 'fintech' | 'healthcare' | 'software-platform';
  workspacePath: string;
  techStack: TechStackInfo;
  targetAudience: TargetAudience;
  productVision: ProductVision;
  currentState: CurrentStateAssessment;
  createdAt: string;
}

export interface CompetitorPainPoint {
  id: string;
  description: string;
  source: string;
  severity: 'high' | 'medium' | 'low';
  frequency: string;
  opportunity: string;
}

export interface CompetitorItem {
  id: string;
  name: string;
  url?: string;
  description: string;
  relevance: 'high' | 'medium' | 'low';
  strengths: string[];
  painPoints: CompetitorPainPoint[];
  marketPosition: string;
}

export interface MarketGap {
  id: string;
  description: string;
  affectedCompetitors: string[];
  opportunitySize: 'high' | 'medium' | 'low';
  suggestedFeature: string;
}

export interface CompetitorAnalysis {
  projectName: string;
  projectType: string;
  targetAudience: string;
  competitors: CompetitorItem[];
  marketGaps: MarketGap[];
  insightsSummary: {
    topPainPoints: string[];
    differentiatorOpportunities: string[];
    marketTrends: string[];
  };
  sourcesConsulted: string[];
  createdAt: string;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  featureIds: string[];
  status: 'planned' | 'in_progress' | 'completed';
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'planned' | 'in_progress' | 'completed';
  features: string[];
  milestones?: RoadmapMilestone[];
}

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  rationale: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  complexity: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  phaseId: string;
  dependencies: string[];
  status: 'idea' | 'planned' | 'in_progress' | 'completed';
  acceptanceCriteria: string[];
  userStories: string[];
  competitorInsightIds?: string[];
}

export interface RoadmapDocument {
  id: string;
  projectName: string;
  version: string;
  vision: string;
  targetAudience: {
    primary: string;
    secondary: string[];
  };
  phases: RoadmapPhase[];
  features: RoadmapFeature[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    generatedBy: string;
    prioritizationFramework: 'MoSCoW';
    competitorAnalysisUsed: boolean;
  };
}
