import React from 'react';
import type { AnalysisResponse } from '../../types/analysis';

interface AnalysisResultsProps {
  analysis: AnalysisResponse;
  className?: string;
}

// Type guard to check if an agent result has a confidence property
const hasConfidence = (agent: any): agent is { confidence?: number } => {
  return agent && typeof agent === 'object';
};

// Type guard to check if an agent result has an error property
const hasError = (agent: any): agent is { error?: string } => {
  return agent && typeof agent === 'object';
};

// Type guard to check if an agent result has a data property
const hasData = (agent: any): agent is { data?: any } => {
  return agent && typeof agent === 'object';
};

const AnalysisResults: React.FC<AnalysisResultsProps> = ({ analysis, className = '' }) => {
  if (!analysis.finalVerdict) {
    return (
      <div className={`bg-slate-800 rounded-lg p-6 text-center ${className}`}>
        <p className="text-slate-400">No analysis results available</p>
      </div>
    );
  }

  const { finalVerdict, summary } = analysis;

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_INVEST': return 'text-green-600 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-lg';
      case 'CONSIDER': return 'text-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg';
      case 'HIGH_RISK': return 'text-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 shadow-lg';
      case 'PASS': return 'text-rose-600 bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 shadow-lg';
      default: return 'text-indigo-600 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-200 shadow-lg';
    }
  };

  const getVerdictLabel = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_INVEST': return 'Strong Investment Opportunity';
      case 'CONSIDER': return 'Consider for Investment';
      case 'HIGH_RISK': return 'High Risk - Use Caution';
      case 'PASS': return 'Do Not Invest';
      default: return verdict;
    }
  };

  const getVerdictSummary = (verdict: string, confidence: number) => {
    switch (verdict) {
      case 'STRONG_INVEST':
        return `Exceptional investment opportunity with ${Math.round(confidence)}% confidence. Multiple strong indicators align including market potential, team quality, and competitive positioning.`;
      case 'CONSIDER':
        return `Promising opportunity with ${Math.round(confidence)}% confidence. Shows potential but requires additional validation and due diligence before proceeding.`;
      case 'HIGH_RISK':
        return `High-risk opportunity with ${Math.round(confidence)}% confidence. Significant concerns identified but some potential exists worth exploring with proper risk mitigation.`;
      case 'PASS':
        return `Investment not recommended with ${Math.round(confidence)}% confidence. Major red flags outweigh potential benefits - capital preservation prioritized.`;
      default:
        return `Analysis completed with ${Math.round(confidence)}% confidence level based on comprehensive evaluation.`;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-gradient-to-r from-green-500 to-emerald-500';
    if (confidence >= 0.6) return 'bg-gradient-to-r from-amber-400 to-yellow-500';
    return 'bg-gradient-to-r from-rose-500 to-pink-500';
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Analysis ID and Timestamp */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Investment Analysis Report</h2>
            <p className="text-sm text-indigo-600 font-medium mt-1">Analysis ID: {analysis.analysisId}</p>
          </div>
          <div className="bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
            <p className="text-sm font-medium text-gray-700">
              {analysis.startTime && new Date(analysis.startTime).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="text-xs text-indigo-500 font-medium">
              Analysis completed in {analysis.durationSeconds || 0} seconds
            </p>
          </div>
        </div>
      </div>

      {/* Investment Verdict Section */}
      <div className={`rounded-2xl p-8 ${getVerdictColor(finalVerdict.recommendation)} transition-all duration-300 hover:shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold text-gray-900">Investment Verdict</h2>
            <p className="text-gray-600 mt-1">Comprehensive analysis of investment potential</p>
          </div>
          <div className="text-right">
            <span className={`inline-flex items-center px-6 py-3 rounded-full text-base font-bold ${getVerdictColor(finalVerdict.recommendation).replace('border-2', 'border-0')} shadow-md`}>
              {getVerdictLabel(finalVerdict.recommendation)}
            </span>
          </div>
        </div>

        {/* Summary Statement */}
        <div className="mb-6 p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Executive Summary</h3>
              <p className="text-gray-700 leading-relaxed">
                {getVerdictSummary(finalVerdict.recommendation, finalVerdict.confidence)}
              </p>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-gray-700 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">Analysis Confidence</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">
              {Math.round(finalVerdict.confidence * 100)}% Confidence Level
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${getConfidenceColor(finalVerdict.confidence)}`}
              style={{ 
                width: `${finalVerdict.confidence * 100}%`,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
            ></div>
          </div>
        </div>

        {/* Key Supporting Points */}
        {finalVerdict.reasons.length > 0 && (
          <div>
            <div className="flex items-center mb-6">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
              <h3 className="mx-4 text-lg font-semibold text-gray-800 whitespace-nowrap">Key Supporting Analysis</h3>
              <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
            </div>
            <div className="grid gap-4">
              {finalVerdict.reasons.map((reason, i) => {
                const colors = [
                  'bg-blue-50 border-blue-200 text-blue-800',
                  'bg-emerald-50 border-emerald-200 text-emerald-800',
                  'bg-amber-50 border-amber-200 text-amber-800',
                  'bg-purple-50 border-purple-200 text-purple-800',
                  'bg-rose-50 border-rose-200 text-rose-800'
                ];
                const colorClass = colors[i % colors.length];
                
                return (
                  <div 
                    key={i} 
                    className={`flex items-start p-5 rounded-xl border-2 ${colorClass} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center mr-4 mt-0.5">
                      <span className="text-lg font-bold">{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 leading-relaxed">{reason}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium text-gray-600">Impact:</span>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${star <= Math.ceil(finalVerdict.confidence * 5) ? 'text-yellow-400' : 'text-gray-200'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/80 text-gray-700 shadow-sm">
                          {['Low', 'Medium', 'High', 'Very High', 'Critical'][Math.min(4, Math.floor(finalVerdict.confidence * 5))]}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      {analysis.summary?.keyInsights && Object.entries(analysis.summary.keyInsights).length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center mb-6">
            <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
            <h2 className="mx-4 text-xl font-bold text-gray-900 whitespace-nowrap">Key Metrics Assessment</h2>
            <div className="h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent flex-1"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(analysis.summary.keyInsights).slice(0, 6).map(([key, value], i) => {
              const colors = [
                'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100',
                'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100',
                'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100',
                'bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100',
                'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-100',
                'bg-gradient-to-br from-cyan-50 to-sky-50 border-cyan-100'
              ];
              const colorClass = colors[i % colors.length];
              
              return (
                <div 
                  key={i} 
                  className={`p-5 rounded-xl border-2 ${colorClass} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center mr-3">
                      <span className="text-xl font-bold text-gray-600">{i + 1}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{String(value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        {summary?.strengths && summary.strengths.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Key Strengths</h3>
            </div>
            <ul className="space-y-4">
              {summary.strengths.map((strength, i) => (
                <li 
                  key={i} 
                  className="flex items-start p-4 bg-green-50 rounded-xl border border-green-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-700">{strength}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns & Risks */}
        {summary?.concerns && summary.concerns.length > 0 && (
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border-2 border-rose-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-rose-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Concerns & Risks</h3>
            </div>
            <ul className="space-y-4">
              {summary.concerns.map((concern, i) => (
                <li 
                  key={i} 
                  className="flex items-start p-4 bg-white rounded-xl border-2 border-rose-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-700">{concern}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Opportunities */}
        {summary?.keyInsights && Object.keys(summary.keyInsights).length > 0 && (
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Market Opportunities</h3>
            </div>
            <ul className="space-y-4">
              {Object.entries(summary.keyInsights).map(([key, value], i) => (
                <li 
                  key={i} 
                  className="flex items-start p-4 bg-white rounded-xl border-2 border-blue-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{key}</p>
                    {value && <p className="text-sm text-gray-600 mt-1">{String(value)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {summary?.recommendations && summary.recommendations.length > 0 && (
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border-2 border-violet-100 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-violet-100 rounded-lg mr-3">
                <svg className="w-6 h-6 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Next Steps</h3>
            </div>
            <ul className="space-y-4">
              {summary.recommendations.map((rec, i) => (
                <li 
                  key={i} 
                  className="flex items-start p-4 bg-white rounded-xl border-2 border-violet-100 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center mr-3">
                      <span className="text-xs font-bold text-violet-600">{i + 1}</span>
                    </div>
                  </div>
                  <p className="text-gray-700">{rec}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisResults;
