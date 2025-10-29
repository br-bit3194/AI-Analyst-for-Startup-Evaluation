const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface AnalysisResponse {
  analysisId: string;
  status: string;
  message?: string;
  result?: any;
}

export async function analyzeStartup(pitch: string, websiteUrl?: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pitch,
      website_url: websiteUrl,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to analyze startup');
  }

  return response.json();
}

export async function getAnalysisStatus(analysisId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_BASE_URL}/analysis/${analysisId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch analysis status');
  }

  return response.json();
}

// WebSocket connection for real-time updates
export function connectToAnalysisSocket(analysisId: string, onUpdate: (data: any) => void) {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/api/ws/analysis/status/${analysisId}`;
  
  const socket = new WebSocket(wsUrl);
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onUpdate(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  return socket;
}
