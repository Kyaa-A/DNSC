import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { authenticateAdminApi, createAuthErrorResponse, authenticatePermissionApi } from '@/lib/auth/api-auth';
import { z } from 'zod';

const createProgramSchema = z.object({
  name: z.string().min(2).max(20),
  displayName: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

// GET - List all programs
export async function GET(request: NextRequest) {
  try {
    // Allow both admin and permission-based access for listing
    const authResult = await authenticatePermissionApi(request, 'canRegisterStudents');
    if (!authResult.success) {
      return Response.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const programs = await prisma.program.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    return NextResponse.json({
      programs: programs.map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.displayName,
        description: p.description,
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        studentCount: p._count.students,
      })),
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST - Create a new program
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAdminApi(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    // Only admins can create programs
    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create programs' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createProgramSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, displayName, description, isActive } = validation.data;

    // Check if program already exists
    const existing = await prisma.program.findUnique({
      where: { name: name.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A program with this name already exists' },
        { status: 409 }
      );
    }

    const program = await prisma.program.create({
      data: {
        name: name.toUpperCase(),
        displayName,
        description,
        isActive,
      },
    });

    return NextResponse.json({ program }, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}