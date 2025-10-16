import { NextRequest } from 'next/server'
import { getEventAttendanceKpis, getEventAttendanceListWithFilters } from '@/lib/db/queries/attendance'

export const dynamic = 'force-dynamic'

type SortKey = 'name' | 'status' | 'checkInAt'

function parseStringList(param: string | null | undefined): string[] {
  if (!param) return []
  return param.split(',').map(s => s.trim()).filter(Boolean)
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolved = 'then' in ctx.params ? await (ctx.params as Promise<{ id: string }>) : (ctx.params as { id: string })
    const eventId = resolved.id
    if (!eventId) return Response.json({ success: false, error: 'Missing event id' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const sessionIds = parseStringList(searchParams.get('sessions'))
    const statuses = parseStringList(searchParams.get('statuses')) as Array<'present' | 'checked-in' | 'checked-out' | 'absent'>
    const q = (searchParams.get('q') || '').trim()
    const sort = (searchParams.get('sort') as SortKey) || 'name'
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'asc'
    const page = Math.max(1, Number(searchParams.get('page') || '1'))
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') || '50')))

    const { rows, total } = await getEventAttendanceListWithFilters(eventId, {
      sessionIds,
      q,
      statuses,
      sort,
      order,
      page,
      pageSize,
    })

    const { registered, present, checkedInOnly, checkedOut, absent, attendanceRatePercent } = await getEventAttendanceKpis(eventId)

    return Response.json({
      success: true,
      kpis: { registered, present, checkedInOnly, checkedOut, absent, attendanceRatePercent },
      rows,
      pagination: { page, pageSize, total },
      eventTimeZone: null,
    })
  } catch (err) {
    console.error('Attendance API error', err)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


