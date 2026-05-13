import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Square sandbox catalog images are hosted on AWS S3
      { protocol: "https", hostname: "**.amazonaws.com" },
      // Square production CDN
      { protocol: "https", hostname: "**.squarecdn.com" },
      // Square's own image CDN (used by some sandbox accounts)
      { protocol: "https", hostname: "**.squareup.com" },
    ],
  },
};

export default nextConfig;
