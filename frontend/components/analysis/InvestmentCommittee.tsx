import React from 'react';
import type { InvestmentCommitteeResponse } from '../../types/analysis';

interface InvestmentCommitteeProps {
  committeeData: InvestmentCommitteeResponse;
  className?: string;
}

const InvestmentCommittee: React.FC<InvestmentCommitteeProps> = ({ committeeData, className = '' }) => {
  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'STRONG_INVEST': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'CONSIDER': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      case 'HIGH_RISK': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'PASS': return 'text-red-400 bg-red-900/20 border-red-500';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-500';
    }
  };

  const getVoteLabel = (vote: string) => {
    switch (vote) {
      case 'STRONG_INVEST': return 'Strong Invest';
      case 'CONSIDER': return 'Consider';
      case 'HIGH_RISK': return 'High Risk';
      case 'PASS': return 'Pass';
      default: return vote;
    }
  };

  const getConsensusColor = (score: number) => {
    if (score >= 0.75) return 'text-green-400 bg-green-900/20';
    if (score >= 0.5) return 'text-yellow-400 bg-yellow-900/20';
    return 'text-red-400 bg-red-900/20';
  };

  const getMemberVoteIcon = (vote: string) => {
    switch (vote) {
      case 'STRONG_INVEST': return (
        <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
      case 'CONSIDER': return (
        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
      case 'HIGH_RISK': return (
        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
      case 'PASS': return (
        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
      default: return (
        <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Committee Header */}
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-200">Investment Committee Simulation</h2>
              <p className="text-sm text-slate-400">Multi-agent VC committee debate and voting</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Committee Meeting</p>
            <p className="text-sm font-medium text-slate-300">
              {committeeData.timestamp && new Date(committeeData.timestamp).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Consensus Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h4 className="font-semibold text-slate-200 mb-2">Final Verdict</h4>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getVoteColor(committeeData.final_verdict)}`}>
              {getVoteLabel(committeeData.final_verdict)}
            </span>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h4 className="font-semibold text-slate-200 mb-2">Consensus Level</h4>
            <div className="flex items-center space-x-2">
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getConsensusColor(committeeData.consensus_score)}`}
                  style={{ width: `${committeeData.consensus_score * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-bold text-slate-300">
                {Math.round(committeeData.consensus_score * 100)}%
              </span>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
            <h4 className="font-semibold text-slate-200 mb-2">Majority Vote</h4>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold border ${getVoteColor(committeeData.majority_vote)}`}>
              {getVoteLabel(committeeData.majority_vote)}
            </span>
          </div>
        </div>
      </div>

      {/* Committee Members */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {committeeData.committee_members.map((member, index) => (
          <div key={index} className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-colors">
            {/* Member Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-slate-200">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-200">{member.name}</h3>
                  <p className="text-sm text-slate-400">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getMemberVoteIcon(member.vote)}
                <span className={`px-2 py-1 rounded text-xs font-bold border ${getVoteColor(member.vote)}`}>
                  {getVoteLabel(member.vote)}
                </span>
              </div>
            </div>

            {/* Personality */}
            <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Personality:</p>
              <p className="text-sm text-slate-300 italic">{member.personality}</p>
            </div>

            {/* Analysis */}
            <div className="mb-4">
              <h4 className="font-semibold text-slate-200 mb-2">Analysis</h4>
              <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
                <p className="text-sm text-slate-300 leading-relaxed">{member.analysis}</p>
              </div>
            </div>

            {/* Confidence & Reasoning */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Confidence</h4>
                <div className="flex items-center space-x-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        member.confidence >= 80 ? 'bg-green-500' :
                        member.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${member.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    {Math.round(member.confidence)}%
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-200 mb-2">Reasoning</h4>
                <p className="text-sm text-slate-300 bg-slate-700/30 p-2 rounded border border-slate-600">
                  {member.reasoning}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Debate Summary */}
      {committeeData.key_debate_points.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-slate-200 mb-4">Key Debate Points</h3>
          <div className="space-y-3">
            {committeeData.key_debate_points.map((point, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-lg border-l-4 border-blue-500">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0"></div>
                <p className="text-slate-300 text-sm">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dissenting Opinions */}
      {committeeData.dissenting_opinions.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-slate-200 mb-4">Dissenting Opinions</h3>
          <div className="space-y-3">
            {committeeData.dissenting_opinions.map((opinion, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-red-900/10 rounded-lg border-l-4 border-red-500">
                <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0"></div>
                <p className="text-slate-300 text-sm">{opinion}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final Decision Summary */}
      <div className={`bg-slate-800 rounded-xl p-6 border-2 ${getVoteColor(committeeData.final_verdict)}`}>
        <h3 className="text-xl font-bold text-slate-200 mb-4">Final Committee Decision</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-slate-200 mb-2">
              Committee Recommendation: <span className={`font-bold ${getVoteColor(committeeData.final_verdict)}`}>
                {getVoteLabel(committeeData.final_verdict)}
              </span>
            </p>
            <p className="text-slate-400 text-sm">
              Consensus Score: <span className="font-medium text-slate-300">
                {Math.round(committeeData.consensus_score * 100)}%
              </span> | Majority Vote: <span className="font-medium text-slate-300">
                {getVoteLabel(committeeData.majority_vote)}
              </span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-200">
              {getMemberVoteIcon(committeeData.final_verdict)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCommittee;
