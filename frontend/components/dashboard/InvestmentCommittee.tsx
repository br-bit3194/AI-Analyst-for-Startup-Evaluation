import React, { useState } from 'react';
import type { CommitteePersona } from '../../types';

interface InvestmentCommitteeProps {
    committee: CommitteePersona[];
}

const personaStyles = {
    'Devils Advocate': 'border-red-500 text-red-400',
    'Growth Investor': 'border-green-500 text-green-400',
    'Conservative Investor': 'border-blue-500 text-blue-400',
    'Impact Investor': 'border-teal-500 text-teal-400'
};

const InvestmentCommittee: React.FC<InvestmentCommitteeProps> = ({ committee }) => {
    const [activeTab, setActiveTab] = useState(0);
    const activePersona = committee[activeTab];
    const activeStyle = personaStyles[activePersona.persona];

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-6">
                <h3 className="text-lg font-bold text-white">Investment Committee Simulator</h3>
            </div>
            <div className="border-b border-slate-700 px-6">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {committee.map((persona, index) => (
                        <button
                            key={persona.persona}
                            onClick={() => setActiveTab(index)}
                            className={`${
                                activeTab === index
                                    ? `border-brand-accent text-brand-accent`
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                            } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                        >
                            {persona.persona}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-6">
                <div key={activePersona.persona} className="animate-fade-in">
                    <h4 className={`text-md font-bold ${activeStyle.split(' ')[1]}`}>{activePersona.persona}'s Verdict</h4>
                    <p className="text-slate-300 mt-2 italic">"{activePersona.keyArgument}"</p>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="font-semibold text-green-400 mb-2">Strengths</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                                {activePersona.strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-semibold text-red-400 mb-2">Concerns</h5>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                                {activePersona.concerns.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentCommittee;
