import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  const { documentId } = params;
  
  try {
    // In a real app, you'd fetch from your backend service
    // const backendUrl = `${process.env.BACKEND_URL}/finance/metrics/${documentId}`;
    // const response = await fetch(backendUrl);
    
    // For now, return mock data
    return NextResponse.json({
      health: {
        mrr: Array.from({ length: 12 }, (_, i) => ({
          period: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: 10000 + (i * 5000) + (Math.random() * 2000 - 1000),
          growth_rate: i > 0 ? Math.random() * 10 - 2 : undefined,
        })),
        burn_rate: Array.from({ length: 12 }, (_, i) => ({
          period: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: 5000 + (i * 1000) + (Math.random() * 1000 - 500),
          growth_rate: i > 0 ? Math.random() * 5 - 1 : undefined,
        })),
        gross_margin: Array.from({ length: 12 }, (_, i) => ({
          period: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: 60 + (Math.random() * 10 - 5),
          growth_rate: i > 0 ? Math.random() * 2 - 1 : undefined,
        })),
        runway_months: 18 + Math.floor(Math.random() * 12),
        cash_balance: 500000 + Math.floor(Math.random() * 1000000),
        arr: 1000000 + Math.floor(Math.random() * 500000),
      },
      cash_flow: {
        operating_activities: Array.from({ length: 12 }, (_, i) => ({
          period: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: -3000 - (i * 500) + (Math.random() * 1000 - 500),
          growth_rate: i > 0 ? Math.random() * 5 - 2 : undefined,
        })),
        investing_activities: Array.from({ length: 12 }, (_, i) => ({
          period: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: -1000 - (i * 200) + (Math.random() * 500 - 250),
          growth_rate: i > 0 ? Math.random() * 5 - 2 : undefined,
        })),
        financing_activities: Array.from({ length: 4 }, (_, i) => ({
          period: `2024-${String(i * 3 + 1).padStart(2, '0')}-01`,
          value: 50000 + (i * 10000) + (Math.random() * 10000 - 5000),
          growth_rate: i > 0 ? Math.random() * 10 - 5 : undefined,
        })),
        free_cash_flow: Array.from({ length: 12 }, (_, i) => ({
          period: `2024-${String(i + 1).padStart(2, '0')}-01`,
          value: -2000 - (i * 300) + (Math.random() * 800 - 400),
          growth_rate: i > 0 ? Math.random() * 5 - 2 : undefined,
        })),
      },
      unit_economics: {
        cac: 500 + Math.random() * 200,
        ltv: 2500 + Math.random() * 1000,
        payback_period: 6 + Math.random() * 6,
        ltv_to_cac_ratio: 3 + Math.random() * 2,
        churn_rate: 2 + Math.random() * 3,
        arpa: 50 + Math.random() * 50,
      },
      benchmarks: [
        {
          metric: 'CAC',
          startup_value: 700,
          industry_avg: 850,
          percentile: 65,
          period: 'Q1 2025',
        },
        {
          metric: 'LTV',
          startup_value: 3000,
          industry_avg: 2800,
          percentile: 75,
          period: 'Q1 2025',
        },
        {
          metric: 'Churn Rate',
          startup_value: 3.2,
          industry_avg: 4.5,
          percentile: 80,
          period: 'Q1 2025',
        },
      ],
      last_updated: new Date().toISOString(),
      confidence_scores: {
        overall_confidence: 0.85,
        data_completeness: 0.9,
        data_consistency: 0.8,
      },
      anomalies: [
        'High cash burn rate detected in Q1 2025',
        'Customer acquisition cost increased by 15% MoM',
      ],
    });
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial metrics' },
      { status: 500 }
    );
  }
}
