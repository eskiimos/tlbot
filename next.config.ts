import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  // Next.js 16: Turbopack включён по умолчанию, явно объявляем конфиг
  turbopack: {},
  webpack: (config) => {
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
};

export default nextConfig;
