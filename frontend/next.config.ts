import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
      },
      {
        protocol: 'https',
        hostname: '*.waddesdonwine.co.uk',
      },
    ],
  },
  experimental: {
    mdxRs: true,
  },
};

export default nextConfig;
