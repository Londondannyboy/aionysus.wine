import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/wines/1875-boal-h-m-borges',
        destination: '/wines/boal-borges-1875',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
