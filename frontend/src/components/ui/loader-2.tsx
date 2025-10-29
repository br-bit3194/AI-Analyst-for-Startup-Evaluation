import { cn } from "@/lib/utils";
import { useState } from "react";

export const Loader2 = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center justify-center space-x-8 p-8">
      <div className="loader">
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <circle r="32" cy="40" cx="40" id="test" 
            className="stroke-current text-blue-500"
            strokeWidth="4"
            strokeDasharray="180"
            strokeDashoffset="0"
            fill="none"
            style={{
              animation: 'pathCircle 2s linear infinite'
            }}
          />
        </svg>
      </div>

      <div className="loader triangle">
        <svg viewBox="0 0 86 80" className="w-16 h-16">
          <polygon 
            points="43 8 79 72 7 72" 
            className="stroke-current text-green-500"
            strokeWidth="4"
            strokeDasharray="210"
            strokeDashoffset="210"
            fill="none"
            style={{
              animation: 'pathTriangle 2s linear infinite'
            }}
          />
        </svg>
      </div>

      <div className="loader">
        <svg viewBox="0 0 80 80" className="w-16 h-16">
          <rect 
            height="64" 
            width="64" 
            y="8" 
            x="8" 
            className="stroke-current text-purple-500"
            strokeWidth="4"
            strokeDasharray="256"
            strokeDashoffset="256"
            fill="none"
            style={{
              animation: 'pathRect 2s linear infinite'
            }}
          />
        </svg>
      </div>
    </div>
  );
};
