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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'TEACHER' | 'STUDENT' | 'ADMIN';
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
