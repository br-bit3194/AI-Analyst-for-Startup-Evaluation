import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { 
  fetchFinanceMetrics, 
  fetchFinancialHealth, 
  fetchCashFlow, 
  fetchUnitEconomics,
  type FinancialHealth,
  type CashFlow,
  type UnitEconomics,
  type BenchmarkComparison,
  type TimePeriod
} from '@/services/finance';

interface FinancialMetricsProps {
  documentId: string;
}

export function FinancialMetrics({ documentId }: FinancialMetricsProps) {
  const [activeTab, setActiveTab] = useState('health');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{
    health?: FinancialHealth;
    cashFlow?: CashFlow;
    unitEconomics?: UnitEconomics;
    benchmarks?: BenchmarkComparison[];
  }>({});

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load all metrics in parallel
        const [health, cashFlow, unitEconomics] = await Promise.all([
          fetchFinancialHealth(documentId),
          fetchCashFlow(documentId),
          fetchUnitEconomics(documentId)
        ]);
        
        setMetrics({
          health,
          cashFlow,
          unitEconomics
        });
      } catch (err) {
        console.error('Error loading financial metrics:', err);
        setError('Failed to load financial metrics. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Financial Metrics</h2>
        <div className="flex items-center space-x-2">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="bg-background border border-input rounded-md px-3 py-1 text-sm"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="unit-economics">Unit Economics</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="space-y-4">
          <FinancialHealthMetrics 
            health={metrics.health} 
            timePeriod={timePeriod} 
          />
        </TabsContent>

        <TabsContent value="cashflow" className="space-y-4">
          <CashFlowMetrics 
            cashFlow={metrics.cashFlow} 
            timePeriod={timePeriod} 
          />
        </TabsContent>

        <TabsContent value="unit-economics" className="space-y-4">
          <UnitEconomicsMetrics 
            unitEconomics={metrics.unitEconomics} 
          />
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-4">
          <BenchmarkMetrics 
            benchmarks={metrics.benchmarks || []} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for each tab
function FinancialHealthMetrics({ 
  health, 
  timePeriod 
}: { 
  health?: FinancialHealth;
  timePeriod: TimePeriod;
}) {
  if (!health) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard 
        title="MRR" 
        value={health.mrr[health.mrr.length - 1]?.value} 
        growth={health.mrr[health.mrr.length - 1]?.growth_rate}
        prefix="$"
        isCurrency
      />
      <MetricCard 
        title="ARR" 
        value={health.arr} 
        prefix="$"
        isCurrency
      />
      <MetricCard 
        title="Burn Rate" 
        value={health.burn_rate[health.burn_rate.length - 1]?.value} 
        growth={health.burn_rate[health.burn_rate.length - 1]?.growth_rate}
        prefix="$"
        isCurrency
      />
      <MetricCard 
        title="Runway" 
        value={health.runway_months} 
        suffix="months"
        isPositive={health.runway_months ? health.runway_months >= 12 : undefined}
      />
      <MetricCard 
        title="Cash Balance" 
        value={health.cash_balance} 
        prefix="$"
        isCurrency
      />
      <MetricCard 
        title="Gross Margin" 
        value={health.gross_margin[health.gross_margin.length - 1]?.value} 
        suffix="%"
        growth={health.gross_margin[health.gross_margin.length - 1]?.growth_rate}
      />
    </div>
  );
}

function CashFlowMetrics({ 
  cashFlow, 
  timePeriod 
}: { 
  cashFlow?: CashFlow;
  timePeriod: TimePeriod;
}) {
  if (!cashFlow) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Operating Activities</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard 
            title="Current Period" 
            value={cashFlow.operating_activities[cashFlow.operating_activities.length - 1]?.value}
            prefix="$"
            isCurrency
          />
          <MetricCard 
            title="YoY Growth" 
            value={cashFlow.operating_activities[cashFlow.operating_activities.length - 1]?.growth_rate}
            suffix="%"
            showTrend
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Free Cash Flow</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <MetricCard 
            title="Current Period" 
            value={cashFlow.free_cash_flow[cashFlow.free_cash_flow.length - 1]?.value}
            prefix="$"
            isCurrency
          />
          <MetricCard 
            title="YoY Growth" 
            value={cashFlow.free_cash_flow[cashFlow.free_cash_flow.length - 1]?.growth_rate}
            suffix="%"
            showTrend
          />
        </div>
      </div>
    </div>
  );
}

function UnitEconomicsMetrics({ 
  unitEconomics 
}: { 
  unitEconomics?: UnitEconomics;
}) {
  if (!unitEconomics) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <MetricCard 
        title="Customer Acquisition Cost" 
        value={unitEconomics.cac} 
        prefix="$"
        isCurrency
      />
      <MetricCard 
        title="Lifetime Value" 
        value={unitEconomics.ltv} 
        prefix="$"
        isCurrency
      />
      <MetricCard 
        title="LTV:CAC Ratio" 
        value={unitEconomics.ltv_to_cac_ratio} 
        isPositive={unitEconomics.ltv_to_cac_ratio ? unitEconomics.ltv_to_cac_ratio >= 3 : undefined}
      />
      <MetricCard 
        title="Payback Period" 
        value={unitEconomics.payback_period} 
        suffix="months"
        isPositive={unitEconomics.payback_period ? unitEconomics.payback_period <= 12 : undefined}
      />
      <MetricCard 
        title="Monthly Churn" 
        value={unitEconomics.churn_rate} 
        suffix="%"
        isPositive={unitEconomics.churn_rate ? unitEconomics.churn_rate <= 5 : undefined}
      />
      <MetricCard 
        title="ARPA" 
        value={unitEconomics.arpa} 
        prefix="$"
        isCurrency
      />
    </div>
  );
}

function BenchmarkMetrics({ 
  benchmarks 
}: { 
  benchmarks: BenchmarkComparison[];
}) {
  if (benchmarks.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No benchmark data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {benchmarks.map((benchmark) => (
        <Card key={benchmark.metric}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {benchmark.metric} ({benchmark.period})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {benchmark.startup_value.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  vs Industry Avg: {benchmark.industry_avg.toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  benchmark.percentile >= 70 
                    ? 'bg-green-100 text-green-800' 
                    : benchmark.percentile >= 30 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {benchmark.percentile}% Percentile
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Reusable metric card component
function MetricCard({
  title,
  value,
  prefix = '',
  suffix = '',
  growth,
  isPositive,
  isCurrency = false,
  showTrend = false
}: {
  title: string;
  value?: number;
  prefix?: string;
  suffix?: string;
  growth?: number;
  isPositive?: boolean;
  isCurrency?: boolean;
  showTrend?: boolean;
}) {
  if (value === undefined || value === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No data</p>
        </CardContent>
      </Card>
    );
  }

  const formattedValue = isCurrency
    ? value.toLocaleString(undefined, { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    : value.toLocaleString();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold">
            {prefix}{formattedValue}{suffix}
          </p>
          {growth !== undefined && growth !== null && (
            <span className={`ml-2 text-sm ${
              growth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {growth >= 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(1)}%
            </span>
          )}
          {showTrend && isPositive !== undefined && (
            <span className={`ml-2 text-sm ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              {isPositive ? '✓' : '✗'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
