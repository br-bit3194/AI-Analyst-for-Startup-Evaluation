"use client";

import { FileSearch, BarChart, TrendingUp, Users, Clock, Zap, Upload, Link as LinkIcon } from "lucide-react";
import { useState } from "react";

export default function DealAnalysisPage() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [pitchDescription, setPitchDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle form submission
    console.log({ websiteUrl, pitchDescription, selectedFile });
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-3xl">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 shadow-sm">
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
            >
              Use Sample Pitch
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Analyze Startup
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
}
