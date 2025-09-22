import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, BarChart2, Briefcase, DollarSign, TrendingUp, UserCheck, Zap } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ElementType;
  change?: string;
  description?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  description, 
  className 
}: StatCardProps) {
  const isPositive = change?.includes('+');
  const isNegative = change?.includes('-');
  
  // Default icon based on title if not provided
  let DefaultIcon = BarChart2;
  if (title.includes('Burn Rate')) DefaultIcon = Zap;
  if (title.includes('Runway')) DefaultIcon = Briefcase;
  if (title.includes('MRR') || title.includes('Revenue')) DefaultIcon = DollarSign;
  if (title.includes('Margin') || title.includes('Growth')) DefaultIcon = TrendingUp;
  if (title.includes('CAC') || title.includes('Customer')) DefaultIcon = UserCheck;

  const displayIcon = Icon || DefaultIcon;

  return (
    <div className={cn("bg-card rounded-lg border p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          
          {change && (
            <div className={cn("flex items-center text-sm mt-1", {
              'text-green-500': isPositive,
              'text-red-500': isNegative,
              'text-amber-500': !isPositive && !isNegative && change,
            })}>
              {isPositive && <ArrowUp className="h-3 w-3 mr-1" />}
              {isNegative && <ArrowDown className="h-3 w-3 mr-1" />}
              {change}
            </div>
          )}
          
          {description && (
            <p className="text-xs text-muted-foreground mt-2">{description}</p>
          )}
        </div>
        
        <div className="bg-primary/10 p-3 rounded-lg">
          {React.createElement(displayIcon, { className: 'h-6 w-6 text-primary' })}
        </div>
      </div>
    </div>
  );
}
