import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle, Info, Users, BarChart2 as BarChart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// Custom Progress component with proper typing
const AnalysisProgress = ({ value, className = '' }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div 
      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

type RiskFactor = {
  category: string;
  description: string;
  impact: string;
  likelihood: string;
  confidence: number;
  mitigation: string;
};

interface MarketSize {
  value?: string | number;
  currency?: string;
  year?: number;
  source?: string;
  confidence?: number;
  notes?: string;
  TAM?: string | number;
  SAM?: string | number;
  SOM?: string | number;
  validation_notes?: string;
}

interface FinancialValue {
  value: number | string;
  unit?: string;
  benchmark?: string | number;
  monthly?: number;
  annual?: number;
  months?: number;
  years?: number;
}

interface FinancialMetrics {
  [key: string]: FinancialValue | number | null | undefined;
}

interface UnitEconomics extends FinancialMetrics {
  customer_acquisition_cost?: FinancialValue;
  lifetime_value?: FinancialValue;
  ltv_cac_ratio?: FinancialValue | number;
  payback_period?: FinancialValue | { months: number };
  gross_margin?: FinancialValue | number;
  contribution_margin?: FinancialValue | number;
}

interface FinancialHealth extends FinancialMetrics {
  burn_rate?: FinancialValue | { monthly: number; annual: number };
  runway_months?: FinancialValue | number;
  revenue_growth_rate?: FinancialValue | number;
  cash_balance?: FinancialValue | number;
  gross_margin?: FinancialValue | number;
  ebitda_margin?: FinancialValue | number;
}

interface FundingRound {
  date: string;
  amount: number;
  type: string;
  valuation?: number;
  investors?: string[];
  purpose?: string;
}

interface FinanceExpertData {
  unit_economics?: UnitEconomics;
  financial_health?: FinancialHealth;
  funding_rounds?: FundingRound[];
  analysis?: string;
}

type GrowthProjection = {
  year: number;
  growth_rate: number;
  market_size: string;
  currency: string;
  drivers: string[];
  confidence: number;
};

interface FinalVerdict {
  recommendation?: string;
  confidence?: number;
  confidence_label?: string;
  reasons?: string[];
  timestamp?: string;
  committee_analysis?: any;
}

interface AnalysisResultProps {
  result: {
    analysis_id: string;
    start_time: string;
    duration_seconds: number;
    agents: {
      [key: string]: {
        success: boolean;
        data: Record<string, unknown>;
        error: string | null;
        confidence: number;
      };
    } & {
      FinanceExpert?: {
        success: boolean;
        data: FinanceExpertData;
        error: string | null;
        confidence: number;
      };
      MarketExpert?: {
        success: boolean;
        data: {
          market_analysis?: {
            market_size_validation?: {
              TAM?: string | number;
              SAM?: string | number;
              SOM?: string | number;
              validation_notes?: string;
            };
            [key: string]: unknown;
          };
          [key: string]: unknown;
        };
        error: string | null;
        confidence: number;
      };
    };
    final_verdict?: FinalVerdict;
    reasons?: string[];
    timestamp?: string;
    committee_analysis?: any;
  };
}

const getRecommendationColor = (recommendation?: string): string => {
  if (!recommendation) return 'bg-gray-100 text-gray-800';
  switch (recommendation.toUpperCase()) {
    case 'STRONG_INVEST':
      return 'bg-green-100 text-green-800';
    case 'CONSIDER':
      return 'bg-yellow-100 text-yellow-800';
    case 'RISKY':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
        <p>No analysis data available. Please run the analysis first.</p>
      </div>
    );
  }

  // Safely extract values with defaults
  const agents = result.agents as {
    [key: string]: {
      success: boolean;
      data: Record<string, unknown>;
      error: string | null;
      confidence: number;
    };
    FinanceExpert?: {
      success: boolean;
      data: FinanceExpertData;
      error: string | null;
      confidence: number;
    };
    MarketExpert?: {
      success: boolean;
      data: {
        market_analysis?: {
          market_size_validation?: {
            TAM?: string | number;
            SAM?: string | number;
            SOM?: string | number;
            validation_notes?: string;
          };
          [key: string]: unknown;
        };
        [key: string]: unknown;
      };
      error: string | null;
      confidence: number;
    };
  };

  // Helper function to safely access financial values
  const getFinancialValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }

    if (typeof value === 'object' && value !== null) {
      const val = value as FinancialValue;
      const numValue = typeof val.value === 'string' ? parseFloat(val.value) : val.value;
      
      if (isNaN(numValue)) return 'N/A';
      
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(numValue);
      
      return val.unit ? `${formatted} ${val.unit}`.trim() : formatted;
    }
    
    return String(value);
  };
  const final_verdict = result.final_verdict || {
    recommendation: 'PENDING',
    confidence: 0,
    confidence_label: 'Low',
    reasons: [],
    timestamp: new Date().toISOString()
  };

  // Get all available agent data
  const agentData = Object.entries(agents).map(([name, data]) => ({
    name,
    success: data?.success || false,
    data: data?.data || {},
    error: data?.error || null,
    confidence: data?.confidence || 0
  }));

  // Check if we have any agent data
  const hasAgentData = agentData.some(agent => agent.success && agent.data);

  // Create a safe version of final_verdict with all required defaults
  const safeVerdict = {
    recommendation: final_verdict?.recommendation || 'PENDING',
    confidence: final_verdict?.confidence ?? 0,
    confidence_label: final_verdict?.confidence_label || 'Low',
    reasons: Array.isArray(final_verdict?.reasons) ? final_verdict.reasons : ['Analysis in progress'],
    timestamp: final_verdict?.timestamp || new Date().toISOString(),
    committee_analysis: final_verdict?.committee_analysis || {
      members: [],
      summary: 'No committee analysis available',
      dissenting_opinions: []
    }
  } as const;

  // Debug: Log the data we're working with
  console.log('Analysis Result Data:', {
    result,
    final_verdict,
    safeVerdict,
    agents: Object.keys(agents)
  });
  
  // Safely access committee_analysis with robust defaults
  const committeeAnalysis = safeVerdict?.committee_analysis || {};
  const committeeVotes = committeeAnalysis && Array.isArray(committeeAnalysis.votes) 
    ? committeeAnalysis.votes 
    : [];
  const committeeSummary = committeeAnalysis?.summary || 'No committee analysis available';
  
  // Ensure result is valid
  if (!result || typeof result !== 'object') {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
        <p>No valid analysis data available. Please run the analysis first.</p>
      </div>
    );
  }
  
  // Fallback for the entire result object if it's undefined or invalid
  if (!result || typeof result !== 'object') {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
        <p>No valid analysis data available. Please run the analysis first.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderTeamAnalysis = (teamData?: any) => {
    if (!teamData) {
      return <p className="text-gray-500 italic">No team analysis available</p>;
    }
    return (
      <div>
        <h4 className="font-medium text-gray-900">Team Analysis</h4>
        <p className="text-gray-700">{teamData}</p>
      </div>
    );
  };

  const renderRiskFactors = (riskFactors?: RiskFactor[]) => {
    if (!riskFactors || riskFactors.length === 0) {
      return <p className="text-gray-500 italic">No risk factors identified</p>;
    }

    // Group risk factors by category and keep only the one with highest impact
    const riskByCategory = new Map<string, RiskFactor>();
    
    // Impact levels for sorting (higher number = higher impact)
    const impactLevels: Record<string, number> = {
      'High': 3,
      'Medium': 2,
      'Low': 1
    };

    riskFactors.forEach(factor => {
      if (!factor || !factor.category || !factor.description) return;
      
      const category = factor.category.trim();
      const existing = riskByCategory.get(category);
      
      // If this category doesn't exist yet, or if this factor has higher impact
      if (!existing || 
          (impactLevels[factor.impact] > impactLevels[existing.impact])) {
        riskByCategory.set(category, factor);
      }
    });

    // Convert to array and sort by impact level (high to low)
    const uniqueRiskFactors = Array.from(riskByCategory.entries())
      .sort((a, b) => impactLevels[b[1].impact] - impactLevels[a[1].impact]);
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {uniqueRiskFactors.map(([category, factor], index) => {
          // Create a unique key using category and index
          const contentKey = `risk-${category.toLowerCase().replace(/\s+/g, '-')}-${index}`;
          return (
            <div 
              key={contentKey}
              className="border rounded-lg p-5 flex flex-col h-full hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex-grow">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-lg text-gray-900">{factor.category}</h4>
                  <div className="flex flex-col items-end space-y-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      factor.impact === 'High' ? 'bg-red-100 text-red-800' :
                      factor.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {factor.impact} Impact
                    </span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-800 rounded-full text-xs font-medium">
                      {factor.likelihood} Likelihood
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-4">{factor.description}</p>
                
                {factor.confidence && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Confidence</span>
                      <span>{factor.confidence}%</span>
                    </div>
                    <AnalysisProgress value={factor.confidence} className="h-1.5" />
                  </div>
                )}
              </div>
              
              {factor.mitigation && (
                <div className="mt-auto pt-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-800 mb-1">Mitigation Strategy</p>
                  <p className="text-sm text-gray-600">{factor.mitigation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const formatCurrency = (value: number | string, currency: string = 'USD'): string => {
    if (typeof value === 'string') {
      // If it's already formatted, return as is
      if (value.includes('$') || value.includes(currency)) return value;
      // Try to parse string to number
      const numValue = parseFloat(value.replace(/[^0-9.-]+/g, ''));
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numValue);
      }
      return value;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(numValue / 100);
  };

  const renderFinancialAnalysis = (financialData?: any) => {
    if (!financialData) {
      return <p className="text-gray-500 italic">No financial data available</p>;
    }

    const { unit_economics, financial_health, funding_rounds } = financialData;

    return (
      <div className="space-y-6">
        {/* Unit Economics */}
        {unit_economics && (
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-indigo-600" />
              Unit Economics
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unit_economics.customer_acquisition_cost && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Customer Acquisition Cost</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(unit_economics.customer_acquisition_cost.value, unit_economics.customer_acquisition_cost.currency)}
                  </p>
                  {unit_economics.customer_acquisition_cost.benchmark && (
                    <p className="text-xs text-gray-500 mt-1">
                      Benchmark: {formatCurrency(unit_economics.customer_acquisition_cost.benchmark, unit_economics.customer_acquisition_cost.currency)}
                    </p>
                  )}
                </div>
              )}

              {unit_economics.lifetime_value && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Lifetime Value</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(unit_economics.lifetime_value.value, unit_economics.lifetime_value.currency)}
                  </p>
                  {unit_economics.lifetime_value.benchmark && (
                    <p className="text-xs text-gray-500 mt-1">
                      Benchmark: {formatCurrency(unit_economics.lifetime_value.benchmark, unit_economics.lifetime_value.currency)}
                    </p>
                  )}
                </div>
              )}

              {unit_economics.ltv_cac_ratio && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">LTV:CAC Ratio</p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof unit_economics.ltv_cac_ratio === 'object' 
                      ? unit_economics.ltv_cac_ratio.value 
                      : unit_economics.ltv_cac_ratio}
                    {typeof unit_economics.ltv_cac_ratio === 'object' && unit_economics.ltv_cac_ratio.unit 
                      ? ` ${unit_economics.ltv_cac_ratio.unit}` 
                      : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof unit_economics.ltv_cac_ratio === 'object' && unit_economics.ltv_cac_ratio.benchmark 
                      ? `Benchmark: ${unit_economics.ltv_cac_ratio.benchmark}` 
                      : 'Ideal: > 3.0'}
                  </p>
                </div>
              )}

              {unit_economics.payback_period && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Payback Period</p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof unit_economics.payback_period === 'object' 
                      ? `${unit_economics.payback_period.months} months` 
                      : `${unit_economics.payback_period} months`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof unit_economics.payback_period === 'object' && unit_economics.payback_period.benchmark 
                      ? `Benchmark: ${unit_economics.payback_period.benchmark} months` 
                      : 'Ideal: < 12 months'}
                  </p>
                </div>
              )}

              {unit_economics.gross_margin && (
                <div className="bg-pink-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Gross Margin</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPercentage(unit_economics.gross_margin)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof unit_economics.gross_margin === 'object' && unit_economics.gross_margin.benchmark 
                      ? `Benchmark: ${formatPercentage(unit_economics.gross_margin.benchmark)}` 
                      : 'Ideal: > 70% for SaaS'}
                  </p>
                </div>
              )}

              {unit_economics.contribution_margin && (
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Contribution Margin</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPercentage(unit_economics.contribution_margin)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof unit_economics.contribution_margin === 'object' && unit_economics.contribution_margin.benchmark 
                      ? `Benchmark: ${formatPercentage(unit_economics.contribution_margin.benchmark)}` 
                      : 'Ideal: > 50%'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Health */}
        {financial_health && (
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-teal-600" />
              Financial Health
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {financial_health.burn_rate && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Monthly Burn Rate</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      typeof financial_health.burn_rate === 'object' 
                        ? financial_health.burn_rate.monthly 
                        : financial_health.burn_rate
                    )}
                  </p>
                  {typeof financial_health.burn_rate === 'object' && financial_health.burn_rate.annual && (
                    <p className="text-xs text-gray-500 mt-1">
                      Annual: {formatCurrency(financial_health.burn_rate.annual)}
                    </p>
                  )}
                </div>
              )}

              {financial_health.runway_months && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Runway</p>
                  <p className="text-xl font-bold text-gray-900">
                    {typeof financial_health.runway_months === 'object' 
                      ? financial_health.runway_months.value 
                      : financial_health.runway_months} months
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {typeof financial_health.runway_months === 'object' && financial_health.runway_months.benchmark 
                      ? `Benchmark: ${financial_health.runway_months.benchmark} months` 
                      : 'Ideal: > 18 months'}
                  </p>
                </div>
              )}

              {financial_health.revenue_growth_rate && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Revenue Growth (YoY)</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPercentage(financial_health.revenue_growth_rate)}
                  </p>
                  {typeof financial_health.revenue_growth_rate === 'object' && financial_health.revenue_growth_rate.benchmark && (
                    <p className="text-xs text-gray-500 mt-1">
                      Benchmark: {formatPercentage(financial_health.revenue_growth_rate.benchmark)}
                    </p>
                  )}
                </div>
              )}

              {financial_health.cash_balance && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Cash Balance</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      typeof financial_health.cash_balance === 'object' 
                        ? financial_health.cash_balance.value 
                        : financial_health.cash_balance
                    )}
                  </p>
                  {financial_health.runway_months && financial_health.burn_rate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Runway: {typeof financial_health.runway_months === 'object' 
                        ? financial_health.runway_months.value 
                        : financial_health.runway_months} months
                    </p>
                  )}
                </div>
              )}

              {financial_health.gross_margin && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Gross Margin</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPercentage(financial_health.gross_margin)}
                  </p>
                  {typeof financial_health.gross_margin === 'object' && financial_health.gross_margin.benchmark && (
                    <p className="text-xs text-gray-500 mt-1">
                      Benchmark: {formatPercentage(financial_health.gross_margin.benchmark)}
                    </p>
                  )}
                </div>
              )}

              {financial_health.ebitda_margin && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">EBITDA Margin</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatPercentage(financial_health.ebitda_margin)}
                  </p>
                  {typeof financial_health.ebitda_margin === 'object' && financial_health.ebitda_margin.benchmark && (
                    <p className="text-xs text-gray-500 mt-1">
                      Benchmark: {formatPercentage(financial_health.ebitda_margin.benchmark)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Funding Rounds */}
        {funding_rounds && funding_rounds.length > 0 && (
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-5 w-5 mr-2 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Funding History
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Round
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valuation
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Investors
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {funding_rounds
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((round: any, index: number) => (
                      <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(round.date).toLocaleDateString()}
                          {index === 0 && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Latest
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {round.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(round.amount, round.currency || 'USD')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {round.valuation ? formatCurrency(round.valuation, round.currency || 'USD') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {round.investors && round.investors.length > 0 
                            ? round.investors.slice(0, 2).join(', ') + (round.investors.length > 2 ? ` +${round.investors.length - 2} more` : '')
                            : 'Undisclosed'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarketSize = (marketSize?: MarketSize) => {
    if (!marketSize) return <p className="text-gray-500 italic">No market size data available</p>;
    if (!marketSize) return <p className="text-gray-500 italic">No market size data available</p>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Market Size
            </CardTitle>
            <CardDescription className="text-2xl font-bold text-gray-900">
              {marketSize.value} {marketSize.currency}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              <p>Year: {marketSize.year}</p>
              <p className="mt-1 text-xs text-gray-500">Source: {marketSize.source}</p>
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Confidence</span>
                  <span>{Math.round(marketSize.confidence * 100)}%</span>
                </div>
                <Progress value={marketSize.confidence * 100} className="h-2" />
              </div>
              {marketSize.notes && (
                <p className="mt-2 text-xs text-gray-500 italic">{marketSize.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGrowthProjections = (projections?: GrowthProjection[]) => {
    if (!projections || projections.length === 0) {
      return <p className="text-gray-500 italic">No growth projections available</p>;
    }
    return (
      <div className="space-y-4">
        {projections.map((projection, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{projection.year}</h4>
                <p className="text-2xl font-bold text-blue-600">{projection.growth_rate}% Growth</p>
                <p className="text-sm text-gray-600">Market Size: {projection.market_size} {projection.currency}</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {Math.round(projection.confidence * 100)}% Confidence
                </div>
              </div>
            </div>
            <div className="mt-3">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Key Drivers:</h5>
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                {projection.drivers.map((driver, i) => (
                  <li key={i}>{driver}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCommitteeVotes = (votes: any[] = []) => {
    if (!Array.isArray(votes) || votes.length === 0) {
      return <p className="text-gray-500 italic">No committee votes available</p>;
    }
    return (
      <div>
        <h4 className="font-medium text-gray-900">Committee Votes</h4>
        <ul className="space-y-2">
          {votes.map((vote: any, i: number) => (
            <li key={i} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{vote}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-gray-800">
      {/* Header with overall recommendation */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Analysis Result</CardTitle>
              <CardDescription className="text-gray-600">Analysis ID: {result.analysis_id}</CardDescription>
            </div>
            <Badge 
              className={`${getRecommendationColor(safeVerdict.recommendation)} text-sm font-medium px-3 py-1`}
            >
              {safeVerdict.recommendation.replace(/_/g, ' ')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">Analysis Duration</p>
              <p className="text-lg font-semibold">{Math.round(result.duration_seconds)} seconds</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">Confidence</p>
              <div className="flex items-center">
                <p className="text-lg font-semibold mr-2">
                  {Math.round(safeVerdict.confidence * 100)}%
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${Math.min(100, Math.max(0, safeVerdict.confidence || 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-700">Agents Executed</p>
              <p className="text-lg font-semibold">
                {Object.keys(agents).length} / {Object.keys(agents).length} completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>


      {/* Risk Analysis */}
      {agents.RiskAnalyst?.data?.risk_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
              Risk Analysis
            </CardTitle>
            <CardDescription>
              {agents.RiskAnalyst.data.risk_analysis.overall_risk.explanation}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <h4 className="font-medium text-red-800">Overall Risk: {agents.RiskAnalyst.data.risk_analysis.overall_risk.level}</h4>
                <p className="mt-1 text-red-700">
                  {agents.RiskAnalyst.data.risk_analysis.key_risks_summary}
                </p>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-red-600 mb-1">
                    <span>Confidence</span>
                    <span>{Math.round(agents.RiskAnalyst.data.risk_analysis.overall_risk.confidence * 100)}%</span>
                  </div>
                  <Progress 
                    value={agents.RiskAnalyst.data.risk_analysis.overall_risk.confidence * 100} 
                    className="h-2 bg-red-100"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              </div>

              {agents.RiskAnalyst.data.risk_analysis.risk_factors && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Key Risk Factors</h4>
                  {renderRiskFactors(agents.RiskAnalyst.data.risk_analysis.risk_factors)}
                </div>
              )}

              {agents.RiskAnalyst.data.risk_analysis.recommendations && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {agents.RiskAnalyst.data.risk_analysis.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Market Analysis */}
      {agents.MarketExpert?.data?.market_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-blue-600" />
              Market Analysis
            </CardTitle>
            <CardDescription>
              {agents.MarketExpert.data.market_analysis.summary}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Market Size */}
            {agents.MarketExpert.data.market_analysis.market_size_validation && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Market Size Validation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow">
                    <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">TAM</h5>
                    <p className="text-xl font-semibold text-blue-700">
                      {agents.MarketExpert?.data?.market_analysis?.market_size_validation?.TAM !== undefined 
                        ? String(agents.MarketExpert.data.market_analysis.market_size_validation.TAM) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow">
                    <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">SAM</h5>
                    <p className="text-xl font-semibold text-blue-700">
                      {agents.MarketExpert?.data?.market_analysis?.market_size_validation?.SAM !== undefined 
                        ? String(agents.MarketExpert.data.market_analysis.market_size_validation.SAM) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-blue-100 shadow">
                    <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">SOM</h5>
                    <p className="text-xl font-semibold text-blue-700">
                      {agents.MarketExpert?.data?.market_analysis?.market_size_validation?.SOM !== undefined 
                        ? String(agents.MarketExpert.data.market_analysis.market_size_validation.SOM) 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {agents.MarketExpert?.data?.market_analysis?.market_size_validation?.validation_notes && (
                  <p className="mt-3 text-sm text-gray-600">
                    {agents.MarketExpert.data.market_analysis.market_size_validation.validation_notes}
                  </p>
                )}
              </div>
            )}

            {/* Growth Projections */}
            {agents.MarketExpert.data.market_analysis.growth_projections && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Growth Projections</h4>
                {renderGrowthProjections(agents.MarketExpert.data.market_analysis.growth_projections)}
              </div>
            )}

            {/* Competitive Positioning */}
            {agents.MarketExpert.data.market_analysis.competitive_positioning && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Competitive Landscape</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800">Positioning</h5>
                    <p className="mt-1 text-blue-700">
                      {agents.MarketExpert.data.market_analysis.competitive_positioning.positioning}
                    </p>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Key Competitors</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {agents.MarketExpert.data.market_analysis.competitive_positioning.key_competitors.map(
                        (competitor: any, i: number) => (
                          <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <h6 className="font-medium text-gray-900">{competitor.name}</h6>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-500">Strengths</p>
                              <ul className="list-disc pl-5 mt-1 text-sm text-gray-700 space-y-1">
                                {competitor.strengths.slice(0, 2).map((s: string, j: number) => (
                                  <li key={j} className="line-clamp-2">{s}</li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-500">Weaknesses</p>
                              <ul className="list-disc pl-5 mt-1 text-sm text-gray-700 space-y-1">
                                {competitor.weaknesses.slice(0, 2).map((w: string, j: number) => (
                                  <li key={j} className="line-clamp-2">{w}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Financial Analysis */}
      {agents.FinanceExpert?.data && (
        <Card className="border border-blue-50 bg-white shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
            <CardTitle className="flex items-center text-blue-800">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Financial Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Business Model Overview */}
            {agents.FinanceExpert.data[' '] && (
              <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-full mr-3">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Business Model Overview</h3>
                </div>
                <div className="ml-10">
                  <p className="text-gray-700">{agents.FinanceExpert.data[' '].model}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h5 className="font-medium text-green-800 flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                        Strengths
                      </h5>
                      <ul className="mt-2 space-y-2">
                        {agents.FinanceExpert.data[' '].strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-green-500 mr-2">•</span>
                            <span className="text-sm text-gray-700">{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h5 className="font-medium text-red-800 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                        Concerns
                      </h5>
                      <ul className="mt-2 space-y-2">
                        {agents.FinanceExpert.data[' '].concerns.map((c: string, i: number) => (
                          <li key={i} className="flex items-start">
                            <span className="text-red-500 mr-2">•</span>
                            <span className="text-sm text-gray-700">{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Unit Economics */}
            {agents.FinanceExpert.data.unit_economics && (
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-indigo-100 rounded-full mr-3">
                    <BarChart className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Unit Economics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(agents.FinanceExpert.data.unit_economics || {}).map(([key, value]) => {
                    if (value === null || value === undefined || key === 'analysis') return null;
                    
                    let displayValue, benchmark, isPositive;
                    
                    // Format the value based on its type
                    if (value && typeof value === 'object' && 'value' in value) {
                      const val = value as FinancialValue;
                      const numValue = typeof val.value === 'string' ? parseFloat(val.value) : Number(val.value);
                      isPositive = !isNaN(numValue) ? numValue >= 0 : true;
                      
                      if (!isNaN(numValue)) {
                        displayValue = getFinancialValue(numValue);
                        if ('unit' in val && val.unit) {
                          displayValue = `${displayValue} ${val.unit}`.trim();
                        }
                      } else {
                        displayValue = 'N/A';
                      }
                      
                      if ('benchmark' in val && val.benchmark) {
                        benchmark = `vs ${val.benchmark} benchmark`;
                      }
                    } else if (typeof value === 'number' || typeof value === 'string') {
                      const numValue = typeof value === 'string' ? parseFloat(value) : value;
                      isPositive = !isNaN(numValue) ? numValue >= 0 : true;
                      displayValue = !isNaN(numValue) 
                        ? new Intl.NumberFormat('en-US', { 
                            style: 'currency', 
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                          }).format(numValue)
                        : 'N/A';
                    } else {
                      displayValue = value || 'N/A';
                    }
                    
                    return (
                      <div key={key} className={`p-4 rounded-lg border ${
                        isPositive === true ? 'border-green-100 bg-green-50' : 
                        isPositive === false ? 'border-red-100 bg-red-50' : 
                        'border-gray-100 bg-gray-50'
                      }`}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          {key.replace(/_/g, ' ')}
                        </p>
                        <p className={`text-xl font-semibold ${
                          isPositive === true ? 'text-green-700' : 
                          isPositive === false ? 'text-red-700' : 
                          'text-gray-900'
                        }`}>
                          {displayValue}
                        </p>
                        {benchmark && (
                          <p className="text-xs text-gray-500 mt-1">{benchmark}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {agents.FinanceExpert.data.unit_economics.analysis && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-sm text-blue-700">
                      {typeof agents.FinanceExpert.data.unit_economics.analysis === 'string' 
                        ? agents.FinanceExpert.data.unit_economics.analysis
                        : JSON.stringify(agents.FinanceExpert.data.unit_economics.analysis, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Financial Health */}
            {agents.FinanceExpert.data.financial_health && (
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-teal-100 rounded-full mr-3">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Financial Health</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(agents.FinanceExpert.data.financial_health).map(([key, value]) => {
                    if (value === null || value === undefined || key === 'analysis') return null;
                    
                    let displayValue, subValue, isPositive;
                    
                    // Handle different value types
                    if (value && typeof value === 'object') {
                      // Handle burn rate object with monthly/annual properties
                      if ('monthly' in value && 'annual' in value) {
                        const monthly = (value as { monthly?: number }).monthly || 0;
                        const annual = (value as { annual?: number }).annual || 0;
                        isPositive = annual >= 0;
                        
                        displayValue = new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(monthly);
                        
                        subValue = new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(annual) + ' annual';
                      } else {
                        displayValue = JSON.stringify(value, null, 2);
                      }
                    } else if (typeof value === 'number') {
                      isPositive = value >= 0;
                      // Format as percentage if the key contains 'rate' or 'ratio'
                      if (key.includes('rate') || key.includes('ratio') || key.includes('margin')) {
                        displayValue = new Intl.NumberFormat('en-US', { 
                          style: 'percent',
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 1
                        }).format(value / 100);
                      } else {
                        // Format as currency for other numbers
                        displayValue = new Intl.NumberFormat('en-US', { 
                          style: 'currency', 
                          currency: 'USD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(value);
                      }
                    } else {
                      displayValue = value || 'N/A';
                    }
                    
                    return (
                      <div key={key} className={`p-4 rounded-lg border ${
                        isPositive === true ? 'border-green-100 bg-green-50' : 
                        isPositive === false ? 'border-red-100 bg-red-50' : 
                        'border-gray-100 bg-gray-50'
                      }`}>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </p>
                        <p className={`text-xl font-semibold ${
                          isPositive === true ? 'text-green-700' : 
                          isPositive === false ? 'text-red-700' : 
                          'text-gray-900'
                        }`}>
                          {displayValue}
                        </p>
                        {subValue && (
                          <p className="text-xs text-gray-500 mt-1">{subValue}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {agents.FinanceExpert.data.financial_health.analysis && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
                    <p className="text-sm text-blue-700">
                      {agents.FinanceExpert.data.financial_health.analysis}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* Funding Rounds */}
            {agents.FinanceExpert.data.funding_rounds && agents.FinanceExpert.data.funding_rounds.length > 0 && (
              <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-full mr-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Funding History</h3>
                  </div>
                  <div className="text-sm text-gray-500">
                    {agents.FinanceExpert.data.funding_rounds.length} round{agents.FinanceExpert.data.funding_rounds.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {agents.FinanceExpert.data.funding_rounds
                    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((round: any, index: number) => (
                      <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {round.type} Round • {new Date(round.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </h4>
                            <div className="mt-1 space-y-1">
                              <div className="flex items-center text-sm text-gray-700">
                                <span className="font-medium w-24">Amount:</span>
                                <span className="font-mono">
                                  {new Intl.NumberFormat('en-US', { 
                                    style: 'currency', 
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0
                                  }).format(round.amount)}
                                </span>
                              </div>
                              {round.valuation && (
                                <div className="flex items-center text-sm text-gray-700">
                                  <span className="font-medium w-24">Valuation:</span>
                                  <span className="font-mono">
                                    {new Intl.NumberFormat('en-US', { 
                                      style: 'currency', 
                                      currency: 'USD',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0
                                    }).format(round.valuation)}
                                  </span>
                                </div>
                              )}
                              {round.investors && round.investors.length > 0 && (
                                <div className="flex items-start text-sm text-gray-700">
                                  <span className="font-medium w-24 flex-shrink-0">Investors:</span>
                                  <span>{round.investors.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {index === 0 && agents.FinanceExpert.data.funding_rounds.length > 1 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Most Recent
                            </span>
                          )}
                        </div>
                        {round.purpose && (
                          <p className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Purpose:</span> {round.purpose}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
                
                {/* Funding Insights */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Investment Insights</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    {agents.FinanceExpert.data.funding_rounds.length > 1 ? (
                      <>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>Company has raised {agents.FinanceExpert.data.funding_rounds.length} funding rounds to date.</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span>Most recent round: {agents.FinanceExpert.data.funding_rounds[0].type} round of {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(agents.FinanceExpert.data.funding_rounds[0].amount)}</span>
                        </li>
                        {agents.FinanceExpert.data.funding_rounds[0].valuation && (
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>Current valuation: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(agents.FinanceExpert.data.funding_rounds[0].valuation)}</span>
                          </li>
                        )}
                      </>
                    ) : (
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>Company has raised {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(agents.FinanceExpert.data.funding_rounds[0].amount)} in a {agents.FinanceExpert.data.funding_rounds[0].type} round.</span>
                      </li>
                    )}
                    
                    {/* Add more insights based on funding data */}
                    {agents.FinanceExpert.data.funding_rounds.some((r: any) => r.type === 'Series A') && (
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>Successfully raised Series A, indicating strong market validation.</span>
                      </li>
                    )}
                    
                    {agents.FinanceExpert.data.funding_rounds.some((r: any) => r.type === 'Seed') && (
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>Raised seed funding, typical for early-stage companies with proven concept.</span>
                      </li>
                    )}
                    
                    {agents.FinanceExpert.data.funding_rounds.length >= 3 && (
                      <li className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span>Multiple funding rounds suggest investor confidence and growth potential.</span>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Financial Analysis & Insights */}
            <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-amber-100 rounded-full mr-3">
                  <Info className="h-5 w-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Financial Insights & Analysis</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <h4 className="font-medium text-green-800 flex items-center mb-3">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    Key Strengths
                  </h4>
                  <ul className="space-y-2">
                    {[
                      (agents.FinanceExpert.data.unit_economics?.ltv_cac_ratio && 
                      (typeof agents.FinanceExpert.data.unit_economics.ltv_cac_ratio === 'number' 
                        ? agents.FinanceExpert.data.unit_economics.ltv_cac_ratio > 3
                        : (agents.FinanceExpert.data.unit_economics.ltv_cac_ratio as FinancialValue)?.value as number > 3)) ? 
                        'Strong unit economics with LTV:CAC ratio above 3:1, indicating efficient customer acquisition.' : 
                        'Healthy unit economics with room for optimization.',
                      (agents.FinanceExpert.data.financial_health?.runway_months && 
                      (typeof agents.FinanceExpert.data.financial_health.runway_months === 'number'
                        ? agents.FinanceExpert.data.financial_health.runway_months > 12
                        : (agents.FinanceExpert.data.financial_health.runway_months as FinancialValue)?.value as number > 12)) ? 
                        'Substantial cash runway of over 12 months, providing stability for growth.' :
                        'Adequate cash runway for current operations.',
                      agents.FinanceExpert.data.funding_rounds?.length > 0 ?
                        'Successful fundraising history with multiple investors.' :
                        'Early-stage company with initial funding secured.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Risks */}
                <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                  <h4 className="font-medium text-red-800 flex items-center mb-3">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
                    Potential Risks
                  </h4>
                  <ul className="space-y-2">
                    {[
                      (() => {
                        const burnRate = agents.FinanceExpert.data.financial_health?.burn_rate;
                        const monthlyBurn = burnRate && (
                          typeof burnRate === 'object' && 'monthly' in burnRate 
                            ? (burnRate as { monthly?: number }).monthly 
                            : (burnRate as FinancialValue)?.value as number
                        );
                        return monthlyBurn && monthlyBurn > 500000;
                      })() ?
                        'High monthly burn rate may require additional funding in the near term.' :
                        'Monitor burn rate to ensure sustainable operations.',
                      (() => {
                        const payback = agents.FinanceExpert.data.unit_economics?.payback_period;
                        const months = payback && (
                          typeof payback === 'object' && 'months' in payback
                            ? (payback as { months: number }).months
                            : (payback as FinancialValue)?.value as number
                        );
                        return months && months > 12;
                      })() ?
                        'Extended payback period may impact cash flow and growth potential.' :
                        'Customer acquisition payback period is within industry norms.',
                      agents.FinanceExpert.data.funding_rounds?.length === 0 ?
                        'Limited funding history may indicate higher risk for investors.' :
                        'Diversified investor base reduces dependency on a single source.'
                    ].map((item, i) => (
                      <li key={i} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="text-sm text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {[
                    'Consider additional funding rounds to extend runway and accelerate growth.',
                    'Focus on improving unit economics through customer retention and monetization strategies.',
                    'Monitor cash burn rate and adjust spending to align with revenue growth.',
                    'Explore strategic partnerships to enhance market position and reduce customer acquisition costs.'
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      <span className="text-sm text-blue-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {agents.FinanceExpert.data.projections && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Projections & Assumptions</h4>
                <div className="space-y-4">
                  {agents.FinanceExpert.data.projections.assumptions_analysis && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Key Assumptions</h5>
                      <p className="text-sm text-gray-600">
                        {agents.FinanceExpert.data.projections.assumptions_analysis}
                      </p>
                    </div>
                  )}
                  
                  {agents.FinanceExpert.data.projections.sensitivity_analysis && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Sensitivity Analysis</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(agents.FinanceExpert.data.projections.sensitivity_analysis).map(([scenario, data]) => (
                          <div key={scenario} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <h6 className="text-sm font-medium text-gray-700 capitalize mb-1">
                              {scenario.replace('_', ' ')}
                            </h6>
                            {typeof data === 'object' && data !== null ? (
                              <div className="space-y-1">
                                {Object.entries(data).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-sm">
                                    <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                                    <span className="font-medium text-gray-900">
                                      {typeof value === 'number' 
                                        ? value.toLocaleString(undefined, { 
                                            style: key === 'revenue' ? 'currency' : 'decimal',
                                            currency: 'USD',
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0
                                          })
                                        : String(value) || 'N/A'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">
                                {String(data) || 'No data available'}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {agents.FinanceExpert.data.projections.red_flags && 
                   agents.FinanceExpert.data.projections.red_flags.length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                      <h5 className="text-sm font-medium text-red-800 flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Red Flags
                      </h5>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                        {agents.FinanceExpert.data.projections.red_flags.map((flag: string, i: number) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Evaluation */}
      {agents.TeamEvaluator?.data?.team_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Team Evaluation
            </CardTitle>
            <CardDescription>
              Assessment of the founding team and key personnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700">Team Composition Score</p>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold text-purple-800">
                      {agents?.TeamEvaluator?.data?.team_analysis?.team_composition?.completeness_score ?? 'N/A'}/10
                    </span>
                    <div className="ml-auto w-16">
                      <Progress 
                        value={(agents?.TeamEvaluator?.data?.team_analysis?.team_composition?.completeness_score ?? 0) * 10} 
                        className="h-2 bg-purple-100"
                        indicatorClassName="bg-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">Execution Risk</p>
                  <div className="flex items-center mt-1">
                    <span className="text-2xl font-bold text-blue-800">
                      {agents.TeamEvaluator.data.team_analysis.execution_risk.risk_score}/10
                    </span>
                    <div className="ml-auto w-16">
                      <Progress 
                        value={agents.TeamEvaluator.data.team_analysis.execution_risk.risk_score * 10} 
                        className="h-2 bg-blue-100"
                        indicatorClassName="bg-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-700">Key Hires Needed</p>
                  <span className="text-2xl font-bold text-green-800">
                    {agents.TeamEvaluator.data.team_analysis.recommendations?.key_hires_needed?.length || 0}
                  </span>
                </div>
              </div>

              {/* Team Composition */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Team Composition</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-medium text-green-800 mb-2">Strengths</h5>
                    <ul className="space-y-2">
                      {agents.TeamEvaluator.data.team_analysis.team_composition.strengths.map((s: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h5 className="font-medium text-yellow-800 mb-2">Gaps</h5>
                    <ul className="space-y-2">
                      {agents.TeamEvaluator.data.team_analysis.team_composition.gaps.map((g: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Experience Assessment */}
              {agents.TeamEvaluator.data.team_analysis.experience_assessment && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Experience Assessment</h4>
                  <div className="space-y-4">
                    {agents.TeamEvaluator.data.team_analysis.experience_assessment.relevant_experience && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Relevant Experience</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                          {agents.TeamEvaluator.data.team_analysis.experience_assessment.relevant_experience.map(
                            (exp: string, i: number) => (
                              <li key={i}>{exp}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {agents.TeamEvaluator.data.team_analysis.experience_assessment.past_performance && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Past Performance</h5>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                          {agents.TeamEvaluator.data.team_analysis.experience_assessment.past_performance.map(
                            (perf: string, i: number) => (
                              <li key={i}>{perf}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {agents.TeamEvaluator.data.team_analysis.experience_assessment.domain_expertise && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Domain Expertise</h5>
                        <p className="text-sm text-gray-600">
                          {agents.TeamEvaluator.data.team_analysis.experience_assessment.domain_expertise}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Execution Risk */}
              {agents.TeamEvaluator.data.team_analysis.execution_risk && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Execution Risk</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Key Risks</h5>
                        <ul className="space-y-2">
                          {agents.TeamEvaluator.data.team_analysis.execution_risk.key_risks.map(
                            (risk: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{risk}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-1">Mitigation Strategies</h5>
                        <ul className="space-y-2">
                          {agents.TeamEvaluator.data.team_analysis.execution_risk.mitigation_strategies.map(
                            (strategy: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{strategy}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {agents.TeamEvaluator.data.team_analysis.recommendations && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Recommendations</h4>
                  
                  {agents.TeamEvaluator.data.team_analysis.recommendations.key_hires_needed &&
                    agents.TeamEvaluator.data.team_analysis.recommendations.key_hires_needed.length > 0 && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Key Hires Needed</h5>
                        <ul className="space-y-2">
                          {agents.TeamEvaluator.data.team_analysis.recommendations.key_hires_needed.map(
                            (hire: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="h-6 w-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium mr-2 flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-sm text-gray-700">{hire}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  
                  {agents.TeamEvaluator.data.team_analysis.recommendations.advisors_suggested &&
                    agents.TeamEvaluator.data.team_analysis.recommendations.advisors_suggested.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Advisors</h5>
                        <ul className="space-y-2">
                          {agents.TeamEvaluator.data.team_analysis.recommendations.advisors_suggested.map(
                            (advisor: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="h-6 w-6 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-xs font-medium mr-2 flex-shrink-0">
                                  {i + 1}
                                </span>
                                <span className="text-sm text-gray-700">{advisor}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Competitive Analysis */}
      {agents.CompetitiveAnalyst?.data?.competitive_landscape && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2 text-indigo-600" />
              Competitive Analysis
            </CardTitle>
            <CardDescription>
              Analysis of the competitive landscape and market positioning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Market Positioning */}
              {agents.CompetitiveAnalyst.data.competitive_landscape.market_position && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Market Positioning</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-indigo-700">Positioning Statement</p>
                      <p className="mt-1 font-medium text-indigo-900">
                        {agents.CompetitiveAnalyst.data.competitive_landscape.market_position.positioning}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">Unique Value Proposition</p>
                      <p className="mt-1 text-blue-900">
                        {agents.CompetitiveAnalyst.data.competitive_landscape.market_position.unique_value_prop}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">Competitive Moat</p>
                      <p className="mt-1 text-purple-900">
                        {agents.CompetitiveAnalyst.data.competitive_landscape.market_position.moat}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Competitors */}
              {agents.CompetitiveAnalyst.data.competitive_landscape.direct_competitors && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">Direct Competitors</h4>
                    <span className="text-sm text-gray-500">
                      {agents.CompetitiveAnalyst.data.competitive_landscape.direct_competitors.length} competitors analyzed
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    {agents.CompetitiveAnalyst.data.competitive_landscape.direct_competitors.map(
                      (competitor: any, i: number) => (
                        <div key={i} className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-3 border-b">
                            <h5 className="font-medium text-gray-900">{competitor.name}</h5>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Strengths</h6>
                                <ul className="space-y-1">
                                  {competitor.strengths.map((s: string, j: number) => (
                                    <li key={j} className="flex items-start">
                                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                                      <span className="text-sm text-gray-600">{s}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h6 className="text-sm font-medium text-gray-700 mb-1">Weaknesses</h6>
                                <ul className="space-y-1">
                                  {competitor.weaknesses.map((w: string, j: number) => (
                                    <li key={j} className="flex items-start">
                                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                                      <span className="text-sm text-gray-600">{w}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            {competitor.differentiation && (
                              <div className="mt-4 pt-3 border-t">
                                <h6 className="text-sm font-medium text-gray-700 mb-1">How We Differentiate</h6>
                                <p className="text-sm text-gray-600">{competitor.differentiation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Barriers to Entry */}
              {agents.CompetitiveAnalyst.data.competitive_landscape.barriers_to_entry && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Barriers to Entry</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Existing Barriers</h5>
                      <ul className="space-y-3">
                        {agents.CompetitiveAnalyst.data.competitive_landscape.barriers_to_entry.existing.map(
                          (barrier: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="h-5 w-5 flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-xs font-medium mr-2 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-gray-700">{barrier}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Potential Barriers</h5>
                      <ul className="space-y-3">
                        {agents.CompetitiveAnalyst.data.competitive_landscape.barriers_to_entry.potential.map(
                          (barrier: string, i: number) => (
                            <li key={i} className="flex items-start">
                              <span className="h-5 w-5 flex-shrink-0 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-xs font-medium mr-2 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-sm text-gray-700">{barrier}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Threat Analysis */}
              {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Threat Analysis</h4>
                  
                  <div className="space-y-4">
                    {/* Incumbent Threats */}
                    {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.incumbent_threats &&
                     agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.incumbent_threats.length > 0 && (
                      <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r">
                        <h5 className="font-medium text-yellow-800 flex items-center mb-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          Incumbent Threats
                        </h5>
                        <ul className="space-y-2">
                          {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.incumbent_threats.map(
                            (threat: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="text-yellow-700 mr-2">•</span>
                                <span className="text-sm text-yellow-700">{threat}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* New Entrant Risks */}
                    {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.new_entrant_risks &&
                     agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.new_entrant_risks.length > 0 && (
                      <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded-r">
                        <h5 className="font-medium text-red-800 flex items-center mb-2">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          New Entrant Risks
                        </h5>
                        <ul className="space-y-2">
                          {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.new_entrant_risks.map(
                            (risk: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="text-red-700 mr-2">•</span>
                                <span className="text-sm text-red-700">{risk}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* Substitute Products */}
                    {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.substitute_products &&
                     agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.substitute_products.length > 0 && (
                      <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r">
                        <h5 className="font-medium text-blue-800 flex items-center mb-2">
                          <Info className="h-4 w-4 mr-1" />
                          Substitute Products
                        </h5>
                        <ul className="space-y-2">
                          {agents.CompetitiveAnalyst.data.competitive_landscape.threat_analysis.substitute_products.map(
                            (sub: string, i: number) => (
                              <li key={i} className="flex items-start">
                                <span className="text-blue-700 mr-2">•</span>
                                <span className="text-sm text-blue-700">{sub}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Committee Analysis */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="bg-purple-50 border-b border-purple-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-gray-900">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Committee Analysis
            </CardTitle>
            <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">
              {safeVerdict.committee_analysis?.members?.length || 0} Members
            </Badge>
          </div>
          <CardDescription className="text-gray-600">
            {safeVerdict.committee_analysis?.summary || 'No committee analysis available for this evaluation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {final_verdict?.committee_analysis ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {final_verdict.committee_analysis.members?.map((member: any) => (
                    <div 
                      key={member.name} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{member.name}</h4>
                          <p className="text-sm text-gray-500">{member.role}</p>
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          member.vote === 'STRONG_INVEST' ? 'bg-green-100 text-green-800' :
                          member.vote === 'CONSIDER' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {member.vote.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Confidence</span>
                          <span>{member.confidence}%</span>
                        </div>
                        <AnalysisProgress value={member.confidence} className="h-1.5" />
                      </div>
                      {member.reasoning && (
                        <p className="mt-2 text-sm text-gray-600">{member.reasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
                {final_verdict.committee_analysis.dissenting_opinions?.length > 0 && (
                <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r">
                  <h4 className="font-medium text-yellow-800 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Dissenting Opinions
                  </h4>
                  <ul className="mt-2 space-y-2 text-sm text-yellow-700">
                    {final_verdict.committee_analysis.dissenting_opinions.map((opinion: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{opinion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                The committee analysis is not available for this evaluation. This could be because the analysis is still in progress or the feature is not enabled.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
