/**
 * Status Colors for DNSC Attendance
 *
 * This file defines status-based color coding using semantic color mapping
 * for consistent status indicators across the interface.
 */

import { baseColors } from './colors';

// Status color definitions
export const statusColors = {
  // Event status colors
  event: {
    draft: {
      background: baseColors.neutral[100],
      text: baseColors.neutral[700],
      border: baseColors.neutral[300],
      icon: baseColors.neutral[500],
    },
    published: {
      background: baseColors.success[100],
      text: baseColors.success[800],
      border: baseColors.success[300],
      icon: baseColors.success[600],
    },
    active: {
      background: baseColors.primary[100],
      text: baseColors.primary[800],
      border: baseColors.primary[300],
      icon: baseColors.primary[600],
    },
    completed: {
      background: baseColors.secondary[100],
      text: baseColors.secondary[800],
      border: baseColors.secondary[300],
      icon: baseColors.secondary[600],
    },
    cancelled: {
      background: baseColors.error[100],
      text: baseColors.error[800],
      border: baseColors.error[300],
      icon: baseColors.error[600],
    },
  },
  
  // Session status colors
  session: {
    upcoming: {
      background: baseColors.warning[100],
      text: baseColors.warning[800],
      border: baseColors.warning[300],
      icon: baseColors.warning[600],
    },
    ongoing: {
      background: baseColors.success[100],
      text: baseColors.success[800],
      border: baseColors.success[300],
      icon: baseColors.success[600],
    },
    completed: {
      background: baseColors.secondary[100],
      text: baseColors.secondary[800],
      border: baseColors.secondary[300],
      icon: baseColors.secondary[600],
    },
    cancelled: {
      background: baseColors.error[100],
      text: baseColors.error[800],
      border: baseColors.error[300],
      icon: baseColors.error[600],
    },
  },
  
  // User status colors
  user: {
    active: {
      background: baseColors.success[100],
      text: baseColors.success[800],
      border: baseColors.success[300],
      icon: baseColors.success[600],
    },
    inactive: {
      background: baseColors.neutral[100],
      text: baseColors.neutral[700],
      border: baseColors.neutral[300],
      icon: baseColors.neutral[500],
    },
    suspended: {
      background: baseColors.error[100],
      text: baseColors.error[800],
      border: baseColors.error[300],
      icon: baseColors.error[600],
    },
    pending: {
      background: baseColors.warning[100],
      text: baseColors.warning[800],
      border: baseColors.warning[300],
      icon: baseColors.warning[600],
    },
  },
  
  // Attendance status colors
  attendance: {
    present: {
      background: baseColors.success[100],
      text: baseColors.success[800],
      border: baseColors.success[300],
      icon: baseColors.success[600],
    },
    absent: {
      background: baseColors.error[100],
      text: baseColors.error[800],
      border: baseColors.error[300],
      icon: baseColors.error[600],
    },
    late: {
      background: baseColors.warning[100],
      text: baseColors.warning[800],
      border: baseColors.warning[300],
      icon: baseColors.warning[600],
    },
    excused: {
      background: baseColors.secondary[100],
      text: baseColors.secondary[800],
      border: baseColors.secondary[300],
      icon: baseColors.secondary[600],
    },
    pending: {
      background: baseColors.neutral[100],
      text: baseColors.neutral[700],
      border: baseColors.neutral[300],
      icon: baseColors.neutral[500],
    },
  },
  
  // Priority colors
  priority: {
    low: {
      background: baseColors.success[100],
      text: baseColors.success[800],
      border: baseColors.success[300],
      icon: baseColors.success[600],
    },
    medium: {
      background: baseColors.warning[100],
      text: baseColors.warning[800],
      border: baseColors.warning[300],
      icon: baseColors.warning[600],
    },
    high: {
      background: baseColors.error[100],
      text: baseColors.error[800],
      border: baseColors.error[300],
      icon: baseColors.error[600],
    },
    critical: {
      background: baseColors.error[200],
      text: baseColors.error[900],
      border: baseColors.error[400],
      icon: baseColors.error[700],
    },
  },
  
  // System status colors
  system: {
    online: {
      background: baseColors.success[100],
      text: baseColors.success[800],
      border: baseColors.success[300],
      icon: baseColors.success[600],
    },
    offline: {
      background: baseColors.error[100],
      text: baseColors.error[800],
      border: baseColors.error[300],
      icon: baseColors.error[600],
    },
    maintenance: {
      background: baseColors.warning[100],
      text: baseColors.warning[800],
      border: baseColors.warning[300],
      icon: baseColors.warning[600],
    },
    degraded: {
      background: baseColors.secondary[100],
      text: baseColors.secondary[800],
      border: baseColors.secondary[300],
      icon: baseColors.secondary[600],
    },
  },
} as const;

