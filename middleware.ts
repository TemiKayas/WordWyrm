import NextAuth from 'next-auth';
import { authConfig } from './lib/auth.config';
import { NextResponse } from 'next/server';

/**
 * Middleware using lightweight auth config (no Prisma or bcryptjs)
 * This keeps the Edge Function bundle size under 1MB
 */
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const path = req.nextUrl.pathname;
  const isAuthenticated = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && (path === '/login' || path === '/signup')) {
    const redirectPath = userRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard';
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Protect teacher routes
  if (path.startsWith('/teacher')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/student/dashboard', req.url));
    }
  }

  // Protect student routes
  if (path.startsWith('/student')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/teacher/dashboard', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Exclude: api routes, Next.js internals, static files, public files, auth pages, and play pages
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|signup|play|.*\\..*).*)'],
};
