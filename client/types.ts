export interface FounderDNA {
  communicationPatterns: {
    score: number;
    analysis: string;
  };
  teamDynamics: {
    score: number;
    analysis: string;
  };
  stressTest: {
    scenario: string;
    predictedResponse: string;
  };
}

export interface NewsItem {
  headline: string;
  source: string;
  impactScore: number;
  summary: string;
}

export interface CompetitorAlert {
  competitor: string;
  alert: string;
  threatLevel: number;
}

export interface MarketPulse {
  news: NewsItem[];
  competitorAlerts: CompetitorAlert[];
}

export interface CommitteePersona {
  persona: 'Devils Advocate' | 'Growth Investor' | 'Conservative Investor' | 'Impact Investor';
  keyArgument: string;
  concerns: string[];
  strengths: string[];
}

export interface InvestmentMemoryInsight {
  pattern: string;
  pastExample: string;
  relevance: string;
}

export interface PortfolioSynergy {
  company: string;
  synergyOpportunity: string;
  potentialImpact: string;
}

export interface FinancialMetrics {
  health: {
    mrr: Array<{ period: string; value: number; growth_rate?: number }>;
    arr?: number;
    burn_rate: Array<{ period: string; value: number; growth_rate?: number }>;
    gross_margin: Array<{ period: string; value: number; growth_rate?: number }>;
    runway_months?: number;
    cash_balance?: number;
  };
  cash_flow: {
    operating_activities: Array<{ period: string; value: number; growth_rate?: number }>;
    investing_activities: Array<{ period: string; value: number; growth_rate?: number }>;
    financing_activities: Array<{ period: string; value: number; growth_rate?: number }>;
    free_cash_flow: Array<{ period: string; value: number; growth_rate?: number }>;
  };
  unit_economics: {
    cac?: number;
    ltv?: number;
    payback_period?: number;
    ltv_to_cac_ratio?: number;
    churn_rate?: number;
    arpa?: number;
  };
  benchmarks?: Array<{
    metric: string;
    startup_value: number;
    industry_avg: number;
    percentile: number;
    period: string;
  }>;
  last_updated: string;
  notes?: string;
  confidence_scores?: {
    overall_confidence: number;
    data_completeness: number;
    data_consistency: number;
  };
  anomalies?: string[];
}

export interface DealAnalysis {
  documentId?: string; // Added for tracking the document ID
  overallVerdict: {
    recommendation: 'PASS' | 'CONSIDER' | 'INVEST';
    confidenceScore: number;
    summary: string;
  };
  founderDna: FounderDNA;
  marketPulse: MarketPulse;
  investmentCommittee: CommitteePersona[];
  investmentMemory: InvestmentMemoryInsight[];
  portfolioSynergies: PortfolioSynergy[];
  financialMetrics?: FinancialMetrics; // Added for financial metrics
}
