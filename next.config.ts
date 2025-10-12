import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  eslint: {
    // Disables ESLint during builds to avoid blocking deployment for minor warnings.
    // This is useful for faster iteration, but it's recommended to fix warnings locally.
    ignoreDuringBuilds: true,
  },
  output: "standalone",
};

export default nextConfig;

