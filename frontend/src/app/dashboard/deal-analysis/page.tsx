"use client";

import { FileSearch, BarChart, TrendingUp, Users, Clock, Zap, Upload, Link as LinkIcon, Loader2 as Loader2Icon } from "lucide-react";
import { Loader2 } from "@/components/ui/loader-2";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeStartup } from "@/lib/api";
import { toast } from "sonner";

export default function DealAnalysisPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [pitchDescription, setPitchDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until we're on the client to prevent hydration issues
  if (!isClient) {
    return null;
  }

  const handleUseSample = () => {
    setWebsiteUrl("https://ecobox.in");
    setPitchDescription(`Business Pitch – Ecobox by Binbag

      Problem:
India generates over 3 million tons of e-waste annually, yet most of it ends up in landfills or is handled by unsafe, unorganized channels. Consumers and small businesses struggle to responsibly dispose of electronics due to lack of convenience, trust, and transparency.

Solution:
Ecobox is a simple, scalable, and secure e-waste collection service. Customers order a free Ecobox online, pack their unused electronics, and schedule a doorstep pickup. We ensure certified recycling, zero-landfill processing, and guaranteed data destruction. Every user receives tracking updates and a recycling certificate — creating accountability and trust.

Business Model:
B2C: Free service for individuals (leveraging extended producer responsibility & brand partnerships).
B2B: Paid solutions for corporates, offices, and SMEs needing bulk collection, audit reports, and ESG compliance.
Partnerships: Tie-ups with electronics brands, retailers, and producers under EPR (Extended Producer Responsibility) mandates.

Market Opportunity:
India is the 3rd largest e-waste generator in the world.
Government EPR regulations mandate responsible e-waste management, opening a multi-billion-dollar compliance-driven market.
Rising consumer awareness creates demand for eco-conscious and convenient recycling options.

Traction & Impact:
Growing customer adoption across urban India.
Proven zero-landfill and certified recycling pipeline.
Tangible ESG impact for partner brands and corporates.

Vision:
To build India's most trusted and scalable e-waste reverse logistics platform, making responsible recycling as easy as ordering food delivery.`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pitchDescription.trim()) {
      setError("Please enter a pitch description");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // First handle file upload if present
      if (selectedFile) {
        // TODO: Implement file upload logic if needed
        console.log("File selected for upload:", selectedFile);
      }

      // Submit the analysis request
      const response = await analyzeStartup(pitchDescription, websiteUrl || undefined);
      setAnalysisId(response.analysisId);
      setAnalysisStatus('processing');
      
      // Start polling for status
      pollAnalysisStatus(response.analysisId);
      
    } catch (err) {
      console.error("Error analyzing startup:", err);
      setError(err instanceof Error ? err.message : "Failed to analyze startup");
      toast.error("Failed to start analysis. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to poll for analysis status
  const pollAnalysisStatus = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/analysis/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis status');
      }
      
      const data = await response.json();
      
      // Assuming the backend returns a 'status' field that can be 'completed', 'processing', or 'failed'
      if (data.status === 'completed' || data.status === 'succeeded') {
        setAnalysisResult(data);
        setAnalysisStatus('completed');
        setIsSubmitting(false);
      } else if (data.status === 'failed') {
        setError('Analysis failed. Please try again.');
        setAnalysisStatus('failed');
        setIsSubmitting(false);
      } else {
        // Continue polling every 2 seconds if still processing
        setTimeout(() => pollAnalysisStatus(id), 2000);
      }
    } catch (err) {
      console.error('Error fetching analysis status:', err);
      setError('Failed to get analysis status');
      setAnalysisStatus('failed');
      setIsSubmitting(false);
    }
  };

  // Reset form and analysis state
  const resetAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisStatus('idle');
    setAnalysisId(null);
    setError(null);
  };

  return (
    <div className="relative">
      {analysisStatus === 'processing' && (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <Loader2 />
            <p className="mt-4 text-center text-lg font-medium text-gray-900">
              Analyzing your pitch...
            </p>
            <p className="text-center text-sm text-gray-600">
              This may take a few moments
            </p>
          </div>
        </div>
      )}
      <div className="flex justify-center">
      <div className="w-full max-w-5xl">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-sm w-full">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Deal Analysis</h1>
            <p className="text-gray-700 mt-1">Analyze and evaluate new startup opportunities with comprehensive due diligence.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Website URL */}
          <div>
            <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
              Website URL (optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LinkIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="url"
                id="websiteUrl"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 placeholder-gray-400"
                placeholder="https://example.com"
              />
            </div>
          </div>

          {/* Pitch Description */}
          <div>
            <label htmlFor="pitchDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Enter pitch description
            </label>
            <textarea
              id="pitchDescription"
              rows={5}
              value={pitchDescription}
              onChange={(e) => setPitchDescription(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 placeholder-gray-400"
              placeholder="Paste the startup's pitch or description here..."
              required
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Documents (optional)
            </label>
            <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-600 rounded-lg border-2 border-dashed border-blue-300 cursor-pointer hover:bg-blue-50">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PDF, DOCX, TXT up to 10MB
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
              />
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-200 mt-8">
            <button
              type="button"
              onClick={handleUseSample}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              suppressHydrationWarning
            >
              Use Sample Pitch
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
              suppressHydrationWarning
            >
              Analyze Startup
            </button>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          </form>

          {/* Analysis Results */}
          {analysisStatus === 'completed' && analysisResult && (
            <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white">Analysis Results</h2>
                  <button
                    onClick={resetAnalysis}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                  >
                    New Analysis
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-8">
                {/* Overview Section */}
                {analysisResult.overall && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <FileSearch className="h-5 w-5 mr-2 text-blue-600" />
                      Overall Assessment
                    </h3>
                    <div className="prose prose-blue max-w-none">
                      <p className="text-gray-700">{analysisResult.overall.summary}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-600">
                        <span className="font-medium">Confidence:</span>
                        <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {Math.round(analysisResult.overall.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Market Analysis */}
                {analysisResult.market_analysis && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <BarChart className="h-5 w-5 mr-2 text-blue-600" />
                        Market Analysis
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {analysisResult.market_analysis.market_size && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Market Size</h4>
                          <p className="text-gray-700">{analysisResult.market_analysis.market_size}</p>
                        </div>
                      )}
                      
                      {analysisResult.market_analysis.growth_rate && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Growth Rate</h4>
                          <p className="text-gray-700">{analysisResult.market_analysis.growth_rate}</p>
                        </div>
                      )}

                      {analysisResult.market_analysis.customer_segments && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Customer Segments</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            {analysisResult.market_analysis.customer_segments.map((segment: string, index: number) => (
                              <li key={index}>{segment}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Financial Analysis */}
                {analysisResult.financial_analysis && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                        Financial Analysis
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {analysisResult.financial_analysis.revenue_model && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Revenue Model</h4>
                          <p className="text-gray-700">{analysisResult.financial_analysis.revenue_model}</p>
                        </div>
                      )}
                      
                      {analysisResult.financial_analysis.burn_rate && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">Burn Rate</h4>
                          <p className="text-gray-700">{analysisResult.financial_analysis.burn_rate}</p>
                        </div>
                      )}

                      {analysisResult.financial_analysis.metrics && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Metrics</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(analysisResult.financial_analysis.metrics).map(([key, value]) => (
                              <div key={key} className="bg-gray-50 p-3 rounded border">
                                <div className="text-sm font-medium text-gray-500">
                                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                </div>
                                <div className="mt-1 text-lg font-semibold text-gray-900">
                                  {typeof value === 'number' ? value.toLocaleString() : value}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Analysis */}
                {analysisResult.team_analysis && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-purple-600" />
                        Team Analysis
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {analysisResult.team_analysis.team_strengths && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Team Strengths</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-700">
                            {analysisResult.team_analysis.team_strengths.map((strength: string, index: number) => (
                              <li key={index}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {analysisResult.team_analysis.key_team_members && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Team Members</h4>
                          <div className="space-y-4">
                            {analysisResult.team_analysis.key_team_members.map((member: any, index: number) => (
                              <div key={index} className="border rounded-lg p-3">
                                <div className="font-medium text-gray-900">{member.name}</div>
                                <div className="text-sm text-gray-600">{member.role}</div>
                                {member.experience && (
                                  <div className="mt-1 text-sm text-gray-700">{member.experience}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Risk Assessment */}
                {analysisResult.risk_assessment && (
                  <div className="border border-red-100 rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                      <h3 className="text-lg font-semibold text-red-900 flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-red-600" />
                        Risk Assessment
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {analysisResult.risk_assessment.key_risks && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Key Risks</h4>
                          <ul className="space-y-2">
                            {analysisResult.risk_assessment.key_risks.map((risk: any, index: number) => (
                              <li key={index} className="flex items-start">
                                <span className="flex-shrink-0 h-5 w-5 text-red-500">•</span>
                                <span className="ml-2 text-gray-700">
                                  <span className="font-medium">{risk.risk}</span>
                                  {risk.impact && (
                                    <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                                      Impact: {risk.impact}
                                    </span>
                                  )}
                                  {risk.mitigation && (
                                    <p className="mt-1 text-sm text-gray-600">
                                      <span className="font-medium">Mitigation:</span> {risk.mitigation}
                                    </p>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Raw JSON Toggle (for debugging) */}
              <div className="border-t border-gray-200 px-6 py-3 bg-gray-50">
                <details className="group">
                  <summary className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer">
                    <span>View Raw Analysis Data</span>
                    <svg className="ml-1.5 h-5 w-5 flex-shrink-0 transition-transform group-open:rotate-180" 
                         xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </summary>
                  <div className="mt-2 bg-gray-50 p-4 rounded border border-gray-200 overflow-auto max-h-96">
                    <pre className="text-xs text-gray-700">
                      {JSON.stringify(analysisResult, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
