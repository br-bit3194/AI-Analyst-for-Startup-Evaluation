import React, { useState, useEffect } from 'react';
import type { AnalysisResponse } from '../../types/analysis';
import { websocketService, type ProgressUpdate } from '../../services/websocketService';

interface AnalysisResultsProps {
  analysis: AnalysisResponse;
  className?: string;
}

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, className = '' }) => {
  // Check if we have the analysis data
  const [currentAgent, setCurrentAgent] = useState<string>('');
  
  useEffect(() => {
    if (analysis.status === 'processing') {
      const handleProgressUpdate = (update: ProgressUpdate) => {
        if (update.agentName) {
          setCurrentAgent(update.agentName);
        }
      };
      
      websocketService.subscribe(handleProgressUpdate);
      
      return () => {
        websocketService.unsubscribe(handleProgressUpdate);
      };
    }
  }, [analysis.status]);
  
  const hasResults = analysis.status === 'completed' && analysis.result;
  
  if (!hasResults) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 text-center ${className}`}>
        <p className="text-slate-400">
          {analysis.status === 'processing' 
            ? 'Analysis in progress...' 
            : 'No analysis results available yet.'}
        </p>
        {analysis.status === 'processing' && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-blue-400">
              {currentAgent 
                ? `${currentAgent} is analyzing...` 
                : analysis.message || 'Analyzing pitch and website data...'}
            </p>
            {analysis.progress && (
              <div className="mt-2 w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, analysis.progress))}%` }}
                ></div>
              </div>
            )}
          </div>
        )}
        {analysis.status === 'error' && (
          <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-md">
            <p className="text-red-400">{analysis.message || 'An error occurred during analysis'}</p>
          </div>
        )}
      </div>
    );
  }

  const { result } = analysis;
  
  // Extract agent analyses
  const { agents = {}, final_verdict } = result || {};
  const { RiskAnalyst, MarketExpert, FinanceExpert, CompetitiveAnalyst, TeamEvaluator } = agents;
  
  // Debug log to check the competitive analysis data
  console.log('CompetitiveAnalyst data:', CompetitiveAnalyst);

  // Get verdict from final_verdict
  const verdict = final_verdict?.recommendation || 'UNKNOWN';
  const confidence = final_verdict?.confidence ? Math.round(final_verdict.confidence * 100) : 0;

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_INVEST':
      case 'INVEST': 
        return 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg';
      case 'CONSIDER': 
        return 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg';
      case 'HIGH_RISK': 
        return 'text-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-lg';
      case 'PASS': 
        return 'text-rose-600 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 shadow-lg';
      default: 
        return 'text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 shadow-lg';
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_INVEST':
      case 'INVEST': 
        return 'Strong Investment Opportunity';
      case 'CONSIDER': 
        return 'Consider for Investment';
      case 'HIGH_RISK': 
        return 'High Risk - Use Caution';
      case 'PASS': 
        return 'Do Not Invest';
      default: 
        return verdict;
    }
  };

  const renderAgentAnalysis = (agent: any, title: string) => {
    if (!agent?.success) return null;
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          {agent.data && Object.entries(agent.data).map(([key, value]) => (
            <div key={key} className="mb-4">
              <h4 className="font-medium text-gray-700 capitalize mb-1">
                {key.split('_').join(' ')}
              </h4>
              {typeof value === 'string' ? (
                <p className="text-sm text-gray-600 whitespace-pre-line">{value}</p>
              ) : typeof value === 'object' && value !== null ? (
                <div className="text-sm text-gray-600">
                  {JSON.stringify(value, null, 2)}
                </div>
              ) : (
                <p className="text-sm text-gray-600">{String(value)}</p>
              )}
            </div>
          ))}
          {agent.error && (
            <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
              <p className="font-medium">Error:</p>
              <p>{agent.error}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Format the committee debate section
  const renderCommitteeDebate = (debates: any[] = []) => {
    if (!Array.isArray(debates) || debates.length === 0) {
      return null;
    }

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
        <h3 className="text-lg font-medium mb-4">Investment Committee Debate</h3>
        <div className="space-y-6">
          {debates.map((debate, index) => (
            <div key={index} className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-medium">{debate.member?.charAt(0) || 'M'}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{debate.member || 'Committee Member'}</h4>
                    <span className="text-xs text-gray-500">
                      {debate.role || 'Investment Analyst'}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                    {debate.comment}
                  </div>
                  {debate.sentiment && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        debate.sentiment === 'positive' 
                          ? 'bg-green-100 text-green-800' 
                          : debate.sentiment === 'negative' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {debate.sentiment.charAt(0).toUpperCase() + debate.sentiment.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {index < debates.length - 1 && <div className="border-t border-gray-100 my-4"></div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden ${className}`}>
      {/* Verdict Banner */}
      <div className={`p-6 border-b ${getVerdictColor(verdict)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Investment Verdict: {verdict}</h2>
            <p className="text-sm opacity-80 mt-1">
              {getVerdictLabel(verdict)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-80">Confidence</div>
            <div className="text-2xl font-bold">
              {confidence}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Final Verdict */}
        {final_verdict && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Final Verdict</h3>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-gray-700">
                <span className="font-medium">Recommendation:</span> {final_verdict.recommendation}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Confidence:</span> {confidence}%
              </p>
              {final_verdict.reasons?.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-medium text-gray-700">Reasons:</h4>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    {final_verdict.reasons.map((reason, i) => (
                      <li key={i} className="text-gray-600">{reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agent Analyses */}
        <div className="space-y-8">
          {FinanceExpert && renderAgentAnalysis(FinanceExpert, 'Financial Analysis')}
          
          {/* Enhanced Competitive Analysis Section */}
          {CompetitiveAnalyst?.success && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Competitive Analysis</h3>
              
              {CompetitiveAnalyst.data?.competitive_landscape ? (
                <div className="space-y-6">
                  {/* Direct Competitors */}
                  {CompetitiveAnalyst.data.competitive_landscape.direct_competitors?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Direct Competitors</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        {CompetitiveAnalyst.data.competitive_landscape.direct_competitors.map((competitor: any, idx: number) => (
                          <div key={idx} className="p-4 border rounded-lg bg-gray-50">
                            <h5 className="font-medium text-gray-800">{competitor.name || `Competitor ${idx + 1}`}</h5>
                            
                            {competitor.strengths?.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-green-700">Strengths:</span>
                                <ul className="list-disc pl-5 mt-1">
                                  {competitor.strengths.map((strength: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-600">{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {competitor.weaknesses?.length > 0 && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-red-700">Weaknesses:</span>
                                <ul className="list-disc pl-5 mt-1">
                                  {competitor.weaknesses.map((weakness: string, i: number) => (
                                    <li key={i} className="text-sm text-gray-600">{weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {competitor.differentiation && (
                              <div className="mt-2">
                                <span className="text-sm font-medium text-blue-700">Differentiation:</span>
                                <p className="text-sm text-gray-600 mt-1">{competitor.differentiation}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Market Position */}
                  {CompetitiveAnalyst.data.competitive_landscape.market_position && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="font-medium text-blue-800 mb-2">Market Position</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Positioning</p>
                          <p className="text-sm text-gray-600">{CompetitiveAnalyst.data.competitive_landscape.market_position.positioning || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Unique Value Prop</p>
                          <p className="text-sm text-gray-600">{CompetitiveAnalyst.data.competitive_landscape.market_position.unique_value_prop || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Competitive Moat</p>
                          <p className="text-sm text-gray-600">{CompetitiveAnalyst.data.competitive_landscape.market_position.moat || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Threat Analysis */}
                  {CompetitiveAnalyst.data.competitive_landscape.threat_analysis && (
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                      <h4 className="font-medium text-red-800 mb-3">Threat Analysis</h4>
                      <div className="grid md:grid-cols-3 gap-4">
                        {CompetitiveAnalyst.data.competitive_landscape.threat_analysis.incumbent_threats?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700">Incumbent Threats</p>
                            <ul className="list-disc pl-5 mt-1">
                              {CompetitiveAnalyst.data.competitive_landscape.threat_analysis.incumbent_threats.map((threat: string, i: number) => (
                                <li key={i} className="text-sm text-red-600">{threat}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {CompetitiveAnalyst.data.competitive_landscape.threat_analysis.new_entrant_risks?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700">New Entrant Risks</p>
                            <ul className="list-disc pl-5 mt-1">
                              {CompetitiveAnalyst.data.competitive_landscape.threat_analysis.new_entrant_risks.map((risk: string, i: number) => (
                                <li key={i} className="text-sm text-red-600">{risk}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {CompetitiveAnalyst.data.competitive_landscape.threat_analysis.substitute_products?.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-red-700">Substitute Products</p>
                            <ul className="list-disc pl-5 mt-1">
                              {CompetitiveAnalyst.data.competitive_landscape.threat_analysis.substitute_products.map((sub: string, i: number) => (
                                <li key={i} className="text-sm text-red-600">{sub}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Barriers to Entry */}
                  {CompetitiveAnalyst.data.competitive_landscape.barriers_to_entry && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <h4 className="font-medium text-yellow-800 mb-3">Barriers to Entry</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-yellow-700">Existing Barriers</p>
                          <ul className="list-disc pl-5 mt-1">
                            {CompetitiveAnalyst.data.competitive_landscape.barriers_to_entry.existing?.map((barrier: string, i: number) => (
                              <li key={i} className="text-sm text-yellow-700">{barrier}</li>
                            )) || <li className="text-sm text-gray-500">None identified</li>}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-700">Potential Barriers</p>
                          <ul className="list-disc pl-5 mt-1">
                            {CompetitiveAnalyst.data.competitive_landscape.barriers_to_entry.potential?.map((barrier: string, i: number) => (
                              <li key={i} className="text-sm text-yellow-700">{barrier}</li>
                            )) || <li className="text-sm text-gray-500">None identified</li>}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">
                  {CompetitiveAnalyst.data ? (
                    <p>No competitive landscape data available in the expected format.</p>
                  ) : (
                    <p>No competitive analysis data available.</p>
                  )}
                </div>
              )}
            </div>
          )}
          
          {TeamEvaluator && renderAgentAnalysis(TeamEvaluator, 'Team Evaluation')}
          {MarketExpert && renderAgentAnalysis(MarketExpert, 'Market Analysis')}
          {RiskAnalyst && renderAgentAnalysis(RiskAnalyst, 'Risk Analysis')}
        </div>

        {/* Committee Analysis */}
        {result?.committee_analysis && (
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Investment Committee Analysis</h3>
            
            {/* Consensus Summary */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800">Final Committee Verdict</h4>
                  <div className="flex items-center mt-2">
                    <span className={`px-4 py-2 rounded-full text-lg font-bold ${
                      result.committee_analysis.final_verdict === 'STRONG_INVEST' ? 'bg-green-100 text-green-800' :
                      result.committee_analysis.final_verdict === 'INVEST' ? 'bg-blue-100 text-blue-800' :
                      result.committee_analysis.final_verdict === 'CONSIDER' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {result.committee_analysis.final_verdict}
                    </span>
                    <div className="ml-4">
                      <div className="text-sm text-gray-600">Confidence</div>
                      <div className="text-xl font-bold">
                        {Math.round((result.committee_analysis.consensus_score || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
                {result.committee_analysis.majority_vote && (
                  <div className="mt-4 md:mt-0">
                    <div className="text-sm text-gray-600">Majority Vote</div>
                    <div className="text-lg font-semibold">
                      {result.committee_analysis.majority_vote}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Committee Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {result.committee_analysis.members?.map((member: any, index: number) => (
                <div key={index} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl mr-4">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        member.vote === 'STRONG_INVEST' || member.vote === 'INVEST' ? 'bg-green-100 text-green-800' :
                        member.vote === 'CONSIDER' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.vote}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Confidence</span>
                      <span>{Math.round(member.confidence || 0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${member.confidence || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-1">Analysis</h5>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{member.analysis}</p>
                  </div>
                  {member.reasoning && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Reasoning</h5>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{member.reasoning}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Key Debate Points */}
            {result.committee_analysis.key_debate_points?.length > 0 && (
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-3 text-gray-800">Key Debate Points</h4>
                <div className="space-y-3">
                  {result.committee_analysis.key_debate_points.map((point: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 mt-1 w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                      <p className="text-gray-700">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dissenting Opinions */}
            {result.committee_analysis.dissenting_opinions?.length > 0 && (
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h4 className="text-lg font-semibold mb-3 text-red-800">Dissenting Opinions</h4>
                <div className="space-y-4">
                  {result.committee_analysis.dissenting_opinions.map((opinion: string, index: number) => (
                    <div key={index} className="flex">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{opinion}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
