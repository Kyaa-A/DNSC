'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@/hooks/use-auth'
import { UserRole } from '@/lib/types/auth'
import { hasRole, hasAnyRole, hasPermission, getRoleDisplayName, getRoleErrorMessage } from '@/lib/utils/role-utils'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
  allowedRoles?: UserRole[]
  requiredPermission?: string
  fallback?: React.ReactNode
  redirectTo?: string
  showError?: boolean
}

/**
 * RoleGuard component that protects content based on user roles and permissions
 */
export function RoleGuard({
  children,
  requiredRole,
  allowedRoles,
  requiredPermission,
  fallback,
  redirectTo = '/admin/dashboard',
  showError = true,
}: RoleGuardProps) {
  const { loading } = useAuth()
  const user = useUser()
  const router = useRouter()

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // If user is not logged in, show authentication required message
  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }
    
    if (!showError) {
      return null
    }
    
    return (
      <div className="flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center border border-yellow-200">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-6">Please sign in to access this content</p>
          
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full"
          >
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  let hasAccess = false
  let errorMessage = ''

  // Check specific required role
  if (requiredRole) {
    hasAccess = hasRole(user, requiredRole)
    if (!hasAccess) {
      errorMessage = getRoleErrorMessage(requiredRole, user.role || null)
    }
  }

  // Check allowed roles list
  if (allowedRoles && allowedRoles.length > 0) {
    hasAccess = hasAnyRole(user, allowedRoles)
    if (!hasAccess) {
      const roleNames = allowedRoles.map(getRoleDisplayName).join(', ')
      errorMessage = `This feature requires one of the following roles: ${roleNames}`
    }
  }

  // Check required permission
  if (requiredPermission) {
    hasAccess = hasPermission(user, requiredPermission as keyof import('@/lib/types/auth').RolePermissions)
    if (!hasAccess) {
      errorMessage = `You don't have permission to access this feature (${requiredPermission})`
    }
  }

  // If no restrictions specified, allow access
  if (!requiredRole && !allowedRoles && !requiredPermission) {
    hasAccess = true
  }

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>
  }

  // If custom fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>
  }

  // If showError is false, render nothing
  if (!showError) {
    return null
  }

  // Default error message component
  return (
    <div className="flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center border border-red-200">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600 mb-6">{errorMessage}</p>
        
        <div className="space-y-3">
          <Button
            onClick={() => router.push(redirectTo)}
            className="w-full"
          >
            Go to Dashboard
          </Button>
          
          <div className="text-sm text-gray-500">
            Current role: <span className="font-medium">{getRoleDisplayName(user.role || null)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Higher-order component version of RoleGuard
 */
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<RoleGuardProps, 'children'>
) {
  const WrappedComponent = (props: P) => {
    return (
      <RoleGuard {...options}>
        <Component {...props} />
      </RoleGuard>
    )
  }

  WrappedComponent.displayName = `withRoleGuard(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * AdminOnly component - shorthand for admin-only access
 */
export function AdminOnly({ children, ...props }: Omit<RoleGuardProps, 'requiredRole'>) {
  return (
    <RoleGuard requiredRole="admin" {...props}>
      {children}
    </RoleGuard>
  )
}

/**
 * OrganizerOnly component - shorthand for organizer-only access
 */
export function OrganizerOnly({ children, ...props }: Omit<RoleGuardProps, 'requiredRole'>) {
  return (
    <RoleGuard requiredRole="organizer" {...props}>
      {children}
    </RoleGuard>
  )
}

/**
 * OrganizerOrAdmin component - shorthand for organizer or admin access
 */
export function OrganizerOrAdmin({ children, ...props }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin', 'organizer']} {...props}>
      {children}
    </RoleGuard>
  )
}

/**
 * PermissionGuard component - guards based on specific permissions
 */
export function PermissionGuard({ 
  children, 
  permission, 
  ...props 
}: Omit<RoleGuardProps, 'requiredPermission'> & { permission: string }) {
  return (
    <RoleGuard requiredPermission={permission} {...props}>
      {children}
    </RoleGuard>
  )
}

export default RoleGuard
