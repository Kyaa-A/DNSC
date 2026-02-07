import { Metadata } from 'next';
import { Suspense } from 'react';
import { SessionSelector } from '@/components/organizer/SessionSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Users, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'My Sessions | DNSC Attendance Organizer',
  description: 'View and manage your assigned attendance sessions',
};

export default function OrganizerSessionsPage() {
  return (
    <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">My Sessions</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage your assigned attendance sessions
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Organizer Portal</span>
          <span className="sm:hidden">Portal</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Active Sessions</CardTitle>
              <Clock className="h-4 w-4 text-green-600 dark:text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-500">0</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Currently running
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-500">0</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Scheduled for later
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-gray-100">Total Scanned</CardTitle>
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-500">0</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Students scanned today
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Session Selector */}
        <Suspense fallback={
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-gray-100">Loading Sessions...</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">Please wait while we load your assigned sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-md w-3/4"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <SessionSelector />
        </Suspense>

      {/* Help Section */}
      <div className="mt-8">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Need Help?</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Here are some quick tips for using the session management system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Active Sessions</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Click on any active session to start scanning QR codes. Make sure you have camera permissions enabled.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Session Status</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sessions are color-coded: Green for active time-in, Orange for active time-out, Blue for upcoming.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Time Windows</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Students can only scan during the configured time windows. Check the session details for exact times.
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Support</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If you encounter any issues, contact your administrator or check the system status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
