'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AttendanceKpisDto, AttendanceListResponseDto, AttendanceRowDto } from '@/lib/types/attendance'

function getSearchParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.search)
}

function readParams() {
  const sp = getSearchParams()
  return {
    sessions: sp.get('sessions') || undefined,
    status: sp.get('status') || undefined,
    q: sp.get('q') || undefined,
    sort: sp.get('sort') || undefined,
    order: sp.get('order') || undefined,
    page: sp.get('page') || undefined,
    pageSize: sp.get('pageSize') || undefined,
  }
}

export interface UseAttendanceResult {
  loading: boolean
  error: string | null
  kpis: AttendanceKpisDto | null
  rows: AttendanceRowDto[]
  perSessionAggregates: Array<{ sessionId: string; sessionName: string; present: number; checkedInOnly: number; checkedOut: number; absent: number }>
  refetch: () => Promise<void>
}

export function useAttendance(eventId: string | null): UseAttendanceResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState<AttendanceKpisDto | null>(null)
  const [rows, setRows] = useState<AttendanceRowDto[]>([])

  const fetchData = useCallback(async () => {
    if (!eventId) return
    try {
      setLoading(true)
      setError(null)
      const { sessions, status, q, sort, order, page, pageSize } = readParams()
      const url = new URL(`/api/admin/events/${eventId}/attendance`, window.location.origin)
      if (sessions) url.searchParams.set('sessions', sessions)
      if (status) url.searchParams.set('status', status)
      if (q) url.searchParams.set('q', q)
      if (sort) url.searchParams.set('sort', sort)
      if (order) url.searchParams.set('order', order)
      if (page) url.searchParams.set('page', page)
      if (pageSize) url.searchParams.set('pageSize', pageSize)

      const res = await fetch(url.toString())
      const data: AttendanceListResponseDto = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load attendance')
      }
      setKpis(data.kpis)
      setRows(data.rows)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchData()
    const onPop = () => fetchData()
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [fetchData])

  const perSessionAggregates = useMemo(() => {
    const map = new Map<string, { sessionName: string; present: number; checkedInOnly: number; checkedOut: number; absent: number }>()
    for (const r of rows) {
      const key = r.sessionName || 'Unknown'
      const entry = map.get(key) || { sessionName: key, present: 0, checkedInOnly: 0, checkedOut: 0, absent: 0 }
      switch (r.status) {
        case 'present':
          entry.present += 1; break
        case 'checked-in-only':
          entry.checkedInOnly += 1; break
        case 'absent':
          entry.absent += 1; break
        default:
          entry.absent += 1; break
      }
      map.set(key, entry)
    }
    // Map to array with a synthetic sessionId as name hash to keep UI stable
    const result: Array<{ sessionId: string; sessionName: string; present: number; checkedInOnly: number; checkedOut: number; absent: number }> = []
    for (const [name, agg] of map.entries()) {
      result.push({ sessionId: name, sessionName: agg.sessionName, present: agg.present, checkedInOnly: agg.checkedInOnly, checkedOut: agg.checkedOut, absent: agg.absent })
    }
    return result
  }, [rows])

  return { loading, error, kpis, rows, perSessionAggregates, refetch: fetchData }
}

export default useAttendance


