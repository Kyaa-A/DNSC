import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

// Type for XLSX worksheet styling
type WorksheetWithStyle = Record<string, unknown>

// Type for XLSX cell with styling
interface XLSXCell {
  v?: unknown
  s?: {
    font?: { bold?: boolean; color?: { rgb: string } }
    fill?: { fgColor?: { rgb: string } }
    alignment?: { horizontal?: string; vertical?: string }
    border?: {
      top?: { style?: string; color?: { rgb: string } }
      bottom?: { style?: string; color?: { rgb: string } }
      left?: { style?: string; color?: { rgb: string } }
      right?: { style?: string; color?: { rgb: string } }
    }
  }
}

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

function deriveStatus(timeIn: Date | null, timeOut: Date | null): 'present' | 'checked-in-only' | 'absent' {
  if (timeIn && timeOut) return 'present'
  if (timeIn && !timeOut) return 'checked-in-only'
  if (!timeIn && timeOut) return 'absent' // checked-out maps to absent for consistency
  return 'absent'
}

function formatToPhilippineTime(date: Date | null): string {
  if (!date) return ''
  
  // Format directly using Asia/Manila timezone
  return date.toLocaleString('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const params = await ctx.params
    const eventId = params.id
    if (!eventId) {
      return new Response(JSON.stringify({ error: 'Missing event id' }), { status: 400 })
    }

    // Fetch event name for filename
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true }
    })
    
    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 })
    }

    // Sanitize event name for filename
    const sanitizedEventName = event.name
      .replace(/[^a-zA-Z0-9\s-_]/g, '') // Remove special characters except spaces, hyphens, underscores
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .toLowerCase()
      .substring(0, 50) // Limit length for filename

    const { searchParams } = new URL(req.url)
    const sessionIds = parseStringList(searchParams.get('sessions'))
    const statuses = parseStringList(searchParams.get('status')) as Array<'present' | 'checked-in-only' | 'absent'>
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
    
    // Add status filtering at database level
    if (statuses.length > 0) {
      const statusConditions: Record<string, unknown>[] = []
      
      for (const status of statuses) {
        switch (status) {
          case 'present':
            statusConditions.push({
              timeIn: { not: null },
              timeOut: { not: null }
            })
            break
          case 'checked-in-only':
            statusConditions.push({
              timeIn: { not: null },
              timeOut: null
            })
            break
          case 'absent':
            statusConditions.push({
              timeIn: null,
              timeOut: null
            })
            break
        }
      }
      
      if (statusConditions.length > 0) {
        where.AND = statusConditions
      }
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
          // Sort by check-in time chronologically (ascending = earliest first, descending = latest first)
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
      
      // Determine if we should create separate sheets per session
      const shouldCreateMultipleSheets = sessionIds.length === 0 || sessionIds.length > 1
      
      // If creating multiple sheets, organize data by session
      const sessionDataMap = new Map<string, Array<Record<string, string | number>>>()
      
      // If single session, use simple array
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
          if (statuses.length > 0 && !statuses.includes(status)) continue
          const email = r.student?.email || ''
          const studentId = r.student?.studentIdNumber || ''
          const programSection = [r.student?.program?.name].filter(Boolean).join('/')
          const sessionName = r.session?.name || 'Unknown Session'
          
          if (q) {
            const hay = `${name} ${email} ${studentId}`.toLowerCase()
            if (!hay.includes(q.toLowerCase())) continue
          }
          
          const rowData = {
            Name: name,
            Email: email,
            'Student/ID': studentId,
            'Program/Section': programSection,
            Year: r.student?.year || '',
            Status: status,
            'Check-in': formatToPhilippineTime(r.timeIn),
            'Check-out': formatToPhilippineTime(r.timeOut),
            // Only include Session column if not creating multiple sheets
            ...(shouldCreateMultipleSheets ? {} : { Session: sessionName }),
          }
          
          if (shouldCreateMultipleSheets) {
            // Group by session
            if (!sessionDataMap.has(sessionName)) {
              sessionDataMap.set(sessionName, [])
            }
            sessionDataMap.get(sessionName)!.push(rowData)
          } else {
            // Single sheet
            rows.push(rowData)
          }
        }
        cursor = records[records.length - 1]?.id || null
        if (!cursor || records.length < batchSize) break
      }

      const wb = XLSX.utils.book_new()
      
      // Helper function to style worksheet
      const styleWorksheet = (ws: WorksheetWithStyle, data: Record<string, string | number>[]) => {
        // Define column widths
        const colWidths = [
          { wch: 25 }, // Name
          { wch: 30 }, // Email
          { wch: 15 }, // Student/ID
          { wch: 20 }, // Program/Section
          { wch: 8 },  // Year
          { wch: 12 }, // Status
          { wch: 20 }, // Check-in
          { wch: 20 }, // Check-out
          { wch: 20 }, // Session (if present)
        ]
        
        // Set column widths
        ws['!cols'] = colWidths
        
        // Style header row
        const headerRow = 1
        const headers = Object.keys(data[0] || {})
        
        headers.forEach((header, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: headerRow - 1, c: colIndex })
          if (!ws[cellAddress]) ws[cellAddress] = { v: header } as XLSXCell
          
          // Apply header styling
          (ws[cellAddress] as XLSXCell).s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2E86AB" } }, // Blue background
            alignment: { horizontal: "center", vertical: "center" },
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          }
        })
        
        // Style data rows
        data.forEach((row, rowIndex) => {
          headers.forEach((header, colIndex) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 1, c: colIndex })
            if (!ws[cellAddress]) ws[cellAddress] = { v: row[header] } as XLSXCell
            
            // Alternate row colors
            const isEvenRow = (rowIndex + 1) % 2 === 0
            const backgroundColor = isEvenRow ? "F8F9FA" : "FFFFFF"
            
            // Status-specific coloring
            let statusColor = "000000"
            if (header === "Status") {
              switch (row[header]) {
                case "present":
                  statusColor = "28A745" // Green
                  break
                case "checked-in":
                  statusColor = "FFC107" // Yellow
                  break
                case "checked-out":
                  statusColor = "DC3545" // Red
                  break
                case "absent":
                  statusColor = "6C757D" // Gray
                  break
              }
            }
            
            (ws[cellAddress] as XLSXCell).s = {
              font: { color: { rgb: statusColor } },
              fill: { fgColor: { rgb: backgroundColor } },
              alignment: { 
                horizontal: header === "Year" ? "center" : "left",
                vertical: "center"
              },
              border: {
                top: { style: "thin", color: { rgb: "E9ECEF" } },
                bottom: { style: "thin", color: { rgb: "E9ECEF" } },
                left: { style: "thin", color: { rgb: "E9ECEF" } },
                right: { style: "thin", color: { rgb: "E9ECEF" } }
              }
            }
          })
        })
        
        // Add auto-filter
        ws['!autofilter'] = { ref: `A1:${XLSX.utils.encode_cell({ r: data.length, c: headers.length - 1 })}` }
        
        // Freeze header row
        ws['!freeze'] = { xSplit: 0, ySplit: 1 }
      }
      
      if (shouldCreateMultipleSheets && sessionDataMap.size > 1) {
        // Create separate sheets for each session
        for (const [sessionName, sessionRows] of sessionDataMap) {
          if (sessionRows.length > 0) {
            // Sanitize sheet name (Excel has restrictions on sheet names)
            const sanitizedSheetName = sessionName
              .replace(/[\\\/\?\*\[\]]/g, '_') // Replace invalid characters
              .substring(0, 31) // Excel sheet name limit is 31 characters
            
            const ws = XLSX.utils.json_to_sheet(sessionRows)
            styleWorksheet(ws as WorksheetWithStyle, sessionRows)
            XLSX.utils.book_append_sheet(wb, ws, sanitizedSheetName)
          }
        }
      } else {
        // Single sheet (either single session or all sessions combined)
        const dataToUse = shouldCreateMultipleSheets && sessionDataMap.size === 1 
          ? Array.from(sessionDataMap.values())[0] 
          : rows
        const ws = XLSX.utils.json_to_sheet(dataToUse)
        styleWorksheet(ws as WorksheetWithStyle, dataToUse)
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance')
      }
      
      const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
      const headers = new Headers({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="attendance-${sanitizedEventName}.xlsx"`,
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
        'Program',
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
        if (statuses.length > 0 && !statuses.includes(status)) {
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
            formatToPhilippineTime(r.timeIn),
            formatToPhilippineTime(r.timeOut),
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
      'Content-Disposition': `attachment; filename="attendance-${sanitizedEventName}.csv"`,
      'Cache-Control': 'no-store',
    })

    return new Response(readable, { status: 200, headers })
  } catch (err) {
    console.error('Export CSV error', err)
    return new Response(JSON.stringify({ error: 'Failed to generate CSV' }), { status: 500 })
  }
}


