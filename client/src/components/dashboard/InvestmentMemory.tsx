import React from 'react';
import type { InvestmentMemoryInsight } from '../../types';

interface InvestmentMemoryProps {
    memory: InvestmentMemoryInsight[];
}

const InvestmentMemory: React.FC<InvestmentMemoryProps> = ({ memory }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white mb-4">Institutional Memory</h3>
            <div className="space-y-4">
                {memory.map((insight, index) => (
                    <div key={index} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                        <p className="font-semibold text-brand-accent">Pattern: <span className="text-slate-300">{insight.pattern}</span></p>
                        <p className="text-sm text-slate-400 mt-1">
                            <span className="font-medium text-slate-500">Past Example:</span> {insight.pastExample}
                        </p>
                        <p className="text-sm text-slate-400 mt-1">
                           <span className="font-medium text-slate-500">Relevance:</span> {insight.relevance}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InvestmentMemory;
