import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { message } from 'antd';

const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://ai-analyst-for-startup-evaluation.onrender.com/api',
  timeout: 30000, // 30 seconds
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error) => {
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';
    message.error(errorMessage);
    return Promise.reject(error);
  }
);

export interface AnalysisRequest {
  pitch: string;
  website_url?: string;
  additional_context?: string;
}

export interface AnalysisResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    verdict: string;
    confidence: number;
    summary: string;
    rationale: string;
    committee_analysis?: {
      members: Array<{
        name: string;
        role: string;
        analysis: string;
        recommendation: 'invest' | 'pass' | 'maybe';
        confidence: number;
      }>;
      final_verdict: {
        decision: 'invest' | 'pass' | 'needs_more_info';
        confidence: number;
        reasoning: string;
      };
    };
  };
  created_at: string;
  updated_at: string;
}

export const analyzeStartup = async (data: AnalysisRequest): Promise<AnalysisResponse> => {
  const response = await api.post<AnalysisResponse>('/analysis/evaluate', data);
  return response.data;
};

export const getAnalysis = async (id: string): Promise<AnalysisResponse> => {
  const response = await api.get<AnalysisResponse>(`/analysis/${id}`);
  return response.data;
};

export const getAnalysisStatus = async (id: string): Promise<{ status: string }> => {
  const response = await api.get<{ status: string }>(`/analysis/${id}/status`);
  return response.data;
};

export const generateCommitteeDebate = async (pitch: string): Promise<AnalysisResponse> => {
  const response = await api.post<AnalysisResponse>('/committee-simulate', { pitch });
  return response.data;
};

export interface AnalysisHistoryItem {
  id: string;
  createdAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'unknown';
  pitch_preview: string;
  website_url?: string;
  summary: any;
  metrics?: {
    score?: number;
    sentiment?: string;
  };
}

export const getAnalysisHistory = async (params: {
  skip?: number;
  limit?: number;
} = {}): Promise<AnalysisHistoryItem[]> => {
  const { skip = 0, limit = 10 } = params;
  const response = await api.get<AnalysisHistoryItem[]>('/analysis/history/list', {
    params: { skip, limit },
  });
  return response.data;
};

export default api;
