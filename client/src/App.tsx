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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Fixed on all screen sizes */}
      <div className="fixed top-0 left-0 h-full z-40">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-0 md:ml-16 lg:ml-64">
        {/* Header - Fixed at top */}
        <header className="fixed top-0 right-0 left-0 md:left-16 lg:left-64 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-4">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Header />
          </div>
        </header>
        
        {/* Main Content - Padded to account for header and sidebar */}
        <main className="flex-1 pt-20 pb-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              <Outlet />
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} AI Startup Analyst. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

// Layout without Sidebar (for auth pages, etc.)
const SimpleLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50">
      <Header />
      <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AI Startup Analyst. All rights reserved.
        </div>
      </footer>
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
    document.title = 'Dashboard | Startalytica';
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
  const handleAnalyze = async (result: AnalysisResponse) => {
    setIsLoading(true);
    setError(null);
    setActiveTab('analysis');

    try {
      // If the result is already completed, just set it
      if (result.status === 'completed') {
        console.log('Analysis completed:', result);
        setAnalysis({
          ...result,
          // Ensure all required fields are present
          combined_analysis: result.combined_analysis || {
            summary: result.result?.summary || 'No summary available',
            key_insights: result.result?.key_insights || [],
            recommendations: result.result?.recommendations || [],
            has_website_data: !!result.website_analysis
          },
          // Add any missing fields with default values
          recommendations: result.recommendations || [result.result?.recommendation || 'No recommendations available']
        });
        return;
      }
      
      // If it's in progress, show loading state
      if (result.status === 'processing') {
        console.log('Analysis in progress...');
        // Keep the current analysis or set the initial processing state
        setAnalysis(prev => ({
          ...(prev || {}),
          ...result,
          status: 'processing',
          message: result.message || 'Analysis in progress...'
        }));
        return;
      }
      
      // If there's an error, show it
      if (result.status === 'error') {
        console.error('Analysis error:', result.message);
        setError(result.message || 'Analysis failed');
        setAnalysis({
          ...(result as any),
          status: 'error',
          message: result.message || 'Analysis failed'
        });
        return;
      }
      
      // Default case - just set the analysis with proper defaults
      console.log('Setting analysis result:', result);
      setAnalysis({
        ...result,
        status: result.status || 'completed',
        combined_analysis: result.combined_analysis || {
          summary: result.result?.summary || 'No summary available',
          key_insights: result.result?.key_insights || [],
          recommendations: result.result?.recommendations || [],
          has_website_data: !!result.website_analysis
        },
        recommendations: result.recommendations || [result.result?.recommendation || 'No recommendations available']
      });
    } catch (error) {
      console.error('Error analyzing deal:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze deal');
    } finally {
      setIsLoading(false);
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
          setIsLoading={setIsLoading}
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
      {(analysis || committeeData || isLoading) && (
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
          <div className="w-full max-w-4xl mx-auto">
            <LoadingSpinner isCommittee={activeTab === 'committee'} />
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

// Import the AnalysisHistory component
import AnalysisHistory from './pages/AnalysisHistory';

// Main App Component
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Routes with Sidebar */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<DealAnalysis />} />
          <Route path="/analysis/history" element={<AnalysisHistory />} />
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
