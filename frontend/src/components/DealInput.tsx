import React, { useState, useRef, ChangeEvent } from 'react';

interface DealInputProps {
  onAnalyze: (pitch: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const DealInput: React.FC<DealInputProps> = ({ onAnalyze, isLoading, disabled }) => {
  const [pitch, setPitch] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalPitch = pitch;
    
    if (websiteUrl.trim()) {
      finalPitch = `Website: ${websiteUrl}\n\n${pitch}`;
    }
    
    if (finalPitch.trim()) {
      onAnalyze(finalPitch);
    }
  };

  const samplePitch = `Company: ChronoSafe AI
Pitch: We're building a decentralized platform using blockchain and AI to create immutable, verifiable digital archives for historical and legal documents. Our AI can instantly verify authenticity and provide contextual search, solving the multi-billion dollar problem of document fraud and preservation. The team consists of two ex-Google AI engineers and a blockchain expert from MIT. We're seeking a $2M seed round to scale our MVP.`;

  const handleUseSample = () => {
    setPitch(samplePitch);
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
      // and then process it to extract text
      // For now, we'll just read the file directly in the browser
      const text = await readFileAsText(file);
      setPitch(text);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Auto-submit after a short delay to show the progress
      setTimeout(() => {
        onAnalyze(text);
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
    <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/30 p-6 rounded-xl shadow-lg border border-indigo-500/30 backdrop-blur-sm">
      <form onSubmit={handleSubmit}>
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
        
        <div className="flex items-center mb-2">
          <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <label htmlFor="pitch-input" className="block text-lg font-semibold bg-gradient-to-r from-indigo-400 to-blue-500 bg-clip-text text-transparent">
            Enter Startup Pitch or Description
          </label>
        </div>
        
        {/* File Upload Area */}
        <div 
          className={`mt-2 mb-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'border-blue-400 bg-blue-900/30 shadow-lg scale-[1.01]' 
              : 'border-indigo-400/50 hover:border-blue-400 hover:bg-blue-900/20 hover:shadow-md'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
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

        {isUploading && (
          <div className="mb-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        <div className="relative">
          <textarea
            id="pitch-input"
            value={pitch}
            onChange={(e) => setPitch(e.target.value)}
            placeholder={disabled ? 'Analysis in progress...' : 'Paste your pitch here or upload a document...'}
            disabled={disabled}
            className={`w-full h-64 p-6 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl text-gray-800 placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 focus:shadow-lg resize-none transition-all duration-200 ${
              disabled ? 'opacity-70 cursor-not-allowed' : 'hover:border-indigo-300 hover:shadow-md'
            }`}
            style={{
              boxShadow: '0 4px 20px -5px rgba(99, 102, 241, 0.15)'
            }}
          />
            {pitch && (
              <button
                type="button"
                onClick={() => setPitch('')}
                className="absolute top-2 right-2 p-1 rounded-full bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
                title="Clear text"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                type="button"
                onClick={handleUseSample}
                disabled={isLoading || isUploading || disabled}
                className="px-6 py-2.5 text-sm font-medium rounded-lg border-2 border-blue-400/50 text-blue-100 bg-blue-900/30 hover:bg-blue-800/40 hover:border-blue-300/70 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex-1 sm:flex-none"
              >
                Use Sample Pitch
              </button>
              <button
                type="submit"
                disabled={!pitch.trim() || isLoading || isUploading || disabled}
                className={`px-8 py-2.5 text-sm font-medium rounded-lg text-white ${
                  pitch.trim() 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-500/90 hover:to-indigo-600/90 hover:shadow-lg hover:scale-[1.02]' 
                    : 'bg-slate-700 cursor-not-allowed'
                } disabled:opacity-50 transition-all duration-300 flex-1 sm:flex-none`}
              >
                {isLoading || isUploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </span>
                ) : 'Analyze Pitch'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  };

export default DealInput;
