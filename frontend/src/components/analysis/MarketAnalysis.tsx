import React from 'react';
import { BarChart2 as BarChart } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { BaseAgent } from './AnalysisResult';

interface Competitor {
  name: string;
  strengths: string[];
  weaknesses: string[];
}

interface CompetitivePositioning {
  positioning?: string;
  competitors?: Competitor[];
}

interface MarketAnalysisData {
  summary?: string;
  market_size_validation?: {
    TAM?: string | number;
    SAM?: string | number;
    SOM?: string | number;
    validation_notes?: string;
  };
  growth_projections?: Array<{
    year: number;
    growth_rate: number;
    market_size: string;
    currency: string;
    drivers: string[];
    confidence: number;
  }>;
  competitive_positioning?: CompetitivePositioning;
}

interface MarketExpertType {
  data?: {
    market_analysis?: MarketAnalysisData;
    [key: string]: unknown;
  };
  success: boolean;
  error: string | null;
  confidence: number;
}

interface MarketAnalysisProps {
  marketExpert: MarketExpertType | undefined;
}

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ marketExpert }) => {
  const marketAnalysis = marketExpert?.data?.market_analysis;
  
  if (!marketExpert || !marketAnalysis) {
    return null;
  }
  
  const marketSize = marketAnalysis.market_size_validation;
  const growthProjections = marketAnalysis.growth_projections;
  const competitivePositioning = marketAnalysis.competitive_positioning;
  
  return (
    <Card key="market-analysis">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="h-5 w-5 mr-2 text-blue-600" />
          Market Analysis
        </CardTitle>
        {marketAnalysis.summary && (
          <CardDescription>{marketAnalysis.summary}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Market Size */}
        {marketSize && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Market Size Validation</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow">
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">TAM</h5>
                <p className="text-xl font-semibold text-blue-700">
                  {marketSize.TAM !== undefined ? String(marketSize.TAM) : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow">
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">SAM</h5>
                <p className="text-xl font-semibold text-blue-700">
                  {marketSize.SAM !== undefined ? String(marketSize.SAM) : 'N/A'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100 shadow">
                <h5 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">SOM</h5>
                <p className="text-xl font-semibold text-blue-700">
                  {marketSize.SOM !== undefined ? String(marketSize.SOM) : 'N/A'}
                </p>
              </div>
            </div>
            {marketSize.validation_notes && (
              <div className="mt-3 text-sm text-gray-600">
                <p className="font-medium">Validation Notes:</p>
                <p>{marketSize.validation_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Growth Projections */}
        {growthProjections && growthProjections.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Growth Projections</h4>
            <div className="space-y-4">
              {growthProjections.map((projection, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-blue-50">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium">Year {projection.year}</h5>
                    <span className="text-sm px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {projection.growth_rate}% Growth
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Market Size: {projection.market_size} {projection.currency}
                  </p>
                  {projection.drivers && projection.drivers.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700 mb-1">Key Drivers:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {projection.drivers.map((driver, i) => (
                          <li key={i}>{driver}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Competitive Positioning */}
        {competitivePositioning && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Competitive Positioning</h4>
            {competitivePositioning.positioning && (
              <p className="mb-4 text-gray-700">{competitivePositioning.positioning}</p>
            )}
            {competitivePositioning.competitors && competitivePositioning.competitors.length > 0 && (
              <div className="space-y-4">
                {competitivePositioning.competitors.map((competitor, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-gray-100">
                    <h5 className="font-medium text-gray-900 mb-2">{competitor.name}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-1">Strengths</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {competitor.strengths.map((strength, i) => (
                            <li key={`strength-${i}`} className="text-green-700">
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-1">Weaknesses</p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {competitor.weaknesses.map((weakness, i) => (
                            <li key={`weakness-${i}`} className="text-red-700">
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketAnalysis;
