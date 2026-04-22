import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from development
  allowedDevOrigins: ["127.0.0.1"],
  
  // Additional config options
  experimental: {
    // Enable any experimental features if needed
  },
};

export default nextConfig;
