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
    title: "AI Boardroom",
    description: "AI-simulated VC committee debates and votes on deals with human-like insights",
    icon: <Users className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-indigo-600 to-purple-600",
    hover: "hover:from-indigo-700 hover:to-purple-700"
  },
  {
    title: "Deal Memory",
    description: "Learns from past investments to uncover biases and improve future decisions",
    icon: <BrainCircuit className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-cyan-600 to-blue-600",
    hover: "hover:from-cyan-700 hover:to-blue-700"
  },
  {
    title: "Risk Radar",
    description: "Identifies and quantifies risks with clear, actionable insights",
    icon: <AlertTriangle className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-amber-500 to-orange-500",
    hover: "hover:from-amber-600 hover:to-orange-600"
  },
  {
    title: "Deal Chat",
    description: "Natural language Q&A with your deal data and documents",
    icon: <MessageSquare className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-teal-500 to-emerald-600",
    hover: "hover:from-teal-600 hover:to-emerald-700"
  },
  {
    title: "Portfolio Watch",
    description: "Real-time monitoring of portfolio companies and market movements",
    icon: <BellRing className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-rose-500 to-pink-600",
    hover: "hover:from-rose-600 hover:to-pink-700"
  },
  {
    title: "Team Insights",
    description: "Deep analysis of founding teams' strengths and potential red flags",
    icon: <UserCircle className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-violet-600 to-indigo-600",
    hover: "hover:from-violet-700 hover:to-indigo-700"
  },
  {
    title: "Market Truth",
    description: "Validates market size claims against real data and trends",
    icon: <Globe className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-sky-500 to-blue-600",
    hover: "hover:from-sky-600 hover:to-blue-700"
  },
  {
    title: "Rival Mapper",
    description: "Visual competitive positioning and benchmarking",
    icon: <BarChart3 className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-emerald-500 to-green-600",
    hover: "hover:from-emerald-600 hover:to-green-700"
  },
  {
    title: "Deal Brief",
    description: "One-click generation of investor-ready deal memos",
    icon: <FileText className="w-5 h-5" />,
    gradient: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
    hover: "hover:from-purple-600 hover:to-fuchsia-700"
  }
];

const Welcome: React.FC = () => {
    return (
        <div className="py-10 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-4">
                    AI-Powered Venture Capital Analysis
                </h1>
                <p className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
                    Get comprehensive startup evaluations powered by AI, combining multi-agent simulations, 
                    market intelligence, and financial analysis to make better investment decisions.
                </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature, index) => (
                    <div 
                        key={index}
                        className={`${feature.gradient} ${feature.hover} p-5 rounded-xl text-white transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg`}
                    >
                        <div className="bg-white/20 backdrop-blur-sm w-10 h-10 rounded-lg flex items-center justify-center mb-3 shadow-inner">
                            {React.cloneElement(feature.icon, { className: "w-5 h-5 text-white" })}
                        </div>
                        <h3 className="text-lg font-bold mb-2 text-white drop-shadow-sm">{feature.title}</h3>
                        <p className="text-white/90 text-xs leading-snug">{feature.description}</p>
                    </div>
                ))}
            </div>
            
            <div className="mt-16 text-center">
                <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 leading-relaxed">
                    Ready to analyze a startup? Enter the details above to get started with our comprehensive investment analysis.
                </p>
            </div>
        </div>
    );
};


export default Welcome;