// Status color utility functions
export function getStatusColor(
  category: keyof typeof statusColors,
  status: string
): unknown {
  const categoryColors = statusColors[category];
  if (categoryColors && status in categoryColors) {
    return categoryColors[status as keyof typeof categoryColors];
  }
  return null;
}

export function getStatusColorByKey(key: string): unknown {
  // Search through all categories for a matching key
  for (const category of Object.values(statusColors)) {
    if (key in category) {
      return category[key as keyof typeof category];
    }
  }
  return null;
}

// CSS custom properties for status colors
export const statusColorCSSVariables = {
  // Event status
  '--status-event-draft-bg': statusColors.event.draft.background,
  '--status-event-draft-text': statusColors.event.draft.text,
  '--status-event-draft-border': statusColors.event.draft.border,
  '--status-event-draft-icon': statusColors.event.draft.icon,
  
  '--status-event-published-bg': statusColors.event.published.background,
  '--status-event-published-text': statusColors.event.published.text,
  '--status-event-published-border': statusColors.event.published.border,
  '--status-event-published-icon': statusColors.event.published.icon,
  
  '--status-event-active-bg': statusColors.event.active.background,
  '--status-event-active-text': statusColors.event.active.text,
  '--status-event-active-border': statusColors.event.active.border,
  '--status-event-active-icon': statusColors.event.active.icon,
  
  '--status-event-completed-bg': statusColors.event.completed.background,
  '--status-event-completed-text': statusColors.event.completed.text,
  '--status-event-completed-border': statusColors.event.completed.border,
  '--status-event-completed-icon': statusColors.event.completed.icon,
  
  '--status-event-cancelled-bg': statusColors.event.cancelled.background,
  '--status-event-cancelled-text': statusColors.event.cancelled.text,
  '--status-event-cancelled-border': statusColors.event.cancelled.border,
  '--status-event-cancelled-icon': statusColors.event.cancelled.icon,
  
  // Session status
  '--status-session-upcoming-bg': statusColors.session.upcoming.background,
  '--status-session-upcoming-text': statusColors.session.upcoming.text,
  '--status-session-upcoming-border': statusColors.session.upcoming.border,
  '--status-session-upcoming-icon': statusColors.session.upcoming.icon,
  
  '--status-session-ongoing-bg': statusColors.session.ongoing.background,
  '--status-session-ongoing-text': statusColors.session.ongoing.text,
  '--status-session-ongoing-border': statusColors.session.ongoing.border,
  '--status-session-ongoing-icon': statusColors.session.ongoing.icon,
  
  '--status-session-completed-bg': statusColors.session.completed.background,
  '--status-session-completed-text': statusColors.session.completed.text,
  '--status-session-completed-border': statusColors.session.completed.border,
  '--status-session-completed-icon': statusColors.session.completed.icon,
  
  '--status-session-cancelled-bg': statusColors.session.cancelled.background,
  '--status-session-cancelled-text': statusColors.session.cancelled.text,
  '--status-session-cancelled-border': statusColors.session.cancelled.border,
  '--status-session-cancelled-icon': statusColors.session.cancelled.icon,
  
  // User status
  '--status-user-active-bg': statusColors.user.active.background,
  '--status-user-active-text': statusColors.user.active.text,
  '--status-user-active-border': statusColors.user.active.border,
  '--status-user-active-icon': statusColors.user.active.icon,
  
  '--status-user-inactive-bg': statusColors.user.inactive.background,
  '--status-user-inactive-text': statusColors.user.inactive.text,
  '--status-user-inactive-border': statusColors.user.inactive.border,
  '--status-user-inactive-icon': statusColors.user.inactive.icon,
  
  '--status-user-suspended-bg': statusColors.user.suspended.background,
  '--status-user-suspended-text': statusColors.user.suspended.text,
  '--status-user-suspended-border': statusColors.user.suspended.border,
  '--status-user-suspended-icon': statusColors.user.suspended.icon,
  
  '--status-user-pending-bg': statusColors.user.pending.background,
  '--status-user-pending-text': statusColors.user.pending.text,
  '--status-user-pending-border': statusColors.user.pending.border,
  '--status-user-pending-icon': statusColors.user.pending.icon,
  
  // Attendance status
  '--status-attendance-present-bg': statusColors.attendance.present.background,
  '--status-attendance-present-text': statusColors.attendance.present.text,
  '--status-attendance-present-border': statusColors.attendance.present.border,
  '--status-attendance-present-icon': statusColors.attendance.present.icon,
  
  '--status-attendance-absent-bg': statusColors.attendance.absent.background,
  '--status-attendance-absent-text': statusColors.attendance.absent.text,
  '--status-attendance-absent-border': statusColors.attendance.absent.border,
  '--status-attendance-absent-icon': statusColors.attendance.absent.icon,
  
  '--status-attendance-late-bg': statusColors.attendance.late.background,
  '--status-attendance-late-text': statusColors.attendance.late.text,
  '--status-attendance-late-border': statusColors.attendance.late.border,
  '--status-attendance-late-icon': statusColors.attendance.late.icon,
  
  '--status-attendance-excused-bg': statusColors.attendance.excused.background,
  '--status-attendance-excused-text': statusColors.attendance.excused.text,
  '--status-attendance-excused-border': statusColors.attendance.excused.border,
  '--status-attendance-excused-icon': statusColors.attendance.excused.icon,
  
  '--status-attendance-pending-bg': statusColors.attendance.pending.background,
  '--status-attendance-pending-text': statusColors.attendance.pending.text,
  '--status-attendance-pending-border': statusColors.attendance.pending.border,
  '--status-attendance-pending-icon': statusColors.attendance.pending.icon,
  
  // Priority status
  '--status-priority-low-bg': statusColors.priority.low.background,
  '--status-priority-low-text': statusColors.priority.low.text,
  '--status-priority-low-border': statusColors.priority.low.border,
  '--status-priority-low-icon': statusColors.priority.low.icon,
  
  '--status-priority-medium-bg': statusColors.priority.medium.background,
  '--status-priority-medium-text': statusColors.priority.medium.text,
  '--status-priority-medium-border': statusColors.priority.medium.border,
  '--status-priority-medium-icon': statusColors.priority.medium.icon,
  
  '--status-priority-high-bg': statusColors.priority.high.background,
  '--status-priority-high-text': statusColors.priority.high.text,
  '--status-priority-high-border': statusColors.priority.high.border,
  '--status-priority-high-icon': statusColors.priority.high.icon,
  
  '--status-priority-critical-bg': statusColors.priority.critical.background,
  '--status-priority-critical-text': statusColors.priority.critical.text,
  '--status-priority-critical-border': statusColors.priority.critical.border,
  '--status-priority-critical-icon': statusColors.priority.critical.icon,
  
  // System status
  '--status-system-online-bg': statusColors.system.online.background,
  '--status-system-online-text': statusColors.system.online.text,
  '--status-system-online-border': statusColors.system.online.border,
  '--status-system-online-icon': statusColors.system.online.icon,
  
  '--status-system-offline-bg': statusColors.system.offline.background,
  '--status-system-offline-text': statusColors.system.offline.text,
  '--status-system-offline-border': statusColors.system.offline.border,
  '--status-system-offline-icon': statusColors.system.offline.icon,
  
  '--status-system-maintenance-bg': statusColors.system.maintenance.background,
  '--status-system-maintenance-text': statusColors.system.maintenance.text,
  '--status-system-maintenance-border': statusColors.system.maintenance.border,
  '--status-system-maintenance-icon': statusColors.system.maintenance.icon,
  
  '--status-system-degraded-bg': statusColors.system.degraded.background,
  '--status-system-degraded-text': statusColors.system.degraded.text,
  '--status-system-degraded-border': statusColors.system.degraded.border,
  '--status-system-degraded-icon': statusColors.system.degraded.icon,
} as const;

// Type exports for use in components
export type StatusColors = typeof statusColors;
export type StatusCategory = keyof typeof statusColors;
export type StatusKey = string;
