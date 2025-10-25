import { toast } from 'sonner';
import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Trash2, Plus, Edit, Users } from 'lucide-react';

// Toast configuration options
// interface ToastOptions {
//   duration?: number;
//   action?: {
//     label: string;
//     onClick: () => void;
//   };
// }

// Base toast configurations
const baseConfig = {
  duration: 4000,
};

// Success toast configurations
const successConfig = {
  ...baseConfig,
  style: {
    border: '1px solid rgb(34 197 94)', // green-500
    backgroundColor: 'rgb(240 253 244)', // green-50
  },
};

// Error toast configurations
const errorConfig = {
  ...baseConfig,
  duration: 6000, // Longer duration for errors
  style: {
    border: '1px solid rgb(239 68 68)', // red-500
    backgroundColor: 'rgb(254 242 242)', // red-50
  },
};

// Warning toast configurations
const warningConfig = {
  ...baseConfig,
  duration: 5000,
  style: {
    border: '1px solid rgb(245 158 11)', // amber-500
    backgroundColor: 'rgb(255 251 235)', // amber-50
  },
};

// Loading toast configurations
const loadingConfig = {
  duration: Infinity, // Don't auto-dismiss loading toasts
  style: {
    border: '1px solid rgb(59 130 246)', // blue-500
    backgroundColor: 'rgb(239 246 255)', // blue-50
  },
};

