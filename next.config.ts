import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/signal",
        destination: "/supply",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
