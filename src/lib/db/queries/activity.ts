import { prisma } from '../client';
import { Prisma } from '@prisma/client';

/**
 * Activity logging utilities
 * Functions to log activities, fetch recent activities, and manage activity data
 */

// Types for activity logging
export interface ActivityInput {
  type: ActivityType;
  action: string;
  description: string;
  studentId?: string;
  userId?: string; // Authenticated user ID
  programId?: string;
  metadata?: Record<string, unknown>;
  source?: ActivitySource;
  severity?: ActivitySeverity;
  category: ActivityCategory;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface ActivityFilter {
  type?: ActivityType | ActivityType[];
  category?: ActivityCategory | ActivityCategory[];
  source?: ActivitySource | ActivitySource[];
  severity?: ActivitySeverity | ActivitySeverity[];
  studentId?: string;
  userId?: string; // Authenticated user ID
  programId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

export interface ActivityWithRelations {
  id: string;
  type: string;
  action: string;
  description: string;
  studentId: string | null;
  userId: string | null; // Authenticated user ID
  programId: string | null;
  metadata: unknown;
  source: string;
  severity: string;
  category: string;
  ipAddress: string | null;
  userAgent: string | null;
  sessionId: string | null;
  createdAt: Date;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    studentIdNumber: string;
    email: string;
  } | null;

  program: {
    id: string;
    name: string;
    displayName: string;
  } | null;
}

// Activity type enums
export type ActivityType = 
  | 'student_registration'
  | 'qr_generation'
  | 'admin_action'
  | 'system_event'
  | 'authentication'
  | 'data_export'
  | 'data_import';

export type ActivityCategory = 
  | 'registration'
  | 'authentication'
  | 'data_management'
  | 'system'
  | 'analytics'
  | 'security'
  | 'maintenance';

export type ActivitySource = 
  | 'admin'
  | 'public'
  | 'system'
  | 'api'
  | 'cron'
  | 'webhook';

export type ActivitySeverity = 
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'critical'
  | 'debug';

/**
 * Log a new activity
 * @param input - Activity data to log
 * @returns Promise<Activity>
 */
export async function logActivity(input: ActivityInput) {
  try {
    const activity = await prisma.activity.create({
      data: {
        type: input.type,
        action: input.action,
        description: input.description,
        studentId: input.studentId || null,
        userId: input.userId || null,
        programId: input.programId || null,
        metadata: input.metadata as Prisma.InputJsonValue,
        source: input.source || 'system',
        severity: input.severity || 'info',
        category: input.category,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
        sessionId: input.sessionId || null,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentIdNumber: true,
            email: true,
          },
        },

        program: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });

    console.log(`Activity logged: ${input.type} - ${input.action} - ${input.description}`);
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    throw new Error('Failed to log activity');
  }
}

/**
 * Fetch recent activities with optional filtering
 * @param filter - Filter options
 * @returns Promise<ActivityWithRelations[]>
 */
export async function getRecentActivities(filter: ActivityFilter = {}): Promise<ActivityWithRelations[]> {
  try {
    const {
      type,
      category,
      source,
      severity,
      studentId,
      userId,
      programId,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = filter;

    // Build where clause
    const where: Prisma.ActivityWhereInput = {};

    if (type) {
      where.type = Array.isArray(type) ? { in: type } : type;
    }

    if (category) {
      where.category = Array.isArray(category) ? { in: category } : category;
    }

    if (source) {
      where.source = Array.isArray(source) ? { in: source } : source;
    }

    if (severity) {
      where.severity = Array.isArray(severity) ? { in: severity } : severity;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentIdNumber: true,
            email: true,
          },
        },

        program: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return activities;
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw new Error('Failed to fetch recent activities');
  }
}

/**
 * Get activities for a specific student
 * @param studentId - Student ID
 * @param limit - Maximum number of activities to return
 * @returns Promise<ActivityWithRelations[]>
 */
export async function getStudentActivities(
  studentId: string,
  limit: number = 20
): Promise<ActivityWithRelations[]> {
  return getRecentActivities({
    studentId,
    limit,
  });
}

/**
 * Get activities performed by a specific user
 * @param userId - User ID
 * @param limit - Maximum number of activities to return
 * @returns Promise<ActivityWithRelations[]>
 */
export async function getUserActivities(
  userId: string,
  limit: number = 20
): Promise<ActivityWithRelations[]> {
  return getRecentActivities({
    userId,
    limit,
  });
}

/**
 * Get activities for a specific program
 * @param programId - Program ID
 * @param limit - Maximum number of activities to return
 * @returns Promise<ActivityWithRelations[]>
 */
export async function getProgramActivities(
  programId: string,
  limit: number = 20
): Promise<ActivityWithRelations[]> {
  return getRecentActivities({
    programId,
    limit,
  });
}

/**
 * Get activity count by category for analytics
 * @param dateFrom - Start date (optional)
 * @param dateTo - End date (optional)
 * @returns Promise<Array<{ category: string; count: number }>>
 */
