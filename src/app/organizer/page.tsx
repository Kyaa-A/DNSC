'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Users, 
  Calendar, 
  Clock, 
  Settings,
  Scan,
  UserCheck,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default function OrganizerDashboard() {
  // Mock data - would be replaced with actual API calls
  const stats = {
    totalScans: 156,
    todayScans: 23,
    activeEvents: 2,
    upcomingSessions: 5
  };

  const recentActivity = [
    {
      id: 1,
      action: 'Student Check-in',
      student: 'John Doe',
      time: '2 minutes ago',
      event: 'DTP Workshop 2025'
    },
    {
      id: 2,
      action: 'Student Check-out',
      student: 'Jane Smith',
      time: '5 minutes ago',
      event: 'DTP Workshop 2025'
    },
    {
      id: 3,
      action: 'Session Started',
      student: 'System',
      time: '1 hour ago',
      event: 'DTP Workshop 2025'
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Organizer Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage attendance and monitor event sessions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-green-100 text-green-800">
            <UserCheck className="mr-1 h-3 w-3" />
            Active
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Scan className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">
              All time attendance records
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayScans}</div>
            <p className="text-xs text-muted-foreground">
              Scans recorded today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground">
              Currently running events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
            <p className="text-xs text-muted-foreground">
              Sessions scheduled soon
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <QrCode className="mr-2 h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Common tasks and navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                <Button asChild className="h-20 flex-col space-y-2">
                  <Link href="/organizer/scan" className="flex flex-col items-center space-y-2">
                    <Scan className="h-6 w-6" />
                    <span>Start Scanning</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                  <Link href="/organizer/scan/manual" className="flex flex-col items-center space-y-2">
                    <Users className="h-6 w-6" />
                    <span>Manual Entry</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                  <Link href="/organizer/sessions" className="flex flex-col items-center space-y-2">
                    <Calendar className="h-6 w-6" />
                    <span>View Sessions</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col space-y-2">
                  <Link href="/organizer/settings" className="flex flex-col items-center space-y-2">
                    <Settings className="h-6 w-6" />
                    <span>Settings</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest attendance actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.student} • {activity.event}
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Session */}
          <Card>
            <CardHeader>
              <CardTitle>Current Session</CardTitle>
              <CardDescription>
                Active scanning session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-3">
                <div className="h-16 w-16 mx-auto bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <QrCode className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold">DTP Workshop 2025</h3>
                  <p className="text-sm text-muted-foreground">Session 1</p>
                </div>
                <Button asChild className="w-full">
                  <Link href="/organizer/scan" className="flex items-center justify-center">
                    <Scan className="mr-2 h-4 w-4" />
                    Continue Scanning
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Session Stats</CardTitle>
              <CardDescription>
                Current session metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Checked In</span>
                <span className="font-medium">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Checked Out</span>
                <span className="font-medium">18</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Present</span>
                <span className="font-medium">5</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
