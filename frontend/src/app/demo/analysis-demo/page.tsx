'use client';

import { useEffect, useState } from 'react';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Sample data that matches the expected analysis result structure
const sampleAnalysisData = {
  analysis_id: "demo-12345",
  start_time: new Date().toISOString(),
  duration_seconds: 2.5,
  agents: {
    RiskAnalyst: {
      success: true,
      data: {
        risk_analysis: {
          risk_factors: [
            {
              category: "Market Risk",
              description: "The target market is highly competitive with established players.",
              impact: "High",
              likelihood: "Medium",
              confidence: 0.85,
              mitigation: "Focus on niche markets and unique value propositions."
            },
            {
              category: "Financial Risk",
              description: "Current burn rate suggests 12 months of runway remaining.",
              impact: "Medium",
              likelihood: "High",
              confidence: 0.9,
              mitigation: "Secure additional funding within 6 months."
            }
          ],
          overall_risk: {
            level: "Medium",
            explanation: "The startup shows promise but has significant risks that need to be managed.",
            confidence: 0.8
          },
          key_risks_summary: "Main risks include market competition and financial runway.",
          recommendations: [
            "Secure Series A funding within 6 months",
            "Focus on a specific niche to differentiate from competitors",
            "Implement cost optimization measures"
          ]
        }
      },
      error: null,
      confidence: 0.85
    },
    MarketExpert: {
      success: true,
      data: {
        market_analysis: {
          market_size_validation: {
            tam: {
              value: "5.2",
              currency: "Billion USD",
              year: 2025,
              source: "Market Research Inc.",
              confidence: 0.9,
              notes: "Total Addressable Market"
            },
            sam: {
              value: "1.8",
              currency: "Billion USD",
              year: 2025,
              source: "Internal Analysis",
              confidence: 0.8,
              notes: "Serviceable Available Market"
            },
            som: {
              value: "120",
              currency: "Million USD",
              year: 2025,
              source: "Internal Projections",
              confidence: 0.7,
              notes: "Serviceable Obtainable Market"
            },
            validation_notes: "Market size is substantial but competitive."
          },
          growth_projections: [
            {
              year: 2024,
              growth_rate: 25,
              market_size: "4.2 Billion USD",
              currency: "USD",
              drivers: [
                "Market expansion",
                "New product features",
                "Increased digital adoption"
              ],
              confidence: 0.85
            },
            {
              year: 2025,
              growth_rate: 35,
              market_size: "5.2 Billion USD",
              currency: "USD",
              drivers: [
                "International expansion",
                "Partnerships",
                "Product maturity"
              ],
              confidence: 0.8
            }
          ],
          competitive_positioning: {
            key_competitors: [
              {
                name: "Competitor A",
                strengths: [
                  "Strong brand recognition",
                  "Established customer base",
                  "Wide product range"
                ],
                weaknesses: [
                  "Slower innovation",
                  "Higher prices",
                  "Poor customer service"
                ]
              },
              {
                name: "Competitor B",
                strengths: [
                  "Innovative features",
                  "Strong technical team",
                  "Agile development"
                ],
                weaknesses: [
                  "Limited market presence",
                  "Smaller team",
                  "Limited funding"
                ]
              }
            ],
            competitive_advantage: "Our solution offers better integration and lower costs.",
            market_position: "Emerging leader in the SMB segment.",
            confidence: 0.85
          },
          summary: "The market shows strong growth potential with increasing demand for our solution."
        }
      },
      error: null,
      confidence: 0.9
    },
    FinanceExpert: {
      success: true,
      data: {
        " ": {
          model: "Subscription-based SaaS with tiered pricing",
          strengths: [
            "High gross margins (75-80%)",
            "Recurring revenue model",
            "Strong unit economics"
          ],
          concerns: [
            "High customer acquisition cost",
            "Long sales cycles",
            "Dependence on key customers"
          ]
        },
        unit_economics: {
          cac: 1500,
          ltv: 8500,
          payback_period: "14 months",
          analysis: "Healthy LTV:CAC ratio of 5.7x, above industry average."
        },
        financial_health: {
          burn_rate: 50000,
          runway_months: 12,
          analysis: "Adequate runway but recommend extending to 18+ months."
        },
        projections: {
          assumptions_analysis: "Conservative growth projections with 30% YoY growth.",
          sensitivity_analysis: "Moderately sensitive to customer churn rates.",
          red_flags: [
            "Customer concentration risk (top 3 customers = 45% of revenue)",
            "Increasing customer acquisition costs"
          ]
        }
      },
      error: null,
      confidence: 0.8
    },
    TeamEvaluator: {
      success: true,
      data: {
        team_analysis: {
          team_composition: {
            strengths: [
              "Strong technical expertise",
              "Proven track record in the industry",
              "Complementary skill sets"
            ],
            gaps: [
              "Lack of senior sales leadership",
              "Limited marketing experience"
            ],
            completeness_score: 7
          },
          experience_assessment: {
            relevant_experience: [
              "CEO: 10+ years in industry",
              "CTO: Former tech lead at major company"
            ],
            past_performance: [
              "Successfully exited previous startup",
              "Track record of product delivery"
            ],
            domain_expertise: "Deep expertise in target market with proven execution."
          },
          execution_risk: {
            key_risks: [
              "Scaling the team",
              "Hiring key positions",
              "Maintaining culture"
            ],
            mitigation_strategies: [
              "Hiring plan in place",
              "Strong company values",
              "Leadership development program"
            ],
            risk_score: 6
          },
          recommendations: {
            key_hires_needed: [
              "VP of Sales",
              "Marketing Director",
              "Customer Success Manager"
            ],
            advisors_suggested: [
              "Industry veteran for board seat",
              "Sales strategy advisor"
            ]
          }
        }
      },
      error: null,
      confidence: 0.85
    },
    CompetitiveAnalyst: {
      success: true,
      data: {
        competitive_landscape: {
          market_position: {
            positioning: "Premium provider for mid-market businesses",
            unique_value_prop: "All-in-one platform with superior UX and AI capabilities",
            moat: "Proprietary technology and strong network effects"
          },
          direct_competitors: [
            {
              name: "Competitor X",
              strengths: [
                "Established brand",
                "Large customer base",
                "Enterprise features"
              ],
              weaknesses: [
                "Outdated technology",
                "Poor mobile experience",
                "High prices"
              ],
              differentiation: "We offer modern technology at a better price point with superior mobile experience."
            },
            {
              name: "Competitor Y",
              strengths: [
                "Low cost",
                "Simple UI",
                "Freemium model"
              ],
              weaknesses: [
                "Limited features",
                "No enterprise support",
                "Basic reporting"
              ],
              differentiation: "We provide advanced features and enterprise support while maintaining ease of use."
            }
          ],
          barriers_to_entry: {
            existing: [
              "Established brand recognition",
              "Switching costs for customers",
              "Regulatory requirements"
            ],
            potential: [
              "Network effects",
              "Data moat",
              "Strategic partnerships"
            ]
          },
          threat_analysis: {
            incumbent_threats: [
              "Price wars",
              "Feature copying",
              "Acquisition of competitors"
            ],
            new_entrant_risks: [
              "Disruptive technology",
              "Better UX",
              "Lower cost structure"
            ],
            substitute_products: [
              "In-house solutions",
              "Manual processes",
              "Alternative platforms"
            ]
          }
        }
      },
      error: null,
      confidence: 0.88
    }
  },
  final_verdict: {
    recommendation: "CONSIDER",
    confidence: 0.82,
    confidence_label: "High",
    reasons: [
      "Strong market opportunity",
      "Experienced team",
      "Good product-market fit"
    ],
    timestamp: new Date().toISOString(),
    committee_analysis: {
      members: [
        {
          name: "Alex Johnson",
          role: "Investment Partner",
          personality: "Analytical and data-driven",
          analysis: "Strong market potential but concerns about competition",
          vote: "CONSIDER",
          confidence: 85,
          reasoning: "Market is growing but competitive. Team has relevant experience."
        },
        {
          name: "Sarah Chen",
          role: "Technical Expert",
          personality: "Technical and detail-oriented",
          analysis: "Solid technology with good differentiation",
          vote: "STRONG_INVEST",
          confidence: 90,
          reasoning: "Technology is ahead of competitors and well-architected."
        },
        {
          name: "Michael Brown",
          role: "Financial Analyst",
          personality: "Risk-averse",
          analysis: "Financials show promise but need to monitor burn rate",
          vote: "CONSIDER",
          confidence: 75,
          reasoning: "Good margins but runway could be extended."
        },
        {
          name: "Priya Patel",
          role: "Market Strategist",
          personality: "Big-picture thinker",
          analysis: "Market timing is right for this solution",
          vote: "STRONG_INVEST",
          confidence: 88,
          reasoning: "Market trends strongly support this solution's value proposition."
        },
        {
          name: "David Kim",
          role: "Operations Expert",
          personality: "Process-oriented",
          analysis: "Team needs to strengthen operations",
          vote: "RISKY",
          confidence: 65,
          reasoning: "Operational gaps could hinder scaling."
        }
      ],
      final_verdict: "CONSIDER",
      consensus_score: 0.82,
      majority_vote: "CONSIDER",
      dissenting_opinions: [
        "David Kim voted RISKY due to concerns about operational readiness.",
        "Sarah Chen and Priya Patel voted STRONG_INVEST, seeing strong market potential and technology."
      ],
      key_debate_points: [
        "Market timing vs. operational readiness",
        "Competitive landscape assessment",
        "Team's ability to execute on growth plans"
      ]
    }
  },
  status: "completed",
  summary: {
    keyInsights: [
      "Strong market opportunity in growing industry",
      "Experienced founding team with relevant background",
      "Good product-market fit with paying customers"
    ],
    strengths: [
      "Differentiated technology",
      "Strong unit economics",
      "Clear path to scale"
    ],
    concerns: [
      "Competitive market",
      "Operational scaling risks",
      "Customer concentration"
    ],
    recommendations: [
      "Proceed with due diligence",
      "Focus on key hires in sales and marketing",
      "Develop contingency plans for competitive threats"
    ]
  }
};

export default function AnalysisDemoPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setAnalysisData(sampleAnalysisData);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading || !analysisData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-lg font-medium">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Startup Analysis Dashboard</h1>
          <p className="text-gray-600">Interactive demo of the analysis results component</p>
        </div>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              This is a demo showing how the analysis results will be displayed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalysisResult result={analysisData} />
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500">
          <p>This is a demo with sample data. In a real scenario, this would show actual analysis results.</p>
        </div>
      </div>
    </div>
  );
}
