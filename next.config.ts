import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Telegram WebApp script and Vercel Blob images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
    ],
  },
  // Ensure API routes run on Node.js runtime (not Edge)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
