'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, Filter, Download, RotateCcw } from 'lucide-react';

interface SessionOption {
  id: string;
  name: string;
}

interface AttendanceFiltersProps {
  sessions: SessionOption[];
  selectedSessionIds?: string[];
  onSelectionChange?: (sessionIds: string[]) => void;
  selectedStatus?: AttendanceStatus | null;
  onStatusChange?: (status: AttendanceStatus | null) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  eventId?: string;
  className?: string;
}

type AttendanceStatus = 'present' | 'absent' | 'checked-in-only';

const parseFromUrl = (): string[] => {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('sessions');
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
};

const parseStatusFromUrl = (): AttendanceStatus | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('status');
  if (!raw) return null;
  return ['present', 'absent', 'checked-in-only'].includes(raw) ? raw as AttendanceStatus : null;
};

const writeSessionsToUrl = (ids: string[]) => {
  const url = new URL(window.location.href);
  if (ids.length > 0) {
    url.searchParams.set('sessions', ids.join(','));
  } else {
    url.searchParams.delete('sessions');
  }
  window.history.pushState({}, '', url.toString());
};

const writeStatusToUrl = (status: AttendanceStatus | null) => {
  const url = new URL(window.location.href);
  if (status) {
    url.searchParams.set('status', status);
  } else {
    url.searchParams.delete('status');
  }
  window.history.pushState({}, '', url.toString());
};

const parseQueryFromUrl = (): string => {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('q') ?? '';
};

const writeQueryToUrl = (q: string) => {
  const url = new URL(window.location.href);
  if (q && q.trim() !== '') {
    url.searchParams.set('q', q.trim());
  } else {
    url.searchParams.delete('q');
  }
  window.history.pushState({}, '', url.toString());
};

