import React from 'react';

const FeatureCard: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({ title, description, icon }) => (
    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 text-center">
        <div className="flex justify-center items-center mb-4 w-12 h-12 rounded-full bg-slate-700 mx-auto">
            {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
    </div>
);


const Welcome: React.FC = () => {
    return (
        <div className="text-center py-10 px-4">
            <h2 className="text-4xl font-extrabold text-white mb-4">Welcome to Startalytica</h2>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto mb-12">
                Your AI-powered Venture Capital Associate. Enter a startup's details above to receive a comprehensive investment analysis, leveraging simulated institutional knowledge and multi-persona evaluation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <FeatureCard 
                    title="Founder DNA Analysis" 
                    description="Analyzes communication, team dynamics, and predicts founder responses to stress."
                    icon={<IconBrain />}
                />
                 <FeatureCard 
                    title="Market Pulse Intel" 
                    description="Simulates real-time news impact and competitor threats affecting the deal."
                    icon={<IconPulse />}
                />
                 <FeatureCard 
                    title="Investment Committee" 
                    description="Simulates multiple investor personas to provide a 360-degree view on the deal."
                    icon={<IconUsers />}
                />
            </div>
        </div>
    );
};


const IconBrain = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2.5 2.5 0 00-3.536 0l-3.535 3.536a2.5 2.5 0 103.536 3.536l3.535-3.536a2.5 2.5 0 000-3.536z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12h.01M4.572 8.572a2.5 2.5 0 000 3.536l3.536 3.536a2.5 2.5 0 003.536 0l3.535-3.536a2.5 2.5 0 000-3.536l-3.536-3.535a2.5 2.5 0 00-3.536 0L4.572 8.572z" />
    </svg>
);
const IconPulse = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);
const IconUsers = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);


export default Welcome;
