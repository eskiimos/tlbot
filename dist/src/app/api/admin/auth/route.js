"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
exports.GET = GET;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const prisma_1 = require("../../../../lib/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
async function POST(request) {
    try {
        const { username, password } = await request.json();
        if (!username || !password) {
            return server_1.NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
        }
        // Ищем админа в базе данных
        const admin = await prisma_1.prisma.admin.findUnique({
            where: { username }
        });
        if (!admin) {
            return server_1.NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
        }
        // Проверяем пароль
        const isValidPassword = await bcrypt_1.default.compare(password, admin.password);
        if (!isValidPassword) {
            return server_1.NextResponse.json({ error: 'Неверный логин или пароль' }, { status: 401 });
        }
        // Создаем JWT токен
        const token = jsonwebtoken_1.default.sign({ adminId: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
        const response = server_1.NextResponse.json({
            message: 'Авторизация успешна',
            admin: { id: admin.id, username: admin.username }
        });
        // Устанавливаем httpOnly cookie с токеном
        response.cookies.set('admin-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 // 24 часа
        });
        return response;
    }
    catch (error) {
        console.error('Ошибка авторизации админа:', error);
        return server_1.NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
}
// Проверка авторизации
async function GET(request) {
    try {
        const token = request.cookies.get('admin-token')?.value;
        if (!token) {
            return server_1.NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
        }
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const admin = await prisma_1.prisma.admin.findUnique({
            where: { id: decoded.adminId },
            select: { id: true, username: true }
        });
        if (!admin) {
            return server_1.NextResponse.json({ error: 'Админ не найден' }, { status: 401 });
        }
        return server_1.NextResponse.json({ admin });
    }
    catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        return server_1.NextResponse.json({ error: 'Неверный токен' }, { status: 401 });
    }
}
// Выход
async function DELETE() {
    const response = server_1.NextResponse.json({ message: 'Выход выполнен' });
    response.cookies.delete('admin-token');
    return response;
}
