// User role types
export type UserRole = 'admin' | 'organizer'

// User interface with role information
export interface UserWithRole {
  id: string
  email: string
  name?: string | null
  role: UserRole
}

// Auth state interface
export interface AuthState {
  user: UserWithRole | null
  loading: boolean
  error: string | null
}

// Login credentials interface
export interface LoginCredentials {
  email: string
  password: string
}

// Registration data interface
export interface RegisterCredentials {
  email: string
  password: string
  firstName?: string
  lastName?: string
}

// Auth context interface
export interface AuthContextType extends AuthState {
  signIn: (credentials: LoginCredentials) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: string | null }>
  hasRole: (role: UserRole) => boolean
  isAdmin: () => boolean
  isOrganizer: () => boolean
  refreshSession: () => Promise<void>
}

// Session check result
export interface SessionCheckResult {
  user: UserWithRole | null
  error: string | null
}

// Auth error types
export type AuthErrorType =
  | 'invalid_credentials'
  | 'user_not_found'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'email_already_exists'
  | 'network_error'
  | 'unknown_error'

// Auth error interface
export interface AuthErrorDetail {
  type: AuthErrorType
  message: string
}

// Role-based permission helpers
export interface RolePermissions {
  canAccessAdminPanel: boolean
  canManageStudents: boolean
  canViewAnalytics: boolean
  canRegisterStudents: boolean
  canEditSettings: boolean
}

// Authentication action results
export interface AuthActionResult {
  success: boolean
  error?: string
  data?: unknown
}

// Password reset types
export interface PasswordResetData {
  email: string
  newPassword?: string
  token?: string
}
