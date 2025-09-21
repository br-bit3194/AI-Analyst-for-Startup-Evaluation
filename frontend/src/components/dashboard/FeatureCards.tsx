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
    icon: <Users className="w-6 h-6" />,
    title: "Investment Committee Simulator",
    description: "Multi-agent VC boardroom simulation where AI personas debate deals and vote — delivering a realistic investment recommendation.",
    color: "from-purple-500 to-indigo-500"
  },
  {
    icon: <BrainCircuit className="w-6 h-6" />,
    title: "Investment Memory System",
    description: "Learns from past decisions and outcomes, surfaces hidden biases, and refines future investment scoring over time.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: "Explainable Risk Radar",
    description: "Flags risks with transparent reasoning and confidence scores, e.g., inflated TAM or weak retention metrics.",
    color: "from-amber-500 to-yellow-500"
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Conversational Due Diligence",
    description: "Chat directly with deal data. Compare benchmarks, churn, or market trends using multi-agent orchestration.",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: <BellRing className="w-6 h-6" />,
    title: "Continuous Monitoring & Alerts",
    description: "Tracks founder updates, competitor funding, and regulatory changes. Sends smart event-based alerts instantly.",
    color: "from-rose-500 to-pink-500"
  },
  {
    icon: <UserCircle className="w-6 h-6" />,
    title: "Founder & Team Deep Dive",
    description: "Analyzes LinkedIn and public profiles to assess team strength, exits, and risks like missing technical founders.",
    color: "from-indigo-500 to-violet-500"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Market Reality Check",
    description: "Validates TAM/SAM/SOM claims with external reports and trends, exposing overhyped projections.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Competitive Landscape Heatmap",
    description: "Auto-generated visual of startup vs peers on traction, funding, and valuation — a quick battlefield view.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Investor-Ready Deal Notes",
    description: "Generates polished memos with strengths, risks, benchmarks, and IC insights — saving analysts days of work.",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: <LineChart className="w-6 h-6" />,
    title: "Finance Reports Dashboard",
    description: "Central hub for burn rate, runway, MRR, cash flow, benchmarks, and red-flag alerts on financial health.",
    color: "from-sky-500 to-cyan-500"
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
            className={`bg-gradient-to-br ${feature.color} p-6 rounded-xl text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}
          >
            <div className="bg-white/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              {React.cloneElement(feature.icon, { className: "w-6 h-6 text-white" })}
            </div>
            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
            <p className="text-sm text-white/90">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureCards;
