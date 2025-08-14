"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
const server_1 = require("next/server");
const prisma_1 = require("../../../../../lib/prisma");
const telegraf_1 = require("telegraf");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Middleware для проверки авторизации
async function checkAuth(request) {
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
        throw new Error('Не авторизован');
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const admin = await prisma_1.prisma.admin.findUnique({
            where: { id: decoded.adminId }
        });
        if (!admin) {
            throw new Error('Админ не найден');
        }
        return admin;
    }
    catch (error) {
        throw new Error('Неверный токен');
    }
}
// Функция для отправки уведомления пользователю
async function sendStatusNotification(telegramId, orderId, newStatus, adminComment) {
    const statusMessages = {
        'NEW': '📝 Новая заявка',
        'IN_PROGRESS': '⚙️ Заявка принята в обработку',
        'DESIGN': '🎨 Работаем над дизайном',
        'PRODUCTION': '🏭 Запущено в производство',
        'READY': '✅ Заказ готов к выдаче',
        'COMPLETED': '🎉 Заказ завершен',
        'CANCELLED': '❌ Заказ отменен'
    };
    const message = `🔄 Статус вашего заказа #${orderId.slice(-8)} изменился!\n\n` +
        `Новый статус: ${statusMessages[newStatus] || newStatus}\n\n` +
        (adminComment ? `💬 Комментарий: ${adminComment}\n\n` : '') +
        `Мы уведомим вас о дальнейших изменениях. Спасибо за ваше доверие! 🚀\n\n` +
        `— Команда Total Lookas`;
    try {
        await bot.telegram.sendMessage(telegramId, message);
        console.log(`Уведомление отправлено пользователю ${telegramId} о смене статуса на ${newStatus}`);
    }
    catch (error) {
        console.error(`Ошибка отправки уведомления пользователю ${telegramId}:`, error);
    }
}
async function GET(request, { params }) {
    try {
        await checkAuth(request);
        const orderId = params.id;
        // Получаем заказ
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!order) {
            return server_1.NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
        }
        // Получаем информацию о пользователе отдельно
        let userData = null;
        if (order.userId) {
            try {
                userData = await prisma_1.prisma.user.findUnique({
                    where: { id: order.userId },
                    select: {
                        username: true,
                        firstName: true,
                        lastName: true,
                    },
                });
            }
            catch (error) {
                console.log('Не удалось получить данные пользователя:', error);
            }
        }
        // Преобразуем данные для JSON
        const orderData = {
            ...order,
            totalAmount: Number(order.totalAmount), // Преобразуем в число
            user: userData,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
        };
        console.log('🔍 Order data for debugging:', JSON.stringify(orderData, null, 2));
        console.log('🛍️ Order items:', orderData.items);
        return server_1.NextResponse.json({ order: orderData });
    }
    catch (error) {
        console.error('Ошибка получения заказа:', error);
        const message = error instanceof Error ? error.message : 'Ошибка сервера';
        const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
        return server_1.NextResponse.json({ error: message }, { status });
    }
}
async function PATCH(request, { params }) {
    try {
        await checkAuth(request);
        const { status, adminComment } = await request.json();
        const orderId = params.id;
        // Получаем текущий заказ
        const currentOrder = await prisma_1.prisma.order.findUnique({
            where: { id: orderId }
        });
        if (!currentOrder) {
            return server_1.NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
        }
        // Обновляем заказ
        const updatedOrder = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                adminComment: adminComment || currentOrder.adminComment,
                updatedAt: new Date()
            }
        });
        // Отправляем уведомление пользователю, если статус изменился
        if (currentOrder.status !== status) {
            await sendStatusNotification(currentOrder.telegramId, orderId, status, adminComment);
        }
        console.log(`Заказ #${orderId} обновлен: статус ${status}`);
        return server_1.NextResponse.json({
            message: 'Статус заказа обновлен',
            order: {
                ...updatedOrder,
                createdAt: updatedOrder.createdAt.toISOString(),
                updatedAt: updatedOrder.updatedAt.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Ошибка обновления заказа:', error);
        const message = error instanceof Error ? error.message : 'Ошибка сервера';
        const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
        return server_1.NextResponse.json({ error: message }, { status });
    }
}
