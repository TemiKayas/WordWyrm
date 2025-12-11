import type { NextAuthConfig } from 'next-auth';

/**
 * Lightweight auth config for middleware (Edge runtime)
 * Does NOT include heavy dependencies like Prisma or bcryptjs
 */
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google OAuth sign-ins, validate bu.edu domain
      if (account?.provider === 'google') {
        const email = profile?.email || user?.email;
        if (!email || !email.endsWith('@bu.edu')) {
          // Returning false will show an error page
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      // If token is being updated (e.g., after role selection), fetch fresh user data
      if (trigger === 'update' && token.id) {
        // We can't import db here (edge runtime), so we'll fetch in the session callback
        // Just pass through for now
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'TEACHER' | 'STUDENT' | 'ADMIN' | null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If URL is a relative path, combine with base URL
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // If URL is on the same origin, use it directly
      const urlObj = new URL(url);
      if (urlObj.origin === baseUrl) return url;

      // For external URLs or unexpected cases, redirect to base URL
      // Middleware will handle role-based redirects from base URL
      return baseUrl;
    },
  },
  providers: [], // Providers will be added in auth.ts
} satisfies NextAuthConfig;
