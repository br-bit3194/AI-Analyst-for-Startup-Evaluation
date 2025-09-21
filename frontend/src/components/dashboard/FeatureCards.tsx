import React from 'react';
import { 
  Users, 
  BrainCircuit, 
  AlertTriangle, 
  MessageSquare, 
  BellRing, 
  UserCircle, 
  Globe, 
  BarChart3, 
  FileText, 
  LineChart 
} from 'lucide-react';

const features = [
  {
    icon: <Users className="w-6 h-6 text-purple-600" />,
    title: "Investment Committee Simulator",
    description: "Multi-agent VC boardroom simulation where AI personas debate deals and vote — delivering a realistic investment recommendation.",
    bgColor: "bg-purple-50",
    textColor: "text-purple-800",
    iconBg: "bg-purple-100"
  },
  {
    icon: <BrainCircuit className="w-6 h-6 text-blue-600" />,
    title: "Investment Memory System",
    description: "Learns from past decisions and outcomes, surfaces hidden biases, and refines future investment scoring over time.",
    bgColor: "bg-blue-50",
    textColor: "text-blue-800",
    iconBg: "bg-blue-100"
  },
  {
    icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    title: "Explainable Risk Radar",
    description: "Flags risks with transparent reasoning and confidence scores, e.g., inflated TAM or weak retention metrics.",
    bgColor: "bg-amber-50",
    textColor: "text-amber-800",
    iconBg: "bg-amber-100"
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-emerald-600" />,
    title: "Conversational Due Diligence",
    description: "Chat directly with deal data. Compare benchmarks, churn, or market trends using multi-agent orchestration.",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-800",
    iconBg: "bg-emerald-100"
  },
  {
    icon: <BellRing className="w-6 h-6 text-rose-600" />,
    title: "Continuous Monitoring & Alerts",
    description: "Tracks founder updates, competitor funding, and regulatory changes. Sends smart event-based alerts instantly.",
    bgColor: "bg-rose-50",
    textColor: "text-rose-800",
    iconBg: "bg-rose-100"
  },
  {
    icon: <UserCircle className="w-6 h-6 text-indigo-600" />,
    title: "Founder & Team Deep Dive",
    description: "Analyzes LinkedIn and public profiles to assess team strength, exits, and risks like missing technical founders.",
    bgColor: "bg-indigo-50",
    textColor: "text-indigo-800",
    iconBg: "bg-indigo-100"
  },
  {
    icon: <Globe className="w-6 h-6 text-cyan-600" />,
    title: "Market Reality Check",
    description: "Validates TAM/SAM/SOM claims with external reports and trends, exposing overhyped projections.",
    bgColor: "bg-cyan-50",
    textColor: "text-cyan-800",
    iconBg: "bg-cyan-100"
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-green-600" />,
    title: "Competitive Landscape Heatmap",
    description: "Auto-generated visual of startup vs peers on traction, funding, and valuation — a quick battlefield view.",
    bgColor: "bg-green-50",
    textColor: "text-green-800",
    iconBg: "bg-green-100"
  },
  {
    icon: <FileText className="w-6 h-6 text-violet-600" />,
    title: "Investor-Ready Deal Notes",
    description: "Generates polished memos with strengths, risks, benchmarks, and IC insights — saving analysts days of work.",
    bgColor: "bg-violet-50",
    textColor: "text-violet-800",
    iconBg: "bg-violet-100"
  },
  {
    icon: <LineChart className="w-6 h-6 text-sky-600" />,
    title: "Finance Reports Dashboard",
    description: "Central hub for burn rate, runway, MRR, cash flow, benchmarks, and red-flag alerts on financial health.",
    bgColor: "bg-sky-50",
    textColor: "text-sky-800",
    iconBg: "bg-sky-100"
  }
];

const FeatureCards: React.FC = () => {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-6">
        Startup Analysis Features
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div 
            key={index}
            className={`${feature.bgColor} p-6 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-100`}
          >
            <div className={`${feature.iconBg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
              {feature.icon}
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${feature.textColor}`}>{feature.title}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;
