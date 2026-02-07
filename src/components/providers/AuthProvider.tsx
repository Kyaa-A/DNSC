'use client'

import React, { createContext, useContext, useCallback, useMemo } from 'react'
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from 'next-auth/react'
import type { AuthContextType, LoginCredentials, UserWithRole, UserRole } from '@/lib/types/auth'

// Create the authentication context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Inner provider that uses NextAuth session
function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()

  const user: UserWithRole | null = useMemo(() => {
    if (!session?.user) return null
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role as UserRole,
    }
  }, [session?.user])

  const loading = status === 'loading'

  const signIn = useCallback(async (credentials: LoginCredentials): Promise<{ error: string | null }> => {
    try {
      const result = await nextAuthSignIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      })

      if (result?.error) {
        return { error: 'Invalid email or password. Please check your credentials and try again.' }
      }

      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      return { error: errorMessage }
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    await nextAuthSignOut({ redirect: true, redirectTo: '/auth/login' })
  }, [])

  const resetPassword = useCallback(async (_email: string): Promise<{ error: string | null }> => {
    // Password reset would need a custom API endpoint
    return { error: 'Password reset is not yet implemented. Please contact an administrator.' }
  }, [])

  const updatePassword = useCallback(async (_currentPassword: string, _newPassword: string): Promise<{ error: string | null }> => {
    // Password update would need a custom API endpoint
    return { error: 'Password update is not yet implemented. Please contact an administrator.' }
  }, [])

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role
  }, [user])

  const isAdmin = useCallback((): boolean => {
    return user?.role === 'admin'
  }, [user])

  const isOrganizer = useCallback((): boolean => {
    return user?.role === 'organizer'
  }, [user])

  const refreshSession = useCallback(async (): Promise<void> => {
    await update()
  }, [update])

  const value: AuthContextType = useMemo(() => ({
    user,
    loading,
    error: null,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    hasRole,
    isAdmin,
    isOrganizer,
    refreshSession,
  }), [user, loading, signIn, signOut, resetPassword, updatePassword, hasRole, isAdmin, isOrganizer, refreshSession])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// AuthProvider component props
interface AuthProviderProps {
  children: React.ReactNode
}

// AuthProvider component wraps with NextAuth SessionProvider
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </SessionProvider>
  )
}
