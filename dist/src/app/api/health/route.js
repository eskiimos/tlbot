"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
async function GET() {
    try {
        // Проверяем подключение к базе данных
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        return server_1.NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
            version: process.env.npm_package_version || '1.0.0'
        });
    }
    catch (error) {
        console.error('Health check failed:', error);
        return server_1.NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
}
