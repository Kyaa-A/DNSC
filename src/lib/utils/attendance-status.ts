export type AttendanceDerivedStatus = 'present' | 'checked-in-only' | 'absent' | 'late'

export interface StatusInputs {
  timeIn?: string | Date | null
  timeOut?: string | Date | null
  timeInWindowStart?: string | Date | null
  timeInWindowEnd?: string | Date | null
}

function toDate(d?: string | Date | null): Date | null {
  if (!d) return null
  if (d instanceof Date) return d
  const parsed = new Date(d)
  return isNaN(parsed.getTime()) ? null : parsed
}

/**
 * Derive attendance status from scan times and optional session window.
 * Late is defined as checked-in after timeInWindowEnd if window provided.
 */
export function deriveAttendanceStatus(inputs: StatusInputs): AttendanceDerivedStatus {
  const timeIn = toDate(inputs.timeIn)
  const timeOut = toDate(inputs.timeOut)
  const winEnd = toDate(inputs.timeInWindowEnd)

  if (timeIn && timeOut) {
    if (winEnd && timeIn > winEnd) return 'late'
    return 'present'
  }
  if (timeIn && !timeOut) {
    if (winEnd && timeIn > winEnd) return 'late'
    return 'checked-in-only'
  }
  if (!timeIn && timeOut) return 'absent' // checked-out maps to absent for consistency
  return 'absent'
}