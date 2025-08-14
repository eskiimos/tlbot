"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function createTestOrder() {
    try {
        console.log('Создаем тестовый заказ...');
        const order = await prisma.order.create({
            data: {
                userId: '1',
                telegramId: '123456789',
                customerName: 'Тест Тестов',
                customerEmail: 'test@example.com',
                customerPhone: '+7 900 123-45-67',
                customerCompany: 'ООО "Тестовая компания"',
                customerInn: '1234567890',
                items: [
                    {
                        id: '1',
                        name: 'Футболка Total Lookas',
                        price: 2500,
                        quantity: 10,
                        color: 'Черный',
                        size: 'L'
                    },
                    {
                        id: '2',
                        name: 'Худи Total Lookas',
                        price: 4500,
                        quantity: 5,
                        color: 'Белый',
                        size: 'M'
                    }
                ],
                totalAmount: 47500,
                status: 'NEW'
            }
        });
        console.log('✅ Тестовый заказ создан:', order);
        // Создаем еще один заказ с другим статусом
        const order2 = await prisma.order.create({
            data: {
                userId: '2',
                telegramId: '987654321',
                customerName: 'Анна Иванова',
                customerEmail: 'anna@company.com',
                customerPhone: '+7 911 555-77-88',
                customerCompany: 'ООО "Модная компания"',
                customerInn: '9876543210',
                items: [
                    {
                        id: '3',
                        name: 'Кружка Total Lookas',
                        price: 800,
                        quantity: 20,
                        color: 'Белый',
                        size: 'Стандарт'
                    }
                ],
                totalAmount: 16000,
                status: 'IN_PROGRESS',
                adminComment: 'Обсуждаем детали макета'
            }
        });
        console.log('✅ Второй тестовый заказ создан:', order2);
    }
    catch (error) {
        console.error('❌ Ошибка создания тестового заказа:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestOrder();
