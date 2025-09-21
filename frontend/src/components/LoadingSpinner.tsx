import React from 'react';

const LoadingSpinner: React.FC<{ isCommittee?: boolean }> = ({ isCommittee = false }) => {
    const analysisMessages = [
        "Analyzing market potential and competitive landscape...",
        "Evaluating financial projections and unit economics...",
        "Assessing team experience and execution capabilities...",
        "Reviewing product differentiation and technology...",
        "Validating customer traction and growth metrics...",
        "Finalizing investment thesis and risk assessment..."
    ];

    const committeeMessages = [
        "Simulating partner discussions...",
        "Gathering committee member insights...",
        "Analyzing deal terms and valuation...",
        "Evaluating market positioning...",
        "Assessing competitive advantages...",
        "Finalizing investment recommendation..."
    ];

    const messages = isCommittee ? committeeMessages : analysisMessages;
    const [message, setMessage] = React.useState(messages[0]);
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
        // Update message every 3 seconds
        const messageInterval = setInterval(() => {
            setMessage(prev => {
                const currentIndex = messages.indexOf(prev);
                const nextIndex = (currentIndex + 1) % messages.length;
                return messages[nextIndex];
            });
        }, 3000);

        // Simulate progress (0-90%)
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return 90; // Cap at 90% until complete
                return prev + Math.random() * 5;
            });
        }, 500);

        return () => {
            clearInterval(messageInterval);
            clearInterval(progressInterval);
        };
    }, [messages]);

    return (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                    {/* Animated Spinner */}
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <svg 
                                className="w-16 h-16 text-indigo-600 animate-spin" 
                                viewBox="0 0 24 24"
                                style={{
                                    animationDuration: '1.5s',
                                    animationTimingFunction: 'cubic-bezier(0.5, 0, 0.5, 1)'
                                }}
                            >
                                <circle 
                                    className="opacity-75" 
                                    cx="12" 
                                    cy="12" 
                                    r="10" 
                                    stroke="currentColor" 
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="60 15"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
                        </div>
                    </div>

                    {/* Loading Message */}
                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                            {isCommittee 
                                ? 'Simulating Investment Committee Discussion' 
                                : 'Analyzing Your Startup Pitch'}
                        </h3>
                        <p className="text-indigo-700 font-medium transition-opacity duration-500">
                            {message}
                        </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Progress</span>
                            <span>{Math.min(100, Math.round(progress))}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-500">
                            {progress < 30 
                                ? 'Gathering initial data...' 
                                : progress < 60 
                                    ? 'Running deep analysis...' 
                                    : 'Finalizing results...'}
                        </p>
                    </div>
                </div>
            </div>
            
            {/* Decorative Footer */}
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                    This typically takes 15-30 seconds. Please don't close this window.
                </p>
            </div>
        </div>
    );
};

export default LoadingSpinner;
