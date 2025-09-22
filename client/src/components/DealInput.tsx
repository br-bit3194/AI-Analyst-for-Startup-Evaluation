import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { websocketService } from '../services/websocketService';
import { AnalysisResponse, WebsiteAnalysis, PitchAnalysis, CombinedAnalysis } from '../types/analysis';

interface DealInputProps {
  onAnalyze: (result: AnalysisResponse) => void;
  isLoading: boolean;
  disabled: boolean;
  setIsLoading?: (loading: boolean) => void;
}

const DealInput: React.FC<DealInputProps> = ({ 
  onAnalyze, 
  isLoading, 
  disabled, 
  setIsLoading: setParentLoading 
}) => {
  const [pitch, setPitch] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressMessage, setProgressMessage] = useState('Starting analysis...');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pollAnalysisStatus = async (analysisId: string, retries = 30, interval = 2000): Promise<AnalysisResponse> => {
    try {
      const response = await fetch(`https://ai-analyst-for-startup-evaluation.onrender.com/api/analysis/${analysisId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Failed to check analysis status');
      }

      if (result.status === 'completed') {
        return {
          ...result,
          analysisId: result.analysisId || analysisId,
          status: 'completed',
          timestamp: result.timestamp || new Date().toISOString()
        };
      } else if (result.status === 'failed') {
        throw new Error(result.message || 'Analysis failed');
      }

      // If not completed and still have retries left, poll again
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, interval));
        return pollAnalysisStatus(analysisId, retries - 1, interval);
      }

      throw new Error('Analysis timed out');
    } catch (error) {
      console.error('Error polling analysis status:', error);
      throw error;
    }
  };

  // Handle WebSocket messages
  useEffect(() => {
    const handleProgressUpdate = (message: string, progress: number) => {
      console.log('Progress update:', { message, progress });
      setProgressMessage(message);
      setProgress(progress);
      
      // If we receive a progress update, ensure loading state is true
      if (progress > 0 && progress < 100) {
        setIsAnalyzing(true);
        if (setParentLoading) setParentLoading(true);
      }
      
      // If progress is 100%, mark as complete
      if (progress >= 100) {
        setIsAnalyzing(false);
        if (setParentLoading) setParentLoading(false);
      }
    };

    // Subscribe to WebSocket updates
    websocketService.subscribe(handleProgressUpdate);
    
    // Clean up on unmount
    return () => {
      websocketService.unsubscribe(handleProgressUpdate);
      // Don't disconnect here as we want to keep receiving updates
    };
  }, [setParentLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pitch.trim() || isAnalyzing) {
      return;
    }
    
    const setLoading = setParentLoading || setIsUploading;
    setIsAnalyzing(true);
    setProgress(0);
    setProgressMessage('Starting analysis...');
    
    try {
      setLoading(true);
      
      // Show loading state in the UI with a temporary ID
      const tempAnalysisId = `temp-${Date.now()}`;
      onAnalyze({
        analysisId: tempAnalysisId,
        status: 'processing',
        timestamp: new Date().toISOString(),
        message: 'Starting analysis...',
        pitch_analysis: {
          content: pitch,
          length: pitch.length,
          word_count: pitch.split(/\s+/).length
        },
        website_analysis: websiteUrl ? {
          url: websiteUrl,
          status: 'not_processed'
        } : null,
        combined_analysis: {
          summary: 'Analysis in progress...',
          has_website_data: !!websiteUrl
        }
      });
      
      // Reset progress
      setProgress(0);
      setProgressMessage('Initializing analysis...');
      
      // Start the analysis API call
      const startResponse = await fetch('https://ai-analyst-for-startup-evaluation.onrender.com/api/analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pitch: pitch,
          website_url: websiteUrl.trim() || undefined
        }),
      });
      
      // Parse the response
      const responseData = await startResponse.json();
      const serverAnalysisId = responseData.analysisId;
      
      if (!startResponse.ok) {
        throw new Error(responseData.detail || 'Failed to start analysis');
      }
      
      if (!serverAnalysisId) {
        throw new Error('Invalid response from server');
      }
      
      // Connect to WebSocket for progress updates
      websocketService.connect(serverAnalysisId);
      
      // Update the analysis ID in the UI with all required properties
      const processingResponse: AnalysisResponse = {
        analysisId: serverAnalysisId,
        status: 'processing',
        timestamp: new Date().toISOString(),
        message: 'Analysis in progress...',
        pitch_analysis: {
          content: pitch,
          length: pitch.length,
          word_count: pitch.split(/\s+/).length
        },
        website_analysis: websiteUrl ? {
          url: websiteUrl,
          status: 'not_processed'
        } : null,
        combined_analysis: {
          summary: '',
          key_insights: [],
          recommendations: [],
          has_website_data: !!websiteUrl
        },
        recommendations: [],
        progress: 0,
        committee_debate: [],
        agents: {}
      };
      onAnalyze(processingResponse);
      
      // Poll for analysis completion
      setProgressMessage('Analyzing the content...');
      const result = await pollAnalysisStatus(serverAnalysisId);
      
      // Update the UI with the completed result
      onAnalyze({
        ...result,
        status: 'completed',
        progress: 100,
        message: 'Analysis complete!',
        timestamp: new Date().toISOString()
      });
      
      setProgress(100);
      setProgressMessage('Analysis complete!');
      setIsAnalyzing(false);
      if (setParentLoading) setParentLoading(false);
      
      return result;
      
    } catch (error) {
      console.error('Error analyzing startup:', error);
      // Show error state
      onAnalyze({
        analysisId: `error-${Date.now()}`,
        status: 'error',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Failed to analyze startup',
        pitch_analysis: {
          content: pitch,
          length: pitch.length,
          word_count: pitch.split(/\s+/).length
        },
        website_analysis: websiteUrl ? {
          url: websiteUrl,
          status: 'error',
          error: error instanceof Error ? error.message : 'Analysis failed'
        } : null,
        combined_analysis: {
          summary: 'Analysis failed',
          has_website_data: !!websiteUrl
        },
        error: error instanceof Error ? error.message : 'Failed to analyze startup'
      });
    } finally {
      setLoading(false);
      setIsAnalyzing(false);
    }
  };

  const samplePitch = `Business Pitch – Ecobox by Binbag

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
To build India's most trusted and scalable e-waste reverse logistics platform, making responsible recycling as easy as ordering food delivery.`;

  const handleUseSample = () => {
    setPitch(samplePitch);
    setWebsiteUrl('https://ecobox.binbag.in/');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await processFile(files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!isValidFileType(file)) {
      alert('Please upload a valid file type (PDF, DOCX, PPT, TXT, or image)');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate upload progress (in a real app, you'd use actual upload progress events)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // In a real app, you would upload the file to your backend here
      // Read the file content
      const fileContent = await readFileAsText(file);
      setPitch(fileContent);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Create a basic analysis result from the file content
      const fileAnalysis: AnalysisResponse = {
        analysisId: `file-${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        pitch_analysis: {
          content: fileContent,
          length: fileContent.length,
          word_count: fileContent.split(/\s+/).length,
          source: 'file_upload',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type
        },
        website_analysis: null,
        combined_analysis: {
          summary: 'Analysis from uploaded file',
          has_website_data: false,
          source: 'file_upload'
        }
      };
      
      // Auto-submit after a short delay to show the progress
      setTimeout(() => {
        onAnalyze(fileAnalysis);
        setIsUploading(false);
      }, 500);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process the file. Please try again.');
      setIsUploading(false);
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    return validTypes.includes(file.type);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (file.type === 'application/pdf') {
        // For PDFs, we'll just return a message since we can't extract text directly in the browser
        resolve(`[PDF file: ${file.name} - Please implement server-side text extraction for PDFs]`);
      } else if (file.type.startsWith('image/')) {
        // For images, we'll just return the filename since we can't extract text directly
        resolve(`[Image file: ${file.name} - Please implement image text extraction for images]`);
      } else {
        // For text-based files, read as text
        reader.readAsText(file);
      }
    });
  };

  return (
    <div className="relative bg-gradient-to-br from-blue-900/40 to-indigo-900/30 p-6 rounded-xl shadow-lg border border-indigo-500/30 backdrop-blur-sm">
      {/* Loading Overlay with Progress */}
      {(isLoading || isAnalyzing) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex flex-col items-center justify-center z-10 p-4">
          <div className="bg-blue-900/80 p-6 rounded-xl max-w-md w-full text-center">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400 mb-4"></div>
              <h3 className="text-lg font-medium text-white mb-1">Analyzing Startup</h3>
              <p className="text-sm text-blue-200 mb-4">{progressMessage}</p>
              <div className="w-full bg-blue-800/50 rounded-full h-2 overflow-hidden mb-2">
                <div 
                  className="bg-blue-400 h-full rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Website URL Input */}
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <svg className="w-4 h-4 mr-2 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
            </svg>
            <label htmlFor="website-url" className="block text-sm font-semibold text-blue-700">
              Website URL <span className="text-xs font-normal text-slate-500">(optional)</span>
            </label>
          </div>
          <input
            type="url"
            id="website-url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourstartup.com"
            className="w-full px-4 py-2.5 bg-indigo-900/70 border-2 border-indigo-600/50 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500 backdrop-blur-sm"
            disabled={isLoading || isUploading || disabled}
          />
        </div>
        
        {/* Pitch Input Section */}
        <div>
          <div className="flex items-center mb-2">
            <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <label htmlFor="pitch" className="block text-lg font-semibold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
              Enter Startup Pitch or Description
            </label>
          </div>

          {/* Textarea for pitch */}
          <div className="mb-4">
            <textarea
              id="pitch"
              rows={10}
              className={`w-full px-4 py-3 bg-indigo-900/70 border-2 border-indigo-600/50 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-lg hover:shadow-indigo-500/20 hover:border-indigo-500 backdrop-blur-sm ${
                (isLoading || isUploading || disabled) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              placeholder="Paste your startup pitch or description here..."
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              disabled={isLoading || isUploading || disabled}
            />
            <p className="mt-2 text-sm text-blue-100/70">
              Provide a detailed description of your startup, including the problem you're solving, your solution, target market, and business model.
            </p>
          </div>
        </div>
        
        {/* File Upload Area */}
        <div 
          className={`p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'border-blue-400 bg-blue-900/30 shadow-lg scale-[1.01]' 
              : 'border-indigo-400/50 hover:border-blue-400 hover:bg-blue-900/20 hover:shadow-md'
          } ${(isLoading || isUploading || disabled) ? 'opacity-70 cursor-not-allowed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && !isLoading && !isUploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpeg,.jpg,.png,.gif"
            onChange={handleFileChange}
            disabled={isLoading || isUploading || disabled}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-400">PDF, DOCX, PPT, TXT, or images (max 10MB)</p>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-300 mt-1 text-right">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleUseSample}
              className={`px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                isLoading || isUploading || disabled
                  ? 'bg-gray-100/10 text-gray-400 border-gray-200/20 cursor-not-allowed'
                  : 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-blue-400/30'
              }`}
              disabled={isLoading || isUploading || disabled}
            >
              Use Sample Pitch
            </button>
            <button
              type="button"
              onClick={handleFileUploadClick}
              className={`px-4 py-2 text-sm font-medium rounded-lg border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${
                isLoading || isUploading || disabled
                  ? 'bg-gray-100/10 text-gray-400 border-gray-200/20 cursor-not-allowed'
                  : 'bg-white/5 text-white hover:bg-white/10 border-white/20'
              }`}
              disabled={isLoading || isUploading || disabled}
            >
              Upload Document
            </button>
          </div>
          
          <button
            type="submit"
            className={`px-6 py-2.5 text-sm font-medium rounded-lg border flex items-center justify-center min-w-[140px] h-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all ${
              !pitch.trim() || isLoading || isUploading || disabled || isAnalyzing
                ? 'bg-blue-500/30 text-blue-200 border-transparent cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-transparent shadow-lg hover:shadow-blue-500/20 transform hover:-translate-y-0.5'
            }`}
            disabled={!pitch.trim() || isLoading || isUploading || disabled || isAnalyzing}
          >
            {isLoading || isAnalyzing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isAnalyzing ? 'Analyzing...' : 'Processing...'}
              </>
            ) : 'Analyze Startup'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DealInput;
