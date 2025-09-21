import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';

type BenchmarkData = {
  name: string;
  company: number;
  industry: number;
}[];

export function BenchmarkComparisonChart() {
  const data: BenchmarkData = [
    { name: 'Gross Margin', company: 75, industry: 85 },
    { name: 'CAC Payback', company: 14, industry: 12 },
    { name: 'Churn Rate', company: 5.2, industry: 3.8 },
    { name: 'LTV:CAC', company: 4.1, industry: 6.2 },
  ];

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Benchmark Comparison</CardTitle>
        <CardDescription>How the company compares to industry benchmarks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{
                top: 5,
                right: 30,
                left: 40,
                bottom: 5,
              }}
            >
              <XAxis 
                type="number" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                scale="band" 
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(222.2 47.4% 11.2%)',
                  borderColor: 'hsl(215.4 16.3% 46.9%)',
                  borderRadius: '0.5rem',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
              <Legend />
              <Bar dataKey="company" fill="hsl(221.2 83.2% 53.3%)" name="This Company" radius={[0, 4, 4, 0]} />
              <Bar dataKey="industry" fill="hsl(215.4 16.3% 46.9%)" name="Industry Avg" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
