import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { AnalysisResponse } from './types/analysis';
import { InvestmentCommitteeResponse } from './types/analysis';
import { analyzeDeal, simulateInvestmentCommittee } from './services/backend';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DealInput from './components/DealInput';
import LoadingSpinner from './components/LoadingSpinner';
import Welcome from './components/Welcome';
import AnalysisResults from './components/analysis/AnalysisResults';
import InvestmentCommittee from './components/analysis/InvestmentCommittee';

// Layout with Sidebar
const DashboardLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Layout without Sidebar
const SimpleLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

// DealAnalysis Component
const DealAnalysis: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [committeeData, setCommitteeData] = useState<InvestmentCommitteeResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'analysis' | 'committee'>('analysis');
  const navigate = useNavigate();
  
  // Set the document title
  useEffect(() => {
    document.title = 'Dashboard | Dealflow Oracle';
  }, []);

  // Handle committee simulation
  const handleCommitteeSimulation = async (pitch: string) => {
    if (!pitch.trim()) {
      setError("Please provide a startup pitch or description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setActiveTab('committee');

    try {
      const result = await simulateInvestmentCommittee(pitch);
      setCommitteeData(result);
    } catch (error) {
      console.error('Error running committee simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to run committee simulation');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle analysis submission
  const handleAnalyze = async (pitch: string) => {
    if (!pitch.trim()) {
      setError("Please provide a startup pitch or description.");
      return;
    }

    setIsLoading(true);
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setCommitteeData(null);
    setActiveTab('analysis');

    try {
      // Start multi-agent workflow
      console.log('Starting multi-agent analysis workflow...');

      // Run regular deal analysis
      console.log('Agent 1: Running deal analysis...');
      const result = await analyzeDeal(pitch);

      // Run investment committee simulation
      console.log('Agent 2: Running investment committee simulation...');
      const committeeResult = await simulateInvestmentCommittee(pitch);

      // Transform the response to match the expected AnalysisResponse type
      const analysisResponse: AnalysisResponse = {
        analysisId: `analysis_${Date.now()}`,
        status: 'completed',
        startTime: new Date().toISOString(),
        durationSeconds: 0,
        agents: {
          market_analyst: {
            success: true,
            data: { summary: 'Market analysis completed' },
            confidence: result.confidence / 100
          },
          financial_analyst: {
            success: true,
            data: { summary: 'Financial analysis completed' },
            confidence: result.confidence / 100
          },
          team_analyst: {
            success: true,
            data: { summary: 'Team analysis completed' },
            confidence: result.confidence / 100
          },
          risk_analyst: {
            success: true,
            data: { summary: 'Risk analysis completed' },
            confidence: result.confidence / 100
          },
          committee_simulator: {
            success: true,
            data: {
              summary: 'Investment committee simulation completed',
              committee_verdict: committeeResult.final_verdict,
              consensus_score: committeeResult.consensus_score,
              member_count: committeeResult.committee_members.length
            },
            confidence: committeeResult.consensus_score
          }
        },
        finalVerdict: {
          recommendation: result.verdict === 'Invest' ? 'INVEST' :
                         result.verdict === 'Pass' ? 'PASS' : 'CONSIDER',
          confidence: result.confidence / 100,
          confidenceLabel: `${result.confidence}%`,
          reasons: result.recommendations || ['No specific reasons provided'],
          timestamp: new Date().toISOString()
        },
        summary: {
          keyInsights: result.opportunities || [],
          strengths: [],
          concerns: result.risks || [],
          recommendations: result.recommendations || []
        }
      };

      setAnalysis(analysisResponse);
      setCommitteeData(committeeResult);
      console.log('Multi-agent workflow completed successfully!');
    } catch (error) {
      console.error('Error in multi-agent workflow:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete analysis workflow');
    } finally {
      setIsLoading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Startup Analysis</h1>
        <p className="mt-1 text-sm text-gray-500">
          Analyze a startup pitch and get investment insights
        </p>
      </div>
      
      {/* Input Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <DealInput 
          onAnalyze={handleAnalyze} 
          isLoading={isLoading} 
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">An error occurred</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Tabs */}
      {(analysis || committeeData) && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('analysis')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Analysis Report
            </button>
            <button
              onClick={() => setActiveTab('committee')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'committee'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Committee Debate
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-6">
        {/* Analysis in Progress */}
        {isLoading && (
          <div className="rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <LoadingSpinner />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  {activeTab === 'committee' 
                    ? 'Simulating investment committee discussion...' 
                    : 'Analyzing your startup pitch...'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {activeTab === 'analysis' && !isLoading && analysis && (
          <AnalysisResults
            analysis={analysis}
            className="animate-fade-in"
          />
        )}

        {/* Committee Simulation Results */}
        {activeTab === 'committee' && !isLoading && committeeData && (
          <InvestmentCommittee
            committeeData={committeeData}
            className="animate-fade-in"
          />
        )}

        {/* Welcome Screen */}
        {!isLoading && !analysis && !committeeData && !error && (
          <div className="bg-white shadow rounded-lg p-6">
            <Welcome />
          </div>
        )}
      </div>
    </div>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Routes with Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DealAnalysis />} />
        </Route>
        
        {/* Routes without Sidebar */}
        <Route element={<SimpleLayout />}>
          <Route path="/3d-visualization" element={<div>3D Visualization</div>} />
          <Route path="/verdict" element={<div>Verdict Demo</div>} />
        </Route>
      </Routes>
    </Router>
  );
};

// Add some global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
`;
document.head.appendChild(style);

export default App;
