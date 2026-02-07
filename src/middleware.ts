export { auth as middleware } from '@/lib/auth/auth'

// Use Node.js runtime for middleware (Prisma + bcryptjs require Node.js APIs)
export const runtime = 'nodejs'

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
