"use client";

import { FileSearch, BarChart, TrendingUp, Users, Clock, Zap } from "lucide-react";

export default function DealAnalysisPage() {
  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Deal Analysis</h1>
        <p className="text-gray-700">Analyze and evaluate new startup opportunities with comprehensive due diligence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Quick Analysis",
            description: "Rapid initial assessment of a startup's potential",
            icon: <Zap className="h-6 w-6 text-blue-600" />,
            href: "/dashboard/deal-analysis/quick"
          },
          {
            title: "Comprehensive Due Diligence",
            description: "In-depth analysis of all aspects of the business",
            icon: <FileSearch className="h-6 w-6 text-green-600" />,
            href: "/dashboard/deal-analysis/due-diligence"
          },
          {
            title: "Financial Projections",
            description: "Analyze financial models and projections",
            icon: <TrendingUp className="h-6 w-6 text-purple-600" />,
            href: "/dashboard/deal-analysis/financials"
          },
          {
            title: "Market Analysis",
            description: "Evaluate market size and competition",
            icon: <BarChart className="h-6 w-6 text-amber-600" />,
            href: "/dashboard/deal-analysis/market"
          },
          {
            title: "Team Evaluation",
            description: "Assess the founding team and key personnel",
            icon: <Users className="h-6 w-6 text-rose-600" />,
            href: "/dashboard/deal-analysis/team"
          },
          {
            title: "Historical Deals",
            description: "Compare with past investment opportunities",
            icon: <Clock className="h-6 w-6 text-cyan-600" />,
            href: "/dashboard/deal-analysis/history"
          }
        ].map((item, index) => (
          <a
            key={index}
            href={item.href}
            className="group block p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {item.description}
                </p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
