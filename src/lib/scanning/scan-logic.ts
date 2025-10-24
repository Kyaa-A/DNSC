/**
 * Scan Processing Logic
 * Handles scan type detection, time window validation, and business logic
 */

import {
  ParsedQRData,
  DTPSessionQR,
  DTPStudentQR,
  ScanType,
  TimeWindow,
  SessionTimeWindows,
  ScanProcessingResult,
  SessionValidationResult,
  ScanContextData,
  ScanValidationRules,
} from '@/lib/types/scanning';

export interface ScanLogicOptions {
  timeZone?: string;
  allowEarlyScan?: boolean;
  earlyScanMinutes?: number;
  allowLateScan?: boolean;
  lateScanMinutes?: number;
  strictMode?: boolean;
}

export class ScanLogicError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ScanLogicError';
  }
}

/**
 * Parse QR code data and determine its type
 */
export function parseQRData(qrData: string): ParsedQRData {
  if (!qrData || typeof qrData !== 'string') {
    return {
      isValid: false,
      type: 'unknown',
      payload: null,
      error: 'Invalid QR code data',
    };
  }

  try {
    // Check for DTP session QR code format: "DTP:session:sessionId:eventId"
    if (qrData.startsWith('DTP:session:')) {
      const parts = qrData.split(':');
      if (parts.length >= 4) {
        return {
          isValid: true,
          type: 'dtp_session',
          payload: {
            system: parts[0],
            type: parts[1],
            sessionId: parts[2],
            eventId: parts[3],
            data: parts.slice(4).join(':'),
          } as DTPSessionQR,
        };
      }
    }

    // Check for DTP student QR code format: "DTP:student:studentId"
    if (qrData.startsWith('DTP:student:')) {
      const parts = qrData.split(':');
      if (parts.length >= 3) {
        return {
          isValid: true,
          type: 'dtp_student',
          payload: {
            system: parts[0],
            type: parts[1],
            studentId: parts[2],
            data: parts.slice(3).join(':'),
          } as DTPStudentQR,
        };
      }
    }

    // Check if it's a URL
    if (qrData.startsWith('http://') || qrData.startsWith('https://')) {
      return {
        isValid: true,
        type: 'url',
        payload: { url: qrData },
      };
    }

    // Check if it's JSON
    if (qrData.startsWith('{') || qrData.startsWith('[')) {
      try {
        const parsed = JSON.parse(qrData);
        return {
          isValid: true,
          type: 'json',
          payload: parsed,
        };
      } catch {
        // Not valid JSON, treat as plain text
      }
    }

    // Default to plain text
    return {
      isValid: true,
      type: 'text',
      payload: { text: qrData },
    };
  } catch (error) {
    return {
      isValid: false,
      type: 'unknown',
      payload: null,
      error: `Failed to parse QR data: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Determine scan type based on current time and session windows
 */
export function determineScanType(
  context: ScanContextData,
  options: ScanLogicOptions = {}
): ScanType {
  // Note: Early/late scan options are used in determineTimeInOrOut function
  // They are passed through the options parameter for consistency

  const currentTime = context.currentTime;
  const session = context.currentSession;

  if (!session) {
    return {
      type: 'session_not_found',
      reason: 'Session not found or invalid',
      isAllowed: false,
      currentTime,
    };
  }

  // Check if session is active
  if (!session.isActive) {
    return {
      type: 'session_not_active',
      reason: 'Session is not currently active',
      isAllowed: false,
      currentTime,
    };
  }

  // Check if session has started
  if (currentTime < session.startTime) {
    return {
      type: 'session_not_started',
      reason: 'Session has not started yet',
      isAllowed: false,
      currentTime,
    };
  }

  // Check if session has ended
  if (currentTime > session.endTime) {
    return {
      type: 'session_ended',
      reason: 'Session has already ended',
      isAllowed: false,
      currentTime,
    };
  }

  // Determine if this should be a time-in or time-out scan
  const timeWindows = getSessionTimeWindows(session, currentTime);
  const scanType = determineTimeInOrOut(timeWindows, currentTime, options);

  return scanType;
}

/**
 * Get session time windows for time-in and time-out
 */
export function getSessionTimeWindows(
  session: SessionValidationResult['session'],
  currentTime: Date
): SessionTimeWindows {
  if (!session) {
    throw new ScanLogicError('Session is required', 'SESSION_REQUIRED');
  }

  const timeInWindow = session.timeInWindow ? {
    start: new Date(session.timeInWindow.start),
    end: new Date(session.timeInWindow.end),
    type: 'time_in' as const,
    isActive: currentTime >= new Date(session.timeInWindow.start) && 
              currentTime <= new Date(session.timeInWindow.end),
  } : null;

  const timeOutWindow = session.timeOutWindow ? {
    start: new Date(session.timeOutWindow.start),
    end: new Date(session.timeOutWindow.end),
    type: 'time_out' as const,
    isActive: currentTime >= new Date(session.timeOutWindow.start) && 
              currentTime <= new Date(session.timeOutWindow.end),
  } : null;

  return {
    timeIn: timeInWindow,
    timeOut: timeOutWindow,
    session: {
      id: session.id,
      startTime: new Date(session.startTime),
      endTime: new Date(session.endTime),
      isActive: session.isActive,
    },
  };
}

/**
 * Determine if the current time is within time-in or time-out window
 */
export function determineTimeInOrOut(
  timeWindows: SessionTimeWindows,
  currentTime: Date,
  options: ScanLogicOptions = {}
): ScanType {
  const {
    allowEarlyScan = true,
    earlyScanMinutes = 15,
    allowLateScan = true,
    lateScanMinutes = 30,
  } = options;

  // PRIORITY 1: Check actual time windows first (no grace periods)
  // This prevents conflicts when time windows are close together
  
  // Check if we're in the actual time-in window
  if (timeWindows.timeIn) {
    const timeInStart = new Date(timeWindows.timeIn.start);
    const timeInEnd = new Date(timeWindows.timeIn.end);
    
    if (currentTime >= timeInStart && currentTime <= timeInEnd) {
      return {
        type: 'time_in',
        reason: 'Within time-in window',
        isAllowed: true,
        timeWindow: timeWindows.timeIn,
        currentTime,
      };
    }
  }

  // Check if we're in the actual time-out window
  if (timeWindows.timeOut) {
    const timeOutStart = new Date(timeWindows.timeOut.start);
    const timeOutEnd = new Date(timeWindows.timeOut.end);
    
    if (currentTime >= timeOutStart && currentTime <= timeOutEnd) {
      return {
        type: 'time_out',
        reason: 'Within time-out window',
        isAllowed: true,
        timeWindow: timeWindows.timeOut,
        currentTime,
      };
    }
  }

  // PRIORITY 2: Check grace periods for time-out (early/late scans)
  // Time-out grace periods take precedence over time-in grace periods
  if (timeWindows.timeOut) {
    const timeOutStart = new Date(timeWindows.timeOut.start);
    const timeOutEnd = new Date(timeWindows.timeOut.end);
    
    // Check if we're early for time-out
    if (allowEarlyScan && currentTime < timeOutStart) {
      const minutesEarly = Math.floor((timeOutStart.getTime() - currentTime.getTime()) / (1000 * 60));
      if (minutesEarly <= earlyScanMinutes) {
        return {
          type: 'time_out',
          reason: `Early time-out scan (${minutesEarly} minutes early)`,
          isAllowed: true,
          timeWindow: timeWindows.timeOut,
          currentTime,
        };
      }
    }

    // Check if we're late for time-out
    if (allowLateScan && currentTime > timeOutEnd) {
      const minutesLate = Math.floor((currentTime.getTime() - timeOutEnd.getTime()) / (1000 * 60));
      if (minutesLate <= lateScanMinutes) {
        return {
          type: 'time_out',
          reason: `Late time-out scan (${minutesLate} minutes late)`,
          isAllowed: true,
          timeWindow: timeWindows.timeOut,
          currentTime,
        };
      }
    }
  }

  // PRIORITY 3: Check grace periods for time-in (early/late scans)
  // Only if we haven't matched time-out window or its grace periods
  if (timeWindows.timeIn) {
    const timeInStart = new Date(timeWindows.timeIn.start);
    const timeInEnd = new Date(timeWindows.timeIn.end);

    // Check if we're early for time-in
    if (allowEarlyScan && currentTime < timeInStart) {
      const minutesEarly = Math.floor((timeInStart.getTime() - currentTime.getTime()) / (1000 * 60));
      if (minutesEarly <= earlyScanMinutes) {
        return {
          type: 'time_in',
          reason: `Early time-in scan (${minutesEarly} minutes early)`,
          isAllowed: true,
          timeWindow: timeWindows.timeIn,
          currentTime,
        };
      }
    }

    // Check if we're late for time-in
    if (allowLateScan && currentTime > timeInEnd) {
      const minutesLate = Math.floor((currentTime.getTime() - timeInEnd.getTime()) / (1000 * 60));
      if (minutesLate <= lateScanMinutes) {
        return {
          type: 'time_in',
          reason: `Late time-in scan (${minutesLate} minutes late)`,
          isAllowed: true,
          timeWindow: timeWindows.timeIn,
          currentTime,
        };
      }
    }
  }

  // If we're not in any valid window
  return {
    type: 'invalid_time',
    reason: 'Current time is not within any valid scan window',
    isAllowed: false,
    currentTime,
  };
}

/**
 * Validate scan context and rules
 */
export function validateScanContext(
  context: ScanContextData,
  scanType: ScanType
): ScanValidationRules {
  const rules: ScanValidationRules = {
    sessionActive: false,
    timeWindowValid: false,
    studentEnrolled: false,
    organizerAuthorized: false,
    duplicateAllowed: true,
  };

  // Check if session is active
  if (context.currentSession) {
    rules.sessionActive = context.currentSession.isActive;
  }

  // Check if time window is valid
  if (scanType.isAllowed && scanType.timeWindow) {
    rules.timeWindowValid = scanType.timeWindow.isActive;
  }

  // Check if student is enrolled (this would need to be implemented with actual data)
  // For now, we'll assume it's true if we have a valid student context
  rules.studentEnrolled = true; // This should be validated against actual enrollment data

  // Check if organizer is authorized
  if (context.currentOrganizer) {
    rules.organizerAuthorized = context.currentOrganizer.role === 'organizer' || 
                               context.currentOrganizer.role === 'admin';
  }

  // Check if duplicates are allowed (this would depend on business rules)
  rules.duplicateAllowed = true; // This should be configurable

  return rules;
}

/**
 * Calculate time remaining in a time window
 */
export function calculateTimeRemaining(
  timeWindow: TimeWindow,
  currentTime: Date
): number {
  if (!timeWindow.isActive) {
    return 0;
  }

  const endTime = new Date(timeWindow.end);
  const remaining = endTime.getTime() - currentTime.getTime();
  
  return Math.max(0, Math.floor(remaining / (1000 * 60))); // Return minutes
}

/**
 * Check if a scan is within acceptable time range
 */
export function isWithinAcceptableTimeRange(
  currentTime: Date,
  timeWindow: TimeWindow,
  options: ScanLogicOptions = {}
): boolean {
  const {
    allowEarlyScan = true,
    earlyScanMinutes = 15,
    allowLateScan = true,
    lateScanMinutes = 30,
  } = options;

  const windowStart = new Date(timeWindow.start);
  const windowEnd = new Date(timeWindow.end);

  // Check if we're within the actual window
  if (currentTime >= windowStart && currentTime <= windowEnd) {
    return true;
  }

  // Check early scan allowance
  if (allowEarlyScan && currentTime < windowStart) {
    const minutesEarly = Math.floor((windowStart.getTime() - currentTime.getTime()) / (1000 * 60));
    return minutesEarly <= earlyScanMinutes;
  }

  // Check late scan allowance
  if (allowLateScan && currentTime > windowEnd) {
    const minutesLate = Math.floor((currentTime.getTime() - windowEnd.getTime()) / (1000 * 60));
    return minutesLate <= lateScanMinutes;
  }

  return false;
}

/**
 * Get scan type description for user display
 */
export function getScanTypeDescription(scanType: ScanType): string {
  switch (scanType.type) {
    case 'time_in':
      return `Time-In: ${scanType.reason}`;
    case 'time_out':
      return `Time-Out: ${scanType.reason}`;
    case 'invalid_time':
      return `Invalid Time: ${scanType.reason}`;
    case 'session_not_active':
      return `Session Not Active: ${scanType.reason}`;
    case 'session_ended':
      return `Session Ended: ${scanType.reason}`;
    case 'session_not_started':
      return `Session Not Started: ${scanType.reason}`;
    default:
      return `Unknown: ${scanType.reason}`;
  }
}

/**
 * Create a scan processing result
 */
export function createScanResult(
  success: boolean,
  scanType: ScanType,
  message: string,
  error?: string
): ScanProcessingResult {
  return {
    success,
    scanType,
    message,
    error,
    timestamp: new Date(),
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: 0,
      validationTime: 0,
      databaseTime: 0,
      totalTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: [],
      warnings: [],
    },
  };
}

/**
 * Validate QR code format for DTP system
 */
export function validateDTPQRFormat(qrData: string): {
  isValid: boolean;
  type?: 'session' | 'student';
  sessionId?: string;
  studentId?: string;
  eventId?: string;
  error?: string;
} {
  const parsed = parseQRData(qrData);
  
  if (!parsed.isValid || parsed.type !== 'dtp_session' && parsed.type !== 'dtp_student') {
    return {
      isValid: false,
      error: 'Invalid DTP QR code format',
    };
  }

  if (parsed.type === 'dtp_session') {
    const payload = parsed.payload as DTPSessionQR;
    return {
      isValid: true,
      type: 'session',
      sessionId: payload.sessionId,
      eventId: payload.eventId,
    };
  }

  if (parsed.type === 'dtp_student') {
    const payload = parsed.payload as DTPStudentQR;
    return {
      isValid: true,
      type: 'student',
      studentId: payload.studentId,
    };
  }

  return {
    isValid: false,
    error: 'Unknown DTP QR code type',
  };
}

/**
 * Get current time in specified timezone
 */
export function getCurrentTimeInTimezone(_timezone: string = 'UTC'): Date {
  const now = new Date();
  
  // For now, we'll use the local time
  // In a real implementation, you might want to use a library like date-fns-tz
  // The timezone parameter is available for future timezone handling
  return now;
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(date: Date, timezone: string = 'UTC'): string {
  return date.toLocaleString('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

/**
 * Get time difference in minutes
 */
export function getTimeDifferenceInMinutes(date1: Date, date2: Date): number {
  return Math.floor(Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60));
}
