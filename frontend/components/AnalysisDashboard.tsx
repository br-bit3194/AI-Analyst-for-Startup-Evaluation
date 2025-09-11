import React from 'react';
import type { DealAnalysis } from '../types';
import OverallVerdict from './dashboard/OverallVerdict';
import FounderDNA from './dashboard/FounderDNA';
import MarketPulse from './dashboard/MarketPulse';
import InvestmentCommittee from './dashboard/InvestmentCommittee';
import InvestmentMemory from './dashboard/InvestmentMemory';
import PortfolioSynergies from './dashboard/PortfolioSynergies';


interface AnalysisDashboardProps {
  analysis: DealAnalysis;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis }) => {
  return (
    <div className="space-y-8 animate-fade-in">
        <OverallVerdict verdict={analysis.overallVerdict} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                <InvestmentCommittee committee={analysis.investmentCommittee} />
                <InvestmentMemory memory={analysis.investmentMemory} />
                <PortfolioSynergies synergies={analysis.portfolioSynergies} />
            </div>
            <div className="space-y-8">
                 <FounderDNA dna={analysis.founderDna} />
                 <MarketPulse pulse={analysis.marketPulse} />
            </div>
        </div>
    </div>
  );
};

export default AnalysisDashboard;
