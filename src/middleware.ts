import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Auth.js v5 uses "authjs.session-token" cookie (not "next-auth.session-token")
const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') ||
  process.env.VERCEL_URL !== undefined

const cookieName = isSecure
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes — always allow
  if (pathname.startsWith('/auth/')) return NextResponse.next()
  if (pathname.startsWith('/organizer/accept')) return NextResponse.next()
  if (
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/organizer')
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    cookieName,
  })
  const isLoggedIn = !!token

  // Protected routes — redirect to login if not authenticated
  if (!isLoggedIn) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const role = token.role as string | undefined

  // Admin / dashboard route access
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    if (role !== 'admin' && role !== 'organizer') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  // Organizer route access
  if (pathname.startsWith('/organizer')) {
    if (role !== 'admin' && role !== 'organizer') {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
