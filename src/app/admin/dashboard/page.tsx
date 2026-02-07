/**
 * Admin Dashboard Page
 *
 * Displays key metrics and an overview of recent activity.
 * Content varies based on user role (Admin vs Organizer).
 */
import React from 'react'
import { AlertTriangle, Shield, UserPlus, BarChart3 } from 'lucide-react'
import { countStudents } from '@/lib/db/queries/students'
import { getPrograms } from '@/lib/db/queries/programs'
import { countStudentsByProgram, countStudentsByRegistrationSource } from '@/lib/db/queries/analytics'
import {
  MetricsGrid,
  type MetricData,
} from '@/components/admin/dashboard/MetricsGrid';
import SimplifiedActivityContainer from '@/components/admin/dashboard/SimplifiedActivityContainer';
import AnalyticsCharts from '@/components/admin/dashboard/AnalyticsCharts';
import { AdminOnly, OrganizerOrAdmin, PermissionGuard } from '@/components/auth/RoleGuard';
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export default async function DashboardPage() {
  let metrics: MetricData[] = [];
  let dbError: string | null = null;
  const isLoading = false;

  try {
    // Fetch all dashboard data in parallel
    const [
      totalStudents,
      programs,
      studentsByProgram,
      studentsBySource,
    ] = await Promise.all([
      countStudents({}),
      getPrograms(),
      countStudentsByProgram(),
      countStudentsByRegistrationSource(),
    ]);

    // Calculate derived metrics
    const totalPrograms = programs.length;
    const publicRegistrations =
      studentsBySource.find(s => s.source === 'public')?.count || 0;
    const adminRegistrations =
      studentsBySource.find(s => s.source === 'admin')?.count || 0;

    // Estimate QR codes generated (assuming each student gets one)
    const qrCodesGenerated = totalStudents;

    // Build metrics array with enhanced data
    metrics = [
      {
        id: 'total-students',
        title: 'Total Students',
        value: totalStudents,
        previousValue: Math.max(0, totalStudents - publicRegistrations), // Approximation
        percentageChange:
          totalStudents > 0
            ? (publicRegistrations / totalStudents) * 100
            : 0,
        trend: publicRegistrations > 0 ? 'up' : 'neutral',
        iconName: 'users',
        description: 'Total registered students across all programs',
        period: 'vs last period',
      },
      {
        id: 'new-registrations',
        title: 'New Registrations',
        value: publicRegistrations + adminRegistrations,
        previousValue: 0, // Would need historical data
        percentageChange: publicRegistrations > 0 ? 100 : 0, // Placeholder
        trend: publicRegistrations > 0 ? 'up' : 'neutral',
        iconName: 'user-plus',
        description: `${publicRegistrations} public, ${adminRegistrations} admin registrations`,
        period: 'this period',
      },
      {
        id: 'qr-generated',
        title: 'QR Codes Generated',
        value: qrCodesGenerated,
        previousValue: Math.max(0, qrCodesGenerated - 10), // Approximation
        percentageChange: qrCodesGenerated > 0 ? 15 : 0, // Placeholder
        trend: qrCodesGenerated > 0 ? 'up' : 'neutral',
        iconName: 'qr-code',
        description: 'QR codes generated for student identification',
        period: 'vs last period',
      },
      {
        id: 'active-programs',
        title: 'Active Programs',
        value: totalPrograms,
        previousValue: totalPrograms, // Programs don't change frequently
        percentageChange: 0,
        trend: 'neutral',
        iconName: 'bar-chart-3',
        description: `${studentsByProgram.length} programs with enrolled students`,
        period: 'total available',
      },
    ];
  } catch (error) {
    console.error('Dashboard data fetch error:', error);
    dbError = 'Database not connected or unreachable';
  }

  return (
    <div className="min-h-screen w-full">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        <div className="space-y-5 p-4 pb-24">
          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight dark:text-gray-100">Dashboard</h1>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Overview of metrics and activity
            </p>
          </div>

          {/* Database Error Alert */}
          {dbError && (
            <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-3 text-yellow-800 dark:text-yellow-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Limited data: {dbError}</p>
                <p className="text-xs opacity-80">
                  Live metrics will appear when database is available.
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Metrics Grid */}
          <MetricsGrid
            metrics={metrics}
            isLoading={isLoading}
            error={dbError}
            columns={{
              sm: 1,
              md: 2,
            }}
          />

          {/* Analytics Section - Mobile */}
          <AnalyticsCharts />
        </div>

        {/* Floating Recent Activity button (mobile only) */}
        <div className="fixed bottom-20 right-4 z-40 sm:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button aria-label="Open recent activity" className="h-12 w-12 rounded-full p-0 bg-primary-600 text-white hover:bg-primary-700 shadow-lg">
                <BarChart3 className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] p-0 overflow-y-auto">
              <SheetTitle className="sr-only">Recent Activity</SheetTitle>
              <div className="p-4">
                <div className="text-sm font-semibold mb-3">Recent Activity</div>
                <div className="bg-white rounded-lg border shadow-sm">
                  <SimplifiedActivityContainer />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden">
        <main className="flex-1 h-screen overflow-hidden">
          <div className="h-full overflow-y-auto pr-0">
            <div className="space-y-6 p-4 sm:p-6 xl:p-8">
              {/* Header */}
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight dark:text-gray-100">Dashboard</h1>
                <p className="text-muted-foreground dark:text-gray-400">
                  Overview of student registration system metrics and activity
                </p>
              </div>

              {/* Database Error Alert */}
              {dbError && (
                <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-700 p-4 text-yellow-800 dark:text-yellow-300">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">Limited data: {dbError}</p>
                    <p className="text-sm opacity-80">
                      Once the database is available, live metrics will appear
                      automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Enhanced Metrics Grid */}
              <MetricsGrid
                metrics={metrics}
                isLoading={isLoading}
                error={dbError}
                className="mb-8"
                columns={{
                  md: 2,
                  lg: 4,
                }}
              />

              {/* Role-Based Sections */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Admin-Only Quick Actions */}
                <AdminOnly showError={false}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Admin Controls</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Administrative functions</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Manage user roles and permissions
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Access system settings and configuration
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • View detailed user activity logs
                      </div>
                    </div>
                  </div>
                </AdminOnly>

                {/* Organizer-Accessible Section */}
                <OrganizerOrAdmin showError={false}>
                  <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                        <UserPlus className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Registration Tools</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Student management access</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Register new students
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • Generate QR codes for attendance
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        • View registration analytics
                      </div>
                    </div>
                  </div>
                </OrganizerOrAdmin>
              </div>

              {/* Analytics Section - Permission-Based */}
              <PermissionGuard permission="canViewAnalytics" showError={false}>
                <AnalyticsCharts />
              </PermissionGuard>
            </div>
          </div>
        </main>

        {/* Right Sidebar for Activity Feed - Desktop */}
        <aside className="w-80 max-w-[22rem] border-l bg-background h-screen sticky top-0 overflow-y-auto">
          <SimplifiedActivityContainer />
        </aside>
      </div>
    </div>
  );
} 