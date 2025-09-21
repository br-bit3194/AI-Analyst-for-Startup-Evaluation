import React, { useState } from 'react';
import type { CommitteePersona } from '../../types';

interface InvestmentCommitteeProps {
    committee: CommitteePersona[];
}

const personaStyles = {
    'Devils Advocate': {
        border: 'border-red-500/50',
        text: 'text-red-400',
        bg: 'bg-red-900/20',
        icon: (
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        )
    },
    'Growth Investor': {
        border: 'border-green-500/50',
        text: 'text-green-400',
        bg: 'bg-green-900/20',
        icon: (
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        )
    },
    'Conservative Investor': {
        border: 'border-blue-500/50',
        text: 'text-blue-400',
        bg: 'bg-blue-900/20',
        icon: (
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    },
    'Impact Investor': {
        border: 'border-teal-500/50',
        text: 'text-teal-400',
        bg: 'bg-teal-900/20',
        icon: (
            <svg className="w-5 h-5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
        )
    }
};

const InvestmentCommittee: React.FC<InvestmentCommitteeProps> = ({ committee }) => {
    const [activeTab, setActiveTab] = useState(0);
    const activePersona = committee[activeTab];
    const activeStyle = personaStyles[activePersona.persona];

    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700/50 shadow-lg overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                    Investment Committee Simulator
                </h3>
                <p className="text-sm text-slate-400 mt-1">Simulate different investment perspectives</p>
            </div>
            
            <div className="px-6 pt-2 pb-4 border-b border-slate-700/50 bg-slate-800/30">
                <nav className="flex space-x-1 overflow-x-auto pb-1" aria-label="Tabs">
                    {committee.map((persona, index) => {
                        const style = personaStyles[persona.persona];
                        const isActive = activeTab === index;
                        return (
                            <button
                                key={persona.persona}
                                onClick={() => setActiveTab(index)}
                                className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                                    isActive 
                                        ? `${style.bg} ${style.text} shadow-md`
                                        : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                                }`}
                            >
                                {style.icon}
                                {persona.persona.split(' ')[0]}
                            </button>
                        );
                    })}
                </nav>
            </div>
            
            <div className="p-6">
                <div key={activePersona.persona} className="animate-fade-in">
                    <div className={`p-4 rounded-xl ${activeStyle.bg} border-l-4 ${activeStyle.border} mb-6`}>
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                {activeStyle.icon}
                            </div>
                            <div>
                                <h4 className={`text-lg font-bold ${activeStyle.text}`}>
                                    {activePersona.persona}'s Verdict
                                </h4>
                                <p className="text-slate-300 mt-1 italic">"{activePersona.keyArgument}"</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                            <div className="flex items-center mb-3">
                                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <h5 className="font-semibold text-green-400">Strengths</h5>
                            </div>
                            <ul className="space-y-2 pl-1">
                                {activePersona.strengths.map((s, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="text-green-400 mr-2 mt-1">•</span>
                                        <span className="text-sm text-slate-300">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
                            <div className="flex items-center mb-3">
                                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <h5 className="font-semibold text-red-400">Concerns</h5>
                            </div>
                            <ul className="space-y-2 pl-1">
                                {activePersona.concerns.map((c, i) => (
                                    <li key={i} className="flex items-start">
                                        <span className="text-red-400 mr-2 mt-1">•</span>
                                        <span className="text-sm text-slate-300">{c}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvestmentCommittee;
