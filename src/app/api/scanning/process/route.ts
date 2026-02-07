import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth/auth';
import {
  parseQRData,
  determineScanType,
  validateDTPQRFormat,
} from '@/lib/scanning/scan-logic';
import {
  ScanResponse,
  ScanProcessingResult,
  ScanContextData,
  StudentValidationResult,
  ScanActionType,
  AttendanceRecord,
} from '@/lib/types/scanning';

// Request validation schema
const scanRequestSchema = z.object({
  qrData: z.string().min(1, 'QR data is required'),
  sessionId: z.string().min(1, 'Session ID is required'),
  organizerId: z.string().min(1, 'Organizer ID is required'),
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    accuracy: z.number().optional(),
  }).optional(),
  metadata: z.object({
    deviceInfo: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  }).optional(),
});

/**
 * POST /api/scanning/process
 * Process a QR code scan request
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = scanRequestSchema.parse(body);

    // Get authenticated user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          message: 'Please log in to process scans'
        },
        { status: 401 }
      );
    }

    // Verify organizer access
    const organizer = await prisma.organizer.findUnique({
      where: { id: validatedData.organizerId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });

    if (!organizer || !organizer.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organizer not found or inactive',
          message: 'Invalid organizer access'
        },
        { status: 403 }
      );
    }

    // Parse QR data
    const parsedQR = parseQRData(validatedData.qrData);

    if (!parsedQR.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid QR code',
          message: parsedQR.error || 'QR code format is not recognized'
        },
        { status: 400 }
      );
    }

    // Validate DTP QR format
    const qrValidation = validateDTPQRFormat(validatedData.qrData);

    if (!qrValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid DTP QR code',
          message: qrValidation.error || 'QR code is not a valid DTP format'
        },
        { status: 400 }
      );
    }

    // Get session information
    const attendanceSession = await prisma.session.findUnique({
      where: { id: validatedData.sessionId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
          include: {
            organizerAssignments: {
              where: { organizerId: validatedData.organizerId },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found',
          message: 'The specified session does not exist'
        },
        { status: 404 }
      );
    }

    // Check if organizer is assigned to this session
    if (attendanceSession.event.organizerAssignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied',
          message: 'You are not authorized to manage this session'
        },
        { status: 403 }
      );
    }

    // Validate student if it's a student QR code
    let studentValidation: StudentValidationResult = { isValid: false };

    if (qrValidation.type === 'student' && qrValidation.studentId) {
      const student = await prisma.student.findUnique({
        where: { id: qrValidation.studentId },
        select: {
          id: true,
          studentIdNumber: true,
          firstName: true,
          lastName: true,
          email: true,
          programId: true,
          year: true,
        },
      });

      if (student) {
        studentValidation = {
          isValid: true,
          student: {
            id: student.id,
            studentId: student.studentIdNumber,
            fullName: `${student.firstName} ${student.lastName}`,
            email: student.email,
            program: student.programId,
            year: student.year,
            isActive: true,
          },
        };
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Student not found',
            message: 'The student associated with this QR code is not found or inactive'
          },
          { status: 404 }
        );
      }
    }

    // Create scan context
    const currentTime = new Date();
    const scanContext: ScanContextData = {
      currentSession: {
        id: attendanceSession.id,
        eventId: attendanceSession.eventId,
        name: attendanceSession.name,
        startTime: attendanceSession.event.startDate,
        endTime: attendanceSession.event.endDate,
        isActive: attendanceSession.isActive,
        timeInWindow: attendanceSession.timeInStart && attendanceSession.timeInEnd ? {
          start: attendanceSession.timeInStart,
          end: attendanceSession.timeInEnd,
        } : undefined,
        timeOutWindow: attendanceSession.timeOutStart && attendanceSession.timeOutEnd ? {
          start: attendanceSession.timeOutStart,
          end: attendanceSession.timeOutEnd,
        } : undefined,
      },
      currentOrganizer: {
        id: organizer.id,
        email: organizer.email,
        fullName: organizer.fullName,
        role: organizer.role,
      },
      currentTime,
      timeZone: 'UTC',
      location: validatedData.location,
    };

    // Determine scan type
    const scanType = determineScanType(scanContext);

    if (!scanType.isAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Scan not allowed',
          message: scanType.reason
        },
        { status: 400 }
      );
    }

    // Get existing attendance record for this student in this session
    let existingRecord = null;
    if (studentValidation.isValid && studentValidation.student) {
      existingRecord = await prisma.attendance.findFirst({
        where: {
          studentId: studentValidation.student.id,
          sessionId: validatedData.sessionId,
        },
        orderBy: { createdAt: 'desc' },
      });

      // Validate scan sequence and prevent duplicates
      if (scanType.type === 'time_out' && !existingRecord) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid scan sequence',
            message: 'Cannot scan time-out without first scanning time-in for this session.'
          },
          { status: 400 }
        );
      }

      if (scanType.type === 'time_in' && existingRecord && existingRecord.timeIn) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already checked in',
            message: 'You have already checked in for this session.'
          },
          { status: 409 }
        );
      }

      if (scanType.type === 'time_out' && existingRecord && existingRecord.timeOut) {
        return NextResponse.json(
          {
            success: false,
            error: 'Already checked out',
            message: 'You have already checked out for this session.'
          },
          { status: 409 }
        );
      }
    }

    // Create or update attendance record
    let attendanceRecord: AttendanceRecord | null = null;

    if (studentValidation.isValid && studentValidation.student) {
      let newAttendance;

      if (scanType.type === 'time_in') {
        newAttendance = await prisma.attendance.create({
          data: {
            studentId: studentValidation.student.id,
            sessionId: validatedData.sessionId,
            eventId: attendanceSession.eventId,
            scanType: scanType.type as ScanActionType,
            scannedBy: validatedData.organizerId,
            timeIn: currentTime,
            timeOut: null,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: validatedData.metadata?.userAgent || request.headers.get('user-agent') || null,
          },
        });
      } else if (scanType.type === 'time_out' && existingRecord) {
        newAttendance = await prisma.attendance.update({
          where: { id: existingRecord.id },
          data: {
            timeOut: currentTime,
            scanType: 'time_out',
            scannedBy: validatedData.organizerId,
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
            userAgent: validatedData.metadata?.userAgent || request.headers.get('user-agent') || null,
          },
        });
      } else {
        throw new Error('Invalid scan type or missing existing record for time_out');
      }

      attendanceRecord = {
        id: newAttendance.id,
        studentId: newAttendance.studentId,
        sessionId: newAttendance.sessionId,
        eventId: newAttendance.eventId,
        organizerId: newAttendance.scannedBy || '',
        scanType: newAttendance.scanType as ScanActionType,
        timestamp: newAttendance.createdAt,
        location: validatedData.location,
        metadata: {
          qrData: validatedData.qrData,
          deviceInfo: validatedData.metadata?.deviceInfo,
          userAgent: newAttendance.userAgent || undefined,
        },
      };
    }

    // Create successful response
    const processingTime = Date.now() - startTime;
    const result: ScanProcessingResult = {
      success: true,
      scanType,
      attendanceRecord: attendanceRecord || undefined,
      message: `Successfully processed ${scanType.type} scan`,
      timestamp: currentTime,
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime,
        validationTime: 0,
        databaseTime: 0,
        totalTime: processingTime,
        cacheHits: 0,
        cacheMisses: 0,
        errors: [],
        warnings: [],
      },
    };

    const response: ScanResponse = {
      success: true,
      result,
      student: studentValidation.isValid ? studentValidation.student : undefined,
      session: scanContext.currentSession,
      duplicateCheck: {
        isDuplicate: false,
        timeSinceLastScan: undefined,
        message: 'No duplicate found',
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Scan processing error:', error);

    const processingTime = Date.now() - startTime;

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: error.issues.map(e => e.message).join(', '),
          details: error.issues
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing the scan',
        processingTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/scanning/process
 * Get scan processing status and information
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const organizerId = searchParams.get('organizerId');

    if (!sessionId || !organizerId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing parameters',
          message: 'sessionId and organizerId are required'
        },
        { status: 400 }
      );
    }

    // Get session information
    const attendanceSession = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
          include: {
            organizerAssignments: {
              where: { organizerId },
              select: { id: true },
            },
          },
        },
        _count: {
          select: {
            attendance: true,
          },
        },
      },
    });

    if (!attendanceSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found'
        },
        { status: 404 }
      );
    }

    // Check if organizer is assigned to this session
    if (attendanceSession.event.organizerAssignments.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied'
        },
        { status: 403 }
      );
    }

    // Get recent scans for this session
    const recentScans = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            studentIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      session: {
        id: attendanceSession.id,
        name: attendanceSession.name,
        event: attendanceSession.event,
        isActive: attendanceSession.isActive,
        timeInWindow: attendanceSession.timeInStart && attendanceSession.timeInEnd ? {
          start: attendanceSession.timeInStart,
          end: attendanceSession.timeInEnd,
        } : null,
        timeOutWindow: attendanceSession.timeOutStart && attendanceSession.timeOutEnd ? {
          start: attendanceSession.timeOutStart,
          end: attendanceSession.timeOutEnd,
        } : null,
        totalScans: attendanceSession._count.attendance,
      },
      recentScans: recentScans.map(scan => ({
        id: scan.id,
        studentId: scan.student.studentIdNumber,
        studentName: `${scan.student.firstName} ${scan.student.lastName}`,
        scanType: scan.scanType,
        timestamp: scan.createdAt,
      })),
    });

  } catch (error) {
    console.error('Scan status error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
