import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  serverExternalPackages: ['pdf-parse'],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors. Only use in development/staging.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors. Use with caution.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
