import React from 'react';
import type { FounderDNA as FounderDNAType } from '../../types';

interface ScoreBarProps {
    label: string;
    score: number;
}
const ScoreBar: React.FC<ScoreBarProps> = ({ label, score }) => {
    const color = score > 75 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500';
    const textColor = score > 75 ? 'text-green-400' : score > 50 ? 'text-yellow-400' : 'text-red-400';
    
    return (
        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-200">{label}</span>
                <span className={`text-sm font-bold ${textColor}`}>{score}/100</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2.5 mb-2">
                <div 
                    className={`${color} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${score}%` }}
                ></div>
            </div>
        </div>
    );
};

const FounderDNA: React.FC<{ dna: FounderDNAType }> = ({ dna }) => {
    return (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/50 h-full shadow-lg">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6 pb-2 border-b border-slate-700/50">
                Founder DNA Analysis
            </h3>
            <div className="space-y-6">
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <ScoreBar label="Communication" score={dna.communicationPatterns.score} />
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">{dna.communicationPatterns.analysis}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <ScoreBar label="Team Dynamics" score={dna.teamDynamics.score} />
                    <p className="text-sm text-slate-300 mt-2 leading-relaxed">{dna.teamDynamics.analysis}</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
                    <h4 className="font-semibold text-blue-300 mb-2 text-sm uppercase tracking-wider">Stress Test Scenario</h4>
                    <p className="text-sm text-slate-300 italic mb-3 border-l-2 border-blue-500 pl-3 py-1 bg-slate-800/30 rounded-r">
                        "{dna.stressTest.scenario}"
                    </p>
                    <h5 className="font-semibold text-blue-300 mt-3 text-sm">Predicted Response:</h5>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">{dna.stressTest.predictedResponse}</p>
                </div>
            </div>
        </div>
    );
};

export default FounderDNA;
