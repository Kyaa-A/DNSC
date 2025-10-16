import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db/client';
import { createSupabaseServerClient } from '@/lib/auth/supabase-server';
import {
  parseQRData,
  determineScanType,
  // createScanResult,
  validateDTPQRFormat,
} from '@/lib/scanning/scan-logic';
import {
  // ScanRequest,
  ScanResponse,
  ScanProcessingResult,
  ScanContextData,
  StudentValidationResult,
  // SessionValidationResult,
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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
    const session = await prisma.session.findUnique({
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

    if (!session) {
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
    if (session.event.organizerAssignments.length === 0) {
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
        id: session.id,
        eventId: session.eventId,
        name: session.name,
        startTime: session.event.startDate,
        endTime: session.event.endDate,
        isActive: session.isActive,
        timeInWindow: session.timeInStart && session.timeInEnd ? {
          start: session.timeInStart,
          end: session.timeInEnd,
        } : undefined,
        timeOutWindow: session.timeOutStart && session.timeOutEnd ? {
          start: session.timeOutStart,
          end: session.timeOutEnd,
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

    // Check for duplicate scans and validate scan sequence
    if (studentValidation.isValid && studentValidation.student) {
      // Get all existing attendance records for this student in this session
      const existingRecords = await prisma.attendance.findMany({
        where: {
          studentId: studentValidation.student.id,
          sessionId: validatedData.sessionId,
        },
        orderBy: { createdAt: 'desc' },
      });

      const timeInRecord = existingRecords.find(record => record.scanType === 'time_in');
      const timeOutRecord = existingRecords.find(record => record.scanType === 'time_out');

      // Check for duplicate scan of the same type
      const sameTypeRecord = existingRecords.find(record => record.scanType === scanType.type);
      
      if (sameTypeRecord) {
        const timeSinceLastScan = Math.floor(
          (currentTime.getTime() - sameTypeRecord.createdAt.getTime()) / (1000 * 60)
        );

        return NextResponse.json(
          { 
            success: false, 
            error: 'Duplicate scan',
            message: `You have already scanned ${scanType.type} for this session. Last scan was ${timeSinceLastScan} minutes ago.`
          },
          { status: 409 }
        );
      }

      // Validate scan sequence
      if (scanType.type === 'time_out' && !timeInRecord) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid scan sequence',
            message: 'Cannot scan time-out without first scanning time-in for this session.'
          },
          { status: 400 }
        );
      }

      if (scanType.type === 'time_in' && timeInRecord) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Already checked in',
            message: 'You have already checked in for this session.'
          },
          { status: 409 }
        );
      }

      if (scanType.type === 'time_out' && timeOutRecord) {
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

    // Create attendance record
    let attendanceRecord: AttendanceRecord | null = null;
    
    if (studentValidation.isValid && studentValidation.student) {
      const newAttendance = await prisma.attendance.create({
        data: {
          studentId: studentValidation.student.id,
          sessionId: validatedData.sessionId,
          eventId: session.eventId,
          scanType: scanType.type as ScanActionType,
          scannedBy: validatedData.organizerId,
          timeIn: scanType.type === 'time_in' ? currentTime : null,
          timeOut: scanType.type === 'time_out' ? currentTime : null,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: validatedData.metadata?.userAgent || request.headers.get('user-agent') || null,
        },
      });

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
    
    // Handle validation errors
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

    // Handle other errors
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
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
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
    const session = await prisma.session.findUnique({
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

    if (!session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found'
        },
        { status: 404 }
      );
    }

    // Check if organizer is assigned to this session
    if (session.event.organizerAssignments.length === 0) {
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
        id: session.id,
        name: session.name,
        event: session.event,
        isActive: session.isActive,
        timeInWindow: session.timeInStart && session.timeInEnd ? {
          start: session.timeInStart,
          end: session.timeInEnd,
        } : null,
        timeOutWindow: session.timeOutStart && session.timeOutEnd ? {
          start: session.timeOutStart,
          end: session.timeOutEnd,
        } : null,
        totalScans: session._count.attendance,
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
