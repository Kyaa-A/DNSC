'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  Download, 
  Search, 
  RefreshCw,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  Activity
} from 'lucide-react';

import { toast } from 'sonner';

interface Session {
  id: string;
  name: string;
  description?: string;
  eventId: string;
  event: {
    id: string;
    name: string;
    location?: string;
    startDate: string;
    endDate: string;
  };
  timeInStart: string;
  timeInEnd: string;
  timeOutStart?: string;
  timeOutEnd?: string;
  isActive: boolean;
  _count: {
    attendance: number;
  };
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  eventId: string;
  organizerId: string;
  scanType: 'TIME_IN' | 'TIME_OUT';
  timestamp: Date;
  location?: string;
  metadata: {
    qrData: string;
    deviceInfo: string;
    userAgent: string;
  };
  student?: {
    studentIdNumber: string;
    firstName: string;
    lastName: string;
  };
  session?: {
    name: string;
  };
  event?: {
    name: string;
  };
}

interface SessionStats {
  totalScans: number;
  timeInScans: number;
  timeOutScans: number;
  uniqueStudents: number;
  averageScansPerStudent: number;
}

interface SessionManagerProps {
  sessionId?: string;
  className?: string;
}

export function SessionManager({ sessionId, className }: SessionManagerProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanTypeFilter, setScanTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const pageSize = 20;

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch('/api/organizer/sessions');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessions(data.sessions);
          if (sessionId && !selectedSession) {
            const session = data.sessions.find((s: Session) => s.id === sessionId);
            if (session) {
              setSelectedSession(session);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  }, [sessionId, selectedSession]);

  // Fetch attendance records for selected session
  const fetchAttendanceRecords = useCallback(async (sessionId: string, page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        sessionId,
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
      });

      const response = await fetch(`/api/organizer/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAttendanceRecords(data.attendance || []);
          setTotalPages(Math.ceil((data.total || 0) / pageSize));
          setCurrentPage(page);
        }
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
      setError('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Calculate session stats
  const calculateSessionStats = useCallback((records: AttendanceRecord[]): SessionStats => {
    const totalScans = records.length;
    const timeInScans = records.filter(r => r.scanType === 'TIME_IN').length;
    const timeOutScans = records.filter(r => r.scanType === 'TIME_OUT').length;
    const uniqueStudents = new Set(records.map(r => r.studentId)).size;
    const averageScansPerStudent = uniqueStudents > 0 ? totalScans / uniqueStudents : 0;

    return {
      totalScans,
      timeInScans,
      timeOutScans,
      uniqueStudents,
      averageScansPerStudent,
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Fetch attendance when session is selected
  useEffect(() => {
    if (selectedSession) {
      fetchAttendanceRecords(selectedSession.id);
    }
  }, [selectedSession, fetchAttendanceRecords]);

  // Calculate stats when attendance records change
  useEffect(() => {
    if (attendanceRecords.length > 0) {
      setSessionStats(calculateSessionStats(attendanceRecords));
    }
  }, [attendanceRecords, calculateSessionStats]);

  // Filter attendance records
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      // Scan type filter
      if (scanTypeFilter !== 'all' && record.scanType !== scanTypeFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          record.student?.studentIdNumber.toLowerCase().includes(query) ||
          record.student?.firstName.toLowerCase().includes(query) ||
          record.student?.lastName.toLowerCase().includes(query) ||
          record.session?.name.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [attendanceRecords, scanTypeFilter, searchQuery]);

  // Format time
  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Export attendance data to CSV
  const exportToCSV = useCallback(() => {
    if (!selectedSession || filteredRecords.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = [
      'Student ID',
      'Student Name',
      'Scan Type',
      'Timestamp',
      'Date',
      'Time',
      'Session',
      'Event'
    ];

    const csvData = filteredRecords.map(record => [
      record.student?.studentIdNumber || '',
      `${record.student?.firstName || ''} ${record.student?.lastName || ''}`.trim(),
      record.scanType,
      record.timestamp.toISOString(),
      formatDate(record.timestamp),
      formatTime(record.timestamp),
      record.session?.name || '',
      record.event?.name || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-${selectedSession.name}-${formatDate(new Date())}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Attendance data exported successfully');
  }, [selectedSession, filteredRecords]);

  // Refresh data
  const refreshData = useCallback(() => {
    setLastRefresh(new Date());
    if (selectedSession) {
      fetchAttendanceRecords(selectedSession.id, currentPage);
    }
    fetchSessions();
  }, [selectedSession, currentPage, fetchAttendanceRecords, fetchSessions]);

  if (loading && !selectedSession) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Session Management</h1>
            <p className="text-muted-foreground">View and manage session attendance data</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3" />
              <span>Updated {lastRefresh.toLocaleTimeString()}</span>
            </div>
            <Button variant="outline" size="sm" onClick={refreshData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Session Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Select Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select 
              value={selectedSession?.id || ''} 
              onValueChange={(value) => {
                const session = sessions.find(s => s.id === value);
                setSelectedSession(session || null);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a session to manage" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    <div className="flex items-center gap-2">
                      <span>{session.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {session._count.attendance} scans
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedSession && (
          <>
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-600" />
                  Session Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Session Name</p>
                    <p className="text-lg font-semibold">{selectedSession.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Event</p>
                    <p className="text-lg font-semibold">{selectedSession.event.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="text-lg font-semibold">{selectedSession.event.location || 'Not specified'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge className={selectedSession.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {selectedSession.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {sessionStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-500">Total Scans</p>
                        <p className="text-2xl font-bold text-blue-600">{sessionStats.totalScans}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-500">Time-In</p>
                        <p className="text-2xl font-bold text-green-600">{sessionStats.timeInScans}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-sm text-gray-500">Time-Out</p>
                        <p className="text-2xl font-bold text-orange-600">{sessionStats.timeOutScans}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-500">Unique Students</p>
                        <p className="text-2xl font-bold text-purple-600">{sessionStats.uniqueStudents}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-indigo-600" />
                      <div>
                        <p className="text-sm text-gray-500">Avg per Student</p>
                        <p className="text-2xl font-bold text-indigo-600">{sessionStats.averageScansPerStudent.toFixed(1)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Attendance Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-purple-600" />
                    Attendance Records
                  </CardTitle>
                  <Button onClick={exportToCSV} disabled={filteredRecords.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by student ID or name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={scanTypeFilter} onValueChange={setScanTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Filter by scan type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scans</SelectItem>
                      <SelectItem value="TIME_IN">Time-In Only</SelectItem>
                      <SelectItem value="TIME_OUT">Time-Out Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Attendance Table */}
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Scan Type</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Session</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            {searchQuery || scanTypeFilter !== 'all' 
                              ? 'No records match your search criteria'
                              : 'No attendance records found for this session'
                            }
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="font-mono text-sm">
                              {record.student?.studentIdNumber || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {record.student ? 
                                `${record.student.firstName} ${record.student.lastName}` : 
                                'Unknown Student'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  record.scanType === 'TIME_IN' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-orange-100 text-orange-800'
                                }
                              >
                                {record.scanType === 'TIME_IN' ? 'Time-In' : 'Time-Out'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <div>{formatDate(record.timestamp)}</div>
                                <div className="text-gray-500">{formatTime(record.timestamp)}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {record.session?.name || 'Unknown Session'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} records
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAttendanceRecords(selectedSession.id, currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchAttendanceRecords(selectedSession.id, currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {!selectedSession && sessions.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Sessions Available</h3>
              <p className="text-muted-foreground mb-4">
                You don&apos;t have any sessions assigned to you yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
