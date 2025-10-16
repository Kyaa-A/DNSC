import { prisma } from '@/lib/db/client';
import { ScanActionType, AttendanceRecord } from '@/lib/types/scanning';

/**
 * Create a new attendance record
 */
export async function createAttendanceRecord(data: {
  studentId: string;
  sessionId: string;
  eventId: string;
  scanType: ScanActionType;
  scannedBy: string;
  timeIn?: Date;
  timeOut?: Date;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AttendanceRecord> {
  try {
    const attendance = await prisma.attendance.create({
      data: {
        studentId: data.studentId,
        sessionId: data.sessionId,
        eventId: data.eventId,
        scanType: data.scanType,
        scannedBy: data.scannedBy,
        timeIn: data.timeIn || null,
        timeOut: data.timeOut || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });

    return {
      id: attendance.id,
      studentId: attendance.studentId,
      sessionId: attendance.sessionId,
      eventId: attendance.eventId,
      organizerId: attendance.scannedBy || '',
      scanType: attendance.scanType as ScanActionType,
      timestamp: attendance.createdAt,
      location: undefined, // Not stored in current schema
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: attendance.userAgent || '',
      },
    };

  } catch (error) {
    console.error('Error creating attendance record:', error);
    throw new Error('Failed to create attendance record');
  }
}

/**
 * Get attendance record by ID
 */
export async function getAttendanceRecordById(id: string): Promise<AttendanceRecord | null> {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            studentIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        session: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!attendance) {
      return null;
    }

    return {
      id: attendance.id,
      studentId: attendance.studentId,
      sessionId: attendance.sessionId,
      eventId: attendance.eventId,
      organizerId: attendance.scannedBy || '',
      scanType: attendance.scanType as ScanActionType,
      timestamp: attendance.createdAt,
      location: undefined,
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: attendance.userAgent || '',
      },
    };

  } catch (error) {
    console.error('Error getting attendance record by ID:', error);
    return null;
  }
}

/**
 * Get attendance records for a student in a session
 */
export async function getStudentAttendanceInSession(
  studentId: string,
  sessionId: string
): Promise<AttendanceRecord[]> {
  try {
    const records = await prisma.attendance.findMany({
      where: {
        studentId,
        sessionId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(record => ({
      id: record.id,
      studentId: record.studentId,
      sessionId: record.sessionId,
      eventId: record.eventId,
      organizerId: record.scannedBy || '',
      scanType: record.scanType as ScanActionType,
      timestamp: record.createdAt,
      location: undefined,
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: record.userAgent || '',
      },
    }));

  } catch (error) {
    console.error('Error getting student attendance in session:', error);
    return [];
  }
}

/**
 * Get attendance records for a session
 */
export async function getSessionAttendance(
  sessionId: string,
  options: {
    page?: number;
    limit?: number;
    scanType?: ScanActionType;
    orderBy?: 'createdAt' | 'scanType';
    orderDirection?: 'asc' | 'desc';
  } = {}
): Promise<{
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const {
      page = 1,
      limit = 50,
      scanType,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where = {
      sessionId,
      ...(scanType && { scanType }),
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              studentIdNumber: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [orderBy]: orderDirection },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    const attendanceRecords: AttendanceRecord[] = records.map(record => ({
      id: record.id,
      studentId: record.studentId,
      sessionId: record.sessionId,
      eventId: record.eventId,
      organizerId: record.scannedBy || '',
      scanType: record.scanType as ScanActionType,
      timestamp: record.createdAt,
      location: undefined,
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: record.userAgent || '',
      },
    }));

    return {
      records: attendanceRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

  } catch (error) {
    console.error('Error getting session attendance:', error);
    return {
      records: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    };
  }
}

/**
 * Get attendance records for an event
 */
export async function getEventAttendance(
  eventId: string,
  options: {
    page?: number;
    limit?: number;
    sessionId?: string;
    scanType?: ScanActionType;
    orderBy?: 'createdAt' | 'scanType';
    orderDirection?: 'asc' | 'desc';
  } = {}
): Promise<{
  records: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  try {
    const {
      page = 1,
      limit = 50,
      sessionId,
      scanType,
      orderBy = 'createdAt',
      orderDirection = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where = {
      eventId,
      ...(sessionId && { sessionId }),
      ...(scanType && { scanType }),
    };

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              studentIdNumber: true,
              firstName: true,
              lastName: true,
            },
          },
          session: {
            select: {
              name: true,
            },
          },
        },
        orderBy: { [orderBy]: orderDirection },
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    const attendanceRecords: AttendanceRecord[] = records.map(record => ({
      id: record.id,
      studentId: record.studentId,
      sessionId: record.sessionId,
      eventId: record.eventId,
      organizerId: record.scannedBy || '',
      scanType: record.scanType as ScanActionType,
      timestamp: record.createdAt,
      location: undefined,
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: record.userAgent || '',
      },
    }));

    return {
      records: attendanceRecords,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

  } catch (error) {
    console.error('Error getting event attendance:', error);
    return {
      records: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    };
  }
}