// Event-related feedback
export const eventFeedback = {
  // Create operations
  create: {
    loading: (eventName: string) => {
      return toast.loading(`Creating event "${eventName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Plus, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (eventName: string, toastId?: string) => {
      return toast.success(`Event "${eventName}" created successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The event is now available for session creation and organizer assignment.',
      });
    },
    error: (eventName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to create event "${eventName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Update operations
  update: {
    loading: (eventName: string) => {
      return toast.loading(`Updating event "${eventName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Edit, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (eventName: string, toastId?: string) => {
      return toast.success(`Event "${eventName}" updated successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'All changes have been saved.',
      });
    },
    error: (eventName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to update event "${eventName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Delete operations
  delete: {
    loading: (eventName: string) => {
      return toast.loading(`Deleting event "${eventName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Trash2, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (eventName: string, toastId?: string) => {
      return toast.success(`Event "${eventName}" deleted successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The event has been deactivated and removed from the active list.',
      });
    },
    error: (eventName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to delete event "${eventName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
    warning: (eventName: string, reason: string) => {
      return toast.warning(`Cannot delete event "${eventName}"`, {
        ...warningConfig,
        icon: React.createElement(AlertCircle, { className: "h-4 w-4 text-amber-600" }),
        description: reason,
      });
    },
  },
};

// Session-related feedback
export const sessionFeedback = {
  // Create operations
  create: {
    loading: (sessionName: string) => {
      return toast.loading(`Creating session "${sessionName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Plus, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (sessionName: string, toastId?: string) => {
      return toast.success(`Session "${sessionName}" created successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The session is now ready for attendance tracking.',
      });
    },
    error: (sessionName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to create session "${sessionName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
    conflict: (sessionName: string, conflictingSessions: string[], toastId?: string) => {
      return toast.error(`Cannot create session "${sessionName}"`, {
        ...errorConfig,
        duration: 8000, // Longer duration for conflicts
        icon: React.createElement(AlertCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: `Time windows conflict with existing sessions: ${conflictingSessions.join(', ')}`,
        action: {
          label: 'View Conflicts',
          onClick: () => {
            // This could open a modal or navigate to show conflicting sessions
            console.log('View conflicts clicked', conflictingSessions);
          },
        },
      });
    },
  },

  // Update operations
  update: {
    loading: (sessionName: string) => {
      return toast.loading(`Updating session "${sessionName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Edit, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (sessionName: string, toastId?: string) => {
      return toast.success(`Session "${sessionName}" updated successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'All session changes have been saved.',
      });
    },
    error: (sessionName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to update session "${sessionName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Delete operations
  delete: {
    loading: (sessionName: string) => {
      return toast.loading(`Deleting session "${sessionName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Trash2, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (sessionName: string, toastId?: string) => {
      return toast.success(`Session "${sessionName}" deleted successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The session has been removed from the event.',
      });
    },
    error: (sessionName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to delete session "${sessionName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },
};

// Organizer-related feedback
export const organizerFeedback = {
  // Create/Invite operations
  invite: {
    loading: (email: string) => {
      return toast.loading(`Sending invitation to ${email}...`, {
        ...loadingConfig,
        icon: React.createElement(Users, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (email: string, toastId?: string) => {
      return toast.success(`Invitation sent to ${email}!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The organizer will receive an email with setup instructions.',
      });
    },
    error: (email: string, error: string, toastId?: string) => {
      return toast.error(`Failed to send invitation to ${email}`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Update operations
  update: {
    loading: (organizerName: string) => {
      return toast.loading(`Updating organizer "${organizerName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Edit, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (organizerName: string, toastId?: string) => {
      return toast.success(`Organizer "${organizerName}" updated successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'All organizer changes have been saved.',
      });
    },
    error: (organizerName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to update organizer "${organizerName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Delete/Deactivate operations
  deactivate: {
    loading: (organizerName: string) => {
      return toast.loading(`Deactivating organizer "${organizerName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Trash2, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (organizerName: string, toastId?: string) => {
      return toast.success(`Organizer "${organizerName}" deactivated successfully!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The organizer can no longer access the system.',
      });
    },
    error: (organizerName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to deactivate organizer "${organizerName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Assignment operations
  assign: {
    loading: (organizerName: string, eventName: string) => {
      return toast.loading(`Assigning "${organizerName}" to "${eventName}"...`, {
        ...loadingConfig,
        icon: React.createElement(Users, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (organizerName: string, eventName: string, toastId?: string) => {
      return toast.success(`"${organizerName}" assigned to "${eventName}"!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: 'The organizer can now manage this event.',
      });
    },
    error: (organizerName: string, eventName: string, error: string, toastId?: string) => {
      return toast.error(`Failed to assign "${organizerName}" to "${eventName}"`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },

  // Bulk operations
  bulkAssign: {
    loading: (count: number, eventCount: number) => {
      return toast.loading(`Assigning ${count} organizer(s) to ${eventCount} event(s)...`, {
        ...loadingConfig,
        icon: React.createElement(Users, { className: "h-4 w-4 text-blue-600" }),
      });
    },
    success: (successCount: number, eventCount: number, toastId?: string) => {
      return toast.success(`Bulk assignment completed!`, {
        ...successConfig,
        icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
        id: toastId,
        description: `${successCount} organizer(s) successfully assigned to ${eventCount} event(s).`,
      });
    },
    error: (error: string, toastId?: string) => {
      return toast.error(`Bulk assignment failed`, {
        ...errorConfig,
        icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
        id: toastId,
        description: error,
      });
    },
  },
};

// Generic feedback for common operations
export const genericFeedback = {
  loading: (message: string) => {
    return toast.loading(message, {
      ...loadingConfig,
        icon: React.createElement(Loader2, { className: "h-4 w-4 text-blue-600 animate-spin" }),
    });
  },
  success: (message: string, description?: string) => {
    return toast.success(message, {
      ...successConfig,
      icon: React.createElement(CheckCircle, { className: "h-4 w-4 text-green-600" }),
      description,
    });
  },
  error: (message: string, description?: string) => {
    return toast.error(message, {
      ...errorConfig,
      icon: React.createElement(XCircle, { className: "h-4 w-4 text-red-600" }),
      description,
    });
  },
  warning: (message: string, description?: string) => {
    return toast.warning(message, {
      ...warningConfig,
      icon: React.createElement(AlertCircle, { className: "h-4 w-4 text-amber-600" }),
      description,
    });
  },
  info: (message: string, description?: string) => {
    return toast.info(message, {
      ...baseConfig,
        icon: React.createElement(AlertCircle, { className: "h-4 w-4 text-blue-600" }),
      description,
    });
  },
};

// Utility function to dismiss a toast
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Utility function to dismiss all toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};
