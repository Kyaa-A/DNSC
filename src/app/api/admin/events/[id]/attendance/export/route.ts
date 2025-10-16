import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

type SortKey = 'name' | 'status' | 'checkInAt'

function parseStringList(param: string | null | undefined): string[] {
  if (!param) return []
  return param.split(',').map(s => s.trim()).filter(Boolean)
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

function deriveStatus(timeIn: Date | null, timeOut: Date | null): string {
  if (timeIn && timeOut) return 'present'
  if (timeIn && !timeOut) return 'checked-in'
  if (!timeIn && timeOut) return 'checked-out'
  return 'absent'
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const eventId = params.id
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing event id' }), { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const sessionIds = parseStringList(searchParams.get('sessions'))
    const statuses = parseStringList(searchParams.get('statuses')) as Array<'present' | 'checked-in' | 'checked-out' | 'absent'>
    const q = (searchParams.get('q') || '').trim()
    const sort = (searchParams.get('sort') as SortKey) || 'name'
    const order = (searchParams.get('order') as 'asc' | 'desc') || 'asc'
    const format = (searchParams.get('format') || 'csv').toLowerCase()
    // Additional export-only filters
    const programIds = parseStringList(searchParams.get('programIds'))
    const yearsRaw = parseStringList(searchParams.get('years'))
    const years = yearsRaw.map((y) => Number(y)).filter((n) => Number.isFinite(n))
    const scanTypes = parseStringList(searchParams.get('scanTypes')) as Array<'time_in' | 'time_out'>

    // Build Prisma where clause
    const where: Record<string, unknown> = { eventId }
    if (sessionIds.length > 0) {
      where.sessionId = { in: sessionIds }
    }
    if (scanTypes.length > 0) {
      where.scanType = { in: scanTypes }
    }
    const studentWhere: Record<string, unknown> = {}
    if (programIds.length > 0) studentWhere.programId = { in: programIds }
    if (years.length > 0) studentWhere.year = { in: years }
    if (Object.keys(studentWhere).length > 0) {
      where.student = { is: studentWhere }
    }

    // Base include to fetch necessary fields
    const include = {
      student: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          studentIdNumber: true,
          year: true,
          program: { select: { name: true } },
        },
      },
      session: {
        select: { name: true },
      },
    } as const

    // Order mapping
    const orderBy = (() => {
      switch (sort) {
        case 'name':
          // Sort by student lastName, firstName
          return [{ student: { lastName: order } }, { student: { firstName: order } }]
        case 'status':
          // Sort by derived status (approximate by timeIn/timeOut presence)
          return [{ timeIn: order }, { timeOut: order }]
        case 'checkInAt':
          return [{ timeIn: order }]
        default:
          return [{ createdAt: order }]
      }
    })()

    if (format === 'xlsx') {
      // Buffered XLSX generation
      const XLSX = await import('xlsx')
      const batchSize = 500
      let cursor: string | null = null
      const rows: Array<Record<string, string | number>> = []
      while (true) {
        const records: Array<{
          id: string
          timeIn: Date | null
          timeOut: Date | null
          student: {
            firstName: string | null
            lastName: string | null
            email: string | null
            studentIdNumber: string | null
            year: number
            program: { name: string | null } | null
          } | null
          session: { name: string | null } | null
        }> = await prisma.attendance.findMany({
          where,
          include,
          orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
          take: batchSize,
          ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        })
        if (records.length === 0) break
        for (const r of records) {
          const name = [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ').trim() || ''
          const status = deriveStatus(r.timeIn, r.timeOut)
          if (statuses.length > 0 && !statuses.includes(status as 'present' | 'checked-in' | 'checked-out' | 'absent')) continue
          const email = r.student?.email || ''
          const studentId = r.student?.studentIdNumber || ''
          const programSection = [r.student?.program?.name].filter(Boolean).join('/')
          const sessionName = r.session?.name || ''
          if (q) {
            const hay = `${name} ${email} ${studentId}`.toLowerCase()
            if (!hay.includes(q.toLowerCase())) continue
          }
          rows.push({
            Name: name,
            Email: email,
            'Student/ID': studentId,
            'Program/Section': programSection,
            Year: r.student?.year || '',
            Status: status,
            'Check-in': r.timeIn ? r.timeIn.toISOString() : '',
            'Check-out': r.timeOut ? r.timeOut.toISOString() : '',
            Session: sessionName,
          })
        }
        cursor = records[records.length - 1]?.id || null
        if (!cursor || records.length < batchSize) break
      }

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(rows)
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
      const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
      const headers = new Headers({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="attendance-${eventId}.xlsx"`,
        'Cache-Control': 'no-store',
      })
      return new Response(new Uint8Array(xlsxBuffer), { status: 200, headers })
    }

    // Stream CSV (default)
    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    async function write(line: string) {
      await writer.write(encoder.encode(line))
    }

    // Header
    await write(
      [
        'Name',
        'Email',
        'Student/ID',
        'Program/Section',
        'Year',
        'Status',
        'Check-in',
        'Check-out',
        'Session',
      ].map(csvEscape).join(',') + '\n'
    )

    const batchSize = 500
    let cursor: string | null = null
    // We select by createdAt desc then reverse if needed; using cursor-based pagination for stability
    while (true) {
      const records: Array<{
        id: string
        timeIn: Date | null
        timeOut: Date | null
        student: {
          firstName: string | null
          lastName: string | null
          email: string | null
          studentIdNumber: string | null
          year: number
          program: { name: string | null } | null
        } | null
        session: { name: string | null } | null
      }> = await prisma.attendance.findMany({
        where,
        include,
        orderBy: Array.isArray(orderBy) ? orderBy : [orderBy],
        take: batchSize,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      })

      if (records.length === 0) break

      for (const r of records) {
        const name = [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ').trim() || ''
        const status = deriveStatus(r.timeIn, r.timeOut)
        if (statuses.length > 0 && !statuses.includes(status as 'present' | 'checked-in' | 'checked-out' | 'absent')) {
          continue
        }
        const email = r.student?.email || ''
        const studentId = r.student?.studentIdNumber || ''
        const programSection = [r.student?.program?.name].filter(Boolean).join('/')
        const sessionName = r.session?.name || ''

        // Free-text filter
        if (q) {
          const hay = `${name} ${email} ${studentId}`.toLowerCase()
          if (!hay.includes(q.toLowerCase())) {
            continue
          }
        }

        await write(
          [
            name,
            email,
            studentId,
            programSection,
            r.student?.year || '',
            status,
            r.timeIn ? r.timeIn.toISOString() : '',
            r.timeOut ? r.timeOut.toISOString() : '',
            sessionName,
          ].map(csvEscape).join(',') + '\n'
        )
      }

      cursor = records[records.length - 1]?.id || null
      if (!cursor || records.length < batchSize) break
    }

    await writer.close()

    const headers = new Headers({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="attendance-${eventId}.csv"`,
      'Cache-Control': 'no-store',
    })

    return new Response(readable, { status: 200, headers })
  } catch (err) {
    console.error('Export CSV error', err)
    return new Response(JSON.stringify({ error: 'Failed to generate CSV' }), { status: 500 })
  }
}


