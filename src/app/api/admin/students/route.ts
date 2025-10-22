import { NextRequest, NextResponse } from 'next/server';
import { getStudents, countStudents } from '@/lib/db/queries/students';
import { authenticatePermissionApi, createAuthErrorResponse } from '@/lib/auth/api-auth';

export async function GET(request: NextRequest) {
  // Check if user has permission to manage students (admin only)
  const authResult = await authenticatePermissionApi(request, 'canManageStudents');
  
  if (!authResult.success) {
    return createAuthErrorResponse(authResult);
  }
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    
    // Filter parameters
    const program = searchParams.get('program') || undefined;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
    const registrationSource = searchParams.get('registrationSource') || undefined;
    const dateFrom = searchParams.get('dateFrom') || undefined;
    const dateTo = searchParams.get('dateTo') || undefined;

    const filters = {
      page,
      limit,
      search,
      program,
      year,
      registrationSource,
      dateFrom,
      dateTo,
    };

    const students = await getStudents(filters);
    const total = await countStudents(filters);

    return NextResponse.json({ 
      students, 
      total 
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load students';
    return NextResponse.json({ error: message }, { status: 500 });
  }
} 