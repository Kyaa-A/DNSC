import { z } from 'zod';

/**
 * Enhanced base session validation schema with real-time feedback
 */
export const sessionBaseSchema = z.object({
  name: z
    .string()
    .min(1, 'Session name is required')
    .max(255, 'Session name must be less than 255 characters')
    .trim()
    .refine(
      (name) => !/^\s*$/.test(name),
      'Session name cannot be only whitespace'
    )
    .refine(
      (name) => name.length >= 3,
      'Session name must be at least 3 characters long'
    ),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .or(z.literal(''))
    .refine(
      (desc) => !desc || desc.length >= 10 || desc.length === 0,
      'Description must be at least 10 characters long (or empty)'
    ),
});

/**
 * Enhanced session time window validation schema with smart cross-field validation
 */
export const sessionTimeWindowSchema = z.object({
  timeInStart: z
    .string()
    .datetime('Invalid time-in start format')
    .refine(
      (date) => {
        const inputDate = new Date(date);
        const now = new Date();
        const minDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        return inputDate >= minDate;
      },
      'Time-in start cannot be more than 24 hours in the past'
    ),
  timeInEnd: z
    .string()
    .datetime('Invalid time-in end format'),
  timeOutStart: z
    .string()
    .datetime('Invalid time-out start format')
    .optional(),
  timeOutEnd: z
    .string()
    .datetime('Invalid time-out end format')
    .optional(),
  hasTimeout: z.boolean().optional().default(false),
}).refine(
  (data) => {
    const timeInStart = new Date(data.timeInStart);
    const timeInEnd = new Date(data.timeInEnd);
    const duration = timeInEnd.getTime() - timeInStart.getTime();
    const minDuration = 15 * 60 * 1000; // 15 minutes
    const maxDuration = 8 * 60 * 60 * 1000; // 8 hours
    
    if (duration < minDuration) {
      return false;
    }
    if (duration > maxDuration) {
      return false;
    }
    return true;
  },
  {
    message: 'Time-in window must be between 15 minutes and 8 hours',
    path: ['timeInEnd'],
  }
).refine(
  (data) => {
    const timeInStart = new Date(data.timeInStart);
    const timeInEnd = new Date(data.timeInEnd);
    return timeInEnd > timeInStart;
  },
  {
    message: 'Time-in end must be after time-in start',
    path: ['timeInEnd'],
  }
).refine(
  (data) => {
    // Only validate timeout window if hasTimeout is true and timeout fields are provided
    if (data.hasTimeout && data.timeOutStart && data.timeOutEnd) {
      const timeOutStart = new Date(data.timeOutStart);
      const timeOutEnd = new Date(data.timeOutEnd);
      const duration = timeOutEnd.getTime() - timeOutStart.getTime();
      const minDuration = 15 * 60 * 1000; // 15 minutes
      const maxDuration = 8 * 60 * 60 * 1000; // 8 hours
      
      if (duration < minDuration) {
        return false;
      }
      if (duration > maxDuration) {
        return false;
      }
      return true;
    }
    return true;
  },
  {
    message: 'Time-out window must be between 15 minutes and 8 hours',
    path: ['timeOutEnd'],
  }
).refine(
  (data) => {
    if (data.hasTimeout && data.timeOutStart && data.timeOutEnd) {
      const timeOutStart = new Date(data.timeOutStart);
      const timeOutEnd = new Date(data.timeOutEnd);
      return timeOutEnd > timeOutStart;
    }
    return true;
  },
  {
    message: 'Time-out end must be after time-out start',
    path: ['timeOutEnd'],
  }
).refine(
  (data) => {
    const timeInEnd = new Date(data.timeInEnd);
    if (data.hasTimeout && data.timeOutStart) {
      const timeOutStart = new Date(data.timeOutStart);
      const gap = timeOutStart.getTime() - timeInEnd.getTime();
      const minGap = 5 * 60 * 1000; // 5 minutes minimum gap
      return gap >= minGap;
    }
    return true;
  },
  {
    message: 'Time-out start must be at least 5 minutes after time-in end',
    path: ['timeOutStart'],
  }
).refine(
  (data) => {
    const timeInStart = new Date(data.timeInStart);
    const now = new Date();
    const maxFuture = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
    return timeInStart <= maxFuture;
  },
  {
    message: 'Session cannot be scheduled more than 2 years in the future',
    path: ['timeInStart'],
  }
).refine(
  (data) => {
    // If hasTimeout is true, both timeout fields must be provided
    if (data.hasTimeout) {
      return data.timeOutStart && data.timeOutEnd;
    }
    return true;
  },
  {
    message: 'Both time-out start and end are required when timeout is enabled',
    path: ['timeOutStart'],
  }
);

