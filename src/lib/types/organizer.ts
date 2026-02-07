import { UserWithRole } from './auth'

/**
 * Organizer role type
 */
export type OrganizerRole = 'organizer' | 'admin'

/**
 * Organizer permissions interface
 */
export interface OrganizerPermissions {
  canScanAttendance: boolean
  canViewSessions: boolean
  canManageSessions: boolean
  canViewAnalytics: boolean
  canExportData: boolean
}

/**
 * Organizer user interface extending base user
 */
export interface OrganizerUser extends UserWithRole {
  role: OrganizerRole
}

/**
 * Organizer session state interface
 */
export interface OrganizerSessionState {
  user: OrganizerUser | null
  isAuthenticated: boolean
  isOrganizer: boolean
  isAdmin: boolean
  assignedEvents: string[]
  permissions: OrganizerPermissions
  loading: boolean
  error: string | null
}

/**
 * Organizer authentication context interface
 */
export interface OrganizerAuthContextType extends OrganizerSessionState {
  signIn: (credentials: { email: string; password: string }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
  hasPermission: (permission: keyof OrganizerPermissions) => boolean
  canAccessEvent: (eventId: string) => boolean
  getRoleDisplayName: () => string
}

/**
 * Organizer login credentials interface
 */
export interface OrganizerLoginCredentials {
  email: string
  password: string
}

/**
 * Organizer authentication result interface
 */
export interface OrganizerAuthResult {
  success: boolean
  user?: OrganizerUser
  error?: string
  statusCode?: number
}

/**
 * Organizer session information interface
 */
export interface OrganizerSessionInfo {
  user: OrganizerUser
  isOrganizer: boolean
  isAdmin: boolean
  assignedEvents: string[]
  permissions: OrganizerPermissions
  lastActivity: Date
  sessionExpiry: Date
}

/**
 * Organizer middleware options interface
 */
export interface OrganizerMiddlewareOptions {
  requireAuth?: boolean
  allowedRoles?: OrganizerRole[]
  requiredPermission?: keyof OrganizerPermissions
  redirectTo?: string
}

/**
 * Organizer route protection result interface
 */
export interface OrganizerRouteProtectionResult {
  allowed: boolean
  redirectTo?: string
  error?: string
  user?: OrganizerUser
}

/**
 * Organizer event assignment interface
 */
export interface OrganizerEventAssignment {
  organizerId: string
  eventId: string
  assignedAt: Date
  assignedBy: string
  permissions: {
    canScan: boolean
    canView: boolean
    canManage: boolean
  }
}

/**
 * Organizer activity log interface
 */
export interface OrganizerActivityLog {
  id: string
  organizerId: string
  action: string
  eventId?: string
  sessionId?: string
  timestamp: Date
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

/**
 * Organizer session management interface
 */
export interface OrganizerSessionManagement {
  currentSession: OrganizerSessionInfo | null
  activeSessions: OrganizerSessionInfo[]
  maxConcurrentSessions: number
  sessionTimeout: number
}

/**
 * Organizer authentication error types
 */
export type OrganizerAuthErrorType =
  | 'invalid_credentials'
  | 'user_not_found'
  | 'insufficient_permissions'
  | 'session_expired'
  | 'account_disabled'
  | 'event_access_denied'
  | 'network_error'
  | 'unknown_error'

/**
 * Organizer authentication error interface
 */
export interface OrganizerAuthError {
  type: OrganizerAuthErrorType
  message: string
  code?: string
  details?: Record<string, unknown>
}

/**
 * Organizer login form data interface
 */
export interface OrganizerLoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

/**
 * Organizer password reset request interface
 */
export interface OrganizerPasswordResetRequest {
  email: string
  redirectTo?: string
}

/**
 * Organizer password reset confirmation interface
 */
export interface OrganizerPasswordResetConfirmation {
  token: string
  newPassword: string
  confirmPassword: string
}

/**
 * Organizer profile update interface
 */
export interface OrganizerProfileUpdate {
  fullName?: string
  avatarUrl?: string
  preferences?: {
    theme?: 'light' | 'dark' | 'system'
    notifications?: boolean
    language?: string
  }
}

/**
 * Organizer dashboard data interface
 */
export interface OrganizerDashboardData {
  assignedEvents: Array<{
    id: string
    name: string
    description?: string
    startDate: Date
    endDate: Date
    status: 'upcoming' | 'active' | 'completed'
    attendanceCount: number
    totalExpected: number
  }>
  recentActivity: OrganizerActivityLog[]
  statistics: {
    totalScans: number
    todayScans: number
    activeEvents: number
    completedEvents: number
  }
}
