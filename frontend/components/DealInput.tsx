import React, { useState, useRef, ChangeEvent } from 'react';

interface DealInputProps {
  onAnalyze: (pitch: string, websiteUrl?: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

interface DealInputProps {
  onAnalyze: (pitch: string, websiteUrl?: string) => void;
  isLoading: boolean;
  disabled: boolean;
}

const DealInput: React.FC<DealInputProps> = ({ onAnalyze, isLoading, disabled }) => {
  const [pitch, setPitch] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pitch.trim()) {
      onAnalyze(pitch, websiteUrl);
    }
  };

  const samplePitch = `### **Startup Name: EcoBox**

**Tagline:** *Sustainability, Delivered.*

**Pitch:**

At EcoBox, we're revolutionizing the way people shop for eco-friendly products by offering a one-stop online marketplace for sustainable and zero-waste essentials. We connect conscious consumers with top-rated, eco-conscious brands that provide everything from biodegradable cleaning products to reusable home goods—all in one place.

**The Problem:**
Today, consumers want to reduce their environmental impact, but it’s difficult to find reliable, sustainable products. Current options are often scattered across multiple platforms, and it’s time-consuming to vet the brands for transparency, ethical sourcing, and environmental responsibility.

**The Solution:**
EcoBox solves this by curating a premium selection of eco-friendly products, from personal care to home essentials. Every product on our platform is vetted for sustainability, ethical production, and eco-conscious packaging. We also offer a subscription service that helps customers maintain a zero-waste lifestyle with regular deliveries of essentials, all packaged in 100% recyclable or compostable materials.

**Market Opportunity:**
The global market for sustainable goods is expected to reach \$150 billion by 2025, and demand for eco-friendly products is growing exponentially. Consumers are increasingly aligning their values with their purchasing decisions, and EcoBox is poised to tap into this rapidly expanding trend.

**Revenue Model:**
We operate on a commission-based model, earning a percentage of each sale from the brands we partner with. Additionally, our subscription service provides steady, recurring revenue. By offering exclusive member discounts, green rewards, and early access to new products, we keep customers engaged and loyal.

**Why Now:**
With growing awareness around climate change, pollution, and waste, consumers are looking for solutions to reduce their ecological footprint. EcoBox’s online platform empowers them to make conscious, impactful purchasing decisions with ease, all from the comfort of their home.

**Team:**
EcoBox was founded by a group of passionate environmentalists, e-commerce experts, and sustainability advocates who believe in the power of consumer choice to drive positive change. We’re on a mission to make sustainability accessible, affordable, and convenient for everyone.
`;

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
        onAnalyze(text, websiteUrl);
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
        
        {/* Website URL Input */}
        <div className="mb-4">
          <label htmlFor="website-url" className="block text-sm font-medium text-slate-300 mb-1">
            Company Website (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              type="url"
              id="website-url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={isLoading || isUploading || disabled}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {websiteUrl && (
              <button
                type="button"
                onClick={() => setWebsiteUrl('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                title="Clear URL"
              >
                <svg className="h-4 w-4 text-slate-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Add the company website to enhance analysis with additional product and vision information
          </p>
        </div>

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