/**
 * Get attendance statistics for a session
 */
export async function getSessionAttendanceStats(sessionId: string): Promise<{
  totalScans: number;
  timeInScans: number;
  timeOutScans: number;
  uniqueStudents: number;
  incompleteScans: number;
  averageTimeBetweenScans: number; // in minutes
}> {
  try {
    const [
      totalScans,
      timeInScans,
      timeOutScans,
      uniqueStudents,
      incompleteScans,
      averageTimeBetweenScans,
    ] = await Promise.all([
      // Total scans
      prisma.attendance.count({
        where: { sessionId },
      }),
      
      // Time-in scans
      prisma.attendance.count({
        where: { 
          sessionId,
          scanType: 'time_in',
        },
      }),
      
      // Time-out scans
      prisma.attendance.count({
        where: { 
          sessionId,
          scanType: 'time_out',
        },
      }),
      
      // Unique students
      prisma.attendance.groupBy({
        by: ['studentId'],
        where: { sessionId },
        _count: { studentId: true },
      }).then(result => result.length),
      
      // Incomplete scans (students with only time-in or only time-out)
      prisma.$queryRaw`
        SELECT COUNT(*) as incomplete_count
        FROM (
          SELECT student_id, 
                 COUNT(CASE WHEN scan_type = 'time_in' THEN 1 END) as time_in_count,
                 COUNT(CASE WHEN scan_type = 'time_out' THEN 1 END) as time_out_count
          FROM "Attendance"
          WHERE session_id = ${sessionId}
          GROUP BY student_id
          HAVING (time_in_count > 0 AND time_out_count = 0) OR (time_in_count = 0 AND time_out_count > 0)
        ) as incomplete_students
      `.then((result: unknown) => (result as Record<string, unknown>[])[0]?.incomplete_count || 0),
      
      // Average time between scans
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (time_out - time_in)) / 60) as avg_minutes
        FROM "Attendance"
        WHERE session_id = ${sessionId}
        AND time_in IS NOT NULL
        AND time_out IS NOT NULL
      `.then((result: unknown) => (result as Record<string, unknown>[])[0]?.avg_minutes || 0),
    ]);

    return {
      totalScans,
      timeInScans,
      timeOutScans,
      uniqueStudents,
      incompleteScans: Number(incompleteScans),
      averageTimeBetweenScans: Number(averageTimeBetweenScans),
    };

  } catch (error) {
    console.error('Error getting session attendance stats:', error);
    return {
      totalScans: 0,
      timeInScans: 0,
      timeOutScans: 0,
      uniqueStudents: 0,
      incompleteScans: 0,
      averageTimeBetweenScans: 0,
    };
  }
}

/**
 * Get attendance statistics for an event
 */
export async function getEventAttendanceStats(eventId: string): Promise<{
  totalScans: number;
  timeInScans: number;
  timeOutScans: number;
  uniqueStudents: number;
  sessions: number;
  averageScansPerSession: number;
}> {
  try {
    const [
      totalScans,
      timeInScans,
      timeOutScans,
      uniqueStudents,
      sessions,
    ] = await Promise.all([
      // Total scans
      prisma.attendance.count({
        where: { eventId },
      }),
      
      // Time-in scans
      prisma.attendance.count({
        where: { 
          eventId,
          scanType: 'time_in',
        },
      }),
      
      // Time-out scans
      prisma.attendance.count({
        where: { 
          eventId,
          scanType: 'time_out',
        },
      }),
      
      // Unique students
      prisma.attendance.groupBy({
        by: ['studentId'],
        where: { eventId },
        _count: { studentId: true },
      }).then(result => result.length),
      
      // Number of sessions
      prisma.attendance.groupBy({
        by: ['sessionId'],
        where: { eventId },
        _count: { sessionId: true },
      }).then(result => result.length),
    ]);

    const averageScansPerSession = sessions > 0 ? totalScans / sessions : 0;

    return {
      totalScans,
      timeInScans,
      timeOutScans,
      uniqueStudents,
      sessions,
      averageScansPerSession,
    };

  } catch (error) {
    console.error('Error getting event attendance stats:', error);
    return {
      totalScans: 0,
      timeInScans: 0,
      timeOutScans: 0,
      uniqueStudents: 0,
      sessions: 0,
      averageScansPerSession: 0,
    };
  }
}

/**
 * Get recent attendance records
 */
export async function getRecentAttendance(
  options: {
    limit?: number;
    eventId?: string;
    sessionId?: string;
    scanType?: ScanActionType;
  } = {}
): Promise<AttendanceRecord[]> {
  try {
    const {
      limit = 20,
      eventId,
      sessionId,
      scanType,
    } = options;

    const where = {
      ...(eventId && { eventId }),
      ...(sessionId && { sessionId }),
      ...(scanType && { scanType }),
    };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            studentIdNumber: true,
            firstName: true,
            lastName: true,
          },
        },
        session: {
          select: {
            name: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map(record => ({
      id: record.id,
      studentId: record.studentId,
      sessionId: record.sessionId,
      eventId: record.eventId,
      organizerId: record.scannedBy || '',
      scanType: record.scanType as ScanActionType,
      timestamp: record.createdAt,
      location: undefined,
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: record.userAgent || '',
      },
    }));

  } catch (error) {
    console.error('Error getting recent attendance:', error);
    return [];
  }
}

/**
 * Update attendance record
 */
export async function updateAttendanceRecord(
  id: string,
  data: {
    scanType?: ScanActionType;
    timeIn?: Date;
    timeOut?: Date;
    scannedBy?: string;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<AttendanceRecord | null> {
  try {
    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
        ...(data.scanType && { scanType: data.scanType }),
        ...(data.timeIn !== undefined && { timeIn: data.timeIn }),
        ...(data.timeOut !== undefined && { timeOut: data.timeOut }),
        ...(data.scannedBy && { scannedBy: data.scannedBy }),
        ...(data.ipAddress !== undefined && { ipAddress: data.ipAddress }),
        ...(data.userAgent !== undefined && { userAgent: data.userAgent }),
      },
    });

    return {
      id: attendance.id,
      studentId: attendance.studentId,
      sessionId: attendance.sessionId,
      eventId: attendance.eventId,
      organizerId: attendance.scannedBy || '',
      scanType: attendance.scanType as ScanActionType,
      timestamp: attendance.createdAt,
      location: undefined,
      metadata: {
        qrData: '',
        deviceInfo: '',
        userAgent: attendance.userAgent || '',
      },
    };

  } catch (error) {
    console.error('Error updating attendance record:', error);
    return null;
  }
}

/**
 * Delete attendance record
 */
export async function deleteAttendanceRecord(id: string): Promise<boolean> {
  try {
    await prisma.attendance.delete({
      where: { id },
    });
    return true;

  } catch (error) {
    console.error('Error deleting attendance record:', error);
    return false;
  }
}

/**
 * Check if attendance record exists
 */
export async function attendanceRecordExists(
  studentId: string,
  sessionId: string,
  scanType: ScanActionType
): Promise<boolean> {
  try {
    const count = await prisma.attendance.count({
      where: {
        studentId,
        sessionId,
        scanType,
      },
    });
    return count > 0;

  } catch (error) {
    console.error('Error checking if attendance record exists:', error);
    return false;
  }
}

// =====================
// Event attendance queries with filters (for admin UI/API)
// =====================

export type DerivedAttendanceStatus = 'present' | 'checked-in' | 'checked-out' | 'absent'
import { deriveAttendanceStatus } from '@/lib/utils/attendance-status'

export interface EventAttendanceListOptions {
  sessionIds?: string[]
  q?: string
  statuses?: DerivedAttendanceStatus[]
  sort?: 'name' | 'status' | 'checkInAt'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}

export interface EventAttendanceRowDto {
  id: string
  name: string | null
  email: string | null
  studentId: string | null
  programSection: string | null
  status: DerivedAttendanceStatus
  checkInAt: string | null
  checkOutAt: string | null
  sessionName: string | null
}

export async function getEventAttendanceListWithFilters(
  eventId: string,
  options: EventAttendanceListOptions = {}
): Promise<{ rows: EventAttendanceRowDto[]; total: number; page: number; pageSize: number }> {
  const {
    sessionIds = [],
    q = '',
    statuses = [],
    sort = 'name',
    order = 'asc',
    page = 1,
    pageSize = 50,
  } = options

  const where: Record<string, unknown> = { eventId }
  if (sessionIds.length > 0) where.sessionId = { in: sessionIds }
  if (q) {
    where.OR = [
      { student: { firstName: { contains: q, mode: 'insensitive' } } },
      { student: { lastName: { contains: q, mode: 'insensitive' } } },
      { student: { email: { contains: q, mode: 'insensitive' } } },
      { student: { studentIdNumber: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const include = {
    student: {
      select: {
        firstName: true,
        lastName: true,
        email: true,
        studentIdNumber: true,
        program: { select: { name: true } },
      },
    },
    session: { select: { name: true } },
  } as const

  const orderBy = (() => {
    switch (sort) {
      case 'name':
        return [{ student: { lastName: order } }, { student: { firstName: order } }]
      case 'status':
        return [{ timeIn: order }, { timeOut: order }]
      case 'checkInAt':
        return [{ timeIn: order }]
      default:
        return [{ createdAt: order }]
    }
  })()

  const skip = (page - 1) * pageSize
  const [records, total] = await Promise.all([
    prisma.attendance.findMany({ where, include, orderBy: Array.isArray(orderBy) ? orderBy : [orderBy], skip, take: pageSize }),
    prisma.attendance.count({ where }),
  ])

  const rows: EventAttendanceRowDto[] = records
    .map((r) => {
      const status = deriveAttendanceStatus({ timeIn: r.timeIn, timeOut: r.timeOut }) as DerivedAttendanceStatus
      return {
        id: r.id,
        name: [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ') || null,
        email: r.student?.email ?? null,
        studentId: r.student?.studentIdNumber ?? null,
        programSection: [r.student?.program?.name].filter(Boolean).join('/') || null,
        status,
        checkInAt: r.timeIn ? r.timeIn.toISOString() : null,
        checkOutAt: r.timeOut ? r.timeOut.toISOString() : null,
        sessionName: r.session?.name ?? null,
      }
    })
    .filter((r) => (statuses.length > 0 ? statuses.includes(r.status) : true))

  return { rows, total, page, pageSize }
}

export async function getEventAttendanceKpis(
  eventId: string
): Promise<{ registered: number; present: number; checkedInOnly: number; checkedOut: number; absent: number; attendanceRatePercent: number }> {
  const registered = await prisma.attendance.groupBy({ by: ['studentId'], where: { eventId }, _count: { studentId: true } }).then((g) => g.length)
  // For present/checked-in/out we approximate on attendance rows; refine with domain rules if needed
  const recent = await prisma.attendance.findMany({ where: { eventId }, select: { timeIn: true, timeOut: true } })
  let present = 0,
    checkedInOnly = 0,
    checkedOut = 0
  for (const r of recent) {
    const s = deriveAttendanceStatus({ timeIn: r.timeIn, timeOut: r.timeOut })
    if (s === 'present') present++
    else if (s === 'checked-in') checkedInOnly++
    else if (s === 'checked-out') checkedOut++
  }
  const absent = Math.max(registered - present, 0)
  const attendanceRatePercent = registered > 0 ? Math.round((present / registered) * 100) : 0
  return { registered, present, checkedInOnly, checkedOut, absent, attendanceRatePercent }
}
