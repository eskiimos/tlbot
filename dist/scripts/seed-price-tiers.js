"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Ценовые уровни для всех товаров (минимальный заказ 10 штук)
const priceTiersData = [
    {
        slug: 't-shirt',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 1350 },
            { minQuantity: 25, maxQuantity: 49, price: 1260 },
            { minQuantity: 50, maxQuantity: 74, price: 1170 },
            { minQuantity: 75, maxQuantity: 99, price: 1080 },
            { minQuantity: 100, maxQuantity: null, price: 900 }, // 100+ штук
        ]
    },
    {
        slug: 'longsleeve',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 1485 },
            { minQuantity: 25, maxQuantity: 49, price: 1377 },
            { minQuantity: 50, maxQuantity: 74, price: 1269 },
            { minQuantity: 75, maxQuantity: 99, price: 1161 },
            { minQuantity: 100, maxQuantity: null, price: 1350 }, // 100+ штук
        ]
    },
    {
        slug: 'sweatshirt',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 2200 },
            { minQuantity: 25, maxQuantity: 49, price: 2040 },
            { minQuantity: 50, maxQuantity: 74, price: 1880 },
            { minQuantity: 75, maxQuantity: 99, price: 1720 },
            { minQuantity: 100, maxQuantity: null, price: 2000 }, // 100+ штук
        ]
    },
    {
        slug: 'hoodies',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 2750 },
            { minQuantity: 25, maxQuantity: 49, price: 2550 },
            { minQuantity: 50, maxQuantity: 74, price: 2350 },
            { minQuantity: 75, maxQuantity: 99, price: 2150 },
            { minQuantity: 100, maxQuantity: null, price: 2500 }, // 100+ штук
        ]
    },
    {
        slug: 'halfzip',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 2750 },
            { minQuantity: 25, maxQuantity: 49, price: 2550 },
            { minQuantity: 50, maxQuantity: 74, price: 2350 },
            { minQuantity: 75, maxQuantity: 99, price: 2150 },
            { minQuantity: 100, maxQuantity: null, price: 2500 }, // 100+ штук
        ]
    },
    {
        slug: 'zip-hoodie',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 3300 },
            { minQuantity: 25, maxQuantity: 49, price: 3060 },
            { minQuantity: 50, maxQuantity: 74, price: 2820 },
            { minQuantity: 75, maxQuantity: 99, price: 2580 },
            { minQuantity: 100, maxQuantity: null, price: 3000 }, // 100+ штук
        ]
    },
    {
        slug: 'shopper',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 544 }, // +36% от минимальной цены
            { minQuantity: 25, maxQuantity: 49, price: 504 }, // +26% от минимальной цены
            { minQuantity: 50, maxQuantity: 74, price: 464 }, // +16% от минимальной цены
            { minQuantity: 75, maxQuantity: 99, price: 424 }, // +6% от минимальной цены
            { minQuantity: 100, maxQuantity: null, price: 400 }, // 100+ штук - самая низкая цена
        ]
    },
    {
        slug: 'jeans',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 4400 },
            { minQuantity: 25, maxQuantity: 49, price: 4080 },
            { minQuantity: 50, maxQuantity: 74, price: 3760 },
            { minQuantity: 75, maxQuantity: 99, price: 3440 },
            { minQuantity: 100, maxQuantity: null, price: 4000 }, // 100+ штук
        ]
    },
    {
        slug: 'shorts',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 1760 },
            { minQuantity: 25, maxQuantity: 49, price: 1632 },
            { minQuantity: 50, maxQuantity: 74, price: 1504 },
            { minQuantity: 75, maxQuantity: 99, price: 1376 },
            { minQuantity: 100, maxQuantity: null, price: 1600 }, // 100+ штук
        ]
    },
    {
        slug: 'pants',
        tiers: [
            { minQuantity: 10, maxQuantity: 24, price: 2420 },
            { minQuantity: 25, maxQuantity: 49, price: 2244 },
            { minQuantity: 50, maxQuantity: 74, price: 2068 },
            { minQuantity: 75, maxQuantity: 99, price: 1892 },
            { minQuantity: 100, maxQuantity: null, price: 2200 }, // 100+ штук
        ]
    }
];
async function main() {
    console.log('Добавляем ценовые уровни...');
    for (const productData of priceTiersData) {
        // Находим товар по slug
        const product = await prisma.product.findUnique({
            where: { slug: productData.slug }
        });
        if (!product) {
            console.log(`Товар с slug "${productData.slug}" не найден`);
            continue;
        }
        // Удаляем существующие ценовые уровни
        await prisma.priceTier.deleteMany({
            where: { productId: product.id }
        });
        // Добавляем новые ценовые уровни
        for (const tier of productData.tiers) {
            await prisma.priceTier.create({
                data: {
                    productId: product.id,
                    minQuantity: tier.minQuantity,
                    maxQuantity: tier.maxQuantity,
                    price: tier.price
                }
            });
        }
        console.log(`Добавлены ценовые уровни для "${product.name}"`);
    }
    console.log('Ценовые уровни успешно добавлены!');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
