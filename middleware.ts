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
    const redirectPath = userRole === 'TEACHER'
      ? '/teacher/dashboard'
      : userRole === 'STUDENT'
      ? '/student/dashboard'
      : '/';
    return NextResponse.redirect(new URL(redirectPath, req.url));
  }

  // Redirect root to appropriate dashboard if authenticated
  if (isAuthenticated && path === '/') {
    const redirectPath = userRole === 'TEACHER'
      ? '/teacher/dashboard'
      : userRole === 'STUDENT'
      ? '/student/dashboard'
      : '/';
    if (redirectPath !== '/') {
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }
  }

  // Protect teacher routes
  if (path.startsWith('/teacher')) {
    if (!isAuthenticated) {
      // Save the attempted URL to redirect back after login
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      // Wrong role - redirect to their appropriate dashboard
      if (userRole === 'STUDENT') {
        return NextResponse.redirect(new URL('/student/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Protect student routes
  if (path.startsWith('/student')) {
    if (!isAuthenticated) {
      // Save the attempted URL to redirect back after login
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', path);
      return NextResponse.redirect(loginUrl);
    }
    if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
      // Wrong role - redirect to their appropriate dashboard
      if (userRole === 'TEACHER') {
        return NextResponse.redirect(new URL('/teacher/dashboard', req.url));
      }
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Exclude: api routes (including NextAuth callbacks), Next.js internals, static files, public files, and play pages
  // NOTE: We DO include login/signup so we can redirect authenticated users away from them
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|play|.*\\..*).*)',
  ],
};
