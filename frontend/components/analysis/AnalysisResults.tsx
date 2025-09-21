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
      case 'STRONG_INVEST': return 'text-green-400 bg-green-900/20 border-green-500';
      case 'CONSIDER': return 'text-blue-400 bg-blue-900/20 border-blue-500';
      case 'HIGH_RISK': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500';
      case 'PASS': return 'text-red-400 bg-red-900/20 border-red-500';
      default: return 'text-slate-400 bg-slate-900/20 border-slate-500';
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
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Analysis ID and Timestamp */}
      <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-200">Investment Analysis Report</h2>
            <p className="text-sm text-slate-400">Analysis ID: {analysis.analysisId}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">
              {analysis.startTime && new Date(analysis.startTime).toLocaleDateString()}
            </p>
            <p className="text-xs text-slate-500">
              Duration: {analysis.durationSeconds || 0}s
            </p>
          </div>
        </div>
      </div>

      {/* Investment Verdict Section */}
      <div className={`bg-slate-800 rounded-lg p-6 border-2 ${getVerdictColor(finalVerdict.recommendation)}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-slate-200">Investment Verdict</h2>
          <div className="text-right">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getVerdictColor(finalVerdict.recommendation)}`}>
              {getVerdictLabel(finalVerdict.recommendation)}
            </span>
          </div>
        </div>

        {/* Summary Statement */}
        <div className="mb-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 rounded-full bg-slate-400 mt-2 flex-shrink-0"></div>
            <p className="text-slate-200 font-medium leading-relaxed">
              {getVerdictSummary(finalVerdict.recommendation, finalVerdict.confidence)}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">Analysis Confidence</span>
            <span className="text-sm text-slate-400">
              {Math.round(finalVerdict.confidence * 100)}% Confidence Level
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getConfidenceColor(finalVerdict.confidence)}`}
              style={{ width: `${finalVerdict.confidence * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Key Supporting Points */}
        {finalVerdict.reasons.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-200 mb-4">Key Supporting Analysis:</h3>
            <div className="grid gap-3">
              {finalVerdict.reasons.map((reason, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-lg border-l-4 border-slate-500">
                  <div className="flex-shrink-0 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-xs font-bold text-slate-300">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300 text-sm leading-relaxed">{reason}</p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-xs text-slate-400">Impact:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div
                            key={star}
                            className={`w-2 h-2 rounded-full ${
                              star <= Math.ceil((finalVerdict.confidence * 5))
                                ? 'bg-yellow-400'
                                : 'bg-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
      {analysis.summary?.keyInsights && analysis.summary.keyInsights.length > 0 && (
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-slate-200">Key Metrics Assessment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analysis.summary.keyInsights).slice(0, 6).map(([key, value], i) => (
              <div key={i} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                <h4 className="font-medium text-slate-200 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-sm text-slate-300">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        {summary?.strengths && summary.strengths.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Strengths
            </h3>
            <ul className="space-y-3">
              {summary.strengths.map((strength, i) => (
                <li key={i} className="text-slate-300 text-sm bg-green-900/10 p-3 rounded border-l-4 border-green-500">
                  {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {summary?.concerns && summary.concerns.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Concerns & Risks
            </h3>
            <ul className="space-y-3">
              {summary.concerns.map((concern, i) => (
                <li key={i} className="text-slate-300 text-sm bg-red-900/10 p-3 rounded border-l-4 border-red-500">
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Opportunities */}
        {summary?.keyInsights && Object.keys(summary.keyInsights).length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Market Opportunities
            </h3>
            <ul className="space-y-3">
              {summary.keyInsights.map((insight, i) => (
                <li key={i} className="text-slate-300 text-sm bg-blue-900/10 p-3 rounded border-l-4 border-blue-500">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {summary?.recommendations && summary.recommendations.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Next Steps
            </h3>
            <ul className="space-y-3">
              {summary.recommendations.map((rec, i) => (
                <li key={i} className="text-slate-300 text-sm bg-purple-900/10 p-3 rounded border-l-4 border-purple-500">
                  {rec}
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
