import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import api from '@/services/api';

interface Verdict {
  recommendation: 'INVEST' | 'CONSIDER' | 'PASS';
  confidence: number;
  summary: string;
  rationale: string;
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
      // In a real implementation, you would fetch from your API
      // const response = await api.get(`/verdict/${id}`);
      // setVerdict(response.data);
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate different verdicts based on analysisId hash
      const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const verdictType = ['INVEST', 'CONSIDER', 'PASS'][hash % 3];
      const confidence = 60 + (hash % 40); // 60-99
      
      const mockVerdicts = {
        INVEST: {
          recommendation: 'INVEST',
          confidence,
          summary: 'Strong investment opportunity with experienced team and growing market.',
          rationale: 'The startup demonstrates a strong product-market fit with a clear value proposition. The founding team has relevant industry experience and a track record of success.'
        },
        CONSIDER: {
          recommendation: 'CONSIDER',
          confidence,
          summary: 'Promising opportunity with some areas requiring further due diligence.',
          rationale: 'The company shows potential but has some risks that need to be carefully evaluated. Further investigation into the competitive landscape and unit economics is recommended.'
        },
        PASS: {
          recommendation: 'PASS',
          confidence,
          summary: 'Significant concerns that currently outweigh the potential benefits.',
          rationale: 'The analysis indicates several red flags including unclear market differentiation and concerns about the financial projections. The current risk/reward profile does not justify investment.'
        }
      };
      
      setVerdict(mockVerdicts[verdictType as keyof typeof mockVerdicts]);
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

  const generateVerdict = useCallback(async (analysisData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would post to your API
      // const response = await api.post('/verdict/generate', analysisData);
      // setVerdict(response.data);
      
      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate different verdicts based on analysis data hash
      const dataStr = JSON.stringify(analysisData);
      const hash = dataStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const verdictType = ['INVEST', 'CONSIDER', 'PASS'][hash % 3];
      const confidence = 60 + (hash % 40); // 60-99
      
      const mockVerdicts = {
        INVEST: {
          recommendation: 'INVEST',
          confidence,
          summary: 'Strong investment opportunity with experienced team and growing market.',
          rationale: 'The startup demonstrates a strong product-market fit with a clear value proposition. The founding team has relevant industry experience and a track record of success.'
        },
        CONSIDER: {
          recommendation: 'CONSIDER',
          confidence,
          summary: 'Promising opportunity with some areas requiring further due diligence.',
          rationale: 'The company shows potential but has some risks that need to be carefully evaluated. Further investigation into the competitive landscape and unit economics is recommended.'
        },
        PASS: {
          recommendation: 'PASS',
          confidence,
          summary: 'Significant concerns that currently outweigh the potential benefits.',
          rationale: 'The analysis indicates several red flags including unclear market differentiation and concerns about the financial projections. The current risk/reward profile does not justify investment.'
        }
      };
      
      const result = mockVerdicts[verdictType as keyof typeof mockVerdicts];
      setVerdict(result);
      return result;
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
