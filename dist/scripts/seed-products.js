"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedProducts() {
    console.log('🌱 Добавляем товары...');
    const products = [
        {
            name: 'Футболка TL',
            slug: 't-shirt',
            price: 900,
            images: [
                '/products/t-shirt/IMG_0161_resized.webp',
                '/products/t-shirt/IMG_0243_resized.webp',
                '/products/t-shirt/IMG_0249_resized.webp',
                '/products/t-shirt/IMG_0257_resized.webp'
            ],
            description: 'Стильная футболка TL из качественного хлопка'
        },
        {
            name: 'Лонгслив TL',
            slug: 'longsleeve',
            price: 1350,
            images: [
                '/products/longsleeve/black.webp',
                '/products/longsleeve/white.webp'
            ],
            description: 'Удобный лонгслив TL для повседневной носки'
        },
        {
            name: 'Свитшот TL',
            slug: 'sweatshirt',
            price: 2000,
            images: [
                '/products/sweatshirt/black.webp',
                '/products/sweatshirt/white.webp'
            ],
            description: 'Теплый свитшот TL с мягким внутренним покрытием'
        },
        {
            name: 'Худи TL',
            slug: 'hoodies',
            price: 2500,
            images: [
                '/products/hoodies/black.webp',
                '/products/hoodies/white.webp'
            ],
            description: 'Стильное худи TL с капюшоном'
        },
        {
            name: 'Халфзип TL',
            slug: 'halfzip',
            price: 2500,
            images: [
                '/products/halfzip/black.webp',
                '/products/halfzip/white.webp'
            ],
            description: 'Модный халфзип TL с половинной молнией'
        },
        {
            name: 'Шоппер TL',
            slug: 'shopper',
            price: 400,
            images: [
                '/products/shopper/black.webp',
                '/products/shopper/white.webp'
            ],
            description: 'Практичная сумка-шоппер TL для покупок'
        },
        {
            name: 'Зип худи TL',
            slug: 'zip-hoodie',
            price: 3000,
            images: [
                '/products/zip-hoodie/black.webp',
                '/products/zip-hoodie/white.webp'
            ],
            description: 'Премиум зип худи TL на молнии'
        },
        {
            name: 'Штаны TL',
            slug: 'pants',
            price: 2200,
            images: [
                '/products/pants/black.webp',
                '/products/pants/white.webp'
            ],
            description: 'Удобные штаны TL для спорта и отдыха'
        },
        {
            name: 'Джинсы TL',
            slug: 'jeans',
            price: 4000,
            images: [
                '/products/jeans/black.webp',
                '/products/jeans/white.webp'
            ],
            description: 'Качественные джинсы TL классического кроя'
        },
        {
            name: 'Шорты TL',
            slug: 'shorts',
            price: 1600,
            images: [
                '/products/shorts/black.webp',
                '/products/shorts/white.webp'
            ],
            description: 'Комфортные шорты TL для лета'
        }
    ];
    for (const product of products) {
        await prisma.product.upsert({
            where: { slug: product.slug },
            update: product,
            create: product,
        });
    }
    console.log('✅ Товары успешно добавлены!');
}
async function main() {
    try {
        await seedProducts();
    }
    catch (error) {
        console.error('Ошибка при заполнении данных:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
