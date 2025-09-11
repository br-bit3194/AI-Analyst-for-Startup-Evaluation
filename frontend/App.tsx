import React, { useState } from 'react';
import type { DealAnalysis } from './types';
import { analyzeDeal } from './services/geminiService';
import Header from './components/Header';
import DealInput from './components/DealInput';
import AnalysisDashboard from './components/AnalysisDashboard';
import LoadingSpinner from './components/LoadingSpinner';
import Welcome from './components/Welcome';

const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (pitch: string) => {
    if (!pitch.trim()) {
      setError("Please provide a startup pitch or description.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeDeal(pitch);
      setAnalysis(result);
    } catch (err) {
      console.error("Error analyzing deal:", err);
      setError(
        "Failed to analyze the deal. The Oracle is busy. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <DealInput onAnalyze={handleAnalyze} isLoading={isLoading} />
        {error && (
          <div className="mt-8 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            <p className="font-bold">An Error Occurred</p>
            <p>{error}</p>
          </div>
        )}
        <div className="mt-8">
          {isLoading && <LoadingSpinner />}
          {!isLoading && !analysis && !error && <Welcome />}
          {analysis && <AnalysisDashboard analysis={analysis} />}
        </div>
      </main>
       <footer className="text-center p-4 text-slate-600 text-sm">
        <p>Dealflow Oracle &copy; 2025 - For Hackathon Purposes Only</p>
      </footer>
    </div>
  );
};

export default App;
