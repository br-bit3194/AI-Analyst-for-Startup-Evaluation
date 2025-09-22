import type { DealAnalysis } from "../types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ai-analyst-for-startup-evaluation.onrender.com';

export async function analyzeDeal(pitch: string): Promise<DealAnalysis> {
  try {
    const response = await fetch(`${API_URL}/api/analysis/evaluate`, {
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

    const data = await response.json();
    
    // Transform the response to match the DealAnalysis type
    const analysis: DealAnalysis = {
      overallVerdict: data.overall_verdict,
      founderDna: data.founder_dna,
      marketPulse: data.market_pulse,
      investmentCommittee: data.investment_committee,
      investmentMemory: data.investment_memory,
      portfolioSynergies: data.portfolio_synergies,
      documentId: `doc_${Date.now()}` // Generate a document ID for tracking
    };
    
    return analysis;
  } catch (error) {
    console.error("Analysis failed:", error);
    throw new Error(error instanceof Error ? error.message : "Failed to analyze deal");
  }
}
