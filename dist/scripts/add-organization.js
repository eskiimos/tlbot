"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function addOrganizationToUser() {
    try {
        // Находим тестового пользователя
        const user = await prisma.user.findUnique({
            where: { telegramId: BigInt(123456789) }
        });
        if (!user) {
            console.log('❌ Тестовый пользователь не найден');
            return;
        }
        console.log('👤 Найден пользователь:', user.firstName, user.lastName);
        // Создаем организацию для пользователя
        const organization = await prisma.organization.create({
            data: {
                contactName: 'ООО "Тестовая Компания"',
                inn: '1234567890',
                phone: '+7 (999) 123-45-67',
                email: 'test@company.ru',
                userId: user.id
            }
        });
        console.log('✅ Организация создана:', organization);
        // Проверяем результат
        const updatedUser = await prisma.user.findUnique({
            where: { telegramId: BigInt(123456789) },
            include: { organization: true }
        });
        console.log('🔄 Обновленные данные пользователя:');
        console.log('👤 Пользователь:', {
            telegramId: updatedUser.telegramId.toString(),
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            username: updatedUser.username
        });
        console.log('🏢 Организация:', updatedUser.organization);
    }
    catch (error) {
        console.error('❌ Ошибка:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
addOrganizationToUser();
