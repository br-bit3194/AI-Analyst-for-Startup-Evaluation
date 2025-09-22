export const BACKEND_BASE_URL = (import.meta as any).env?.VITE_BACKEND_URL || 'https://ai-analyst-for-startup-evaluation.onrender.com';

export interface DealAnalysisResponse {
  verdict: string;
  confidence: number;
  key_metrics: {
    market_size?: string;
    revenue?: string;
    growth_rate?: string;
    team_strength?: string;
    [key: string]: any;
  };
  risks: string[];
  opportunities: string[];
  recommendations: string[];
  timestamp: string;
}

export interface InvestmentCommitteeResponse {
  deal_pitch: string;
  committee_members: {
    name: string;
    role: string;
    personality: string;
    analysis: string;
    vote: 'INVEST' | 'CONSIDER' | 'PASS';
    confidence: number;
    reasoning: string;
  }[];
  final_verdict: 'INVEST' | 'CONSIDER' | 'PASS';
  consensus_score: number;
  majority_vote: 'INVEST' | 'CONSIDER' | 'PASS';
  dissenting_opinions: string[];
  key_debate_points: string[];
  timestamp?: string;
}

export type DocumentStatus = {
  id: string;
  filename: string;
  file_type: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  storage_path: string;
  extracted_text?: string | null;
  metadata?: Record<string, any>;
};

export async function simulateInvestmentCommittee(pitch: string): Promise<InvestmentCommitteeResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/deal-analysis/committee-simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pitch }),
  });

  if (!response.ok) {
    throw new Error(`Committee simulation failed: ${response.statusText}`);
  }

  return response.json();
}

export function uploadFileXHR(file: File, onProgress?: (pct: number) => void): Promise<{ id: string; status: string }>{
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BACKEND_BASE_URL}/upload/`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          resolve(json);
        } catch (err) {
          reject(err);
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));

    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export async function getDocument(id: string): Promise<DocumentStatus> {
  const res = await fetch(`${BACKEND_BASE_URL}/documents/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch document ${id}`);
  return res.json();
}

export async function analyzeDeal(pitch: string): Promise<DealAnalysisResponse> {
  const response = await fetch(`${BACKEND_BASE_URL}/api/deal-analysis/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pitch }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze deal');
  }

  return response.json();
}

export async function seedIngest(urls: string[]): Promise<{ created: (string | { url: string; error: string })[] }> {
  const res = await fetch(`${BACKEND_BASE_URL}/seed/ingest_urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(urls),
  });
  if (!res.ok) throw new Error('Failed to seed ingest');
  return res.json();
}
