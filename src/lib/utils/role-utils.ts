import type { UserRole, UserWithRole, RolePermissions } from '@/lib/types/auth'

/**
 * Check if a user has a specific role
 */
export function hasRole(user: UserWithRole | null, role: UserRole): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Check if a user is an admin
 */
export function isAdmin(user: UserWithRole | null): boolean {
  return hasRole(user, 'admin')
}

/**
 * Check if a user is an organizer
 */
export function isOrganizer(user: UserWithRole | null): boolean {
  return hasRole(user, 'organizer')
}

/**
 * Check if a user has any of the allowed roles
 */
export function hasAnyRole(user: UserWithRole | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.some(role => hasRole(user, role))
}

/**
 * Get the user's role as a string
 */
export function getUserRole(user: UserWithRole | null): UserRole | null {
  if (!user) return null
  return user.role || null
}

/**
 * Get role display name for UI
 */
export function getRoleDisplayName(role: UserRole | null): string {
  switch (role) {
    case 'admin':
      return 'Administrator'
    case 'organizer':
      return 'Organizer'
    default:
      return 'Unknown Role'
  }
}

/**
 * Get role permissions based on user role
 */
export function getRolePermissions(user: UserWithRole | null): RolePermissions {
  const role = getUserRole(user)

  switch (role) {
    case 'admin':
      return {
        canAccessAdminPanel: true,
        canManageStudents: true,
        canViewAnalytics: true,
        canRegisterStudents: true,
        canEditSettings: true,
      }
    case 'organizer':
      return {
        canAccessAdminPanel: true,
        canManageStudents: false,
        canViewAnalytics: true,
        canRegisterStudents: true,
        canEditSettings: false,
      }
    default:
      return {
        canAccessAdminPanel: false,
        canManageStudents: false,
        canViewAnalytics: false,
        canRegisterStudents: false,
        canEditSettings: false,
      }
  }
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  user: UserWithRole | null,
  permission: keyof RolePermissions
): boolean {
  const permissions = getRolePermissions(user)
  return permissions[permission]
}

/**
 * Get all available roles
 */
export function getAllRoles(): UserRole[] {
  return ['admin', 'organizer']
}

/**
 * Check if a role is valid
 */
export function isValidRole(role: string): role is UserRole {
  return getAllRoles().includes(role as UserRole)
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: UserRole | null): number {
  switch (role) {
    case 'admin':
      return 10
    case 'organizer':
      return 5
    default:
      return 0
  }
}

/**
 * Check if user has higher or equal role level than required
 */
export function hasMinimumRoleLevel(user: UserWithRole | null, requiredRole: UserRole): boolean {
  const userLevel = getRoleLevel(getUserRole(user))
  const requiredLevel = getRoleLevel(requiredRole)
  return userLevel >= requiredLevel
}

/**
 * Get role-specific navigation items
 */
export function getRoleNavigation(user: UserWithRole | null) {
  const role = getUserRole(user)
  const permissions = getRolePermissions(user)

  const baseItems = [
    { href: '/admin/dashboard', label: 'Dashboard', permission: 'canAccessAdminPanel' },
    { href: '/admin/register', label: 'Register Students', permission: 'canRegisterStudents' },
    { href: '/admin/analytics', label: 'Analytics', permission: 'canViewAnalytics' },
  ]

  const adminOnlyItems = [
    { href: '/admin/students', label: 'Manage Students', permission: 'canManageStudents' },
    { href: '/admin/settings', label: 'Settings', permission: 'canEditSettings' },
  ]

  let allowedItems = baseItems.filter(item =>
    permissions[item.permission as keyof RolePermissions]
  )

  if (role === 'admin') {
    const allowedAdminItems = adminOnlyItems.filter(item =>
      permissions[item.permission as keyof RolePermissions]
    )
    allowedItems = [...allowedItems, ...allowedAdminItems]
  }

  return allowedItems
}

/**
 * Role-based error messages
 */
export function getRoleErrorMessage(requiredRole: UserRole, userRole: UserRole | null): string {
  if (!userRole) {
    return 'You must be logged in to access this resource.'
  }

  if (userRole === requiredRole) {
    return 'Access granted.'
  }

  return `This resource requires ${getRoleDisplayName(requiredRole)} privileges. You currently have ${getRoleDisplayName(userRole)} access.`
}
