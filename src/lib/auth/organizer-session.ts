import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/client';
import { UserWithRole, UserRole } from '@/lib/types/auth';
import { OrganizerPermissions } from '@/lib/types/organizer';

/**
 * Enhanced organizer session with database integration
 */
export interface EnhancedOrganizerSession {
  user: UserWithRole;
  isOrganizer: boolean;
  isAdmin: boolean;
  organizerId: string;
  assignedEvents: Array<{
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location?: string;
    isActive: boolean;
    assignedAt: Date;
  }>;
  permissions: OrganizerPermissions;
  lastLoginAt?: Date;
  isActive: boolean;
}

/**
 * Session state for concurrent organizer sessions
 */
export interface OrganizerSessionState {
  currentSession: EnhancedOrganizerSession | null;
  activeSessions: Array<{
    sessionId: string;
    eventId: string;
    eventName: string;
    startedAt: Date;
    lastActivity: Date;
  }>;
  loading: boolean;
  error: string | null;
}

/**
 * Get enhanced organizer session with database integration
 */
export async function getEnhancedOrganizerSession(): Promise<EnhancedOrganizerSession | null> {
  try {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    const user: UserWithRole = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
    };

    const isOrganizer = user.role === 'organizer';
    const isAdmin = user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return null;
    }

    // Get organizer record from database
    const organizer = await prisma.organizer.findUnique({
      where: { email: user.email },
      include: {
        eventAssignments: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
                startDate: true,
                endDate: true,
                location: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!organizer) {
      return null;
    }

    // Update last login time
    await prisma.organizer.update({
      where: { id: organizer.id },
      data: { lastLoginAt: new Date() },
    });

    // Build assigned events array
    const assignedEvents = organizer.eventAssignments.map(assignment => ({
      id: assignment.event.id,
      name: assignment.event.name,
      startDate: assignment.event.startDate,
      endDate: assignment.event.endDate,
      location: assignment.event.location || undefined,
      isActive: assignment.event.isActive,
      assignedAt: assignment.assignedAt,
    }));

    // Build permissions based on role and assignments
    const permissions: OrganizerPermissions = {
      canScanAttendance: isOrganizer || isAdmin,
      canViewSessions: isOrganizer || isAdmin,
      canManageSessions: isAdmin,
      canViewAnalytics: isAdmin,
      canExportData: isAdmin,
    };

    return {
      user,
      isOrganizer,
      isAdmin,
      organizerId: organizer.id,
      assignedEvents,
      permissions,
      lastLoginAt: organizer.lastLoginAt || undefined,
      isActive: organizer.isActive,
    };

  } catch (error) {
    console.error('Error getting enhanced organizer session:', error);
    return null;
  }
}

/**
 * Get organizer's assigned events with session information
 */
