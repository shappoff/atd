import type { NextConfig } from "next";

const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath || undefined,
  transpilePackages: ["@shappoff/ui"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
