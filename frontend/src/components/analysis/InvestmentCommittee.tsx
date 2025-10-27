import React, { useMemo } from 'react';
import { Card, Progress, Tooltip } from 'antd';
import { CheckCircleFilled, ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons';
import type { InvestmentCommitteeResponse } from '../../types/analysis';

interface InvestmentCommitteeProps {
  committeeData: InvestmentCommitteeResponse;
  className?: string;
}

const InvestmentCommittee: React.FC<InvestmentCommitteeProps> = ({ committeeData, className = '' }) => {
  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'STRONG_INVEST': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'CONSIDER': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'HIGH_RISK': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'PASS': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-indigo-600 bg-indigo-50 border-indigo-200';
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
    if (score >= 0.75) return 'bg-gradient-to-r from-emerald-400 to-teal-500';
    if (score >= 0.5) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    return 'bg-gradient-to-r from-rose-400 to-pink-500';
  };

  // Calculate vote distribution for visualization
  const voteDistribution = useMemo(() => {
    const counts = committeeData.committee_members.reduce((acc, member) => {
      acc[member.vote] = (acc[member.vote] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = committeeData.committee_members.length;
    return Object.entries(counts).map(([vote, count]) => ({
      vote,
      count,
      percentage: Math.round((count / total) * 100),
      color: getVoteColor(vote).split(' ')[0].replace('text-', 'bg-') + ' bg-opacity-20'
    }));
  }, [committeeData.committee_members]);

  const getMemberVoteIcon = (vote: string, size = 'w-5 h-5') => {
    const baseClass = `${size} flex-shrink-0`;
    switch (vote) {
      case 'STRONG_INVEST': return (
        <div className={`${baseClass} text-emerald-600`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      );
      case 'CONSIDER': return (
        <div className={`${baseClass} text-blue-600`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
      case 'HIGH_RISK': return (
        <div className={`${baseClass} text-amber-600`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
      case 'PASS': return (
        <div className={`${baseClass} text-rose-600`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
      default: return (
        <div className={`${baseClass} text-gray-400`}>
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Committee Header */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Investment Committee Simulation</h2>
              <p className="text-sm text-indigo-600 font-medium">Multi-agent VC committee debate and voting</p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-lg border border-indigo-100 shadow-sm">
            <p className="text-xs text-indigo-500 font-medium">Committee Meeting</p>
            <p className="text-sm font-semibold text-gray-800">
              {committeeData.timestamp && new Date(committeeData.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Consensus Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Final Verdict */}
          <div className="bg-white/80 rounded-xl p-5 border-2 border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h4 className="font-semibold text-gray-700">Final Verdict</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getVoteColor(committeeData.final_verdict)}`}>
                {getVoteLabel(committeeData.final_verdict)}
              </span>
              {getMemberVoteIcon(committeeData.final_verdict, 'w-6 h-6')}
            </div>
          </div>

          {/* Consensus Level */}
          <div className="bg-white/80 rounded-xl p-5 border-2 border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <h4 className="font-semibold text-gray-700">Consensus Level</h4>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-800">
                  {Math.round(committeeData.consensus_score * 100)}%
                </span>
                <span className="text-sm font-medium text-indigo-600">
                  {committeeData.consensus_score >= 0.75 ? 'High' : committeeData.consensus_score >= 0.5 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${getConsensusColor(committeeData.consensus_score)}`}
                  style={{ width: `${committeeData.consensus_score * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Majority Vote */}
          <div className="bg-white/80 rounded-xl p-5 border-2 border-indigo-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center space-x-2 mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <h4 className="font-semibold text-gray-700">Majority Vote</h4>
            </div>
            <div className="flex items-center justify-between">
              <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold border-2 ${getVoteColor(committeeData.majority_vote)}`}>
                {getVoteLabel(committeeData.majority_vote)}
              </span>
        </div>

        {/* Vote Distribution */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Vote Distribution</span>
            <span>{committeeData.committee_members.length} members</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full flex">
              {voteDistribution.map((item, idx) => (
                <Tooltip key={idx} title={`${item.vote} (${item.percentage}%)`}>
                  <div
                    className={`h-full ${item.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </Tooltip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {voteDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center text-xs">
                <span className={`w-2 h-2 rounded-full ${item.color.replace('bg-opacity-20', '')} mr-1`}></span>
                {item.vote}: {item.count} ({item.percentage}%)
              </div>
            ))}
          </div>
        </div>

        {/* Key Debate Points */}
        {committeeData.key_debate_points?.length > 0 && (
          <Card
            title={
              <div className="flex items-center">
                <InfoCircleFilled className="text-blue-500 mr-2" />
                <span>Key Debate Points</span>
              </div>
            }
            className="border-0 shadow-sm"
          >
            <ul className="space-y-3">
              {committeeData.key_debate_points.map((point, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-medium mr-2 mt-0.5 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {/* Dissenting Opinions */}
        {committeeData.dissenting_opinions?.length > 0 && (
          <Card
            title={
              <div className="flex items-center">
                <ExclamationCircleFilled className="text-amber-500 mr-2" />
                <span>Dissenting Opinions</span>
              </div>
            }
            className="border-0 shadow-sm"
          >
            <div className="space-y-4">
              {committeeData.dissenting_opinions.map((opinion, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  </div>
                  <p className="ml-3 text-gray-700">{opinion}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Committee Members */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {committeeData.committee_members.map((member, index) => {
            const initials = member.name.split(' ').map(n => n[0]).join('');
            const bgGradients = [
              'from-blue-500 to-cyan-500',
              'from-purple-500 to-pink-500',
              'from-emerald-500 to-teal-500',
              'from-amber-500 to-yellow-500',
              'from-indigo-500 to-violet-500',
              'from-rose-500 to-pink-500'
            ];
            const bgGradient = bgGradients[index % bgGradients.length];

            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Member Header */}
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${bgGradient} rounded-xl flex items-center justify-center shadow-md`}>
                      <span className="text-sm font-bold text-white">
                        {initials}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                      <p className="text-sm text-indigo-600 font-medium">{member.role}</p>
                      <div className="mt-1 flex items-center space-x-2">
                        {getMemberVoteIcon(member.vote, 'w-4 h-4')}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getVoteColor(member.vote)}`}>
                          {getVoteLabel(member.vote)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personality & Analysis */}
                <div className="space-y-3">
                  <div className="p-4 bg-indigo-50 rounded-xl border-2 border-indigo-100">
                    <div className="flex items-center text-indigo-700 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold">PERSONALITY</span>
                    </div>
                    <p className="text-sm text-gray-700">{member.personality}</p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                    <div className="flex items-center text-blue-700 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold">ANALYSIS</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{member.analysis}</p>
                  </div>
                </div>

                {/* Vote & Reasoning */}
                <div className="space-y-3">
                  <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-100">
                    <div className="flex items-center text-amber-700 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.332-.441-.616-.952.86-2.351 1.226-.97 1.855-1.856 1.905-3.113a1 1 0 00-1.972-.333z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs font-semibold">VOTE & CONFIDENCE</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVoteColor(member.vote)}`}>
                        {getVoteLabel(member.vote)}
                      </span>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {Math.round(member.confidence)}%
                        </div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full ${
                              member.confidence >= 80 ? 'bg-emerald-500' :
                              member.confidence >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${member.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border-2 border-green-100">
                    <div className="flex items-center text-green-700 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                      <span className="text-xs font-semibold">REASONING</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{member.reasoning}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                  <div className="flex items-center text-gray-700 mb-2">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-semibold">NOTES</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {member.vote === committeeData.majority_vote ? (
                      <span className="text-green-600 flex items-center">
                        <CheckCircleFilled className="mr-1" /> In agreement with committee consensus
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center">
                        <ExclamationCircleFilled className="mr-1" /> Dissenting opinion - see above
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Final Decision Summary */}
        <div className={`rounded-2xl p-8 ${getVoteColor(committeeData.final_verdict)} shadow-lg`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Final Committee Decision</h3>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-700">
                  Committee Recommendation:
                  <span className={`ml-2 px-4 py-1.5 rounded-full text-base font-bold ${getVoteColor(committeeData.final_verdict).replace('border-2', 'border-0')} shadow-sm`}>
                    {getVoteLabel(committeeData.final_verdict)}
                  </span>
                </p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Consensus:</span>
                    <span className="ml-1 font-bold text-gray-800">
                      {Math.round(committeeData.consensus_score * 100)}%
                    </span>
                  </div>
                  <div className="h-4 w-px bg-gray-300"></div>
                  <div className="flex items-center">
                    <span className="text-gray-600 font-medium">Majority:</span>
                    <span className="ml-1 font-bold text-gray-800">
                      {getVoteLabel(committeeData.majority_vote)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                {getMemberVoteIcon(committeeData.final_verdict, 'w-10 h-10')}
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentCommittee;
