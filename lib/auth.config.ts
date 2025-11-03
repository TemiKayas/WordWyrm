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
      // Handle callback URLs with explicit paths
      if (url.startsWith('/')) return `${baseUrl}${url}`;

      // Handle URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;

      // Default: redirect to base URL (will be handled by middleware)
      return baseUrl;
    },
  },
  providers: [], // Providers will be added in auth.ts
} satisfies NextAuthConfig;
