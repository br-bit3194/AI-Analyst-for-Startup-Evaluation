import React from 'react';
import { FinanceDashboard } from '../components/dashboard/FinanceDashboard';

const FinancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="container mx-auto py-6 px-4">
        <FinanceDashboard />
      </div>
    </div>
  );
};

export default FinancePage;
