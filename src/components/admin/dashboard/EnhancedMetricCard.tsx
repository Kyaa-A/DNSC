'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Enhanced metric card variants using CVA
const metricCardVariants = cva(
  "rounded-sm border bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 hover:shadow-md",
  {
    variants: {
      trend: {
        up: "bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-primary-900/20 dark:via-gray-800 dark:to-secondary-900/20",
        down: "bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-primary-900/20 dark:via-gray-800 dark:to-secondary-900/20",
        neutral: "bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-primary-900/20 dark:via-gray-800 dark:to-secondary-900/20",
      },
      size: {
        default: "p-0",
        compact: "p-0",
      }
    },
    defaultVariants: {
      trend: "neutral",
      size: "default",
    },
  }
);

const trendVariants = cva(
  "inline-flex items-center gap-1 text-sm font-medium",
  {
    variants: {
      trend: {
        up: "text-primary-700 dark:text-primary-400",
        down: "text-primary-700 dark:text-primary-400",
        neutral: "text-primary-700 dark:text-primary-400",
      }
    },
    defaultVariants: {
      trend: "neutral",
    },
  }
);

export interface EnhancedMetricCardProps extends VariantProps<typeof metricCardVariants> {
  title: string;
  value: string | number;
  previousValue?: string | number;
  percentageChange?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  description?: string;
  period?: string;
  isLoading?: boolean;
  className?: string;
}

export function EnhancedMetricCard({
  title,
  value,
  previousValue,
  percentageChange,
  trend = 'neutral',
  icon: Icon,
  description,
  period = 'vs last month',
  isLoading = false,
  size,
  className,
}: EnhancedMetricCardProps) {
  // Determine trend icon based on trend prop
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const iconAccent = 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
  
  // Format percentage change display
  const formatPercentageChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className={cn(metricCardVariants({ trend: 'neutral', size }), className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          </CardTitle>
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(metricCardVariants({ trend, size }), "h-full flex flex-col relative", className)}>
      {/* Top-right icon badge - flush to the corner */}
      <div className={cn('absolute top-0 right-0 h-8 w-8 rounded-tl-sm rounded-br-sm rounded-bl-sm rounded-tr-none flex items-center justify-center shadow-inner', iconAccent)}>
        <Icon className="h-4 w-4" />
      </div>
      <CardHeader className="space-y-0 pt-3 pb-3 px-4">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col pt-1 pb-4 px-4">
        <div className="space-y-2 flex-1">
          {/* Main metric value */}
          <div className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-none">
            {typeof value === 'number' ? value.toLocaleString('en-PH') : value}
          </div>
          
          {/* Trend indicator and percentage change */}
          {percentageChange !== undefined && (
            <div className={cn('flex items-center gap-2', trendVariants({ trend }))}>
              <TrendIcon className="h-3 w-3" />
              <span>{formatPercentageChange(percentageChange)}</span>
              <span className="text-xs text-muted-foreground ml-1">
                {period}
              </span>
            </div>
          )}

          {/* Additional details */}
          {(previousValue !== undefined || description) && (
            <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
              {previousValue !== undefined && percentageChange === undefined && (
                <p className="text-xs text-muted-foreground">
                  Previous: {typeof previousValue === 'number' ? previousValue.toLocaleString('en-PH') : previousValue}
                </p>
              )}
              {description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default EnhancedMetricCard;
