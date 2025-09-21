import React from 'react';
import type { DealAnalysis } from '../../types';

interface OverallVerdictProps {
    verdict: DealAnalysis['overallVerdict'];
}

const getVerdictStyles = (recommendation: 'PASS' | 'CONSIDER' | 'INVEST') => {
    switch (recommendation) {
        case 'INVEST':
            return {
                bg: 'bg-green-500/10',
                border: 'border-green-500',
                text: 'text-green-400',
                ring: 'ring-green-500'
            };
        case 'CONSIDER':
            return {
                bg: 'bg-yellow-500/10',
                border: 'border-yellow-500',
                text: 'text-yellow-400',
                ring: 'ring-yellow-500'
            };
        case 'PASS':
            return {
                bg: 'bg-red-500/10',
                border: 'border-red-500',
                text: 'text-red-400',
                ring: 'ring-red-500'
            };
        default:
            return {
                bg: 'bg-slate-700',
                border: 'border-slate-600',
                text: 'text-slate-300',
                ring: 'ring-slate-500'
            };
    }
};

const OverallVerdict: React.FC<OverallVerdictProps> = ({ verdict }) => {
    const styles = getVerdictStyles(verdict.recommendation);
    const confidencePercentage = `${verdict.confidenceScore}%`;

    return (
        <div className={`p-6 rounded-xl shadow-lg border ${styles.bg} ${styles.border}`}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">Oracle's Verdict</h2>
                    <p className={`text-4xl font-bold ${styles.text}`}>{verdict.recommendation}</p>
                </div>
                <div className="w-full md:w-1/3">
                    <div className="flex justify-between mb-1">
                        <span className="text-base font-medium text-slate-300">Confidence</span>
                        <span className={`text-sm font-medium ${styles.text}`}>{confidencePercentage}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2.5">
                        <div className={`${styles.text.replace('text', 'bg')} h-2.5 rounded-full`} style={{ width: confidencePercentage }}></div>
                    </div>
                </div>
            </div>
            <p className="mt-4 text-slate-300">{verdict.summary}</p>
        </div>
    );
};

export default OverallVerdict;
