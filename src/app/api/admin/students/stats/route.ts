import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { authenticateAdminApi, createAuthErrorResponse } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authResult = await authenticateAdminApi(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    // Get current date info for "this month" calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch all stats in parallel
    const [totalStudents, thisMonth, programs, qrGenerated] = await Promise.all([
      // Total students
      prisma.student.count(),
      
      // Students registered this month
      prisma.student.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      
      // Total active programs
      prisma.program.count(),
      
      // Students with QR codes generated (all students have QR codes in this system)
      prisma.student.count(),
    ]);

    return NextResponse.json({
      totalStudents,
      thisMonth,
      programs,
      qrGenerated,
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student stats' },
      { status: 500 }
    );
  }
}
