import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/db/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email as string
        const password = credentials.password as string

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        })

        if (!user || !user.isActive) {
          return null
        }

        const isValid = await compare(password, user.passwordHash)
        if (!isValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id

        // Update lastLoginAt on the Organizer record if one exists
        if (user.email) {
          prisma.organizer.updateMany({
            where: { email: user.email.toLowerCase() },
            data: { lastLoginAt: new Date() },
          }).catch(() => {}) // fire-and-forget, don't block login
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = request.nextUrl

      // Public routes
      if (pathname.startsWith('/auth/')) return true
      if (pathname.startsWith('/organizer/accept')) return true
      if (!pathname.startsWith('/admin') && !pathname.startsWith('/dashboard') && !pathname.startsWith('/organizer')) {
        return true
      }

      if (!isLoggedIn) return false

      const role = auth?.user?.role

      // Admin route access
      if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
        return role === 'admin' || role === 'organizer'
      }

      // Organizer route access
      if (pathname.startsWith('/organizer')) {
        return role === 'admin' || role === 'organizer'
      }

      return true
    },
  },
})

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    role?: string
  }
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
  }
}

// JWT type augmentation handled via next-auth module above
// The jwt callback types are inferred from the next-auth configuration
