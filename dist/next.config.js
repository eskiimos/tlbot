"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nextConfig = {
    eslint: {
        // Игнорируем ESLint ошибки при сборке в продакшене
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Игнорируем ошибки типов при сборке в продакшене
        ignoreBuildErrors: true,
    },
    // Убираем output: 'standalone' для Railway
    experimental: {
        serverComponentsExternalPackages: ['@prisma/client', 'prisma']
    },
    webpack: (config) => {
        // Исправляем проблемы с внешними модулями
        config.externals = [...config.externals, 'canvas', 'jsdom'];
        return config;
    },
};
exports.default = nextConfig;
