import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { auth } from '@/lib/auth/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    // Fetch the session with event details and attendance counts by scan type
    const [eventSession, timeInCount, timeOutCount, totalStudents] = await Promise.all([
      prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.attendance.count({
        where: { sessionId, scanType: 'time_in' },
      }),
      prisma.attendance.count({
        where: { sessionId, scanType: 'time_out' },
      }),
      prisma.student.count(),
    ]);

    if (!eventSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Use timeInStart as the session date
    const now = new Date();
    const sessionDate = new Date(eventSession.timeInStart);
    let status: 'active' | 'upcoming' | 'completed' = 'upcoming';

    // Check if session is today
    const isToday = sessionDate.toDateString() === now.toDateString();
    const isPast = sessionDate < now && !isToday;

    if (isPast) {
      status = 'completed';
    } else if (isToday) {
      // Check if within time windows
      const timeInStart = eventSession.timeInStart;
      const timeOutEnd = eventSession.timeOutEnd;
      
      if (timeInStart && timeOutEnd) {
        if (now >= timeInStart && now <= timeOutEnd) {
          status = 'active';
        } else if (now > timeOutEnd) {
          status = 'completed';
        }
      } else if (timeInStart && now >= timeInStart) {
        status = 'active';
      }
    }

    return NextResponse.json({
      session: {
        id: eventSession.id,
        name: eventSession.name,
        date: eventSession.timeInStart.toISOString(),
        status,
        timeInStart: eventSession.timeInStart.toISOString(),
        timeInEnd: eventSession.timeInEnd.toISOString(),
        timeOutStart: eventSession.timeOutStart?.toISOString() || null,
        timeOutEnd: eventSession.timeOutEnd?.toISOString() || null,
        event: eventSession.event,
        timeInCount,
        timeOutCount,
        attendanceCount: timeInCount,
        expectedAttendance: totalStudents,
      },
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 }
    );
  }
}
