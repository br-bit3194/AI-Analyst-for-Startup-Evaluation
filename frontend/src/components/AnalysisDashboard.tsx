import React, { useEffect, useState } from 'react';
import type { DealAnalysis, FinancialMetrics } from '../types';
import OverallVerdict from './dashboard/OverallVerdict';
import FounderDNA from './dashboard/FounderDNA';
import MarketPulse from './dashboard/MarketPulse';
import InvestmentCommittee from './dashboard/InvestmentCommittee';
import InvestmentMemory from './dashboard/InvestmentMemory';
import PortfolioSynergies from './dashboard/PortfolioSynergies';
import FeatureCards from './dashboard/FeatureCards';
import { FinancialChart } from './charts/FinancialChart';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

interface AnalysisDashboardProps {
  analysis: DealAnalysis;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis }) => {
  const [financialData, setFinancialData] = useState<FinancialMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have financial data or no document ID, don't fetch
    if (financialData || !analysis.documentId) return;

    const fetchFinancialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/finance/metrics/${analysis.documentId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch financial data');
        }
        const data = await response.json();
        setFinancialData(data);
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError('Failed to load financial metrics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [analysis.documentId]);

  return (
    <div className="animate-fade-in">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="-mx-4 sm:mx-0">
          <OverallVerdict verdict={analysis.overallVerdict} />
        </div>

        {/* Financial Metrics Section */}
        {analysis.documentId && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Financial Metrics</h2>
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : financialData ? (
              <div className="space-y-6">
                {/* MRR and Burn Rate */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FinancialChart
                    title="Monthly Recurring Revenue (MRR)"
                    data={financialData.health.mrr}
                    type="line"
                    yAxisLabel="MRR"
                    isCurrency
                  />
                  <FinancialChart
                    title="Monthly Burn Rate"
                    data={financialData.health.burn_rate}
                    type="line"
                    yAxisLabel="Amount"
                    isCurrency
                  />
                </div>

                {/* Cash Flow */}
                <FinancialChart
                  title="Cash Flow"
                  data={[
                    ...financialData.cash_flow.operating_activities.map(item => ({
                      ...item,
                      name: 'Operating',
                      value: item.value,
                    })),
                    ...financialData.cash_flow.free_cash_flow.map(item => ({
                      ...item,
                      name: 'Free Cash Flow',
                      value: item.value,
                    })),
                  ]}
                  type="area"
                  yAxisLabel="Amount"
                  isCurrency
                />

                {/* Unit Economics */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Customer Acquisition Cost</h3>
                    <p className="text-2xl font-bold">
                      ${financialData.unit_economics.cac?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">Lifetime Value</h3>
                    <p className="text-2xl font-bold">
                      ${financialData.unit_economics.ltv?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="font-semibold mb-2">LTV:CAC Ratio</h3>
                    <p className="text-2xl font-bold">
                      {financialData.unit_economics.ltv_to_cac_ratio?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <InvestmentCommittee committee={analysis.investmentCommittee} />
              <InvestmentMemory memory={analysis.investmentMemory} />
              <PortfolioSynergies synergies={analysis.portfolioSynergies} />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <FounderDNA dna={analysis.founderDna} />
              <MarketPulse pulse={analysis.marketPulse} />
            </div>
          </div>
          
          <div className="pt-4">
            <FeatureCards />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;
