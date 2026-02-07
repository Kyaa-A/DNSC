'use client';

import React from 'react';
import { 
  User, 
  UserPlus, 
  QrCode, 
  Shield, 
  Settings, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  XCircle,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ActivityWithRelations, 
  ActivityDisplayConfig,
  ActivityType,
  ActivitySeverity,
  ActivityCategory,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  ACTIVITY_SEVERITY_LABELS
} from '@/lib/types/activity';

// Icon mapping for different activity types
const ACTIVITY_TYPE_ICONS: Record<ActivityType, React.ComponentType<{ className?: string }>> = {
  student_registration: UserPlus,
  qr_generation: QrCode,
  admin_action: Shield,
  system_event: Settings,
  authentication: User,
  data_export: Download,
  data_import: Upload,
  maintenance: Settings,
  security: Shield,
};



// Severity color mapping
const SEVERITY_COLORS: Record<ActivitySeverity, {
  bg: string;
  text: string;
  border: string;
  icon: string;
}> = {
  info: {
    bg: 'bg-primary-50',
    text: 'text-primary-800',
    border: 'border-primary-200',
    icon: 'text-primary-600',
  },
  success: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'text-orange-500',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'text-red-500',
  },
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-300',
    icon: 'text-red-600',
  },
  debug: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'text-gray-500',
  },
};

// Severity icon mapping
const SEVERITY_ICONS: Record<ActivitySeverity, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  critical: XCircle,
  debug: Settings,
};

interface ActivityItemProps {
  activity: ActivityWithRelations;
  config?: Partial<ActivityDisplayConfig>;
  onClick?: (activity: ActivityWithRelations) => void;
  className?: string;
  showEntityDetails?: boolean;
  compactMode?: boolean;
}



/**
 * Format relative time from a date
 */
function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return 'Invalid date';
  }
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  // For older dates, show the actual date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Get entity display name and type
 */
function getEntityInfo(activity: ActivityWithRelations): {
  name: string;
  type: 'student' | 'admin' | 'program' | 'system';
  identifier?: string;
} {
  if (activity.student) {
    return {
      name: `${activity.student.firstName} ${activity.student.lastName}`,
      type: 'student',
      identifier: activity.student.studentIdNumber,
    };
  }

  if (activity.admin) {
    return {
      name: activity.admin.email,
      type: 'admin',
    };
  }

  if (activity.program) {
    return {
      name: activity.program.name,
      type: 'program',
      identifier: activity.program.displayName,
    };
  }

  return {
    name: 'System',
    type: 'system',
  };
}

/**
 * Truncate description if it exceeds max length
 */
function truncateDescription(description: string, maxLength: number = 100): string {
  if (description.length <= maxLength) {
    return description;
  }
  return description.substring(0, maxLength - 3) + '...';
}

