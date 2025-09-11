import React from 'react';
import type { FounderDNA as FounderDNAType } from '../../types';

interface ScoreBarProps {
    label: string;
    score: number;
}
const ScoreBar: React.FC<ScoreBarProps> = ({ label, score }) => {
    const color = score > 75 ? 'bg-green-500' : score > 50 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-300">{label}</span>
                <span className="text-sm font-bold text-white">{score}/100</span>
            </div>
            <div className="w-full bg-slate-600 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${score}%` }}></div>
            </div>
        </div>
    );
};

const FounderDNA: React.FC<{ dna: FounderDNAType }> = ({ dna }) => {
    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full">
            <h3 className="text-lg font-bold text-white mb-4">Founder DNA Analysis</h3>
            <div className="space-y-6">
                <div>
                    <ScoreBar label="Communication" score={dna.communicationPatterns.score} />
                    <p className="text-sm text-slate-400 mt-2">{dna.communicationPatterns.analysis}</p>
                </div>
                <div>
                    <ScoreBar label="Team Dynamics" score={dna.teamDynamics.score} />
                    <p className="text-sm text-slate-400 mt-2">{dna.teamDynamics.analysis}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-slate-200 mb-1">Stress Test Scenario</h4>
                    <p className="text-sm text-slate-400 italic">"{dna.stressTest.scenario}"</p>
                    <h5 className="font-semibold text-slate-300 mt-2 text-sm">Predicted Response:</h5>
                    <p className="text-sm text-slate-400">{dna.stressTest.predictedResponse}</p>
                </div>
            </div>
        </div>
    );
};

export default FounderDNA;