export async function getActivityCountByCategory(
  dateFrom?: Date,
  dateTo?: Date
): Promise<Array<{ category: string; count: number }>> {
  try {
    const where: Prisma.ActivityWhereInput = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const result = await prisma.activity.groupBy({
      by: ['category'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return result.map((item) => ({
      category: item.category,
      count: item._count.id,
    }));
  } catch (error) {
    console.error('Error getting activity count by category:', error);
    throw new Error('Failed to get activity count by category');
  }
}

/**
 * Get activity count by source for analytics
 * @param dateFrom - Start date (optional)
 * @param dateTo - End date (optional)
 * @returns Promise<Array<{ source: string; count: number }>>
 */
export async function getActivityCountBySource(
  dateFrom?: Date,
  dateTo?: Date
): Promise<Array<{ source: string; count: number }>> {
  try {
    const where: Prisma.ActivityWhereInput = {};

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    const result = await prisma.activity.groupBy({
      by: ['source'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return result.map((item) => ({
      source: item.source,
      count: item._count.id,
    }));
  } catch (error) {
    console.error('Error getting activity count by source:', error);
    throw new Error('Failed to get activity count by source');
  }
}

/**
 * Get daily activity counts for the last N days
 * @param days - Number of days to look back (default: 7)
 * @returns Promise<Array<{ date: string; count: number }>>
 */
export async function getDailyActivityCounts(
  days: number = 7
): Promise<Array<{ date: string; count: number }>> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const activityByDate = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activityByDate.set(dateStr, 0);
    }

    // Count activities by date
    activities.forEach((activity) => {
      const dateStr = activity.createdAt.toISOString().split('T')[0];
      const currentCount = activityByDate.get(dateStr) || 0;
      activityByDate.set(dateStr, currentCount + 1);
    });

    // Convert to array format
    return Array.from(activityByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  } catch (error) {
    console.error('Error getting daily activity counts:', error);
    throw new Error('Failed to get daily activity counts');
  }
}

/**
 * Clean up old activities (for maintenance)
    * @param olderThanDays - Delete activities older than this many days
 * @returns Promise<{ deletedCount: number }>
 */
export async function cleanupOldActivities(
  olderThanDays: number = 365
): Promise<{ deletedCount: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.activity.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        // Keep critical activities regardless of age
        severity: {
          not: 'critical',
        },
      },
    });

    console.log(`Cleaned up ${result.count} old activities older than ${olderThanDays} days`);
    return { deletedCount: result.count };
  } catch (error) {
    console.error('Error cleaning up old activities:', error);
    throw new Error('Failed to clean up old activities');
  }
}

/**
 * Get total activity count
 * @param filter - Optional filter
 * @returns Promise<number>
 */
export async function getTotalActivityCount(filter: Omit<ActivityFilter, 'limit' | 'offset'> = {}): Promise<number> {
  try {
    const {
      type,
      category,
      source,
      severity,
      studentId,
      userId,
      programId,
      dateFrom,
      dateTo,
    } = filter;

    // Build where clause
    const where: Prisma.ActivityWhereInput = {};

    if (type) {
      where.type = Array.isArray(type) ? { in: type } : type;
    }

    if (category) {
      where.category = Array.isArray(category) ? { in: category } : category;
    }

    if (source) {
      where.source = Array.isArray(source) ? { in: source } : source;
    }

    if (severity) {
      where.severity = Array.isArray(severity) ? { in: severity } : severity;
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (userId) {
      where.userId = userId;
    }

    if (programId) {
      where.programId = programId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = dateFrom;
      }
      if (dateTo) {
        where.createdAt.lte = dateTo;
      }
    }

    return await prisma.activity.count({ where });
  } catch (error) {
    console.error('Error getting total activity count:', error);
    throw new Error('Failed to get total activity count');
  }
}

// Convenience functions for common activity logging scenarios

/**
 * Log student registration activity
 */
export async function logStudentRegistration(
  studentId: string,
  source: 'admin' | 'public',
  userId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return logActivity({
    type: 'student_registration',
    action: 'register',
    description: `Student registered via ${source} interface`,
    studentId,
    userId,
    metadata,
    source,
    severity: 'success',
    category: 'registration',
    ipAddress,
    userAgent,
  });
}

/**
 * Log QR code generation activity
 */
export async function logQRGeneration(
  studentId: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return logActivity({
    type: 'qr_generation',
    action: 'generate',
    description: 'QR code generated for student',
    studentId,
    metadata,
    source: 'system',
    severity: 'info',
    category: 'data_management',
    ipAddress,
    userAgent,
  });
}

/**
 * Log user login activity
 */
export async function logUserLogin(
  userId: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string,
  metadata?: Record<string, unknown>
) {
  return logActivity({
    type: 'authentication',
    action: success ? 'login_success' : 'login_failed',
    description: `User ${success ? 'successfully logged in' : 'failed to log in'}`,
    userId,
    metadata,
    source: 'admin',
    severity: success ? 'success' : 'warning',
    category: 'authentication',
    ipAddress,
    userAgent,
  });
}

/**
 * Log data export activity
 */
export async function logDataExport(
  userId: string,
  exportType: string,
  recordCount: number,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  return logActivity({
    type: 'data_export',
    action: 'export',
    description: `Exported ${recordCount} ${exportType} records`,
    userId,
    metadata: { exportType, recordCount, ...metadata },
    source: 'admin',
    severity: 'info',
    category: 'data_management',
    ipAddress,
    userAgent,
  });
}

/**
 * Log system event activity
 */
export async function logSystemEvent(
  action: string,
  description: string,
  severity: ActivitySeverity = 'info',
  metadata?: Record<string, unknown>
) {
  return logActivity({
    type: 'system_event',
    action,
    description,
    metadata,
    source: 'system',
    severity,
    category: 'system',
  });
}
