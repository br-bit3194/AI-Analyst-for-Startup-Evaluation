declare module '@/services/api' {
  import { AxiosInstance } from 'axios';
  
  export interface AnalysisRequest {
    pitch: string;
    website_url?: string;
    additional_context?: string;
  }

  export interface CommitteeMember {
    name: string;
    role: string;
    personality: string;
    vote: 'STRONG_INVEST' | 'CONSIDER' | 'HIGH_RISK' | 'PASS';
    confidence: number;
    analysis: string;
    reasoning: string;
  }

  export interface AnalysisResult {
    verdict: string;
    confidence: number;
    summary: string;
    rationale: string;
    committee_analysis?: {
      members: CommitteeMember[];
      final_verdict: string;
      consensus_score: number;
      key_debate_points: string[];
    };
  }

  export interface AnalysisResponse {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: AnalysisResult;
    created_at: string;
    updated_at: string;
  }

  export interface StatusResponse {
    status: string;
  }

  export const analyzeStartup: (data: AnalysisRequest) => Promise<AnalysisResponse>;
  export const getAnalysis: (id: string) => Promise<AnalysisResponse>;
  export const getAnalysisStatus: (id: string) => Promise<StatusResponse>;
  export const generateCommitteeDebate: (pitch: string) => Promise<AnalysisResponse>;
  
  const api: AxiosInstance;
  export default api;
}
