import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface DataPoint {
  period: string;
  value: number;
  growth_rate?: number;
}

interface FinancialChartProps {
  title: string;
  data: DataPoint[];
  height?: number;
  type?: 'line' | 'area' | 'bar';
  yAxisLabel?: string;
  showGrowth?: boolean;
  isCurrency?: boolean;
}

export function FinancialChart({
  title,
  data,
  height = 300,
  type = 'line',
  yAxisLabel = '',
  showGrowth = false,
  isCurrency = false,
}: FinancialChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    ...item,
    // Convert period to Date object for better sorting
    date: new Date(item.period).getTime() || item.period,
  }));

  // Sort data by date
  chartData.sort((a, b) => a.date - b.date);

  // Format Y-axis tick
  const formatYAxis = (value: number) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value);
    }
    return value.toLocaleString();
  };

  // Format tooltip
  const formatTooltip = (value: number, name: string) => {
    if (name === 'value' && isCurrency) {
      return [
        new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value),
        'Value',
      ];
    }
    if (name === 'growth_rate') {
      return [
        `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
        'Growth Rate',
      ];
    }
    return [value, name];
  };

  // Format X-axis tick
  const formatXAxis = (tickItem: string | number) => {
    if (typeof tickItem === 'string') return tickItem;
    
    // If it's a timestamp
    const date = new Date(tickItem);
    if (!isNaN(date.getTime())) {
      return format(date, 'MMM yyyy');
    }
    
    return tickItem;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={formatTooltip} 
              labelFormatter={(label) => {
                if (typeof label === 'number') {
                  return format(new Date(label), 'MMM d, yyyy');
                }
                return label;
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.3}
              name={yAxisLabel || 'Value'}
            />
            {showGrowth && (
              <Line
                type="monotone"
                dataKey="growth_rate"
                stroke="#82ca9d"
                dot={false}
                name="Growth Rate"
                yAxisId="right"
              />
            )}
            {showGrowth && <YAxis yAxisId="right" orientation="right" />}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => {
                if (typeof label === 'number') {
                  return format(new Date(label), 'MMM d, yyyy');
                }
                return label;
              }}
            />
            <Legend />
            <Bar
              dataKey="value"
              fill="#8884d8"
              name={yAxisLabel || 'Value'}
            />
          </BarChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={formatYAxis} 
              width={80}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(label) => {
                if (typeof label === 'number') {
                  return format(new Date(label), 'MMM d, yyyy');
                }
                return label;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              name={yAxisLabel || 'Value'}
            />
            {showGrowth && (
              <Line
                type="monotone"
                dataKey="growth_rate"
                stroke="#82ca9d"
                dot={false}
                name="Growth Rate"
                yAxisId="right"
              />
            )}
            {showGrowth && <YAxis yAxisId="right" orientation="right" />}
          </LineChart>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialChart;