export async function getOrganizerAssignedEvents(organizerId: string): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  isActive: boolean;
  sessions: Array<{
    id: string;
    name: string;
    description?: string;
    timeInStart: Date;
    timeInEnd: Date;
    timeOutStart?: Date;
    timeOutEnd?: Date;
    isActive: boolean;
  }>;
  assignedAt: Date;
}>> {
  try {
    const organizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
      include: {
        eventAssignments: {
          include: {
            event: {
              include: {
                sessions: {
                  where: { isActive: true },
                  orderBy: { timeInStart: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!organizer) {
      return [];
    }

    return organizer.eventAssignments.map(assignment => ({
      id: assignment.event.id,
      name: assignment.event.name,
      description: assignment.event.description || undefined,
      startDate: assignment.event.startDate,
      endDate: assignment.event.endDate,
      location: assignment.event.location || undefined,
      isActive: assignment.event.isActive,
      sessions: assignment.event.sessions.map(session => ({
        id: session.id,
        name: session.name,
        description: session.description || undefined,
        timeInStart: session.timeInStart,
        timeInEnd: session.timeInEnd,
        timeOutStart: session.timeOutStart || undefined,
        timeOutEnd: session.timeOutEnd || undefined,
        isActive: session.isActive,
      })),
      assignedAt: assignment.assignedAt,
    }));

  } catch (error) {
    console.error('Error getting organizer assigned events:', error);
    return [];
  }
}

/**
 * Check if organizer has access to specific event
 */
export async function hasOrganizerEventAccess(
  organizerId: string,
  eventId: string
): Promise<boolean> {
  try {
    const assignment = await prisma.organizerEventAssignment.findFirst({
      where: {
        organizerId,
        eventId,
      },
    });

    return !!assignment;
  } catch (error) {
    console.error('Error checking organizer event access:', error);
    return false;
  }
}

/**
 * Check if organizer has access to specific session
 */
export async function hasOrganizerSessionAccess(
  organizerId: string,
  sessionId: string
): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        event: {
          include: {
            organizerAssignments: {
              where: { organizerId },
            },
          },
        },
      },
    });

    return !!(session && session.event.organizerAssignments.length > 0);
  } catch (error) {
    console.error('Error checking organizer session access:', error);
    return false;
  }
}

/**
 * Get organizer's active sessions (sessions they're currently managing)
 */
export async function getOrganizerActiveSessions(organizerId: string): Promise<Array<{
  sessionId: string;
  eventId: string;
  eventName: string;
  sessionName: string;
  startedAt: Date;
  lastActivity: Date;
  attendanceCount: number;
}>> {
  try {
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        scannedBy: organizerId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        session: {
          include: {
            event: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const sessionMap = new Map<string, {
      sessionId: string;
      eventId: string;
      eventName: string;
      sessionName: string;
      startedAt: Date;
      lastActivity: Date;
      attendanceCount: number;
    }>();

    for (const attendance of recentAttendance) {
      const sessionId = attendance.sessionId;
      const existing = sessionMap.get(sessionId);

      if (!existing) {
        sessionMap.set(sessionId, {
          sessionId,
          eventId: attendance.eventId,
          eventName: attendance.session.event.name,
          sessionName: attendance.session.name,
          startedAt: attendance.createdAt,
          lastActivity: attendance.createdAt,
          attendanceCount: 1,
        });
      } else {
        existing.attendanceCount++;
        if (attendance.createdAt > existing.lastActivity) {
          existing.lastActivity = attendance.createdAt;
        }
      }
    }

    return Array.from(sessionMap.values());
  } catch (error) {
    console.error('Error getting organizer active sessions:', error);
    return [];
  }
}

/**
 * Validate organizer session and permissions
 */
export async function validateOrganizerSession(
  organizerId: string,
  requiredPermission?: keyof OrganizerPermissions,
  eventId?: string,
  sessionId?: string
): Promise<{
  isValid: boolean;
  session?: EnhancedOrganizerSession;
  error?: string;
}> {
  try {
    const session = await getEnhancedOrganizerSession();

    if (!session || session.organizerId !== organizerId) {
      return {
        isValid: false,
        error: 'Invalid organizer session',
      };
    }

    if (!session.isActive) {
      return {
        isValid: false,
        error: 'Organizer account is inactive',
      };
    }

    if (requiredPermission && !session.permissions[requiredPermission]) {
      return {
        isValid: false,
        error: `Insufficient permissions: ${requiredPermission} required`,
      };
    }

    if (eventId && !session.assignedEvents.some(event => event.id === eventId)) {
      return {
        isValid: false,
        error: 'Access denied to this event',
      };
    }

    if (sessionId) {
      const hasAccess = await hasOrganizerSessionAccess(organizerId, sessionId);
      if (!hasAccess) {
        return {
          isValid: false,
          error: 'Access denied to this session',
        };
      }
    }

    return {
      isValid: true,
      session,
    };

  } catch (error) {
    console.error('Error validating organizer session:', error);
    return {
      isValid: false,
      error: 'Session validation failed',
    };
  }
}

/**
 * Track organizer activity for session management
 */
export async function trackOrganizerActivity(
  organizerId: string,
  action: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activity.create({
      data: {
        type: 'organizer_action',
        action,
        description: `Organizer ${organizerId} performed action: ${action}`,
        organizerId,
        metadata: JSON.parse(JSON.stringify({
          action,
          details,
          timestamp: new Date().toISOString(),
        })),
        source: 'organizer',
        category: 'session_management',
        severity: 'info',
      },
    });
  } catch (error) {
    console.error('Error tracking organizer activity:', error);
  }
}
