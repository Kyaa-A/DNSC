'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  ShieldCheck, 
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface OrganizerStatsData {
  total: number;
  active: number;
  inactive: number;
  admin: number;
  organizer: number;
  pendingInvitations: number;
  assignments?: {
    totalAssignments: number;
    organizersWithAssignments: number;
    eventsWithOrganizers: number;
  };
}

interface OrganizerStatsProps {
  className?: string;
  showAssignments?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function OrganizerStats({ 
  className, 
  showAssignments = false,
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: OrganizerStatsProps) {
  const [stats, setStats] = useState<OrganizerStatsData>({
    total: 0,
    active: 0,
    inactive: 0,
    admin: 0,
    organizer: 0,
    pendingInvitations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/organizers/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch organizer stats: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch organizer statistics');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching organizer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(fetchStats, refreshInterval);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const handleRefresh = () => {
    fetchStats();
    toast.success('Organizer statistics refreshed');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const getPercentage = (value: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  };

  const statCards = [
    {
      title: 'Total Organizers',
      value: formatNumber(stats.total),
      icon: Users,
      color: 'blue',
      description: 'All registered organizers',
      trend: stats.total > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Active Organizers',
      value: formatNumber(stats.active),
      icon: UserCheck,
      color: 'green',
      description: `${getPercentage(stats.active, stats.total)}% of total`,
      trend: stats.active > 0 ? 'up' : 'neutral',
    },
    {
      title: 'Inactive Organizers',
      value: formatNumber(stats.inactive),
      icon: UserX,
      color: 'red',
      description: `${getPercentage(stats.inactive, stats.total)}% of total`,
      trend: stats.inactive > 0 ? 'down' : 'neutral',
    },
    {
      title: 'Pending Invitations',
      value: formatNumber(stats.pendingInvitations),
      icon: Clock,
      color: 'yellow',
      description: 'Never logged in',
      trend: stats.pendingInvitations > 0 ? 'down' : 'neutral',
    },
  ];

  if (showAssignments && stats.assignments) {
    statCards.push(
      {
        title: 'Event Assignments',
        value: formatNumber(stats.assignments.totalAssignments),
        icon: Activity,
        color: 'purple',
        description: `${stats.assignments.eventsWithOrganizers} events assigned`,
        trend: stats.assignments.totalAssignments > 0 ? 'up' : 'neutral',
      }
    );
  }

  if (loading) {
    return (
      <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
        {Array.from({ length: statCards.length }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 w-20 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">Failed to load organizer statistics</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Organizer Statistics</h3>
          <p className="text-sm text-muted-foreground">
            Real-time organizer metrics and status
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg',
                card.color === 'blue' && 'bg-blue-100 text-blue-600',
                card.color === 'green' && 'bg-green-100 text-green-600',
                card.color === 'red' && 'bg-red-100 text-red-600',
                card.color === 'yellow' && 'bg-primary-100 text-primary-600',
                card.color === 'purple' && 'bg-purple-100 text-purple-600',
              )}>
                <card.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
              {card.trend && (
                <div className={cn(
                  'flex items-center mt-2 text-xs',
                  card.trend === 'up' && 'text-green-600',
                  card.trend === 'down' && 'text-red-600',
                  card.trend === 'neutral' && 'text-gray-500'
                )}>
                  <TrendingUp className={cn(
                    'h-3 w-3 mr-1',
                    card.trend === 'down' && 'rotate-180'
                  )} />
                  {card.trend === 'up' && 'Active'}
                  {card.trend === 'down' && 'Needs attention'}
                  {card.trend === 'neutral' && 'Stable'}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Role Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Shield className="mr-2 h-4 w-4 text-blue-600" />
              Admin Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.admin)}</div>
            <p className="text-xs text-muted-foreground">
              Full system access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShieldCheck className="mr-2 h-4 w-4 text-green-600" />
              Organizer Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.organizer)}</div>
            <p className="text-xs text-muted-foreground">
              Event management access
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
