'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RefreshCw, 
  Filter, 
  Search, 
  AlertCircle, 
  Activity as ActivityIcon,
  Loader2,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ActivityWithRelations, 
  ActivityType, 
  ActivityCategory, 
  ActivitySeverity, 
  ActivitySource,
  ActivityDisplayConfig,
  DEFAULT_ACTIVITY_DISPLAY_CONFIG,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_SEVERITY_LABELS
} from '@/lib/types/activity';
import { ActivityItem, CompactActivityItem, MinimalActivityItem } from './ActivityItem';

// Props interface
export interface RecentActivityFeedProps {
  activities?: ActivityWithRelations[];
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  onActivityClick?: (activity: ActivityWithRelations) => void;
  hasMore?: boolean;
  className?: string;
  maxHeight?: string;
  showFilters?: boolean;
  showSearch?: boolean;
  displayMode?: 'standard' | 'compact' | 'minimal';
  groupByDate?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// Filter state interface
interface FilterState {
  search: string;
  types: ActivityType[];
  categories: ActivityCategory[];
  severities: ActivitySeverity[];
  sources: ActivitySource[];
  dateFrom?: Date;
  dateTo?: Date;
}

// Default filter state
const DEFAULT_FILTER_STATE: FilterState = {
  search: '',
  types: [],
  categories: [],
  severities: [],
  sources: [],
};

// Group activities by date
function groupActivitiesByDate(activities: ActivityWithRelations[]): Array<{
  date: string;
  displayDate: string;
  activities: ActivityWithRelations[];
}> {
  const groups = new Map<string, ActivityWithRelations[]>();
  
  activities.forEach(activity => {
    const date = new Date(activity.createdAt).toISOString().split('T')[0];
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(activity);
  });

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, activities]) => ({
      date,
      displayDate: date === today ? 'Today' : 
                   date === yesterday ? 'Yesterday' : 
                   new Date(date).toLocaleDateString('en-PH', {
                     timeZone: 'Asia/Manila',
                     weekday: 'long',
                     month: 'short',
                     day: 'numeric'
                   }),
      activities: activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }));
}

// Filter activities based on filter state
function filterActivities(activities: ActivityWithRelations[], filter: FilterState): ActivityWithRelations[] {
  return activities.filter(activity => {
    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const matchesSearch = 
        activity.description.toLowerCase().includes(searchLower) ||
        activity.action.toLowerCase().includes(searchLower) ||
        activity.type.toLowerCase().includes(searchLower) ||
        activity.category.toLowerCase().includes(searchLower) ||
        activity.student?.firstName.toLowerCase().includes(searchLower) ||
        activity.student?.lastName.toLowerCase().includes(searchLower) ||
        activity.student?.email.toLowerCase().includes(searchLower) ||
        activity.admin?.email.toLowerCase().includes(searchLower) ||
        activity.program?.name.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filter.types.length > 0 && !filter.types.includes(activity.type as ActivityType)) {
      return false;
    }

    // Category filter
    if (filter.categories.length > 0 && !filter.categories.includes(activity.category as ActivityCategory)) {
      return false;
    }

    // Severity filter
    if (filter.severities.length > 0 && !filter.severities.includes(activity.severity as ActivitySeverity)) {
      return false;
    }

    // Source filter
    if (filter.sources.length > 0 && !filter.sources.includes(activity.source as ActivitySource)) {
      return false;
    }

    // Date range filter
    if (filter.dateFrom && new Date(activity.createdAt) < filter.dateFrom) {
      return false;
    }

    if (filter.dateTo && new Date(activity.createdAt) > filter.dateTo) {
      return false;
    }

    return true;
  });
}

