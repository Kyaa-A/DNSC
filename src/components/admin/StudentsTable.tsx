'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, QrCode } from 'lucide-react';
import type { ScanningStudent } from '@/lib/types/scanning';
import type { StudentWithProgram } from '@/lib/db/queries/students';
import { toast } from 'sonner';
import EditStudentModal from './EditStudentModal';
import { FilterParams } from './StudentsFilter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';

interface StudentsTableProps {
  searchQuery?: string;
  filters?: FilterParams;
}

// Helper function to get program name
const getProgramName = (program: string | { name?: string; displayName?: string } | null): string => {
  if (typeof program === 'string') return program;
  if (typeof program === 'object' && program !== null) {
    return program.displayName || program.name || 'Unknown';
  }
  return 'Unknown';
};

export function StudentsTable({ searchQuery = '', filters = {} }: StudentsTableProps) {
  const [students, setStudents] = useState<ScanningStudent[] | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [editingStudent, setEditingStudent] = useState<StudentWithProgram | null>(null);
  const [viewingQRStudent, setViewingQRStudent] = useState<ScanningStudent | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search: searchQuery,
      });

      // Add filter parameters
      if (filters.program) params.set('program', filters.program);
      if (filters.year) params.set('year', filters.year);
      if (filters.registrationSource) params.set('registrationSource', filters.registrationSource);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch students');
      const data = await res.json();
      
      console.log('API Response:', data); // Debug log
      console.log('Students data type:', typeof data.students, Array.isArray(data.students)); // Debug log
      
      // Ensure students is always an array
      const studentsArray = Array.isArray(data.students) ? data.students : [];
      setStudents(studentsArray);
      setTotal(data.total ?? 0);
    } catch (error) {
      console.error('Failed to load students:', error);
      toast.error('Failed to load students');
      setStudents([]);
      setTotal(0);
    }
  }, [page, limit, searchQuery, filters]);
  
  async function handleDelete(studentId: string) {
    if (!confirm('Are you sure you want to delete this student?')) return;
    try {
      const res = await fetch(`/api/admin/students/${studentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete student');
      toast.success('Student deleted successfully');
      fetchStudents(); // Refresh the table
    } catch (error) {
      console.error('Failed to delete student:', error);
      toast.error('Failed to delete student');
    }
  }

  async function handleEdit(student: ScanningStudent) {
    try {
      const res = await fetch(`/api/admin/students/${student.id}`);
      if (!res.ok) throw new Error('Failed to fetch student details');
      const data = await res.json();
      setEditingStudent(data.student);
    } catch (error) {
      console.error('Failed to fetch student details:', error);
      toast.error('Failed to fetch student details');
    }
  }
  
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    setPage(1); // Reset to first page when search or filters change
  }, [searchQuery, filters]);

  // Ensure students is always an array for safety
  const safeStudents = Array.isArray(students) ? students : [];

  return (
    <div className="space-y-4">
      {/* Mobile Card View */}
      <div className="block sm:hidden space-y-3">
        {safeStudents.length > 0 ? (
          safeStudents.map((student) => (
            <div key={student.id} className="rounded-lg border bg-white dark:bg-gray-800 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {student.fullName}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      {student.studentId}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{student.email}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{getProgramName(student.program)}</span>
                    <span>Year {student.year}</span>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewingQRStudent(student)}>
                      <QrCode className="mr-2 h-4 w-4" />
                      View QR Code
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEdit(student)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(student.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            {students === undefined ? 'Loading...' : 'No students found'}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block">
        <div className="rounded-lg border bg-white dark:bg-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Student ID</TableHead>
                  <TableHead className="min-w-[160px]">Name</TableHead>
                  <TableHead className="min-w-[240px]">Email</TableHead>
                  <TableHead className="min-w-[140px]">Program</TableHead>
                  <TableHead className="min-w-[60px]">Year</TableHead>
                  <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safeStudents.length > 0 ? (
                  safeStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-yellow-50/40 dark:hover:bg-yellow-900/20">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">{student.studentId}</TableCell>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {student.fullName}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400 max-w-[260px] truncate">{student.email}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{getProgramName(student.program)}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{student.year}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingQRStudent(student)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              View QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(student)}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(student.id)}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      {students === undefined ? 'Loading...' : 'No students found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {Math.min(safeStudents.length, total)} of {total} students
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => (total > prev * limit ? prev + 1 : prev))}
            disabled={total <= page * limit}
          >
            Next
          </Button>
        </div>
      </div>
      <EditStudentModal
        student={editingStudent}
        isOpen={!!editingStudent}
        onClose={() => setEditingStudent(null)}
        onUpdate={() => {
          toast.success('Student updated successfully');
          fetchStudents(); // Refresh the table data
        }}
      />
      
      {/* QR Code Modal */}
      <Dialog open={!!viewingQRStudent} onOpenChange={() => setViewingQRStudent(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code - {viewingQRStudent ? viewingQRStudent.fullName : ''}
            </DialogTitle>
          </DialogHeader>
          {viewingQRStudent && (
            <div className="mt-4">
              <QRCodeDisplay studentId={viewingQRStudent.id} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StudentsTable; 