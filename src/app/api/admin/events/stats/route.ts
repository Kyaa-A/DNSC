import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { authenticateApiRequest } from '@/lib/auth/api-auth';

/**
 * GET /api/admin/events/stats
 * Fetch event statistics for admin dashboard
 */
export async function GET(request: NextRequest) {
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

    // Fetch simple, accurate event statistics
    const [
      totalEvents,
      activeEvents,
      totalSessions,
      totalOrganizers,
    ] = await Promise.all([
      // Total events count
      prisma.event.count(),
      
      // Active events count
      prisma.event.count({
        where: { isActive: true },
      }),
      
      // Total sessions count
      prisma.session.count(),
      
      // Total organizers count
      prisma.organizer.count({
        where: { isActive: true },
      }),
    ]);

    const stats = {
      totalEvents,
      activeEvents,
      inactiveEvents: totalEvents - activeEvents,
      totalSessions,
      totalOrganizers,
    };

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching event statistics:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
