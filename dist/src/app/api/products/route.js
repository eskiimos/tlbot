"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const prisma_1 = require("@/lib/prisma");
async function GET() {
    try {
        console.log('Получаем товары из базы данных...');
        const products = await prisma_1.prisma.product.findMany({
            include: {
                priceTiers: {
                    orderBy: {
                        minQuantity: 'asc'
                    }
                },
                options: {
                    orderBy: [
                        { category: 'asc' },
                        { isDefault: 'desc' },
                        { name: 'asc' }
                    ]
                }
            },
            where: {
                isActive: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        console.log(`Найдено товаров: ${products.length}`);
        // Преобразуем BigInt в строки для JSON
        const serializedProducts = products.map(product => ({
            ...product,
            priceTiers: product.priceTiers.map(tier => ({
                ...tier,
                id: tier.id.toString(),
                minQuantity: tier.minQuantity,
                maxQuantity: tier.maxQuantity,
                price: tier.price
            }))
        }));
        return server_1.NextResponse.json({
            success: true,
            products: serializedProducts
        });
    }
    catch (error) {
        console.error('Ошибка при получении товаров:', error);
        return server_1.NextResponse.json({
            success: false,
            error: 'Внутренняя ошибка сервера',
            details: error instanceof Error ? error.message : 'Неизвестная ошибка'
        }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const body = await request.json();
        const { name, slug, price, images, description } = body;
        if (!name || !slug || !price) {
            return server_1.NextResponse.json({ error: 'Отсутствуют обязательные поля' }, { status: 400 });
        }
        const product = await prisma_1.prisma.product.create({
            data: {
                name,
                slug,
                price: parseInt(price),
                images: images || [],
                description: description || null,
            }
        });
        return server_1.NextResponse.json({
            success: true,
            product: {
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                images: product.images,
                description: product.description,
                createdAt: product.createdAt.toISOString(),
                updatedAt: product.updatedAt.toISOString(),
            }
        });
    }
    catch (error) {
        console.error('Ошибка при создании товара:', error);
        return server_1.NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
    }
}
