import { useContext } from 'react'
import { AuthContext } from '@/components/providers/AuthProvider'
import type { AuthContextType } from '@/lib/types/auth'

/**
 * Hook to access the authentication context
 * This hook must be used within an AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth()
  return !loading && !!user
}

/**
 * Hook to check if user has specific role
 */
export function useHasRole(role: 'admin' | 'organizer'): boolean {
  const { hasRole } = useAuth()
  return hasRole(role)
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = useAuth()
  return isAdmin()
}

/**
 * Hook to check if user is organizer
 */
export function useIsOrganizer(): boolean {
  const { isOrganizer } = useAuth()
  return isOrganizer()
}

/**
 * Hook to get user information
 */
export function useUser() {
  const { user } = useAuth()
  return user
}

/**
 * Hook to get auth loading state
 */
export function useAuthLoading(): boolean {
  const { loading } = useAuth()
  return loading
}

/**
 * Hook to get auth error
 */
export function useAuthError(): string | null {
  const { error } = useAuth()
  return error
}

/**
 * Hook for authentication actions
 */
export function useAuthActions() {
  const { signIn, signOut, resetPassword, refreshSession } = useAuth()

  return {
    signIn,
    signOut,
    resetPassword,
    refreshSession,
  }
}
