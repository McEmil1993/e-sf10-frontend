import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BASE_API: process.env.BASE_API,
    BASE_URL: process.env.BASE_URL,
  },
};

export default nextConfig;
