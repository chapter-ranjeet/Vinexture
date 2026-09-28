import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local builds to use a non-synced directory when OneDrive locks .next.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