/**
 * Session conflict checking validation schema (without organizer requirements)
 */
export const sessionConflictCheckSchema = sessionBaseSchema
  .extend({
    eventId: z.string().cuid('Invalid event ID format'),
    organizerIds: z
      .array(z.string().cuid('Invalid organizer ID format'))
      .optional()
      .default([]),
    maxCapacity: z
      .number()
      .min(1, 'Maximum capacity must be at least 1')
      .max(1000, 'Maximum capacity cannot exceed 1000')
      .optional(),
    allowWalkIns: z.boolean().default(true),
    requireRegistration: z.boolean().default(false),
  })
  .merge(sessionTimeWindowSchema)
  .refine(
    (data) => {
      if (data.requireRegistration && !data.maxCapacity) {
        return false;
      }
      return true;
    },
    {
      message: 'Maximum capacity is required when registration is required',
      path: ['maxCapacity'],
    }
  );

/**
 * Enhanced session creation validation schema with organizer assignment
 */
export const createSessionSchema = sessionBaseSchema
  .extend({
    eventId: z.string().cuid('Invalid event ID format'),
    organizerIds: z
      .array(z.string().cuid('Invalid organizer ID format'))
      .min(1, 'At least one organizer must be assigned')
      .max(10, 'Cannot assign more than 10 organizers'),
    maxCapacity: z
      .number()
      .min(1, 'Maximum capacity must be at least 1')
      .max(1000, 'Maximum capacity cannot exceed 1000')
      .optional(),
    allowWalkIns: z.boolean().default(true),
    requireRegistration: z.boolean().default(false),
  })
  .merge(sessionTimeWindowSchema)
  .refine(
    (data) => {
      if (data.requireRegistration && !data.maxCapacity) {
        return false;
      }
      return true;
    },
    {
      message: 'Maximum capacity is required when registration is required',
      path: ['maxCapacity'],
    }
  );

/**
 * Session update validation schema
 */
export const updateSessionSchema = sessionBaseSchema
  .extend({
    timeInStart: z
      .string()
      .datetime('Invalid time-in start format')
      .optional(),
    timeInEnd: z
      .string()
      .datetime('Invalid time-in end format')
      .optional(),
    timeOutStart: z
      .string()
      .datetime('Invalid time-out start format')
      .nullable()
      .optional(),
    timeOutEnd: z
      .string()
      .datetime('Invalid time-out end format')
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  })
  .partial();

/**
 * Session query parameters validation schema
 */
export const sessionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, 'Page must be greater than 0'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100'),
  eventId: z.string().cuid('Invalid event ID format').optional(),
  search: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return undefined;
    }),
  sortBy: z
    .enum(['name', 'timeInStart', 'timeInEnd', 'createdAt', 'updatedAt'])
    .optional()
    .default('timeInStart'),
  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),
});

/**
 * Session ID parameter validation schema
 */
export const sessionIdSchema = z.object({
  id: z.string().cuid('Invalid session ID format'),
});

/**
 * Session scan type validation schema
 */
export const sessionScanTypeSchema = z.object({
  scanType: z.enum(['time_in', 'time_out'], {
    message: 'Scan type must be either "time_in" or "time_out"',
  }),
});

/**
 * Session time window query validation schema
 */
export const sessionTimeWindowQuerySchema = z.object({
  eventId: z.string().cuid('Invalid event ID format'),
  date: z
    .string()
    .datetime('Invalid date format')
    .optional(),
  includeInactive: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default(false),
});

/**
 * TypeScript types inferred from schemas
 */
