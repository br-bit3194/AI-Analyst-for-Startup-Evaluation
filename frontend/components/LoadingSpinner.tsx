import React from 'react';

const LoadingSpinner: React.FC = () => {
    const messages = [
        "Consulting with market trends...",
        "Simulating investment committee debates...",
        "Analyzing founder DNA...",
        "Accessing institutional knowledge...",
        "Cross-referencing historical deal data...",
        "The Oracle is thinking..."
    ];
    const [message, setMessage] = React.useState(messages[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center text-center p-8">
            <svg className="animate-spin h-12 w-12 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-slate-200">
                {message}
            </h3>
            <p className="mt-1 text-slate-400">Please wait while the analysis is being generated.</p>
        </div>
    );
};

export default LoadingSpinner;
