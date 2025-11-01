"use client";

import { FileSearch, BarChart, TrendingUp, Users, Clock, Zap, Upload, Link as LinkIcon, Loader2 as Loader2Icon } from "lucide-react";
import { Loader2 } from "@/components/ui/loader-2";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeStartup } from "@/lib/api";
import { toast } from "sonner";
import { AnalysisResult } from "@/components/analysis/AnalysisResult";

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
    setPitchDescription(`Ecobox is the consumer- and SME-facing arm of Binbag, offering a convenient, certified, and full-service solution for e-waste (electrical and electronic waste) collection, tracking, data destruction and recycling. Driven by regulatory mandates (especially extended producer responsibility, or EPR) and mounting environmental awareness, Ecobox aims to provide a seamless service that bridges the gap between end-users (households, small businesses) and certified recyclers. Their vision: make e-waste disposal as easy as any other home service, while delivering transparent impact and circular economy benefit.
---

## The Problem

India generates a massive volume of e-waste yet collection, certified recycling and tracking remain weak. As one market study indicates: India’s e-waste generation is ~3 million + tons annually, while formal recycling capacity is significantly lower. ([bkschool.org.in][1])
Key pain points:

* For households and small businesses: Hassle of identifying a trustworthy recycler, arranging pickup, ensuring data destruction, getting compliance documentation.
* For manufacturers/brands: Meeting EPR commitments, getting reliable tracking and documentation of downstream disposal of consumer devices.
* For recyclers: Fragmented supply, high logistics cost, difficulty scaling collection from small lot generators.

In short: there is a large regulatory and consumer demand — but the service layer is fragmented and often opaque.

---

## The Solution

Ecobox provides a packaged, digital-enabled service that simplifies the e-waste disposal journey for end-users and small businesses. From the website:

* Users can **order an Ecobox** to their doorstep, fill it with old gadgets and small e-waste (phones, laptops, chargers, cables etc). ([ecobox.binbag.in][2])
* Free pickup of the box (or shipping address if they use their own box) and then certified, zero landfill recycling with full data destruction and tracking. ([ecobox.binbag.in][2])
* For mini businesses/SMEs: subscription plans (for example: INR 2,999/yr for 10–20 employees) offering Ecoboxes, e-waste manifest, compliance documents. ([ecobox.binbag.in][3])
* The parent company (Binbag) has a broader infrastructure: pan-India service, digital dashboard, own recycling units, data destruction, compliance & refurbishing. ([binbag.in][4])

Thus, Ecobox is positioned as the accessible outward‐facing brand that taps into Binbag’s backend infrastructure, bringing professional e-waste services to smaller generators (households, SMEs) that previously were underserved.

---

## Business Model

Ecobox’s model comprises a few revenue-streams:

* **Subscription for SMEs / small offices**: The website shows plans: e.g., for 10–20 employees, allowing 4 free Ecoboxes annually for INR 2,999 + taxes. ([ecobox.binbag.in][3])
* **Consumer pickup service**: While the consumer service is marketed as “free pickup” for households when using Ecobox box. The question remains how margins work at scale (likely through scale, refurbishing value, and upsell). ([ecobox.binbag.in][2])
* **Value extraction & recycling downstream**: The parent company recovers value from devices (refurbishing, resale, material recovery) and services large enterprises, which helps subsidize smaller-generator economics. ([ANDE][5])
* **Compliance documentation & EPR support**: For brands and manufacturers, perhaps premium services can be monetised.

Key economic model: converting many low-volume smaller generators into a continuous supply stream, leveraging logistics and digital tracking to drive cost efficiency; improve margins via refurbishing/resale & material recovery.

---

## Market & Opportunity

* The e-waste market in India is large and growing. With only a fraction currently formally collected and recycled, there is significant upside. ([bkschool.org.in][1])
* SME segment: Many offices, coworking spaces, small firms generate e-waste but lack structured disposal and compliance. Ecobox’s pricing targets that gap.
* Consumer segment: As awareness rises (privacy/data destruction, environmental concerns, resale value), more households are seeking safe, certified e-waste disposal — Ecobox offers ease of “order box, fill, ship/pickup” model.
* Regulatory tailwinds: EPR regulations for electronics, tightening enforcement, push for responsible recycling and certified service providers — improves demand for reliable service providers like Ecobox/Binbag.
* Geographic expansion: India is large, many tier-2 & tier-3 cities remain underserved; the infrastructure of parent company supports pan-India reach. ([binbag.in][4])

With these trends, Ecobox is well-positioned to tap both the bottom-of-pyramid (individual households) and mid-tier (SME, offices) segments.

---

## Competitive Advantage

* **Integrated platform + infrastructure**: Unlike many collection-only services, Ecobox is backed by Binbag’s own recycling units, digital track-and-trace, data-destruction certification, refurbishing capabilities. ([ANDE][5])
* **Brand + trust**: Household consumers may distrust informal e-waste disposers. Ecobox offers certified, tracked, transparent service (e.g., recycling certificate) which builds trust. ([ecobox.binbag.in][2])
* **Ease & convenience**: The “order box, pick up from door” model simplifies what otherwise might be a cumbersome process.
* **SME focused plans**: Many e-waste services focus only large corporates; Ecobox addresses SME size generators with tailored pricing and simplicity.
* **Value extraction + circular economy**: Use of downstream refurbishing and secondary materials allows cost offsets and improved margins.

---

## Traction & Milestones (Publicly available / estimated)

* Binbag’s background: Founded 2014, with goal to solve e-waste disposal from households and businesses. ([binbag.in][6])
* According to a sector-report, Binbag had existing revenue around US$1 million for FY 23-24, recycled ~2,000 tonnes of e-waste, avoided ~2,880 tonnes of GHG emissions. ([ANDE][5])
* The same report shows funding raised (equity + debt) of ~US$1.1 million to date. ([ANDE][5])

While specific numbers for Ecobox brand are not publicly broken out, the parent company’s metrics validate that infrastructure is live and scaling.

---

## Impact & ESG Proposition

* Environmental: By diverting e-waste from informal/unsafe channels and landfills, Ecobox contributes to reduced pollution, resource circularity, and lower greenhouse gas emissions. The parent notes e-waste recycling avoids emissions (example: 1,000 tons of e-waste ~1,440 tons CO₂ avoided) in their messaging. ([binbag.in][6])
* Social: By formalising e-waste collection and recycling, the model creates traceable jobs, reduces informal sector risk exposures, and fosters safer disposal across incomes.
* Governance & compliance: Transparent tracking, certified recyclers, documented disposal chains make Ecobox attractive to compliance-driven brands and regulators.
* Circular economy: By refurbishing devices, recovering secondary materials and enabling reuse / resale, Ecobox aligns with circular economy goals, not purely “take-dispose”.

These impact credentials are strong for ESG-driven buyers (enterprises) and consumers choosing sustainable services.

---

## Risks & Challenges

* **Logistics & cost structure**: For low-volume household generators, collection + shipping costs may challenge unit economics unless offset by scale, refurbishing value, or cross-subsidisation.
* **Behavioural change**: Convincing households to pack and send devices rather than discard informally remains a behavioural barrier.
* **Regulatory clarity & enforcement**: While EPR is a tailwind, enforcement gaps can delay large scale adoption and price consolidation.
* **Scale & competition**: As the opportunity becomes obvious, other players may enter with low-cost models; differentiation must be maintained via service, trust, tracking.
* **Valuation of recovered materials**: Device refurbishing and material recovery margins fluctuate with market value of scrap and components; downturns could impact economics.

---

## Go-to-Market Strategy

* **Consumer outreach**: Digital marketing, partnerships with device brands, e-commerce platforms, tie-ups with gadget retailers to include an “Ecobox option” at end-of-life of devices.
* **SME/Office campaigns**: Target coworking spaces, small offices, startup hubs — emphasise compliance simplicity, fixed-price plans and ESG credentials.
* **Brand/Corporate partnerships**: Offer “take-back” programmes for large manufacturers to channel devices via Ecobox; co-branding opportunities.
* **Logistics & hub roll-out**: Expand collection hubs / micro-warehouses in Tier-2/3 cities to bring pickup costs down, service speed up.
* **Data & analytics value-add**: Provide dashboard analytics for clients (brand, SME) showing volumes recycled, emissions avoided, compliance status — turning service into a value proposition beyond pick-up.
* **Refurb-plus resale model**: Leverage refurbished devices and material recovery to offset costs and improve margins, enabling cross-subsidy of free/low-cost pick-ups.

---

## Funding Ask & Use of Funds

Ecobox is seeking a seed/Series A round to scale logistics, technology, marketing and geographic reach. Proposed ask: **₹8 Crore (~US$1 million)**. Allocation example:

* 40 % – expand collection hubs & logistics fleet (Tier-2/3 cities)
* 30 % – technology platform & analytics dashboard enhancement
* 20 % – marketing, consumer/SME acquisition campaigns
* 10 % – team & operations (service, customer success, compliance)

This funding would allow Ecobox to achieve scale, reduce per-unit cost, improve margins, and hit a meaningful revenue inflection point in ~18-24 months.

---

## Vision & Long-Term Outlook

Ecobox envisions a future where **returning old electronics is as routine and hassle-free as ordering a pickup for dry waste**. Beyond India, the model could expand to other emerging markets with similar e-waste challenges. With its roots in Binbag’s infrastructure, Ecobox could evolve into the “consumer front-door” for circular electronics. Over time, the platform could integrate resale/refurb market, subscription upgrade services (“trade-in your old device for a discount”), embedded analytics for brands, and possibly even expansion into battery-recycling and other electronic waste streams (e-bikes, EV components). The long-term aim: to **make certified, trackable electronics disposal and reuse the default choice**, thereby radically reducing landfill e-waste and resource extraction globally.

---

## Summary

Ecobox by Binbag is uniquely positioned at the intersection of rising regulatory demand (e-waste, EPR), consumer sustainability awareness and logistics/digital innovation. Its offering of door-step, certified e-waste pickup, backed by strong infrastructure, gives it a credible moat. With the right scaling, cost control and brand positioning, Ecobox has potential to become a leading player in India’s electronic circular economy space. For your analytics app: this pitch offers clear KPIs (tonnes recycled, customers acquired, margin improvements, emissions avoided) and a compelling narrative of growth, impact and value.

---
`);
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
      
      const responseData = await response.json();
      
      // Check if we have a result object in the response
      const resultData = responseData.result || responseData;
      
      // Ensure the response has the expected structure
      const processedData = {
        analysis_id: resultData.analysis_id || id,
        start_time: resultData.start_time || new Date().toISOString(),
        duration_seconds: resultData.duration_seconds || 0,
        agents: resultData.agents || {},
        final_verdict: resultData.final_verdict || {
          recommendation: resultData.recommendation,
          confidence: resultData.confidence,
          confidence_label: resultData.confidence_label,
          reasons: resultData.reasons || [],
          timestamp: resultData.timestamp || new Date().toISOString()
        },
        ...(resultData.committee_analysis && { committee_analysis: resultData.committee_analysis })
      };
      
      // Set the analysis result immediately to show available data
      setAnalysisResult(processedData);
      
      // Check the status to determine if we should continue polling
      const status = responseData.status || (resultData ? 'completed' : 'processing');
      
      if (status === 'completed' || status === 'succeeded') {
        setAnalysisStatus('completed');
        setIsSubmitting(false);
      } else if (status === 'failed') {
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
              This may take a 2-3 mins...
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
            <div className="mt-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analysis Results</h2>
                <button
                  onClick={resetAnalysis}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  New Analysis
                </button>
              </div>
              <AnalysisResult result={analysisResult} />
              
              {/* Raw JSON Toggle (for debugging) */}
              <div className="mt-6 border-t border-gray-200 pt-4">
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
