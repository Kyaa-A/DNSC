export { auth as middleware } from '@/lib/auth/auth'

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
