import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/AI-Strategy-Lab",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
