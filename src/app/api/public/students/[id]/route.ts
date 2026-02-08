import { NextRequest, NextResponse } from 'next/server';
import { getStudentById } from '@/lib/db/queries/students';
import { withRateLimit } from '@/lib/auth/rate-limit';

export const GET = withRateLimit('api', async (req: NextRequest) => {
  try {
    // Extract student ID from URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1]; // Get the ID from the URL path
    
    // Validate the ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid student ID provided' }, 
        { status: 400 }
      );
    }

    const student = await getStudentById(id.trim());
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found. Please verify the student ID is correct.' }, 
        { status: 404 }
      );
    }

    // Return only safe, public information
    const publicStudentData = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentIdNumber: student.studentIdNumber,
      program: student.program ? {
        id: student.program.id,
        name: student.program.name,
        displayName: student.program.displayName
      } : null
    };

    return NextResponse.json(publicStudentData);
  } catch (error) {
    console.error('Failed to fetch public student data:', error);
    
    // Provide different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('Invalid input syntax')) {
        return NextResponse.json(
          { error: 'Invalid student ID format' }, 
          { status: 400 }
        );
      }
      
      if (error.message.includes('connection')) {
        return NextResponse.json(
          { error: 'Database connection error. Please try again later.' }, 
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Unable to retrieve student information. Please try again later.' }, 
      { status: 500 }
    );
  }
});
