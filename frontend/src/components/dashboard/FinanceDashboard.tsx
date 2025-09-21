import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, BarChart, BarChart2, UserCheck, Zap, Briefcase, DollarSign, TrendingUp } from 'lucide-react';
import { StatCard } from './StatCard';
import { FinancialHealthChart } from '../charts/FinancialHealthChart';
import { BenchmarkComparisonChart } from '../charts/BenchmarkComparisonChart';

type SmartAlert = {
  id: string;
  text: string;
  time: string;
};

const smartAlertsData: SmartAlert[] = [
  {
    id: '1',
    text: 'Monthly burn rate increased by 12% compared to last month',
    time: '2 hours ago',
  },
  {
    id: '2',
    text: 'New customer acquisition cost (CAC) is 15% above target',
    time: '1 day ago',
  },
  {
    id: '3',
    text: 'Customer lifetime value (LTV) increased by 8% this quarter',
    time: '3 days ago',
  },
];

export function FinanceDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finance Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Visualizing key financial metrics in a clean, investor-ready way.
        </p>
      </div>

      {/* Top Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Burn Rate" 
          value="$9.1k" 
          icon={Zap} 
          change="-1.1% from last month" 
        />
        <StatCard 
          title="Runway" 
          value="18 Months" 
          icon={Briefcase} 
          description="Based on current burn" 
        />
        <StatCard 
          title="MRR" 
          value="$3.7k" 
          icon={DollarSign} 
          change="+15.6% from last month" 
        />
        <StatCard 
          title="Gross Margin" 
          value="75%" 
          icon={TrendingUp} 
          description="10% below SaaS peers" 
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <FinancialHealthChart />
        <BenchmarkComparisonChart />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Smart Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-lg">Smart Alerts</CardTitle>
            </div>
            <CardDescription>Continuous monitoring updates</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {smartAlertsData.map((alert, index) => (
              <div key={alert.id}>
                <div className="flex items-start gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-full">
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm">{alert.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                  </div>
                </div>
                {index < smartAlertsData.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Unit Economics & Red Flags */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Unit Economics & Red Flags</CardTitle>
            <CardDescription>Key performance indicators and potential warnings</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                Unit Economics
              </h3>
              <div className="space-y-4">
                <StatCard 
                  title="Customer Acquisition Cost (CAC)" 
                  value="$450" 
                  icon={UserCheck} 
                />
                <StatCard 
                  title="Lifetime Value (LTV)" 
                  value="$1,800" 
                  icon={BarChart2} 
                />
                <StatCard 
                  title="LTV:CAC Ratio" 
                  value="4:1" 
                  icon={BarChart} 
                  description="Healthy ratio above 3:1"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground">
                Red Flags
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertTriangle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-destructive">High Burn-to-Revenue</h4>
                    <p className="text-sm text-destructive/80">
                      Ratio is 2.5x, significantly higher than the 1.5x benchmark.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-500">Inconsistent Unit Economics</h4>
                    <p className="text-sm text-amber-500/80">
                      CAC has fluctuated by over 40% in the last quarter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
