import React, { useState } from 'react';

interface DealInputProps {
  onAnalyze: (pitch: string) => void;
  isLoading: boolean;
}

const DealInput: React.FC<DealInputProps> = ({ onAnalyze, isLoading }) => {
  const [pitch, setPitch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze(pitch);
  };

  const samplePitch = `Company: ChronoSafe AI
Pitch: We're building a decentralized platform using blockchain and AI to create immutable, verifiable digital archives for historical and legal documents. Our AI can instantly verify authenticity and provide contextual search, solving the multi-billion dollar problem of document fraud and preservation. The team consists of two ex-Google AI engineers and a blockchain expert from MIT. We're seeking a $2M seed round to scale our MVP.`;

  const handleUseSample = () => {
    setPitch(samplePitch);
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit}>
        <label htmlFor="pitch-input" className="block text-lg font-semibold mb-2 text-slate-200">
          Enter Startup Pitch or Description
        </label>
        <textarea
          id="pitch-input"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="Paste the startup's elevator pitch, summary, or link to their deck..."
          className="w-full h-40 p-3 bg-slate-900 border border-slate-600 rounded-md focus:ring-2 focus:ring-brand-accent focus:outline-none transition duration-200 text-slate-300 placeholder-slate-500"
          disabled={isLoading}
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
                type="button"
                onClick={handleUseSample}
                disabled={isLoading}
                className="w-full sm:w-auto px-5 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 focus:ring-4 focus:outline-none focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                Use Sample Pitch
            </button>
            <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-accent focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                </>
                ) : (
                'Summon the Oracle'
                )}
            </button>
        </div>
      </form>
    </div>
  );
};

export default DealInput;
