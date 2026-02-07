'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  QrCode, 
  UserPlus, 
  Settings,
  Activity as ActivityIcon,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Simplified activity type for sidebar display
interface SimpleActivity {
  id: string;
  type: 'registration' | 'qr_generation' | 'admin_action' | 'system';
  description: string;
  userName?: string;
  createdAt: Date | string;
  severity?: 'low' | 'medium' | 'high';
}

interface SimplifiedActivityFeedProps {
  activities?: SimpleActivity[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  className?: string;
}

// Get icon for activity type
const getActivityIcon = (type: string, severity?: string) => {
  const iconClass = cn(
    'w-4 h-4 flex-shrink-0',
    severity === 'high' ? 'text-red-500' :
    severity === 'medium' ? 'text-primary-500' :
    'text-primary-500'
  );

  switch (type) {
    case 'registration':
      return <UserPlus className={iconClass} />;
    case 'qr_generation':
      return <QrCode className={iconClass} />;
    case 'admin_action':
      return <Settings className={iconClass} />;
    default:
      return <ActivityIcon className={iconClass} />;
  }
};

// Format time relative to now
const formatTimeAgo = (date: Date | string) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch {
    return 'Just now';
  }
};

// Truncate long descriptions
const truncateText = (text: string, maxLength: number = 60) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export function SimplifiedActivityFeed({
  activities = [],
  loading = false,
  error,
  onRefresh,
  className
}: SimplifiedActivityFeedProps) {
  // Show recent activities (last 10)
  const recentActivities = activities.slice(0, 10);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">Recent Activity</h3>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {loading && activities.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-3 text-center">
            <p className="text-xs text-red-600">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-2 text-xs text-primary-700 hover:text-primary-800"
              >
                Try again
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && recentActivities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 px-3 text-center">
            <ActivityIcon className="w-8 h-8 mb-2 text-gray-300" />
            <p className="text-xs text-gray-500 mb-1">No recent activity</p>
            <p className="text-xs text-gray-400">Activity will appear here</p>
          </div>
        )}

        {/* Activities list */}
        {!loading && !error && recentActivities.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type, activity.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-900 dark:text-gray-100 leading-relaxed">
                      {truncateText(activity.description)}
                    </p>
                    
                    {/* User name if available */}
                    {activity.userName && (
                      <p className="text-xs text-primary-700 dark:text-primary-400 font-medium mt-0.5">
                        {activity.userName}
                      </p>
                    )}
                    
                    {/* Timestamp */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {formatTimeAgo(activity.createdAt)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <ChevronRight className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show more indicator */}
        {activities.length > 10 && (
          <div className="p-3 border-t bg-gray-50/50 dark:bg-gray-800/50 dark:border-gray-700">
            <button className="w-full text-xs text-primary-700 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 transition-colors">
              View all {activities.length} activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimplifiedActivityFeed;
