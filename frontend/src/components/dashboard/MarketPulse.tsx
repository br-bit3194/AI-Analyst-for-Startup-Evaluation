import React from 'react';
import type { MarketPulse as MarketPulseType } from '../../types';

const MarketPulse: React.FC<{ pulse: MarketPulseType }> = ({ pulse }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/50 h-full shadow-lg">
      <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400 mb-6 pb-2 border-b border-slate-700/50">
        Market Pulse
      </h3>
      <div className="space-y-6">
        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
          <h4 className="font-semibold text-teal-300 mb-4 text-sm uppercase tracking-wider flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            News Impact
          </h4>
          <ul className="space-y-4">
            {pulse.news.map((item, index) => (
              <li key={index} className="group">
                <div className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 transition-colors duration-200">
                  <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                    {item.headline}
                  </p>
                  <div className="flex items-center mt-1.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${item.impactScore > 0 ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                      {item.impactScore > 0 ? `+${item.impactScore} Impact` : `${item.impactScore} Impact`}
                    </span>
                    <span className="mx-2 text-slate-500">•</span>
                    <span className="text-xs text-slate-400">{item.source}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
          <h4 className="font-semibold text-amber-300 mb-4 text-sm uppercase tracking-wider flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Competitor Alerts
          </h4>
          <ul className="space-y-4">
            {pulse.competitorAlerts.map((alert, index) => (
              <li key={index} className="group">
                <div className="p-3 rounded-lg bg-slate-800/30 hover:bg-slate-700/50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-300 text-sm">{alert.competitor}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      alert.threatLevel > 7 ? 'bg-red-900/30 text-red-400' : 
                      alert.threatLevel > 4 ? 'bg-yellow-900/30 text-yellow-400' : 
                      'bg-green-900/30 text-green-400'
                    }`}>
                      Threat: {alert.threatLevel}/10
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1.5">{alert.alert}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
