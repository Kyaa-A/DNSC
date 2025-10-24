export type AttendanceDerivedStatus = 'present' | 'checked-in-only' | 'absent'

export interface AttendanceKpisDto {
  registered: number
  present: number
  checkedInOnly: number
  checkedOut: number
  absent: number
  attendanceRatePercent: number
}

export interface AttendanceRowDto {
  id: string
  name: string | null
  email: string | null
  studentId: string | null
  programSection: string | null
  status: AttendanceDerivedStatus
  checkInAt: string | null
  checkOutAt: string | null
  sessionName: string | null
}

export interface AttendancePaginationDto {
  page: number
  pageSize: number
  total: number
}

export interface AttendanceListResponseDto {
  success: boolean
  kpis: AttendanceKpisDto
  rows: AttendanceRowDto[]
  pagination: AttendancePaginationDto
  eventTimeZone: string | null
  error?: string
}

export interface AttendanceQueryParamsDto {
  sessionIds?: string[]
  status?: AttendanceDerivedStatus
  q?: string
  sort?: 'name' | 'status' | 'checkInAt'
  order?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}


