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

export interface DealAnalysis {
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
}