export function ActivityItem({
  activity,
  config = {},
  onClick,
  className,
  showEntityDetails = true,
  compactMode = false,
}: ActivityItemProps) {
  // Merge with default config
  const displayConfig = {
    showIcons: true,
    showTimestamps: true,
    showMetadata: false,
    showRelatedEntities: true,
    compactMode: false,
    groupByDate: false,
    maxDescriptionLength: 100,
    ...config,
  };

  // Get appropriate icon
  const TypeIcon = ACTIVITY_TYPE_ICONS[activity.type as ActivityType] || Settings;
  const SeverityIcon = SEVERITY_ICONS[activity.severity as ActivitySeverity] || Info;
  
  // Get colors based on severity
  const colors = SEVERITY_COLORS[activity.severity as ActivitySeverity] || SEVERITY_COLORS.info;
  
  // Get entity information
  const entityInfo = getEntityInfo(activity);
  
  // Format time
  const relativeTime = formatRelativeTime(activity.createdAt);

  // Truncate description if needed
  const displayDescription = displayConfig.maxDescriptionLength 
    ? truncateDescription(activity.description, displayConfig.maxDescriptionLength)
    : activity.description;

  const handleClick = () => {
    if (onClick) {
      onClick(activity);
    }
  };

  const isClickable = !!onClick;

  return (
    <div
      className={cn(
        'group relative flex items-start gap-3 p-4 rounded-lg border transition-all duration-200',
        colors.bg,
        colors.border,
        isClickable && 'cursor-pointer hover:shadow-md hover:border-opacity-80',
        compactMode && 'p-3 gap-2',
        className
      )}
      onClick={handleClick}
    >
      {/* Activity Icon */}
      {displayConfig.showIcons && (
        <div className={cn(
          'flex-shrink-0 flex items-center justify-center rounded-full',
          compactMode ? 'w-8 h-8' : 'w-10 h-10',
          colors.bg === 'bg-primary-50' ? 'bg-primary-100' :
          colors.bg === 'bg-green-50' ? 'bg-green-100' :
          colors.bg === 'bg-orange-50' ? 'bg-orange-100' :
          colors.bg === 'bg-red-50' ? 'bg-red-100' :
          colors.bg === 'bg-red-100' ? 'bg-red-200' : 'bg-gray-100'
        )}>
          <TypeIcon className={cn(
            colors.icon,
            compactMode ? 'w-4 h-4' : 'w-5 h-5'
          )} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            {/* Activity Type and Action */}
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                'font-medium',
                colors.text,
                compactMode ? 'text-sm' : 'text-base'
              )}>
                {ACTIVITY_TYPE_LABELS[activity.type as ActivityType] || activity.type}
              </span>
              <span className={cn(
                'text-gray-500',
                compactMode ? 'text-xs' : 'text-sm'
              )}>
                •
              </span>
              <span className={cn(
                'text-gray-600 font-medium',
                compactMode ? 'text-xs' : 'text-sm'
              )}>
                {activity.action}
              </span>
            </div>

            {/* Description */}
            <p className={cn(
              'text-gray-700 leading-relaxed',
              compactMode ? 'text-sm' : 'text-base'
            )}>
              {displayDescription}
            </p>
          </div>

          {/* Severity Indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {activity.severity !== 'info' && (
              <SeverityIcon className={cn(
                colors.icon,
                compactMode ? 'w-4 h-4' : 'w-4 h-4'
              )} />
            )}
            {displayConfig.showTimestamps && (
              <div className="text-right">
                <div className={cn(
                  'text-gray-500',
                  compactMode ? 'text-xs' : 'text-sm'
                )}>
                  {relativeTime}
                </div>
                {/* {!compactMode && (
                  <div className="text-xs text-gray-400">
                    {ensureFormattedTime(absoluteTime)}
                  </div>
                )} */}
              </div>
            )}
          </div>
        </div>

        {/* Entity Information */}
        {displayConfig.showRelatedEntities && showEntityDetails && (
          <div className="flex items-center gap-4 mt-2">
            {/* Primary Entity */}
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                entityInfo.type === 'student' ? 'bg-primary-400' :
                entityInfo.type === 'admin' ? 'bg-purple-400' :
                entityInfo.type === 'program' ? 'bg-green-400' : 'bg-gray-400'
              )} />
              <span className={cn(
                'font-medium',
                compactMode ? 'text-xs' : 'text-sm',
                entityInfo.type === 'student' ? 'text-primary-800' :
                entityInfo.type === 'admin' ? 'text-purple-700' :
                entityInfo.type === 'program' ? 'text-green-700' : 'text-gray-700'
              )}>
                {entityInfo.name}
              </span>
              {entityInfo.identifier && (
                <span className={cn(
                  'text-gray-500',
                  compactMode ? 'text-xs' : 'text-sm'
                )}>
                  ({entityInfo.identifier})
                </span>
              )}
            </div>

            {/* Source */}
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-gray-400',
                compactMode ? 'text-xs' : 'text-sm'
              )}>
                via
              </span>
              <span className={cn(
                'text-gray-600 font-medium capitalize',
                compactMode ? 'text-xs' : 'text-sm'
              )}>
                {activity.source}
              </span>
            </div>
          </div>
        )}

        {/* Metadata (if enabled and exists) */}
        {displayConfig.showMetadata && activity.metadata && (
          <div className="mt-3 p-2 bg-gray-50 rounded border">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 font-medium flex items-center gap-1">
                <span>Additional Details</span>
                <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-2 text-xs text-gray-700">
                <pre className="whitespace-pre-wrap font-mono">
                  {activity.metadata ? JSON.stringify(activity.metadata, null, 2) : 'No metadata available'}
                </pre>
              </div>
            </details>
          </div>
        )}

        {/* Category and Severity Tags (compact mode) */}
        {compactMode && (
          <div className="flex items-center gap-2 mt-2">
            <span className={cn(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
              'bg-gray-100 text-gray-700'
            )}>
              {ACTIVITY_CATEGORY_LABELS[activity.category as ActivityCategory] || activity.category}
            </span>
            {activity.severity !== 'info' && (
              <span className={cn(
                'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                colors.bg,
                colors.text
              )}>
                {ACTIVITY_SEVERITY_LABELS[activity.severity as ActivitySeverity] || activity.severity}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Click indicator */}
      {isClickable && (
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Hover effect overlay */}
      {isClickable && (
        <div className="absolute inset-0 rounded-lg bg-white bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
      )}
    </div>
  );
}

// Compact variant for dense layouts
export function CompactActivityItem(props: ActivityItemProps) {
  return <ActivityItem {...props} compactMode={true} />;
}

// Activity item with minimal information
export function MinimalActivityItem({
  activity,
  onClick,
  className,
}: Pick<ActivityItemProps, 'activity' | 'onClick' | 'className'>) {
  const TypeIcon = ACTIVITY_TYPE_ICONS[activity.type as ActivityType] || Settings;
  const colors = SEVERITY_COLORS[activity.severity as ActivitySeverity] || SEVERITY_COLORS.info;
  const relativeTime = formatRelativeTime(activity.createdAt);
  const entityInfo = getEntityInfo(activity);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer',
        className
      )}
      onClick={() => onClick?.(activity)}
    >
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
        colors.bg
      )}>
        <TypeIcon className={cn('w-4 h-4', colors.icon)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {activity.action}
          </p>
          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
            {relativeTime}
          </span>
        </div>
        <p className="text-xs text-gray-600 truncate">
          {entityInfo.name} • {activity.source}
        </p>
      </div>
    </div>
  );
}

export default ActivityItem;
