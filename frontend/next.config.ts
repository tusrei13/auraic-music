import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return [
      {
        source: "/explore",
        destination: "/",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
