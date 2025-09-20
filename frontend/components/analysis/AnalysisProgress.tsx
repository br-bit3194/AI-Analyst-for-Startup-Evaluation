import React from 'react';
import type { AnalysisProgress } from '../../types/analysis';
import { getStatusMessage, getStatusColor } from '../../services/analysisService';

interface AnalysisProgressProps {
  progress: AnalysisProgress;
  className?: string;
}


const agentNames: Record<string, string> = {
  RiskAnalyst: 'Risk Analyst',
  MarketExpert: 'Market Expert',
  FinanceExpert: 'Finance Expert',
  CompetitiveAnalyst: 'Competitive Analyst',
  TeamEvaluator: 'Team Evaluator',
};

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ progress, className = '' }) => {
  const totalAgents = Object.keys(progress.agents || {}).length;
  const completedAgents = Object.values(progress.agents || {}).filter(a => a.success).length;
  const progressPercent = totalAgents > 0 ? Math.round((completedAgents / totalAgents) * 100) : 0;

  return (
    <div className={`bg-slate-800 rounded-lg p-6 ${className}`}>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-lg font-medium text-slate-200">
            Analysis in Progress
          </h3>
          <span className={`text-sm font-medium ${getStatusColor(progress.status)}`}>
            {getStatusMessage(progress.status)}
          </span>
        </div>
        
        <div className="w-full bg-slate-700 rounded-full h-2.5">
          <div 
            className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm text-slate-400 mt-1">
          {completedAgents} of {totalAgents} analyses complete
        </p>
      </div>

      <div className="space-y-3 mt-6">
        {Object.entries(progress.agents || {}).map(([agentId, agent]) => (
          <div key={agentId} className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              agent.success 
                ? 'bg-green-500' 
                : agent.error 
                  ? 'bg-red-500' 
                  : 'bg-slate-600 animate-pulse'
            }`} />
            <span className="text-sm text-slate-300">
              {agentNames[agentId] || agentId}
              {agent.error && (
                <span className="text-red-400 text-xs ml-2">
                  Error: {agent.error}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      {progress.final_verdict && (
        <div className="mt-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <h4 className="font-medium text-slate-200 mb-2">Preliminary Verdict</h4>
          <div className={`text-xl font-bold ${
            progress.final_verdict.recommendation === 'INVEST' ? 'text-green-400' :
            progress.final_verdict.recommendation === 'CONSIDER' ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {progress.final_verdict.recommendation}
            <span className="text-sm font-normal text-slate-400 ml-2">
              ({progress.final_verdict.confidence_label} Confidence)
            </span>
          </div>
          
          {progress.final_verdict.reasons.length > 0 && (
            <div className="mt-2 text-sm text-slate-300">
              <p className="font-medium mb-1">Key Factors:</p>
              <ul className="list-disc list-inside space-y-1">
                {progress.final_verdict.reasons.map((reason, i) => (
                  <li key={i} className="text-slate-300">{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalysisProgress;
