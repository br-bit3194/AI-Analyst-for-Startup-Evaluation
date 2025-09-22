export interface AgentAnalysis {
  success: boolean;
  data: Record<string, any>;
  error?: string;
  confidence?: number;
}

export interface Verdict {
  recommendation: 'PASS' | 'CONSIDER' | 'INVEST';
  confidence: number;
  confidenceLabel: string;
  reasons: string[];
  timestamp: string;
}

export interface AnalysisSummary {
  keyInsights: string[];
  strengths: string[];
  concerns: string[];
  recommendations: string[];
}

export interface WebsiteAnalysis {
  url: string;
  status: 'processed' | 'not_processed' | 'error';
  error?: string;
  domain?: string;
  contentLength?: number;
  contentPreview?: string;
  storeId?: string;
}

export interface PitchAnalysis {
  content: string;
  length: number;
  word_count: number;
  [key: string]: any;
}

export interface CombinedAnalysis {
  summary: string;
  has_website_data: boolean;
  [key: string]: any;
}

export interface AnalysisResponse {
  // Standard fields
  analysisId: string;
  status: 'processing' | 'completed' | 'error';
  startTime?: string;
  durationSeconds?: number;
  message?: string;
  timestamp?: string;
  
  // Analysis components
  pitch_analysis: PitchAnalysis;
  website_analysis?: WebsiteAnalysis | null;
  combined_analysis: CombinedAnalysis;
  
  // Legacy fields (for backward compatibility)
  agents?: Record<string, AgentAnalysis>;
  finalVerdict?: Verdict;
  summary?: AnalysisSummary;
  result?: any;
  [key: string]: any;
}

export interface CommitteeMember {
  name: string;
  role: string;
  personality: string;
  analysis: string;
  vote: 'INVEST' | 'CONSIDER' | 'PASS';
  confidence: number;
  reasoning: string;
}

export interface InvestmentCommitteeResponse {
  deal_pitch: string;
  committee_members: CommitteeMember[];
  final_verdict: 'INVEST' | 'CONSIDER' | 'PASS';
  consensus_score: number;
  majority_vote: 'INVEST' | 'CONSIDER' | 'PASS';
  dissenting_opinions: string[];
  key_debate_points: string[];
  timestamp?: string;
}
