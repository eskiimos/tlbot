import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
  },
  eslint: {
    // Игнорируем ESLint ошибки при сборке в продакшене
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Игнорируем ошибки типов при сборке в продакшене
    ignoreBuildErrors: true,
  },
  serverExternalPackages: ['@prisma/client', 'prisma'],
  webpack: (config) => {
    // Исправляем проблемы с внешними модулями
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
};

export default nextConfig;
