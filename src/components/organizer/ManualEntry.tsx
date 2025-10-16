'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  User, 
  Search, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  QrCode,
  Keyboard,
  GraduationCap,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

// Enhanced form validation schema
const manualEntrySchema = z.object({
  studentId: z.string()
    .min(1, 'Student ID is required')
    .regex(/^S\d{3}-\d{4}-\d{3}$/, 'Student ID must be in format S000-0000-000'),
  scanType: z.enum(['TIME_IN', 'TIME_OUT']),
});

type ManualEntryFormData = z.infer<typeof manualEntrySchema>;

interface Student {
  id: string;
  studentIdNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  year: number;
  program: {
    id: string;
    name: string;
  };
}

interface ManualEntryProps {
  sessionId: string;
  eventId: string;
  sessionName: string;
  eventName: string;
  onAttendanceRecorded?: (attendanceData: Record<string, unknown>) => void;
  onError?: (error: string) => void;
  onBackToQR?: () => void;
  className?: string;
}

export function ManualEntry({
  sessionId,
  eventId,
  sessionName,
  eventName,
  onAttendanceRecorded,
  onError,
  onBackToQR,
  className = '',
}: ManualEntryProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validatedStudent, setValidatedStudent] = useState<Student | null>(null);
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentEntries, setRecentEntries] = useState<Array<{student: Student, timestamp: Date, scanType: string}>>([]);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    clearErrors,
    reset,
  } = useForm<ManualEntryFormData>({
    resolver: zodResolver(manualEntrySchema),
    mode: 'onChange',
    defaultValues: {
      scanType: 'TIME_IN',
    },
  });

  const studentIdValue = watch('studentId');
  const scanTypeValue = watch('scanType');

  // Real-time validation as user types
  useEffect(() => {
    if (studentIdValue && studentIdValue.length >= 13) {
      const formatValidation = validateStudentIdFormat(studentIdValue);
      if (formatValidation.isValid) {
        clearErrors('studentId');
        handleStudentIdValidation(studentIdValue);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentIdValue, clearErrors]);

  // Validate student ID format
  const validateStudentIdFormat = (studentId: string) => {
    const format = /^S\d{3}-\d{4}-\d{3}$/;
    return {
      isValid: format.test(studentId),
      error: format.test(studentId) ? null : 'Student ID must be in format S000-0000-000',
    };
  };

  // Handle student ID validation
  const handleStudentIdValidation = useCallback(async (studentId: string) => {
    if (!studentId || studentId.length < 13) return;

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/public/check-duplicate?studentId=${encodeURIComponent(studentId)}`);
      const data = await response.json();

      if (data.success && data.student) {
        setValidatedStudent(data.student);
        setError(null);
      } else {
        setValidatedStudent(null);
        setError(data.message || 'Student not found');
      }
    } catch (err) {
      console.error('Error validating student:', err);
      setValidatedStudent(null);
      setError('Failed to validate student');
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Search students
  const searchStudents = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(`/api/public/students/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.students || []);
        setShowSearchResults(true);
      }
    } catch (err) {
      console.error('Error searching students:', err);
      setSearchResults([]);
    }
  }, []);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    searchStudents(value);
  };

  // Select student from search results
  const selectStudent = (student: Student) => {
    setValue('studentId', student.studentIdNumber);
    setValidatedStudent(student);
    setSearchResults([]);
    setShowSearchResults(false);
    setSearchQuery('');
    setError(null);
  };

  // Form submission
  const onSubmit = async (data: ManualEntryFormData) => {
    console.log('🚨 FORM SUBMISSION DEBUG:', {
      originalScanType: data.scanType,
      convertedScanType: data.scanType === 'TIME_IN' ? 'time_in' : 'time_out',
      studentId: validatedStudent?.id,
      sessionId,
      eventId
    });

    if (!validatedStudent) {
      setError('Please validate the student ID first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔍 Sending attendance request:', {
        studentId: validatedStudent.id,
        sessionId,
        eventId,
        scanType: data.scanType === 'TIME_IN' ? 'time_in' : 'time_out',
        originalScanType: data.scanType
      });

      const response = await fetch('/api/organizer/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: validatedStudent.id,
          sessionId,
          eventId,
          scanType: data.scanType === 'TIME_IN' ? 'time_in' : 'time_out',
          scannedBy: 'organizer',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to record attendance');
      }

      const result = await response.json();

      // Add to recent entries
      setRecentEntries(prev => [
        { student: validatedStudent, timestamp: new Date(), scanType: data.scanType },
        ...prev.slice(0, 4) // Keep only last 5 entries
      ]);

      // Reset form
      reset();
      setValidatedStudent(null);

      if (onAttendanceRecorded) {
        onAttendanceRecorded({
          ...validatedStudent,
          attendanceId: result.attendanceId,
          recordedAt: new Date().toISOString(),
          scanType: data.scanType,
        });
      }

      toast.success('Attendance Recorded', {
        description: `${validatedStudent.firstName} ${validatedStudent.lastName} has been marked ${data.scanType === 'TIME_IN' ? 'present' : 'absent'}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record attendance';
      setError(errorMessage);
      toast.error('Attendance Recording Failed', {
        description: errorMessage,
      });
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-medium mb-3">
          <Keyboard className="size-3.5" />
          <span>Manual Entry</span>
        </div>
        
        <h2 className="text-2xl font-semibold text-foreground mb-2">Manual Student Entry</h2>
        
        <p className="text-sm text-muted-foreground">
          Enter student information manually when QR scanning is not available
        </p>
      </div>

      {/* Session Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Session Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Event</p>
              <p className="text-lg font-semibold text-foreground">{eventName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Session</p>
              <p className="text-lg font-semibold text-foreground">{sessionName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Recent Manual Entries
            </CardTitle>
            <CardDescription>
              Last 5 manual entries for this session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentEntries.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium text-foreground">
                        {entry.student.firstName} {entry.student.lastName}
                      </p>
                      <p className="text-sm text-gray-500 font-mono">
                        {entry.student.studentIdNumber}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      className={
                        entry.scanType === 'TIME_IN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }
                    >
                      {entry.scanType === 'TIME_IN' ? 'Time-In' : 'Time-Out'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Enter Student Information
          </CardTitle>
          <CardDescription>
            Enter the student ID and select the scan type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Student ID Input */}
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <div className="relative">
                <Input
                  id="studentId"
                  type="text"
                  placeholder="S000-0000-000"
                  {...register('studentId')}
                  className={`pr-10 ${errors.studentId ? 'border-red-500' : ''}`}
                  disabled={isValidating || isProcessing}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                )}
                {validatedStudent && !isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
              {errors.studentId && (
                <p className="text-red-500 text-sm">{errors.studentId.message}</p>
              )}
            </div>

            {/* Scan Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="scanType">Scan Type</Label>
              <Select 
                value={scanTypeValue} 
                onValueChange={(value) => {
                  console.log('🔍 Scan type changed to:', value);
                  setValue('scanType', value as 'TIME_IN' | 'TIME_OUT');
                }}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select scan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIME_IN">Time-In (Present)</SelectItem>
                  <SelectItem value="TIME_OUT">Time-Out (Absent)</SelectItem>
                </SelectContent>
              </Select>
              {errors.scanType && (
                <p className="text-red-500 text-sm">{errors.scanType.message}</p>
              )}
              {/* Debug info */}
              <div className="text-xs text-gray-500">
                Current scan type: {scanTypeValue} → {scanTypeValue === 'TIME_IN' ? 'time_in' : 'time_out'}
              </div>
            </div>

            {/* Student Validation Result */}
            {validatedStudent && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-800">
                          {validatedStudent.firstName} {validatedStudent.lastName}
                        </span>
                      </div>
                      
                      <div className="space-y-1 text-sm text-green-700">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">ID:</span>
                          <span className="font-mono">{validatedStudent.studentIdNumber}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3 w-3" />
                          <span>{validatedStudent.program.name} - Year {validatedStudent.year}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Email:</span>
                          <span>{validatedStudent.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="submit"
                disabled={!validatedStudent || isProcessing || !isValid}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Recording Attendance...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Record Attendance
                  </>
                )}
              </Button>

              {onBackToQR && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBackToQR}
                  className="flex-1 h-12"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Back to QR Scanner
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Student Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-purple-600" />
            Search Students
          </CardTitle>
          <CardDescription>
            Search for students by name or ID if you&apos;re unsure of the exact format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => selectStudent(student)}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium text-foreground">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500 font-mono">
                          {student.studentIdNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{student.program.name}</p>
                      <p className="text-xs text-gray-500">Year {student.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No students found matching &quot;{searchQuery}&quot;
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
