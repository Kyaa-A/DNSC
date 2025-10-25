import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { authenticateApiRequest, ApiAuthResult } from '@/lib/auth/api-auth';
import { logActivity } from '@/lib/db/queries/activity';
import { updateSessionSchema, sessionIdSchema } from '@/lib/validations/session';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Authenticate admin request
    const authResult = await authenticateApiRequest(request, {
      requiredRole: 'admin',
      requireAuth: true,
    });

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }

    const { id } = await params;

    // Validate session ID
    const idValidation = sessionIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Get session with all related data
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            startDate: true,
            endDate: true,
            location: true,
            isActive: true,
            createdBy: true,
          },
        },
        attendance: {
          select: {
            id: true,
            studentId: true,
            timeIn: true,
            timeOut: true,
            scanType: true,
            createdAt: true,
            student: {
              select: {
                id: true,
                studentIdNumber: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });

  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch session',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  let authResult: ApiAuthResult | undefined;
  let body: Record<string, unknown> | undefined;

  try {
    // Authenticate admin request
    authResult = await authenticateApiRequest(request, {
      requiredRole: 'admin',
      requireAuth: true,
    });

    if (!authResult.success) {
      await logActivity({
        type: 'system_event',
        action: 'session_update_failed',
        description: `Unauthorized attempt to update session ${(await params).id}`,
        severity: 'warning',
        category: 'authentication',
        metadata: { ipAddress, userAgent, error: authResult.error },
        userId: undefined,
      });
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }

    if (!authResult.user) {
      await logActivity({
        type: 'system_event',
        action: 'session_update_failed',
        description: `No user found in authentication result for session ${(await params).id}`,
        severity: 'error',
        category: 'authentication',
        metadata: { ipAddress, userAgent },
      });
      return NextResponse.json(
        { error: 'User not found in authentication result' },
        { status: 401 }
      );
    }

    const adminUser = authResult.user;
    const { id } = await params;

    // Validate session ID
    const idValidation = sessionIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!existingSession) {
      await logActivity({
        type: 'system_event',
        action: 'session_update_failed',
        description: `Attempt to update non-existent session: ${id}`,
        severity: 'warning',
        category: 'data_management',
        metadata: { updatedBy: adminUser.id, sessionId: id, ipAddress, userAgent },
        userId: adminUser.id,
      });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    // Validate request body
    const validationResult = updateSessionSchema.safeParse(body!);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check for duplicate session names if name is being updated
    if (updateData.name && updateData.name !== existingSession.name) {
      const duplicateSession = await prisma.session.findFirst({
        where: {
          eventId: existingSession.eventId,
          name: { equals: updateData.name, mode: 'insensitive' },
          isActive: true,
          id: { not: id },
        },
      });

      if (duplicateSession) {
        await logActivity({
          type: 'system_event',
          action: 'session_update_failed',
          description: `Attempt to update session with duplicate name: ${updateData.name}`,
          severity: 'warning',
          category: 'data_management',
          metadata: { updatedBy: adminUser.id, sessionId: id, newName: updateData.name, ipAddress, userAgent },
          userId: adminUser.id,
        });
        return NextResponse.json(
          { error: 'A session with this name already exists in this event' },
          { status: 409 }
        );
      }
    }

    // Check for time window conflicts if time windows are being updated
    if (updateData.timeInStart || updateData.timeInEnd || updateData.timeOutStart || updateData.timeOutEnd) {
      const timeInStart = updateData.timeInStart ? new Date(updateData.timeInStart) : existingSession.timeInStart;
      const timeInEnd = updateData.timeInEnd ? new Date(updateData.timeInEnd) : existingSession.timeInEnd;
      const timeOutStart = updateData.timeOutStart ? new Date(updateData.timeOutStart) : existingSession.timeOutStart;
      const timeOutEnd = updateData.timeOutEnd ? new Date(updateData.timeOutEnd) : existingSession.timeOutEnd;

      const whereClause: Prisma.SessionWhereInput = {
        eventId: existingSession.eventId,
        isActive: true,
        id: { not: id },
        OR: [
          // Time-in window conflicts
          {
            AND: [
              { timeInStart: { lte: timeInEnd } },
              { timeInEnd: { gte: timeInStart } },
            ],
          },
        ],
      };

      // Add time-out window conflicts if both sessions have time-out windows
      if (timeOutStart && timeOutEnd) {
        whereClause.OR = whereClause.OR || [];
        whereClause.OR.push({
          AND: [
            { timeOutStart: { not: null } },
            { timeOutEnd: { not: null } },
            { timeOutStart: { lte: timeOutEnd } },
            { timeOutEnd: { gte: timeOutStart } },
          ],
        } as Prisma.SessionWhereInput);
      }

      const conflictingSessions = await prisma.session.findMany({
        where: whereClause,
      });

      if (conflictingSessions.length > 0) {
        await logActivity({
          type: 'system_event',
          action: 'session_update_failed',
          description: `Attempt to update session with conflicting time windows: ${existingSession.name}`,
          severity: 'warning',
          category: 'data_management',
          metadata: { 
            updatedBy: adminUser.id, 
            sessionId: id, 
            sessionName: existingSession.name,
            conflictingSessions: conflictingSessions.map(s => s.name),
            ipAddress, 
            userAgent 
          },
          userId: adminUser.id,
        });
        return NextResponse.json(
          { 
            error: 'Session time windows conflict with existing sessions',
            conflictingSessions: conflictingSessions.map(s => s.name),
          },
          { status: 409 }
        );
      }
    }

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        ...updateData,
        ...(updateData.timeInStart && { timeInStart: new Date(updateData.timeInStart) }),
        ...(updateData.timeInEnd && { timeInEnd: new Date(updateData.timeInEnd) }),
        // Handle timeout fields - explicitly set to null if provided as null, or convert to Date if provided as string
        ...(updateData.timeOutStart !== undefined && { 
          timeOutStart: updateData.timeOutStart === null ? null : new Date(updateData.timeOutStart) 
        }),
        ...(updateData.timeOutEnd !== undefined && { 
          timeOutEnd: updateData.timeOutEnd === null ? null : new Date(updateData.timeOutEnd) 
        }),
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    await logActivity({
      type: 'admin_action',
      action: 'session_updated',
      description: `Admin ${adminUser.email} updated session: ${updatedSession.name}`,
      severity: 'info',
      category: 'data_management',
      metadata: {
        sessionId: id,
        sessionName: updatedSession.name,
        eventId: existingSession.eventId,
        eventName: existingSession.event.name,
        changes: updateData,
        updateDuration: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
      userId: adminUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Session updated successfully',
      session: updatedSession,
    });

  } catch (error) {
    console.error('Error updating session:', error);
    await logActivity({
      type: 'system_event',
      action: 'session_update_failed',
      description: `Failed to update session ${(await params).id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
      category: 'system',
      metadata: {
        updatedBy: authResult?.user?.id,
        sessionId: (await params).id,
        updateData: body,
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        updateDuration: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
      userId: authResult?.user?.id,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update session',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const startTime = Date.now();
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  let authResult: ApiAuthResult | undefined;

  try {
    // Authenticate admin request
    authResult = await authenticateApiRequest(request, {
      requiredRole: 'admin',
      requireAuth: true,
    });

    if (!authResult.success) {
      await logActivity({
        type: 'system_event',
        action: 'session_deletion_failed',
        description: `Unauthorized attempt to delete session ${(await params).id}`,
        severity: 'warning',
        category: 'authentication',
        metadata: { ipAddress, userAgent, error: authResult.error },
        userId: undefined,
      });
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }

    if (!authResult.user) {
      await logActivity({
        type: 'system_event',
        action: 'session_deletion_failed',
        description: `No user found in authentication result for session ${(await params).id}`,
        severity: 'error',
        category: 'authentication',
        metadata: { ipAddress, userAgent },
      });
      return NextResponse.json(
        { error: 'User not found in authentication result' },
        { status: 401 }
      );
    }

    const adminUser = authResult.user;
    const { id } = await params;

    // Validate session ID
    const idValidation = sessionIdSchema.safeParse({ id });
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid session ID format' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!existingSession) {
      await logActivity({
        type: 'system_event',
        action: 'session_deletion_failed',
        description: `Attempt to delete non-existent session: ${id}`,
        severity: 'warning',
        category: 'data_management',
        metadata: { deletedBy: adminUser.id, sessionId: id, ipAddress, userAgent },
        userId: adminUser.id,
      });
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if session has attendance records
    if (existingSession._count.attendance > 0) {
      await logActivity({
        type: 'system_event',
        action: 'session_deletion_failed',
        description: `Attempt to delete session with attendance records: ${existingSession.name}`,
        severity: 'warning',
        category: 'data_management',
        metadata: { 
          deletedBy: adminUser.id, 
          sessionId: id, 
          sessionName: existingSession.name,
          eventName: existingSession.event.name,
          attendanceCount: existingSession._count.attendance,
          ipAddress, 
          userAgent 
        },
        userId: adminUser.id,
      });
      return NextResponse.json(
        { error: 'Cannot delete session with existing attendance records. Deactivate the session instead.' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false instead of hard delete
    const deletedSession = await prisma.session.update({
      where: { id },
      data: { isActive: false },
      include: {
        event: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await logActivity({
      type: 'admin_action',
      action: 'session_deleted',
      description: `Admin ${adminUser.email} deleted session: ${existingSession.name} from event ${existingSession.event.name}`,
      severity: 'info',
      category: 'data_management',
      metadata: {
        sessionId: id,
        sessionName: existingSession.name,
        eventId: existingSession.eventId,
        eventName: existingSession.event.name,
        deletionDuration: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
      userId: adminUser.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      session: deletedSession,
    });

  } catch (error) {
    console.error('Error deleting session:', error);
    await logActivity({
      type: 'system_event',
      action: 'session_deletion_failed',
      description: `Failed to delete session ${(await params).id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      severity: 'error',
      category: 'system',
      metadata: {
        deletedBy: authResult?.user?.id,
        sessionId: (await params).id,
        errorMessage: error instanceof Error ? error.message : 'Unknown',
        deletionDuration: Date.now() - startTime,
        ipAddress,
        userAgent,
      },
      userId: authResult?.user?.id,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete session',
      },
      { status: 500 }
    );
  }
}
