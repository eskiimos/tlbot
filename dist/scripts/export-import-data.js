"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const LOCAL_DATABASE_URL = process.env.DATABASE_URL || 'postgresql://tlbot:password@localhost:5432/tlbot';
const PROD_DATABASE_URL = process.env.PROD_DATABASE_URL || '';
if (!PROD_DATABASE_URL) {
    console.error('❌ PROD_DATABASE_URL не указан!');
    process.exit(1);
}
const localPrisma = new client_1.PrismaClient({
    datasources: { db: { url: LOCAL_DATABASE_URL } }
});
const prodClient = new client_1.PrismaClient({
    datasources: {
        db: {
            url: "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19JSmlsZWtPbUVSU1NMNUFqcEk4ZlIiLCJhcGlfa2V5IjoiMDFLMkVONVNGSDRLOFhWMDJZSlFWWldIREoiLCJ0ZW5hbnRfaWQiOiJjZjliOGZiODExMzhkZTNjMWRhMzUyMzZlODgzNjk5ZTkxZGJkZjI4NjBlYTk3YjMyMjA1NDljYWMxMGNkYTZjIiwiaW50ZXJuYWxfc2VjcmV0IjoiMDAyOTI5OTktNjExNy00MjExLTk4NTEtYTg4MWJmNWJlMjlkIn0.nhR7eZJzJ_kUmw6BDUB-Ol4MdHQmxSuMK8A6bEP1_fc"
        }
    }
});
async function exportImportData() {
    try {
        console.log('🔄 Начинаем экспорт данных из локальной БД...');
        // 1. Экспортируем пользователей
        const users = await localPrisma.user.findMany();
        console.log(`📤 Найдено пользователей: ${users.length}`);
        // 2. Экспортируем товары с связанными данными
        const products = await localPrisma.product.findMany({
            include: {
                priceTiers: true,
                options: true
            }
        });
        console.log(`📤 Найдено товаров: ${products.length}`);
        // 3. Экспортируем организации
        const organizations = await localPrisma.organization.findMany();
        console.log(`📤 Найдено организаций: ${organizations.length}`);
        // 4. Экспортируем сообщения
        const messages = await localPrisma.message.findMany();
        console.log(`📤 Найдено сообщений: ${messages.length}`);
        // 5. Экспортируем заказы
        const orders = await localPrisma.order.findMany();
        console.log(`📤 Найдено заказов: ${orders.length}`);
        // 6. Экспортируем настройки бота
        const botSettings = await localPrisma.botSettings.findMany();
        console.log(`📤 Найдено настроек бота: ${botSettings.length}`);
        // 7. Экспортируем админов
        const admins = await localPrisma.admin.findMany();
        console.log(`📤 Найдено админов: ${admins.length}`);
        // 8. Экспортируем данные веб-приложения
        const webAppData = await localPrisma.webAppData.findMany();
        console.log(`📤 Найдено записей веб-приложения: ${webAppData.length}`);
        console.log('\n🔄 Начинаем импорт данных в продакшн БД...');
        // Импортируем пользователей
        for (const user of users) {
            await prodClient.user.upsert({
                where: { telegramId: user.telegramId },
                create: user,
                update: {
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    language: user.language,
                    isBot: user.isBot,
                    isPremium: user.isPremium
                }
            });
        }
        console.log(`✅ Импортировано пользователей: ${users.length}`);
        // Импортируем товары
        for (const product of products) {
            const { priceTiers, options, ...productData } = product;
            const createdProduct = await prodClient.product.upsert({
                where: { slug: product.slug },
                create: productData,
                update: {
                    name: product.name,
                    price: product.price,
                    images: product.images,
                    description: product.description,
                    isActive: product.isActive
                }
            });
            // Импортируем ценовые уровни
            await prodClient.priceTier.deleteMany({
                where: { productId: createdProduct.id }
            });
            for (const tier of priceTiers) {
                await prodClient.priceTier.create({
                    data: {
                        productId: createdProduct.id,
                        minQuantity: tier.minQuantity,
                        maxQuantity: tier.maxQuantity,
                        price: tier.price
                    }
                });
            }
            // Импортируем опции товара
            await prodClient.productOption.deleteMany({
                where: { productId: createdProduct.id }
            });
            for (const option of options) {
                await prodClient.productOption.create({
                    data: {
                        productId: createdProduct.id,
                        category: option.category,
                        name: option.name,
                        price: option.price,
                        description: option.description,
                        isDefault: option.isDefault,
                        isActive: option.isActive
                    }
                });
            }
        }
        console.log(`✅ Импортировано товаров: ${products.length}`);
        // Импортируем организации
        for (const org of organizations) {
            await prodClient.organization.upsert({
                where: { userId: org.userId },
                create: org,
                update: {
                    contactName: org.contactName,
                    inn: org.inn,
                    phone: org.phone,
                    email: org.email
                }
            });
        }
        console.log(`✅ Импортировано организаций: ${organizations.length}`);
        // Импортируем сообщения
        for (const message of messages) {
            await prodClient.message.create({
                data: message
            });
        }
        console.log(`✅ Импортировано сообщений: ${messages.length}`);
        // Импортируем заказы
        for (const order of orders) {
            await prodClient.order.create({
                data: {
                    userId: order.userId,
                    telegramId: order.telegramId,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    customerPhone: order.customerPhone,
                    customerCompany: order.customerCompany,
                    customerInn: order.customerInn,
                    items: order.items,
                    totalAmount: order.totalAmount,
                    status: order.status,
                    proposalFilePath: order.proposalFilePath,
                    adminComment: order.adminComment
                }
            });
        }
        console.log(`✅ Импортировано заказов: ${orders.length}`);
        // Импортируем настройки бота
        for (const setting of botSettings) {
            await prodClient.botSettings.upsert({
                where: { key: setting.key },
                create: setting,
                update: { value: setting.value }
            });
        }
        console.log(`✅ Импортировано настроек бота: ${botSettings.length}`);
        // Импортируем админов
        for (const admin of admins) {
            await prodClient.admin.upsert({
                where: { username: admin.username },
                create: admin,
                update: { password: admin.password }
            });
        }
        console.log(`✅ Импортировано админов: ${admins.length}`);
        // Импортируем данные веб-приложения
        for (const webData of webAppData) {
            await prodClient.webAppData.create({
                data: {
                    userId: webData.userId,
                    data: webData.data
                }
            });
        }
        console.log(`✅ Импортировано записей веб-приложения: ${webAppData.length}`);
        console.log('\n🎉 Все данные успешно экспортированы и импортированы!');
    }
    catch (error) {
        console.error('❌ Ошибка при экспорте/импорте данных:', error);
        throw error;
    }
    finally {
        await localPrisma.$disconnect();
        await prodClient.$disconnect();
    }
}
exportImportData()
    .catch((e) => {
    console.error(e);
    process.exit(1);
});
