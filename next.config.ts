import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/signal",
        destination: "/supply",
        permanent: true,
      },
      {
        source: "/pricing",
        destination: "/services",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
