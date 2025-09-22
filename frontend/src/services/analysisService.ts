import { AnalysisResponse } from '../types/analysis';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-analyst-for-startup-evaluation.onrender.com';

/**
 * Start a new analysis of a startup pitch
 */
export async function startAnalysis(pitch: string): Promise<{ analysisId: string }> {
  const response = await fetch(`${API_URL}/api/analysis/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pitch }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to start analysis');
  }

  return response.json();
}

/**
 * Check the status of an analysis
 */
export async function getAnalysisStatus(analysisId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${API_URL}/api/analysis/status/${analysisId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get analysis status');
  }

  return response.json();
}

/**
 * Poll for analysis completion
 */
export async function pollAnalysis(
  analysisId: string, 
  onProgress?: (status: AnalysisResponse) => void,
  interval: number = 2000
): Promise<AnalysisResponse> {
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const status = await getAnalysisStatus(analysisId);
        
        if (onProgress) {
          onProgress(status);
        }

        if (status.status === 'completed') {
          resolve(status);
        } else if (status.status === 'error') {
          reject(new Error(status.message || 'Analysis failed'));
        } else {
          // Still processing, check again after interval
          setTimeout(checkStatus, interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    checkStatus();
  });
}

/**
 * Get a human-readable status message
 */
export function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    processing: 'Analyzing...',
    completed: 'Analysis complete',
    error: 'Analysis failed',
  };
  
  return messages[status] || 'Unknown status';
}

/**
 * Get a color for the status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    processing: 'text-blue-500',
    completed: 'text-green-500',
    error: 'text-red-500',
  };
  
  return colors[status] || 'text-gray-500';
}
