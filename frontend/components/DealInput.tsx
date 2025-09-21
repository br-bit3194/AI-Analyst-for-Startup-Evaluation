import React, { useState, useRef, ChangeEvent } from 'react';

interface DealInputProps {
  onAnalyze: (pitch: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

interface DealInputProps {
  onAnalyze: (pitch: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const DealInput: React.FC<DealInputProps> = ({ onAnalyze, isLoading, disabled }) => {
  const [pitch, setPitch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pitch.trim()) {
      onAnalyze(pitch);
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
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <form onSubmit={handleSubmit}>
        <label htmlFor="pitch-input" className="block text-lg font-semibold mb-2 text-slate-200">
          Enter Startup Pitch or Description
        </label>
        
        {/* File Upload Area */}
        <div 
          className={`mt-2 mb-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
            isDragging ? 'border-brand-accent bg-slate-900/50' : 'border-slate-600 hover:border-slate-500'
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
            <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <p className="text-sm text-slate-300">
              <span className="font-medium text-brand-accent">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">PDF, DOCX, PPT, TXT, or images (max 10MB)</p>
          </div>
        </div>

        {isUploading && (
          <div className="mb-4">
            <div className="w-full bg-slate-700 rounded-full h-2.5">
              <div 
                className="bg-brand-accent h-2.5 rounded-full transition-all duration-300" 
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
            className={`w-full h-64 p-4 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              disabled ? 'opacity-70 cursor-not-allowed' : ''
            }`}
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
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleUseSample}
              disabled={isLoading || isUploading}
              className="w-1/2 sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 focus:ring-4 focus:outline-none focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sample Pitch
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isUploading}
              className="w-1/2 sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 focus:ring-4 focus:outline-none focus:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <span>Upload</span>
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || isUploading || !pitch.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-base font-bold text-white bg-brand-blue rounded-lg hover:bg-brand-accent focus:ring-4 focus:outline-none focus:ring-blue-300 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isUploading ? 'Processing...' : 'Multi-Agent Analysis...'}
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
