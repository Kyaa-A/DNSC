'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface SessionOption {
  id: string;
  name: string;
}

interface AttendanceFiltersProps {
  sessions: SessionOption[];
  selectedSessionIds?: string[];
  onSelectionChange?: (sessionIds: string[]) => void;
  selectedStatuses?: AttendanceStatus[];
  onStatusesChange?: (statuses: AttendanceStatus[]) => void;
  query?: string;
  onQueryChange?: (q: string) => void;
  eventId?: string;
  className?: string;
}

type AttendanceStatus = 'present' | 'checked-in' | 'checked-out' | 'absent';
type ScanType = 'time_in' | 'time_out';

const parseFromUrl = (): string[] => {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('sessions');
  if (!raw) return [];
  return raw.split(',').filter(Boolean);
};

const parseStatusesFromUrl = (): AttendanceStatus[] => {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('statuses');
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter((v): v is AttendanceStatus => ['present', 'checked-in', 'checked-out', 'absent'].includes(v));
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

const writeStatusesToUrl = (statuses: AttendanceStatus[]) => {
  const url = new URL(window.location.href);
  if (statuses.length > 0) {
    url.searchParams.set('statuses', statuses.join(','));
  } else {
    url.searchParams.delete('statuses');
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

export function AttendanceFilters({ sessions, selectedSessionIds, onSelectionChange, selectedStatuses, onStatusesChange, query, onQueryChange, eventId, className }: AttendanceFiltersProps) {
  const initial = useMemo(() => (selectedSessionIds && selectedSessionIds.length > 0 ? selectedSessionIds : parseFromUrl()), [selectedSessionIds]);
  const [selected, setSelected] = useState<string[]>(initial);
  const initialStatuses = useMemo(() => (selectedStatuses && selectedStatuses.length > 0 ? selectedStatuses : parseStatusesFromUrl()), [selectedStatuses]);
  const [statuses, setStatuses] = useState<AttendanceStatus[]>(initialStatuses);
  const initialQuery = useMemo(() => (typeof query === 'string' ? query : parseQueryFromUrl()), [query]);
  const [localQuery, setLocalQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [programs, setPrograms] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedScanTypes, setSelectedScanTypes] = useState<ScanType[]>([]);

  // Keep selection in sync with URL changes (back/forward)
  useEffect(() => {
    const onPop = () => {
      const ids = parseFromUrl();
      setSelected(ids);
      onSelectionChange?.(ids);
      const sts = parseStatusesFromUrl();
      setStatuses(sts);
      onStatusesChange?.(sts);
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
    onStatusesChange?.(statuses);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses.join(',')]);

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
    writeStatusesToUrl(statuses);
    writeQueryToUrl(localQuery);
    // Notify listeners (useAttendance) by dispatching popstate
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, [selected, statuses, localQuery]);

  const buildExportUrl = useCallback((format: 'csv' | 'xlsx') => {
    const url = new URL(window.location.origin + `/api/admin/events/${eventId ?? ''}/attendance/export`);
    const sp = new URLSearchParams(window.location.search);
    // preserve known params
    ['sessions', 'statuses', 'q', 'sort', 'order'].forEach((k) => {
      const v = sp.get(k);
      if (v) url.searchParams.set(k, v);
    });
    if (selectedProgramIds.length > 0) url.searchParams.set('programIds', selectedProgramIds.join(','));
    if (selectedYears.length > 0) url.searchParams.set('years', selectedYears.join(','));
    if (selectedScanTypes.length > 0) url.searchParams.set('scanTypes', selectedScanTypes.join(','));
    url.searchParams.set('format', format);
    return url.toString();
  }, [eventId, selectedProgramIds, selectedYears, selectedScanTypes]);

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

  const toggle = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const clearAll = useCallback(() => setSelected([]), []);
  const toggleStatus = useCallback((st: AttendanceStatus) => {
    setStatuses((prev) => (prev.includes(st) ? prev.filter((x) => x !== st) as AttendanceStatus[] : [...prev, st]));
  }, []);
  const clearStatuses = useCallback(() => setStatuses([]), []);

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={applyFilters} aria-label="Apply filters">
              Apply
            </Button>
            <Button variant="default" size="sm" onClick={() => handleExport('csv')} disabled={downloading || !eventId} aria-disabled={downloading || !eventId} aria-label="Export CSV">
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('xlsx')} disabled={downloading || !eventId} aria-disabled={downloading || !eventId} aria-label="Export XLSX">
              Export XLSX
            </Button>
            <Button variant="outline" size="sm" onClick={clearStatuses} disabled={statuses.length === 0} aria-disabled={statuses.length === 0}>
              Clear Status
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={selected.length === 0} aria-disabled={selected.length === 0}>
              Clear Sessions
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Export-only filters */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Export Filters</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Programs */}
              <div className="space-y-2">
                <div className="text-xs font-medium">Programs</div>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-auto rounded border p-2">
                  {programs.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No programs</div>
                  ) : programs.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selectedProgramIds.includes(p.id)} onCheckedChange={() => setSelectedProgramIds(prev => prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id])} aria-label={`Export program ${p.name}`} />
                      <span className="truncate" title={p.name}>{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Years */}
              <div className="space-y-2">
                <div className="text-xs font-medium">Year Levels</div>
                <div className="grid grid-cols-2 gap-2 rounded border p-2">
                  {[1,2,3,4,5].map((y) => (
                    <label key={y} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selectedYears.includes(y)} onCheckedChange={() => setSelectedYears(prev => prev.includes(y) ? prev.filter(v => v !== y) : [...prev, y])} aria-label={`Export year ${y}`} />
                      <span>{y}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Scan Types */}
              <div className="space-y-2">
                <div className="text-xs font-medium">Scan Types</div>
                <div className="grid grid-cols-1 gap-2 rounded border p-2">
                  {(['time_in','time_out'] as ScanType[]).map((st) => (
                    <label key={st} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={selectedScanTypes.includes(st)} onCheckedChange={() => setSelectedScanTypes(prev => prev.includes(st) ? prev.filter(v => v !== st) as ScanType[] : [...prev, st])} aria-label={`Export scan type ${st}`} />
                      <span className="capitalize">{st.replace('_',' ')}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Search</div>
            <Input
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search name, email, student ID..."
              aria-label="Search attendees"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Sessions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2" role="group" aria-label="Session filters">
              {sessions.map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer">
                  <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Filter by session ${s.name}`} />
                  <span className="truncate" title={s.name}>{s.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground">Status</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2" role="group" aria-label="Status filters">
              {(['present', 'checked-in', 'checked-out', 'absent'] as AttendanceStatus[]).map((st) => (
                <label key={st} className="flex items-center gap-2 rounded border p-2 cursor-pointer">
                  <Checkbox checked={statuses.includes(st)} onCheckedChange={() => toggleStatus(st)} aria-label={`Filter by status ${st}`} />
                  <span className="capitalize">{st.replace('-', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AttendanceFilters;


