"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
// GET /api/messages - получить сообщения
async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');
        const where = userId ? { userId } : {};
        const messages = await prisma_1.prisma.message.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        username: true,
                        telegramId: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset
        });
        // Преобразуем BigInt в строку для JSON
        const messagesResponse = messages.map(message => ({
            ...message,
            telegramId: message.telegramId?.toString(),
            user: {
                ...message.user,
                telegramId: message.user.telegramId.toString()
            }
        }));
        return server_1.NextResponse.json(messagesResponse);
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        return server_1.NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}
// POST /api/messages - создать сообщение
async function POST(request) {
    try {
        const body = await request.json();
        const { userId, content, type, telegramId } = body;
        if (!userId || !content) {
            return server_1.NextResponse.json({ error: 'userId and content are required' }, { status: 400 });
        }
        const message = await prisma_1.prisma.message.create({
            data: {
                userId,
                content,
                type: type || 'TEXT',
                telegramId: telegramId ? BigInt(telegramId) : null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        username: true,
                        telegramId: true
                    }
                }
            }
        });
        // Преобразуем BigInt в строку для JSON
        const messageResponse = {
            ...message,
            telegramId: message.telegramId?.toString(),
            user: {
                ...message.user,
                telegramId: message.user.telegramId.toString()
            }
        };
        return server_1.NextResponse.json(messageResponse);
    }
    catch (error) {
        console.error('Error creating message:', error);
        return server_1.NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }
}
