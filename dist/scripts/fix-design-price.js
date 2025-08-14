"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function fixDesignPrices() {
    try {
        // Обновляем цену опции "Нужен дизайн" на 0 для всех товаров
        const result = await prisma.productOption.updateMany({
            where: {
                category: 'design',
                name: 'Нужен дизайн'
            },
            data: {
                price: 0
            }
        });
        console.log(`✅ Обновлено ${result.count} опций "Нужен дизайн" - цена установлена на 0`);
        // Проверим результат
        const updatedOptions = await prisma.productOption.findMany({
            where: {
                category: 'design',
                name: 'Нужен дизайн'
            },
            include: {
                product: {
                    select: {
                        name: true
                    }
                }
            }
        });
        console.log('\n📋 Обновленные опции:');
        updatedOptions.forEach(option => {
            console.log(`- ${option.product.name}: "${option.name}" - цена: ${option.price} руб.`);
        });
    }
    catch (error) {
        console.error('❌ Ошибка при обновлении цен:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
fixDesignPrices();
