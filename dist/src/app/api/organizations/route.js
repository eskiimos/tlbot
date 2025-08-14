"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
async function POST(request) {
    console.log('🚀 POST /api/organizations - запрос получен');
    try {
        const body = await request.json();
        console.log('📋 Получены данные организации:', body);
        const { contactName, inn, phone, email, user } = body;
        // Валидация обязательных полей
        if (!contactName || !inn || !phone || !user?.id) {
            console.log('Ошибка валидации:', { contactName, inn, phone, userId: user?.id });
            return server_1.NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
        }
        console.log('Создаем пользователя...');
        // Создаем или находим пользователя
        const existingUser = await prisma_1.prisma.user.upsert({
            where: { telegramId: BigInt(user.id) },
            update: {
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name || null,
            },
            create: {
                telegramId: BigInt(user.id),
                username: user.username,
                firstName: user.first_name,
                lastName: user.last_name || null,
            }
        });
        console.log('Пользователь создан/обновлен:', existingUser.id);
        console.log('Создаем организацию...');
        // Создаем или обновляем организацию
        const organization = await prisma_1.prisma.organization.upsert({
            where: { userId: existingUser.id },
            update: {
                contactName,
                inn,
                phone,
                email: email || null,
            },
            create: {
                contactName,
                inn,
                phone,
                email: email || null,
                userId: existingUser.id,
            }
        });
        console.log('Организация создана/обновлена:', organization.id);
        return server_1.NextResponse.json({
            success: true,
            organization: {
                id: organization.id,
                contactName: organization.contactName,
                inn: organization.inn,
                phone: organization.phone,
                email: organization.email,
                createdAt: organization.createdAt.toISOString(),
                updatedAt: organization.updatedAt.toISOString(),
            }
        });
    }
    catch (error) {
        console.error('Ошибка при сохранении организации:', error);
        return server_1.NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
async function GET(request) {
    console.log('🔍 GET /api/organizations - запрос получен');
    try {
        const { searchParams } = new URL(request.url);
        const telegramId = searchParams.get('telegramId');
        console.log('📱 Ищем организацию для telegramId:', telegramId);
        if (!telegramId) {
            return server_1.NextResponse.json({ error: 'Отсутствует telegramId' }, { status: 400 });
        }
        // Находим пользователя и его организацию
        const user = await prisma_1.prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
            include: { organization: true }
        });
        if (!user || !user.organization) {
            return server_1.NextResponse.json({ organization: null }, { status: 200 });
        }
        return server_1.NextResponse.json({
            organization: {
                id: user.organization.id,
                contactName: user.organization.contactName,
                inn: user.organization.inn,
                phone: user.organization.phone,
                email: user.organization.email,
                createdAt: user.organization.createdAt.toISOString(),
                updatedAt: user.organization.updatedAt.toISOString(),
            }
        });
    }
    catch (error) {
        console.error('Ошибка при получении организации:', error);
        return server_1.NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