export function AttendanceFilters({ sessions, selectedSessionIds, onSelectionChange, selectedStatus, onStatusChange, query, onQueryChange, eventId, className }: AttendanceFiltersProps) {
  const initial = useMemo(() => (selectedSessionIds && selectedSessionIds.length > 0 ? selectedSessionIds : parseFromUrl()), [selectedSessionIds]);
  const [selected, setSelected] = useState<string[]>(initial);
  const initialStatus = useMemo(() => (selectedStatus ? selectedStatus : parseStatusFromUrl()), [selectedStatus]);
  const [status, setStatus] = useState<AttendanceStatus | null>(initialStatus);
  const initialQuery = useMemo(() => (typeof query === 'string' ? query : parseQueryFromUrl()), [query]);
  const [localQuery, setLocalQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  // Keep selection in sync with URL changes (back/forward)
  useEffect(() => {
    const onPop = () => {
      const ids = parseFromUrl();
      setSelected(ids);
      onSelectionChange?.(ids);
      const sts = parseStatusFromUrl();
      setStatus(sts);
      onStatusChange?.(sts);
      const q = parseQueryFromUrl();
      setLocalQuery(q);
      onQueryChange?.(q);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep local state only; applying happens on Apply button
  useEffect(() => {
    onSelectionChange?.(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected.join(',')]);

  useEffect(() => {
    onStatusChange?.(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Debounce query typing
  useEffect(() => {
    const handle = setTimeout(() => setDebouncedQuery(localQuery), 250);
    return () => clearTimeout(handle);
  }, [localQuery]);

  // Only notify parent of local query changes; applying happens on Apply button
  useEffect(() => {
    onQueryChange?.(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const applyFilters = useCallback(() => {
    // Write all filters to URL at once
    writeSessionsToUrl(selected);
    writeStatusToUrl(status);
    writeQueryToUrl(localQuery);
    // Notify listeners (useAttendance) by dispatching popstate
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [selected, status, localQuery]);

  const buildExportUrl = useCallback((format: 'csv' | 'xlsx') => {
    const url = new URL(window.location.origin + `/api/admin/events/${eventId ?? ''}/attendance/export`);
    const sp = new URLSearchParams(window.location.search);
    // preserve known params
    ['sessions', 'status', 'q', 'sort', 'order'].forEach((k) => {
      const v = sp.get(k);
      if (v) url.searchParams.set(k, v);
    });
    if (selectedProgramIds.length > 0) url.searchParams.set('programIds', selectedProgramIds.join(','));
    if (selectedYears.length > 0) url.searchParams.set('years', selectedYears.join(','));
    url.searchParams.set('format', format);
    return url.toString();
  }, [eventId, selectedProgramIds, selectedYears]);

  const handleExport = useCallback(async (format: 'csv' | 'xlsx') => {
    try {
      setDownloading(true);
      const href = buildExportUrl(format);
      // Navigate to the export URL to let the browser handle download (more reliable for streams)
      const a = document.createElement('a');
      a.href = href;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Failed to export file');
    } finally {
      setDownloading(false);
    }
  }, [buildExportUrl]);

  // Load program list for export filters
  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        // Try admin endpoint first (richer data), then public as fallback
        const tryEndpoints = ['/api/admin/programs', '/api/public/programs'];
        for (const ep of tryEndpoints) {
          const res = await fetch(ep);
          if (!res.ok) continue;
          const data = await res.json();
          const list: Array<{ id: string; name?: string; displayName?: string; code?: string }> = Array.isArray(data?.programs)
            ? data.programs
            : (Array.isArray(data?.items) ? data.items : []);
          if (!ignore && list.length > 0) {
            const mapped = list.map((p) => ({ id: p.id, name: p.name || p.displayName || p.code || p.id }));
            setPrograms(mapped);
            return;
          }
        }
        // Final fallback to common codes if nothing returned
        if (!ignore) {
          setPrograms([
            { id: 'BSIT', name: 'BSIT' },
            { id: 'BSCPE', name: 'BSCPE' },
          ]);
        }
      } catch {
        if (!ignore) {
          setPrograms([
            { id: 'BSIT', name: 'BSIT' },
            { id: 'BSCPE', name: 'BSCPE' },
          ]);
        }
      }
    })();
    return () => { ignore = true };
  }, []);

  const clearAll = useCallback(() => {
    setSelected([]);
    setStatus(null);
    setLocalQuery('');
  }, []);

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg font-semibold">Attendance Filters</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm" 
              onClick={applyFilters}
              className="bg-primary hover:bg-primary/90"
            >
              Apply Filters
            </Button>
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('csv')} 
                disabled={downloading || !eventId}
                className="h-8 px-3"
              >
                <Download className="h-3 w-3 mr-1" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleExport('xlsx')} 
                disabled={downloading || !eventId}
                className="h-8 px-3"
              >
                <Download className="h-3 w-3 mr-1" />
                XLSX
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAll}
                className="h-8 px-3"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {/* Search Section */}
          <AccordionItem value="search" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Search</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search name, email, student ID..."
                className="w-full"
                aria-label="Search attendees"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Sessions Section */}
          <AccordionItem value="sessions" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-medium">Sessions</span>
                {selected.length > 0 && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {selected.length} selected
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <MultiSelect
                options={sessions.map(s => ({ value: s.id, label: s.name }))}
                value={selected}
                onChange={setSelected}
                placeholder="Select sessions..."
                searchPlaceholder="Search sessions..."
                emptyMessage="No sessions found."
                maxDisplay={2}
                className="w-full"
              />
            </AccordionContent>
          </AccordionItem>

          {/* Status Section */}
          <AccordionItem value="status" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status</span>
                {status && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {status.replace('-', ' ')}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <Select value={status || ''} onValueChange={(value) => setStatus(value as AttendanceStatus || null)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select attendance status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present (Checked in & out)</SelectItem>
                  <SelectItem value="absent">Absent (No check-in)</SelectItem>
                  <SelectItem value="checked-in-only">Checked In Only (Missing check-out)</SelectItem>
                </SelectContent>
              </Select>
            </AccordionContent>
          </AccordionItem>

          {/* Export Filters Section */}
          <AccordionItem value="export" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Export Filters</span>
                <span className="text-xs text-muted-foreground">(Optional)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Programs */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Programs</div>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-auto rounded border p-3">
                    {programs.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Loading programs...</div>
                    ) : programs.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={selectedProgramIds.includes(p.id)} 
                          onCheckedChange={() => setSelectedProgramIds(prev => 
                            prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                          )} 
                        />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                {/* Year Levels */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Year Levels</div>
                  <div className="grid grid-cols-3 gap-2 rounded border p-3">
                    {[1,2,3,4,5].map((y) => (
                      <label key={y} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={selectedYears.includes(y)} 
                          onCheckedChange={() => setSelectedYears(prev => 
                            prev.includes(y) ? prev.filter(v => v !== y) : [...prev, y]
                          )} 
                        />
                        <span className="text-sm">Year {y}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export default AttendanceFilters;


