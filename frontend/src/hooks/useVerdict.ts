import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import * as api from '@/services/api';
import { AnalysisResponse } from '@/services/api';

export interface Verdict {
  recommendation: 'INVEST' | 'CONSIDER' | 'PASS' | 'STRONG_INVEST' | 'HIGH_RISK';
  confidence: number;
  summary: string;
  rationale: string;
  committee_analysis?: {
    members: Array<{
      name: string;
      role: string;
      personality: string;
      vote: 'STRONG_INVEST' | 'CONSIDER' | 'HIGH_RISK' | 'PASS';
      confidence: number;
      analysis: string;
      reasoning: string;
    }>;
    final_verdict: string;
    consensus_score: number;
    key_debate_points: string[];
  };
}

export const useVerdict = (analysisId?: string) => {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVerdict = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.getAnalysis(id);
      
      if (response.status === 'completed' && response.result) {
        const { verdict, confidence, summary, rationale, committee_analysis } = response.result;
        setVerdict({
          recommendation: verdict as 'INVEST' | 'CONSIDER' | 'PASS' | 'STRONG_INVEST' | 'HIGH_RISK',
          confidence,
          summary,
          rationale,
          committee_analysis: committee_analysis ? {
            ...committee_analysis,
            final_verdict: committee_analysis.final_verdict || verdict,
            members: committee_analysis.members || [],
            key_debate_points: committee_analysis.key_debate_points || []
          } : undefined
        });
      } else if (response.status === 'failed') {
        throw new Error('Analysis failed to complete');
      } else {
        // If still processing, poll again after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchVerdict(id);
      }
    } catch (err) {
      console.error('Error fetching verdict:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch verdict'));
      message.error('Failed to load investment verdict');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (analysisId) {
      fetchVerdict(analysisId);
    }
  }, [analysisId, fetchVerdict]);

  const generateVerdict = useCallback(async (analysisData: { pitch: string; website_url?: string; additional_context?: string }) => {
    setLoading(true);
    setError(null);
    
    try {
      // Start the analysis
      const response = await api.analyzeStartup({
        pitch: analysisData.pitch,
        website_url: analysisData.website_url,
        additional_context: analysisData.additional_context
      });
      
      // Start polling for results
      const pollForResults = async (id: string): Promise<AnalysisResponse> => {
        const status = await api.getAnalysisStatus(id);
        
        if (status.status === 'completed') {
          return api.getAnalysis(id);
        } else if (status.status === 'failed') {
          throw new Error('Analysis failed');
        } else {
          // Wait and poll again
          await new Promise(resolve => setTimeout(resolve, 2000));
          return pollForResults(id);
        }
      };
      
      // Get the final results
      const finalResults = await pollForResults(response.id);
      
      if (finalResults.status === 'completed' && finalResults.result) {
        const { verdict, confidence, summary, rationale } = finalResults.result;
        const result = {
          recommendation: verdict as 'INVEST' | 'CONSIDER' | 'PASS',
          confidence,
          summary,
          rationale
        };
        
        setVerdict(result);
        return result;
      } else {
        throw new Error('Analysis did not complete successfully');
      }
    } catch (err) {
      console.error('Error generating verdict:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate verdict'));
      message.error('Failed to generate investment verdict');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    verdict,
    loading,
    error,
    generateVerdict,
    refetch: () => analysisId ? fetchVerdict(analysisId) : Promise.resolve()
  };
};
