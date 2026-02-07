import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request })
  const isLoggedIn = !!token

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
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (authentication routes)
     * - api/public (public API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public directory assets
     */
    '/((?!api/auth|api/public|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
