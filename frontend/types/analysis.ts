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

export interface AnalysisResponse {
  analysisId: string;  // Changed from analysis_id to analysisId
  status: 'processing' | 'completed' | 'error';
  startTime?: string;  // Changed from start_time
  durationSeconds?: number;  // Changed from duration_seconds
  agents: Record<string, AgentAnalysis>;
  finalVerdict?: Verdict;  // Changed from final_verdict
  summary?: AnalysisSummary;
  message?: string;
  result?: any;
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
