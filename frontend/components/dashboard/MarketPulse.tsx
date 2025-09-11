import React from 'react';
import type { MarketPulse as MarketPulseType } from '../../types';

const MarketPulse: React.FC<{ pulse: MarketPulseType }> = ({ pulse }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-full">
      <h3 className="text-lg font-bold text-white mb-4">Market Pulse</h3>
      <div className="space-y-6">
        <div>
          <h4 className="font-semibold text-slate-200 mb-2 border-b border-slate-700 pb-1">News Impact</h4>
          <ul className="space-y-3">
            {pulse.news.map((item, index) => (
              <li key={index} className="text-sm">
                <p className="text-slate-300 font-medium">{item.headline}</p>
                <p className="text-slate-400 text-xs">
                  <span className={item.impactScore > 0 ? 'text-green-400' : 'text-red-400'}>
                    Impact: {item.impactScore > 0 ? `+${item.impactScore}` : item.impactScore}
                  </span>
                  {' '}| <span className="text-slate-500">{item.source}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-slate-200 mb-2 border-b border-slate-700 pb-1">Competitor Alerts</h4>
          <ul className="space-y-3">
            {pulse.competitorAlerts.map((alert, index) => (
              <li key={index} className="text-sm">
                <p className="font-semibold text-amber-400">{alert.competitor}</p>
                <p className="text-slate-400">{alert.alert}</p>
                <p className="text-xs text-red-400">Threat Level: {alert.threatLevel}/10</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
