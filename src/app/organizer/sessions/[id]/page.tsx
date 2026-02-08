'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  QrCode,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

interface SessionDetails {
  id: string;
  name: string;
  date: string;
  status: 'active' | 'upcoming' | 'completed';
  timeInStart: string | null;
  timeInEnd: string | null;
  timeOutStart: string | null;
  timeOutEnd: string | null;
  event: {
    id: string;
    name: string;
  };
  attendanceCount: number;
  expectedAttendance: number;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/organizer/sessions/${sessionId}`);
        
        if (!res.ok) {
          if (res.status === 404) {
            setError('Session not found');
          } else {
            setError('Failed to load session details');
          }
          return;
        }
        
        const data = await res.json();
        setSession(data.session);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-gray-600 dark:text-gray-400">Loading session details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {error || 'Session not found'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
              The session you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Button onClick={() => router.push('/organizer/sessions')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sessions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Upcoming</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'Not set';
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => router.push('/organizer/sessions')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {session.name}
              </h1>
              {getStatusBadge(session.status)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {session.event.name}
            </p>
          </div>
        </div>
        
        {session.status === 'active' && (
          <Link href={`/organizer/scan?sessionId=${session.id}`}>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white">
              <QrCode className="h-4 w-4 mr-2" />
              Start Scanning
            </Button>
          </Link>
        )}
      </div>

      {/* Session Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatDate(session.date)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              Time-In Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatTime(session.timeInStart)} - {formatTime(session.timeInEnd)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              Time-Out Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {formatTime(session.timeOutStart)} - {formatTime(session.timeOutEnd)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {session.attendanceCount} / {session.expectedAttendance || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Summary */}
      <Card className="bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Attendance Summary</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Overview of attendance records for this session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {session.attendanceCount}
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">Checked In</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  0
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-500">Checked Out</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <XCircle className="h-8 w-8 text-gray-500" />
              <div>
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-400">
                  {Math.max(0, (session.expectedAttendance || 0) - session.attendanceCount)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-500">Not Yet Scanned</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