export type SessionConflictCheckInput = z.infer<typeof sessionConflictCheckSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type SessionQueryParams = z.infer<typeof sessionQuerySchema>;
export type SessionIdParams = z.infer<typeof sessionIdSchema>;
export type SessionScanType = z.infer<typeof sessionScanTypeSchema>;
export type SessionTimeWindowQuery = z.infer<typeof sessionTimeWindowQuerySchema>;

// New validation result types
export type ValidationResult = {
  isValid: boolean;
  message?: string;
  type: 'error' | 'warning' | 'success';
};

export type ValidationSummary = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Enhanced session validation helper functions with detailed feedback
 */
export const validateSessionTimeWindows = (data: {
  timeInStart: Date;
  timeInEnd: Date;
  timeOutStart?: Date;
  timeOutEnd?: Date;
}): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Time-in window validation
  if (data.timeInEnd <= data.timeInStart) {
    errors.push('Time-in end must be after time-in start');
  }

  // Check time-in window duration
  const timeInDuration = data.timeInEnd.getTime() - data.timeInStart.getTime();
  const timeInDurationMinutes = timeInDuration / (1000 * 60);
  
  if (timeInDurationMinutes < 15) {
    errors.push('Time-in window must be at least 15 minutes long');
  } else if (timeInDurationMinutes < 30) {
    warnings.push('Time-in window is quite short. Consider extending it for better attendance tracking.');
  }
  
  if (timeInDurationMinutes > 8 * 60) {
    errors.push('Time-in window cannot exceed 8 hours');
  }

  // Time-out window validation (if provided)
  if (data.timeOutStart && data.timeOutEnd) {
    if (data.timeOutEnd <= data.timeOutStart) {
      errors.push('Time-out end must be after time-out start');
    }
    
    if (data.timeOutStart < data.timeInEnd) {
      errors.push('Time-out start must be after time-in end');
    }
    
    // Check time-out window duration
    const timeOutDuration = data.timeOutEnd.getTime() - data.timeOutStart.getTime();
    const timeOutDurationMinutes = timeOutDuration / (1000 * 60);
    
    if (timeOutDurationMinutes < 15) {
      errors.push('Time-out window must be at least 15 minutes long');
    }
    
    if (timeOutDurationMinutes > 8 * 60) {
      errors.push('Time-out window cannot exceed 8 hours');
    }
    
    // Check gap between time-in and time-out
    const gap = data.timeOutStart.getTime() - data.timeInEnd.getTime();
    const gapMinutes = gap / (1000 * 60);
    
    if (gapMinutes < 5) {
      errors.push('There must be at least 5 minutes between time-in and time-out windows');
    } else if (gapMinutes < 15) {
      warnings.push('Consider a longer gap between time-in and time-out for better logistics');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateSessionName = (name: string): boolean => {
  return name.length >= 1 && name.length <= 255;
};

export const validateSessionDescription = (description?: string): boolean => {
  if (!description) return true;
  return description.length <= 1000;
};

/**
 * Session business logic validation
 */
export const validateSessionBusinessRules = (data: {
  eventId: string;
  timeInStart: Date;
  timeInEnd: Date;
  timeOutStart?: Date;
  timeOutEnd?: Date;
  existingSessions?: Array<{
    id: string;
    name: string;
    timeInStart: Date;
    timeInEnd: Date;
    timeOutStart?: Date;
    timeOutEnd?: Date;
    isActive: boolean;
  }>;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check time window overlap with existing sessions
  if (data.existingSessions) {
    const overlappingSessions = data.existingSessions.filter(session => {
      if (!session.isActive) return false;
      
      // Check if time-in windows overlap
      const timeInOverlap = (
        (data.timeInStart >= session.timeInStart && data.timeInStart < session.timeInEnd) ||
        (data.timeInEnd > session.timeInStart && data.timeInEnd <= session.timeInEnd) ||
        (data.timeInStart <= session.timeInStart && data.timeInEnd >= session.timeInEnd)
      );

      // Check if time-out windows overlap (if both have time-out windows)
      let timeOutOverlap = false;
      if (data.timeOutStart && data.timeOutEnd && session.timeOutStart && session.timeOutEnd) {
        timeOutOverlap = (
          (data.timeOutStart >= session.timeOutStart && data.timeOutStart < session.timeOutEnd) ||
          (data.timeOutEnd > session.timeOutStart && data.timeOutEnd <= session.timeOutEnd) ||
          (data.timeOutStart <= session.timeOutStart && data.timeOutEnd >= session.timeOutEnd)
        );
      }

      return timeInOverlap || timeOutOverlap;
    });

    if (overlappingSessions.length > 0) {
      errors.push(`Session time windows overlap with existing sessions: ${overlappingSessions.map(s => s.name).join(', ')}`);
    }
  }

  // Check if session duration is reasonable (not more than 8 hours for time-in window)
  const timeInDurationInHours = (data.timeInEnd.getTime() - data.timeInStart.getTime()) / (1000 * 60 * 60);
  if (timeInDurationInHours > 8) {
    errors.push('Time-in window cannot exceed 8 hours');
  }

  // Check if time-out window duration is reasonable (not more than 8 hours)
  if (data.timeOutStart && data.timeOutEnd) {
    const timeOutDurationInHours = (data.timeOutEnd.getTime() - data.timeOutStart.getTime()) / (1000 * 60 * 60);
    if (timeOutDurationInHours > 8) {
      errors.push('Time-out window cannot exceed 8 hours');
    }
  }

  // Check if session is not too far in the future (not more than 2 years)
  const now = new Date();
  const twoYearsFromNow = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
  if (data.timeInStart > twoYearsFromNow) {
    errors.push('Session cannot be scheduled more than 2 years in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Determine scan type based on current time and session time windows
 */
export const determineScanType = (data: {
  currentTime: Date;
  timeInStart: Date;
  timeInEnd: Date;
  timeOutStart?: Date;
  timeOutEnd?: Date;
}): 'time_in' | 'time_out' | 'outside_window' | 'invalid' => {
  const { currentTime, timeInStart, timeInEnd, timeOutStart, timeOutEnd } = data;

  // Check if current time is within time-in window
  if (currentTime >= timeInStart && currentTime <= timeInEnd) {
    return 'time_in';
  }

  // Check if current time is within time-out window (if it exists)
  if (timeOutStart && timeOutEnd && currentTime >= timeOutStart && currentTime <= timeOutEnd) {
    return 'time_out';
  }

  // Check if current time is before time-in window
  if (currentTime < timeInStart) {
    return 'outside_window';
  }

  // Check if current time is after time-out window (or after time-in window if no time-out window)
  if (timeOutEnd) {
    if (currentTime > timeOutEnd) {
      return 'outside_window';
    }
  } else {
    if (currentTime > timeInEnd) {
      return 'outside_window';
    }
  }

  return 'invalid';
};

/**
 * Real-time validation functions for form feedback
 */
export const validateSessionNameRealTime = (name: string): { isValid: boolean; message?: string; type: 'error' | 'warning' | 'success' } => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: 'Session name is required', type: 'error' };
  }
  
  if (name.trim().length < 3) {
    return { isValid: false, message: 'Session name must be at least 3 characters', type: 'error' };
  }
  
  if (name.trim().length < 10) {
    return { isValid: false, message: 'Consider a more descriptive name', type: 'warning' };
  }
  
  if (name.trim().length > 255) {
    return { isValid: false, message: 'Session name is too long', type: 'error' };
  }
  
  return { isValid: true, message: 'Session name looks good!', type: 'success' };
};

export const validateSessionDescriptionRealTime = (description: string): { isValid: boolean; message?: string; type: 'error' | 'warning' | 'success' } => {
  if (!description || description.trim().length === 0) {
    return { isValid: true, message: 'Description is optional', type: 'success' };
  }
  
  if (description.trim().length < 10) {
    return { isValid: false, message: 'Description should be at least 10 characters for clarity', type: 'warning' };
  }
  
  if (description.trim().length > 1000) {
    return { isValid: false, message: 'Description is too long', type: 'error' };
  }
  
  return { isValid: true, message: 'Description looks good!', type: 'success' };
};

export const validateTimeWindowRealTime = (startTime: string, endTime: string): { isValid: boolean; message?: string; type: 'error' | 'warning' | 'success' } => {
  if (!startTime || !endTime) {
    return { isValid: false, message: 'Both start and end times are required', type: 'error' };
  }
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { isValid: false, message: 'Invalid date format', type: 'error' };
    }
    
    if (end <= start) {
      return { isValid: false, message: 'End time must be after start time', type: 'error' };
    }
    
    const duration = end.getTime() - start.getTime();
    const durationMinutes = duration / (1000 * 60);
    
    if (durationMinutes < 15) {
      return { isValid: false, message: 'Time window must be at least 15 minutes', type: 'error' };
    }
    
    if (durationMinutes < 30) {
      return { isValid: false, message: 'Time window is quite short', type: 'warning' };
    }
    
    if (durationMinutes > 8 * 60) {
      return { isValid: false, message: 'Time window cannot exceed 8 hours', type: 'error' };
    }
    
    return { isValid: true, message: 'Time window looks good!', type: 'success' };
  } catch {
    return { isValid: false, message: 'Invalid time format', type: 'error' };
  }
};

export const validateOrganizerAssignment = (organizerIds: string[], maxCapacity?: number): { isValid: boolean; message?: string; type: 'error' | 'warning' | 'success' } => {
  if (!organizerIds || organizerIds.length === 0) {
    return { isValid: false, message: 'At least one organizer must be assigned', type: 'error' };
  }
  
  if (organizerIds.length > 10) {
    return { isValid: false, message: 'Cannot assign more than 10 organizers', type: 'error' };
  }
  
  if (organizerIds.length === 1) {
    return { isValid: true, message: 'Single organizer assigned', type: 'warning' };
  }
  
  if (maxCapacity && organizerIds.length < 3 && maxCapacity > 100) {
    return { isValid: true, message: 'Consider assigning more organizers for large capacity sessions', type: 'warning' };
  }
  
  return { isValid: true, message: 'Organizer assignment looks good!', type: 'success' };
};

/**
 * Cross-field validation for session configuration
 */
export const validateSessionConfiguration = (data: {
  name: string;
  description: string;
  timeInStart: string;
  timeInEnd: string;
  timeOutStart?: string;
  timeOutEnd?: string;
  organizerIds: string[];
  maxCapacity?: number;
  requireRegistration: boolean;
}): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate name and description
  const nameValidation = validateSessionNameRealTime(data.name);
  if (!nameValidation.isValid && nameValidation.type === 'error') {
    errors.push(nameValidation.message!);
  } else if (!nameValidation.isValid && nameValidation.type === 'warning') {
    warnings.push(nameValidation.message!);
  }
  
  const descValidation = validateSessionDescriptionRealTime(data.description);
  if (!descValidation.isValid && descValidation.type === 'error') {
    errors.push(descValidation.message!);
  } else if (!descValidation.isValid && descValidation.type === 'warning') {
    warnings.push(descValidation.message!);
  }
  
  // Validate time windows
  const timeValidation = validateTimeWindowRealTime(data.timeInStart, data.timeInEnd);
  if (!timeValidation.isValid && timeValidation.type === 'error') {
    errors.push(timeValidation.message!);
  } else if (!timeValidation.isValid && timeValidation.type === 'warning') {
    warnings.push(timeValidation.message!);
  }
  
  // Validate organizer assignment
  const organizerValidation = validateOrganizerAssignment(data.organizerIds, data.maxCapacity);
  if (!organizerValidation.isValid && organizerValidation.type === 'error') {
    errors.push(organizerValidation.message!);
  } else if (!organizerValidation.isValid && organizerValidation.type === 'warning') {
    warnings.push(organizerValidation.message!);
  }
  
  // Cross-field validation
  if (data.requireRegistration && !data.maxCapacity) {
    errors.push('Maximum capacity is required when registration is required');
  }
  
  if (data.maxCapacity && data.maxCapacity > 500 && data.organizerIds.length < 3) {
    warnings.push('Large capacity sessions should have at least 3 organizers for better management');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
