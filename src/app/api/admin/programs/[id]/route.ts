import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { authenticateAdminApi, createAuthErrorResponse } from '@/lib/auth/api-auth';
import { z } from 'zod';

const updateProgramSchema = z.object({
  name: z.string().min(2).max(20).optional(),
  displayName: z.string().min(5).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET - Get a single program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdminApi(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    const { id } = await params;

    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      program: {
        ...program,
        studentCount: program._count.students,
      },
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PUT - Update a program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdminApi(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    // Only admins can update programs
    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update programs' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateProgramSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Check if program exists
    const existing = await prisma.program.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    const { name, displayName, description, isActive } = validation.data;

    // If name is being changed, check for duplicates
    if (name && name.toUpperCase() !== existing.name) {
      const duplicate = await prisma.program.findUnique({
        where: { name: name.toUpperCase() },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A program with this name already exists' },
          { status: 409 }
        );
      }
    }

    const program = await prisma.program.update({
      where: { id },
      data: {
        ...(name && { name: name.toUpperCase() }),
        ...(displayName && { displayName }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a program (soft delete by deactivating, or hard delete if no students)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateAdminApi(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult);
    }

    // Only admins can delete programs
    if (authResult.user?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can delete programs' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if program exists and has students
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // If program has students, soft delete (deactivate)
    if (program._count.students > 0) {
      await prisma.program.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: `Program deactivated. Cannot delete because ${program._count.students} students are enrolled.`,
        deactivated: true,
      });
    }

    // If no students, hard delete
    await prisma.program.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Program deleted successfully',
      deleted: true,
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}
