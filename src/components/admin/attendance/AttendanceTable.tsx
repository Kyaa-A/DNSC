'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { utcToEventTimezone } from '@/lib/utils/format';

export interface AttendeeRow {
  id: string;
  name: string | null;
  email: string | null;
  studentId: string | null;
  programSection: string | null;
  status: 'present' | 'checked-in' | 'checked-out' | 'absent' | string;
  checkInAt: string | null;
  checkOutAt: string | null;
  sessionName: string | null;
}

interface AttendanceTableProps {
  loading?: boolean;
  rows?: AttendeeRow[];
  className?: string;
  eventTimeZone?: string;
}

function CellText({ value, title, className }: { value: string | null; title?: string | null; className?: string }) {
  const display = value && value.trim() !== '' ? value : '—';
  const cellTitle = title ?? (value && value.trim() !== '' ? value : undefined);
  return <span className={className} title={cellTitle}>{display}</span>;
}

type SortKey = 'name' | 'status' | 'checkInAt';

const parseNumberParam = (key: string, fallback: number) => {
  if (typeof window === 'undefined') return fallback;
  const v = Number(new URLSearchParams(window.location.search).get(key));
  return Number.isFinite(v) && v > 0 ? v : fallback;
};

const parseStringParam = (key: string, allowed: string[], fallback: string) => {
  if (typeof window === 'undefined') return fallback;
  const v = new URLSearchParams(window.location.search).get(key) || '';
  return allowed.includes(v) ? v : fallback;
};

const writeParam = (key: string, value: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  window.history.pushState({}, '', url.toString());
};

export function AttendanceTable({ loading, rows = [], className, eventTimeZone }: AttendanceTableProps) {
  const initialPage = useMemo(() => parseNumberParam('page', 1), []);
  const initialPageSize = useMemo(() => parseNumberParam('pageSize', 50), []);
  const initialSort = useMemo<SortKey>(() => parseStringParam('sort', ['name', 'status', 'checkInAt'], 'name') as SortKey, []);
  const initialOrder = useMemo<'asc' | 'desc'>(() => parseStringParam('order', ['asc', 'desc'], 'asc') as 'asc' | 'desc', []);

  const [page, setPage] = useState<number>(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [order, setOrder] = useState<'asc' | 'desc'>(initialOrder);

  // Sync with back/forward
  useEffect(() => {
    const onPop = () => {
      setPage(parseNumberParam('page', 1));
      setPageSize(parseNumberParam('pageSize', 50));
      setSort(parseStringParam('sort', ['name', 'status', 'checkInAt'], 'name') as SortKey);
      setOrder(parseStringParam('order', ['asc', 'desc'], 'asc') as 'asc' | 'desc');
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Write to URL when params change
  useEffect(() => { writeParam('page', String(page)); }, [page]);
  useEffect(() => { writeParam('pageSize', String(pageSize)); }, [pageSize]);
  useEffect(() => { writeParam('sort', sort); }, [sort]);
  useEffect(() => { writeParam('order', order); }, [order]);

  const toggleSort = useCallback((key: SortKey) => {
    setSort((current) => {
      if (current === key) {
        setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        return current;
      }
      setOrder('asc');
      return key;
    });
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Attendees</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>Prev</Button>
              <div className="text-xs text-muted-foreground px-2">Page {page}</div>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-muted-foreground py-6 text-center">No attendees match the current filters.</div>
        ) : (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px] cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    Name{sort === 'name' ? (order === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  <TableHead className="min-w-[220px]">Email</TableHead>
                  <TableHead className="min-w-[140px]">Student/ID</TableHead>
                  <TableHead className="min-w-[180px]">Program/Section</TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    Status{sort === 'status' ? (order === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  <TableHead className="min-w-[160px] cursor-pointer select-none" onClick={() => toggleSort('checkInAt')}>
                    Check-in{sort === 'checkInAt' ? (order === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  <TableHead className="min-w-[160px]">Check-out</TableHead>
                  <TableHead className="min-w-[180px]">Session</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <CellText value={r.name} className="max-w-[220px] truncate" />
                    </TableCell>
                    <TableCell>
                      <CellText value={r.email} className="max-w-[240px] truncate" />
                    </TableCell>
                    <TableCell>
                      <CellText value={r.studentId} className="max-w-[160px] truncate" />
                    </TableCell>
                    <TableCell>
                      <CellText value={r.programSection} className="max-w-[220px] truncate" />
                    </TableCell>
                    <TableCell>
                      <CellText value={r.status} className="uppercase tracking-wide text-xs" />
                    </TableCell>
                    <TableCell>
                      <CellText value={utcToEventTimezone(r.checkInAt, eventTimeZone ?? 'UTC') ?? r.checkInAt} />
                    </TableCell>
                    <TableCell>
                      <CellText value={utcToEventTimezone(r.checkOutAt, eventTimeZone ?? 'UTC') ?? r.checkOutAt} />
                    </TableCell>
                    <TableCell>
                      <CellText value={r.sessionName} className="max-w-[220px] truncate" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AttendanceTable;


