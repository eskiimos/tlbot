"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("../../../../lib/prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
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
// Получить все заказы
async function GET(request) {
    try {
        await checkAuth(request);
        const orders = await prisma_1.prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        // Преобразуем BigInt в строки для JSON
        const serializedOrders = orders.map(order => ({
            ...order,
            items: order.items,
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString()
        }));
        return server_1.NextResponse.json({ orders: serializedOrders });
    }
    catch (error) {
        console.error('Ошибка получения заказов:', error);
        const message = error instanceof Error ? error.message : 'Ошибка сервера';
        const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
        return server_1.NextResponse.json({ error: message }, { status });
    }
}
// Создать заказ (будет вызываться при отправке КП)
async function POST(request) {
    try {
        const { userId, telegramId, customerName, customerEmail, customerPhone, customerCompany, customerInn, items, totalAmount } = await request.json();
        const order = await prisma_1.prisma.order.create({
            data: {
                userId,
                telegramId,
                customerName,
                customerEmail,
                customerPhone,
                customerCompany,
                customerInn,
                items,
                totalAmount,
                status: 'NEW'
            }
        });
        console.log(`Создан новый заказ #${order.id} для пользователя ${customerName}`);
        return server_1.NextResponse.json({
            message: 'Заказ создан',
            orderId: order.id
        });
    }
    catch (error) {
        console.error('Ошибка создания заказа:', error);
        return server_1.NextResponse.json({ error: 'Ошибка создания заказа' }, { status: 500 });
    }
}
