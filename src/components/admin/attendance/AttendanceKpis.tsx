'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface AttendanceKpisData {
  registered: number;
  present: number;
  checkedInOnly: number;
  checkedOut: number;
  absent: number;
  attendanceRatePercent: number; // 0-100
}

interface AttendanceKpisProps {
  loading?: boolean;
  data?: AttendanceKpisData;
  perSessionAggregates?: Array<{
    sessionId: string;
    sessionName: string;
    present: number;
    checkedInOnly: number;
    checkedOut: number;
    absent: number;
  }>;
  className?: string;
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          <span className="inline-block h-4 w-24 bg-gray-200 rounded animate-pulse" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-7 w-16 bg-gray-200 rounded animate-pulse" />
        <p className="mt-1 h-3 w-28 bg-gray-200 rounded animate-pulse" />
      </CardContent>
    </Card>
  );
}

export function AttendanceKpis({ loading, data, perSessionAggregates, className }: AttendanceKpisProps) {
  if (loading) {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
          <KpiSkeleton />
        </div>
      </div>
    );
  }

  const registered = data?.registered ?? 0;
  const present = data?.present ?? 0;
  const checkedInOnly = data?.checkedInOnly ?? 0;
  const checkedOut = data?.checkedOut ?? 0;
  
  // Calculate absent as registered minus those who have any attendance record
  const totalWithAttendance = present + checkedInOnly + checkedOut;
  const absent = data?.absent ?? Math.max(registered - totalWithAttendance, 0);
  
  // Cap attendance rate at 100% to prevent impossible values
  const rawAttendanceRate = registered > 0 ? (present / registered) * 100 : 0;
  const attendanceRatePercent = data?.attendanceRatePercent ?? Math.min(Math.round(rawAttendanceRate), 100);
  
  // Check for data inconsistencies
  const hasDataInconsistency = present > registered || totalWithAttendance > registered;
  const isCappedRate = rawAttendanceRate > 100;

  return (
    <div className={className}>
      {/* Data inconsistency warning */}
      {hasDataInconsistency && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Data Warning:</strong> Attendance data appears inconsistent. 
              {present > registered && ` Present count (${present}) exceeds registered count (${registered}).`}
              {isCappedRate && ` Attendance rate capped at 100%.`}
            </p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{registered}</div>
            <p className="text-xs text-muted-foreground">Total registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{present}</div>
            <p className="text-xs text-muted-foreground">Checked in and out (per rules)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Checked In Only</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedInOnly}</div>
            <p className="text-xs text-muted-foreground">Checked-in without check-out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkedOut}</div>
            <p className="text-xs text-muted-foreground">Completed check-out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{absent}</div>
            <p className="text-xs text-muted-foreground">No attendance recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceRatePercent}%</div>
            <p className="text-xs text-muted-foreground">
              Present ÷ Registered
              {isCappedRate && (
                <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                  (capped at 100%)
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Per-session aggregates */}
      <div className="mt-4">
        <SessionAggregatesList aggregates={perSessionAggregates ?? []} />
      </div>
    </div>
  );
}

export default AttendanceKpis;

interface SessionAggregatesListProps {
  aggregates: Array<{
    sessionId: string;
    sessionName: string;
    present: number;
    checkedInOnly: number;
    checkedOut: number;
    absent: number;
  }>;
}

function SessionAggregatesList({ aggregates }: SessionAggregatesListProps) {
  const [expanded, setExpanded] = React.useState(false);
  const visibleCount = 4;
  const showToggle = aggregates.length > visibleCount;
  const visible = expanded ? aggregates : aggregates.slice(0, visibleCount);

  if (aggregates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground" aria-live="polite">No session aggregates available</div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Per-session totals</h4>
        {showToggle && (
          <button
            type="button"
            className="text-xs text-blue-600 hover:underline"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-controls="session-aggregates-list"
          >
            {expanded ? 'Show less' : `Show all (${aggregates.length})`}
          </button>
        )}
      </div>
      <div id="session-aggregates-list" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {visible.map((s) => (
          <div
            key={s.sessionId}
            className="flex items-center justify-between rounded border px-3 py-2 text-sm"
            aria-label={`Session ${s.sessionName}: Present ${s.present}, In only ${s.checkedInOnly}, Out ${s.checkedOut}, Absent ${s.absent}`}
          >
            <span className="truncate mr-3" title={s.sessionName}>{s.sessionName}</span>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span title="Present">P: {s.present}</span>
              <span title="Checked in only">IN: {s.checkedInOnly}</span>
              <span title="Checked out">OUT: {s.checkedOut}</span>
              <span title="Absent">A: {s.absent}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


