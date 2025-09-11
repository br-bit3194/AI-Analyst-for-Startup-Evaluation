import React from 'react';
import type { PortfolioSynergy } from '../../types';

interface PortfolioSynergiesProps {
    synergies: PortfolioSynergy[];
}

const PortfolioSynergies: React.FC<PortfolioSynergiesProps> = ({ synergies }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Portfolio Orchestra</h3>
            <div className="space-y-4">
                {synergies.map((synergy, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                         <div className="flex items-center gap-3">
                            <span className="flex-shrink-0 bg-brand-blue/20 text-brand-accent text-sm font-bold p-2 rounded-md">{synergy.company}</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="font-semibold text-slate-200">New Deal</span>
                        </div>
                        <p className="font-semibold text-slate-300 mt-3">{synergy.synergyOpportunity}</p>
                        <p className="text-sm text-slate-400 mt-1">
                           <span className="font-medium text-slate-500">Potential Impact:</span> {synergy.potentialImpact}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PortfolioSynergies;
