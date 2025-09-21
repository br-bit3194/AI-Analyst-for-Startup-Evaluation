import React from 'react';
import { FinanceDashboard } from '../components/dashboard/FinanceDashboard';

const FinancePage: React.FC = () => {
  return (
    <main className="md:pl-64 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance Dashboard</h1>
          <FinanceDashboard />
        </div>
      </div>
    </main>
  );
};

export default FinancePage;
