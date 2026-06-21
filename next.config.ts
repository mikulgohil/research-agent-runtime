import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. Without this, a stray lockfile in a
  // parent directory can make Turbopack infer the wrong root.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
