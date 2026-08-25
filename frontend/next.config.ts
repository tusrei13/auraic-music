import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "usercontent.jamendo.com",
      },
      {
        protocol: "https",
        hostname: "imgjam1.jamendo.com",
      },
      {
        protocol: "https",
        hostname: "imgjam2.jamendo.com",
      },
    ],
  },
};

export default nextConfig;
