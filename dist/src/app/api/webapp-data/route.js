"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
// POST /api/webapp-data - сохранить данные из мини-приложения
async function POST(request) {
    try {
        const body = await request.json();
        const { userId, data } = body;
        if (!userId || !data) {
            return server_1.NextResponse.json({ error: 'userId and data are required' }, { status: 400 });
        }
        const webappData = await prisma_1.prisma.webAppData.create({
            data: {
                userId,
                data
            }
        });
        return server_1.NextResponse.json(webappData);
    }
    catch (error) {
        console.error('Error saving webapp data:', error);
        return server_1.NextResponse.json({ error: 'Failed to save webapp data' }, { status: 500 });
    }
}
// GET /api/webapp-data - получить данные веб-приложения
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '20');
        const where = userId ? { userId } : {};
        const webappData = await prisma_1.prisma.webAppData.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit
        });
        return server_1.NextResponse.json(webappData);
    }
    catch (error) {
        console.error('Error fetching webapp data:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch webapp data' }, { status: 500 });
    }
}
