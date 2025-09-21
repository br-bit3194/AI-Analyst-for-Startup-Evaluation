import { BACKEND_BASE_URL } from './backend';

export interface MetricPoint {
  period: string;
  value: number;
  growth_rate?: number;
}

export interface FinancialHealth {
  mrr: MetricPoint[];
  arr?: number;
  burn_rate: MetricPoint[];
  gross_margin: MetricPoint[];
  runway_months?: number;
  cash_balance?: number;
}

export interface CashFlow {
  operating_activities: MetricPoint[];
  investing_activities: MetricPoint[];
  financing_activities: MetricPoint[];
  free_cash_flow: MetricPoint[];
}

export interface UnitEconomics {
  cac?: number;
  ltv?: number;
  payback_period?: number;
  ltv_to_cac_ratio?: number;
  churn_rate?: number;
  arpa?: number;
}

export interface BenchmarkComparison {
  metric: string;
  startup_value: number;
  industry_avg: number;
  percentile: number;
  period: string;
}

export interface FinanceMetrics {
  health: FinancialHealth;
  cash_flow: CashFlow;
  unit_economics: UnitEconomics;
  benchmarks: BenchmarkComparison[];
  last_updated: string;
  notes?: string;
  confidence_scores?: {
    overall_confidence: number;
    data_completeness: number;
    data_consistency: number;
  };
  anomalies?: string[];
}

export type TimePeriod = 'monthly' | 'quarterly' | 'yearly';

export interface FinanceMetricsOptions {
  period?: TimePeriod;
  includeBenchmarks?: boolean;
}

/**
 * Fetch comprehensive financial metrics for a document
 */
export async function fetchFinanceMetrics(
  documentId: string,
  options: FinanceMetricsOptions = {}
): Promise<FinanceMetrics> {
  const { period = 'monthly', includeBenchmarks = false } = options;
  const url = new URL(`${BACKEND_BASE_URL}/finance/metrics/${documentId}`);
  url.searchParams.append('period', period);
  if (includeBenchmarks) {
    url.searchParams.append('include_benchmarks', 'true');
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Failed to fetch finance metrics: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch only financial health metrics
 */
export async function fetchFinancialHealth(documentId: string): Promise<FinancialHealth> {
  const res = await fetch(`${BACKEND_BASE_URL}/finance/health/${documentId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch financial health: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch only cash flow metrics
 */
export async function fetchCashFlow(documentId: string): Promise<CashFlow> {
  const res = await fetch(`${BACKEND_BASE_URL}/finance/cash-flow/${documentId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch cash flow: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch only unit economics metrics
 */
export async function fetchUnitEconomics(documentId: string): Promise<UnitEconomics> {
  const res = await fetch(`${BACKEND_BASE_URL}/finance/unit-economics/${documentId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch unit economics: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch benchmark comparisons
 */
export async function fetchBenchmarks(documentId: string): Promise<BenchmarkComparison[]> {
  const res = await fetch(`${BACKEND_BASE_URL}/finance/benchmarks/${documentId}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmarks: ${res.status}`);
  }
  return res.json();
}
