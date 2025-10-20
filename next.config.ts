import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  serverExternalPackages: ['pdf-parse'],
};

export default nextConfig;
