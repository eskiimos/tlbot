"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestUser() {
    try {
        // Создаем тестового пользователя
        const user = await prisma.user.create({
            data: {
                telegramId: BigInt(123456789), // Тестовый ID для Telegram WebApp
                username: 'testuser',
                firstName: 'Иван',
                lastName: 'Иванов',
                language: 'ru',
                organization: {
                    create: {
                        contactName: 'ООО "Тестовая Компания"',
                        inn: '1234567890',
                        phone: '+7 (999) 123-45-67',
                        email: 'test@company.ru'
                    }
                }
            },
            include: {
                organization: true
            }
        });
        console.log('✅ Тестовый пользователь создан:');
        console.log('👤 Пользователь:', {
            telegramId: user.telegramId.toString(),
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username
        });
        console.log('🏢 Организация:', user.organization);
    }
    catch (error) {
        console.error('❌ Ошибка при создании пользователя:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestUser();
