"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function createAdmin() {
    try {
        // Проверяем, есть ли уже админ
        const existingAdmin = await prisma.admin.findFirst();
        if (existingAdmin) {
            console.log('Админ уже существует:', existingAdmin.username);
            return;
        }
        // Создаем админа
        const username = 'admin';
        const password = 'admin123'; // Поменяйте на более безопасный пароль
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const admin = await prisma.admin.create({
            data: {
                username,
                password: hashedPassword
            }
        });
        console.log('✅ Админ создан успешно!');
        console.log('Логин:', username);
        console.log('Пароль:', password);
        console.log('🔒 Обязательно смените пароль после первого входа!');
    }
    catch (error) {
        console.error('Ошибка создания админа:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createAdmin();
