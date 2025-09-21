import { InvestmentVisualization } from '@/components/three/InvestmentVisualization';

export default function ThreeDVisualization() {
  return (
    <main className="md:pl-64 bg-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">3D Investment Visualization</h1>
            <p className="mt-1 text-sm text-gray-500">Interactive 3D visualization of investment data</p>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Investment Portfolio Overview</h2>
            <p className="text-gray-600 mb-6">
              Explore your investment portfolio in an immersive 3D environment. 
              Visualize connections, performance metrics, and market trends.
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-8">
            <div className="h-[500px] w-full">
              <InvestmentVisualization />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800">Portfolio Value</h3>
              <p className="text-2xl font-bold">$1,234,567</p>
              <p className="text-sm text-green-600">+12.5% YTD</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-medium text-green-800">Active Investments</h3>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-gray-500">5 new this quarter</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium text-purple-800">Top Performer</h3>
              <p className="text-xl font-bold">TechStart Inc.</p>
              <p className="text-sm text-green-600">+45.2%</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