export function RecentActivityFeed({
  activities = [],
  loading = false,
  error,
  onRefresh,
  onLoadMore,
  onActivityClick,
  hasMore = false,
  className,
  maxHeight = '600px',
  showFilters = true,
  showSearch = true,
  displayMode = 'standard',
  groupByDate = true,
  autoRefresh = false,
  refreshInterval = 30000,
}: RecentActivityFeedProps) {
  // State management
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [displayConfig, setDisplayConfig] = useState<ActivityDisplayConfig>(DEFAULT_ACTIVITY_DISPLAY_CONFIG);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return filterActivities(activities, filter);
  }, [activities, filter]);

  // Group activities if needed
  const groupedActivities = useMemo(() => {
    if (!groupByDate) return null;
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities, groupByDate]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof FilterState, value: unknown) => {
    setFilter(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilter(DEFAULT_FILTER_STATE);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filter.search !== '' ||
           filter.types.length > 0 ||
           filter.categories.length > 0 ||
           filter.severities.length > 0 ||
           filter.sources.length > 0 ||
           filter.dateFrom !== undefined ||
           filter.dateTo !== undefined;
  }, [filter]);

  // Get activity component based on display mode
  const getActivityComponent = useCallback((activity: ActivityWithRelations, key: string) => {
    const props = {
      activity,
      onClick: onActivityClick,
      config: displayConfig,
    };

    switch (displayMode) {
      case 'compact':
        return <CompactActivityItem key={key} {...props} />;
      case 'minimal':
        return <MinimalActivityItem key={key} {...props} />;
      default:
        return <ActivityItem key={key} {...props} />;
    }
  }, [displayMode, onActivityClick, displayConfig]);

  return (
    <div className={cn('flex flex-col bg-white rounded-lg border shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Recent Activity</h3>
          {filteredActivities.length !== activities.length && (
            <span className="text-sm text-gray-500">
              ({filteredActivities.length} of {activities.length})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Display mode toggle */}
          <button
            onClick={() => setDisplayConfig(prev => ({ 
              ...prev, 
              compactMode: !prev.compactMode 
            }))}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={displayConfig.compactMode ? 'Expand view' : 'Compact view'}
          >
            {displayConfig.compactMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Filter toggle */}
          {showFilters && (
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showFilterPanel || hasActiveFilters
                  ? 'text-primary-700 bg-primary-50'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              )}
              title="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          )}

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh activities"
            >
              <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && showFilterPanel && (
        <div className="p-4 border-b bg-gray-50">
          <div className="space-y-4">
            {/* Search */}
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={filter.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            {/* Filter chips */}
            <div className="flex flex-wrap gap-2">
              {/* Type filter */}
              <select
                multiple
                value={filter.types}
                onChange={(e) => handleFilterChange('types', Array.from(e.target.selectedOptions, option => option.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Types</option>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {/* Category filter */}
              <select
                multiple
                value={filter.categories}
                onChange={(e) => handleFilterChange('categories', Array.from(e.target.selectedOptions, option => option.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Categories</option>
                {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              {/* Severity filter */}
              <select
                multiple
                value={filter.severities}
                onChange={(e) => handleFilterChange('severities', Array.from(e.target.selectedOptions, option => option.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Severities</option>
                {Object.entries(ACTIVITY_SEVERITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ maxHeight }}
      >
        {/* Loading state */}
        {loading && activities.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading activities...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filteredActivities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <ActivityIcon className="w-12 h-12 mb-4 text-gray-300" />
            <h4 className="text-lg font-medium mb-2">No activities found</h4>
            <p className="text-sm text-center max-w-sm">
              {hasActiveFilters 
                ? 'Try adjusting your filters to see more activities.'
                : 'Activities will appear here as they occur in the system.'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-primary-700 hover:text-primary-800 hover:bg-primary-50 rounded-lg transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Activities list */}
        {!loading && !error && filteredActivities.length > 0 && (
          <div className="p-4 space-y-4">
            {groupByDate && groupedActivities ? (
              // Grouped by date
              groupedActivities.map(group => (
                <div key={group.date} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-gray-900">{group.displayDate}</h4>
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-sm text-gray-500">
                      {group.activities.length} {group.activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.activities.map(activity => 
                      getActivityComponent(activity, activity.id)
                    )}
                  </div>
                </div>
              ))
            ) : (
              // Ungrouped list
              <div className="space-y-3">
                {filteredActivities.map(activity => 
                  getActivityComponent(activity, activity.id)
                )}
              </div>
            )}
          </div>
        )}

        {/* Load more button */}
        {hasMore && onLoadMore && !loading && (
          <div className="p-4 border-t">
            <button
              onClick={onLoadMore}
              className="w-full py-2 px-4 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
            >
              Load more activities
            </button>
          </div>
        )}

        {/* Loading more indicator */}
        {loading && activities.length > 0 && (
          <div className="flex items-center justify-center py-4 border-t">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      {!loading && !error && filteredActivities.length > 0 && (
        <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>
              Showing {filteredActivities.length} of {activities.length} activities
            </span>
            {autoRefresh && (
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Auto-refresh enabled
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RecentActivityFeed;
