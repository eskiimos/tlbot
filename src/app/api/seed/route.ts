import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(_req: NextRequest) {

  const results: string[] = [];

  try {
    // 1. Товары
    const products = [
      { name: 'Футболка TL', slug: 't-shirt', price: 900, images: ['/products/t-shirt/IMG_0161_resized.webp', '/products/t-shirt/IMG_0243_resized.webp', '/products/t-shirt/IMG_0249_resized.webp', '/products/t-shirt/IMG_0257_resized.webp'], description: 'Стильная футболка TL из качественного хлопка' },
      { name: 'Лонгслив TL', slug: 'longsleeve', price: 1350, images: ['/products/longsleeve/black.webp', '/products/longsleeve/white.webp'], description: 'Удобный лонгслив TL для повседневной носки' },
      { name: 'Свитшот TL', slug: 'sweatshirt', price: 2000, images: ['/products/sweatshirt/black.webp', '/products/sweatshirt/white.webp'], description: 'Теплый свитшот TL с мягким внутренним покрытием' },
      { name: 'Худи TL', slug: 'hoodies', price: 2500, images: ['/products/hoodies/black.webp', '/products/hoodies/white.webp'], description: 'Стильное худи TL с капюшоном' },
      { name: 'Халфзип TL', slug: 'halfzip', price: 2500, images: ['/products/halfzip/black.webp', '/products/halfzip/white.webp'], description: 'Модный халфзип TL с половинной молнией' },
      { name: 'Шоппер TL', slug: 'shopper', price: 400, images: ['/products/shopper/black.webp', '/products/shopper/white.webp'], description: 'Практичная сумка-шоппер TL для покупок' },
      { name: 'Зип худи TL', slug: 'zip-hoodie', price: 3000, images: ['/products/zip-hoodie/black.webp', '/products/zip-hoodie/white.webp'], description: 'Премиум зип худи TL на молнии' },
      { name: 'Штаны TL', slug: 'pants', price: 2200, images: ['/products/pants/black.webp', '/products/pants/white.webp'], description: 'Удобные штаны TL для спорта и отдыха' },
      { name: 'Джинсы TL', slug: 'jeans', price: 4000, images: ['/products/jeans/black.webp', '/products/jeans/white.webp'], description: 'Качественные джинсы TL классического кроя' },
      { name: 'Шорты TL', slug: 'shorts', price: 1600, images: ['/products/shorts/black.webp', '/products/shorts/white.webp'], description: 'Комфортные шорты TL для лета' },
    ];

    for (const p of products) {
      await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
    }
    results.push(`✅ Товаров: ${products.length}`);

    // 2. Ценовые уровни
    const priceTiersData = [
      { slug: 't-shirt', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 1350 }, { minQuantity: 25, maxQuantity: 49, price: 1260 }, { minQuantity: 50, maxQuantity: 74, price: 1170 }, { minQuantity: 75, maxQuantity: 99, price: 1080 }, { minQuantity: 100, maxQuantity: null, price: 900 }] },
      { slug: 'longsleeve', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 1485 }, { minQuantity: 25, maxQuantity: 49, price: 1377 }, { minQuantity: 50, maxQuantity: 74, price: 1269 }, { minQuantity: 75, maxQuantity: 99, price: 1161 }, { minQuantity: 100, maxQuantity: null, price: 1350 }] },
      { slug: 'sweatshirt', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 2200 }, { minQuantity: 25, maxQuantity: 49, price: 2040 }, { minQuantity: 50, maxQuantity: 74, price: 1880 }, { minQuantity: 75, maxQuantity: 99, price: 1720 }, { minQuantity: 100, maxQuantity: null, price: 2000 }] },
      { slug: 'hoodies', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 2750 }, { minQuantity: 25, maxQuantity: 49, price: 2550 }, { minQuantity: 50, maxQuantity: 74, price: 2350 }, { minQuantity: 75, maxQuantity: 99, price: 2150 }, { minQuantity: 100, maxQuantity: null, price: 2500 }] },
      { slug: 'halfzip', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 2750 }, { minQuantity: 25, maxQuantity: 49, price: 2550 }, { minQuantity: 50, maxQuantity: 74, price: 2350 }, { minQuantity: 75, maxQuantity: 99, price: 2150 }, { minQuantity: 100, maxQuantity: null, price: 2500 }] },
      { slug: 'zip-hoodie', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 3300 }, { minQuantity: 25, maxQuantity: 49, price: 3060 }, { minQuantity: 50, maxQuantity: 74, price: 2820 }, { minQuantity: 75, maxQuantity: 99, price: 2580 }, { minQuantity: 100, maxQuantity: null, price: 3000 }] },
      { slug: 'shopper', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 544 }, { minQuantity: 25, maxQuantity: 49, price: 504 }, { minQuantity: 50, maxQuantity: 74, price: 464 }, { minQuantity: 75, maxQuantity: 99, price: 424 }, { minQuantity: 100, maxQuantity: null, price: 400 }] },
      { slug: 'jeans', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 4400 }, { minQuantity: 25, maxQuantity: 49, price: 4080 }, { minQuantity: 50, maxQuantity: 74, price: 3760 }, { minQuantity: 75, maxQuantity: 99, price: 3440 }, { minQuantity: 100, maxQuantity: null, price: 4000 }] },
      { slug: 'shorts', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 1760 }, { minQuantity: 25, maxQuantity: 49, price: 1632 }, { minQuantity: 50, maxQuantity: 74, price: 1504 }, { minQuantity: 75, maxQuantity: 99, price: 1376 }, { minQuantity: 100, maxQuantity: null, price: 1600 }] },
      { slug: 'pants', tiers: [{ minQuantity: 10, maxQuantity: 24, price: 2420 }, { minQuantity: 25, maxQuantity: 49, price: 2244 }, { minQuantity: 50, maxQuantity: 74, price: 2068 }, { minQuantity: 75, maxQuantity: 99, price: 1892 }, { minQuantity: 100, maxQuantity: null, price: 2200 }] },
    ];

    for (const pd of priceTiersData) {
      const product = await prisma.product.findUnique({ where: { slug: pd.slug } });
      if (!product) continue;
      await prisma.priceTier.deleteMany({ where: { productId: product.id } });
      for (const tier of pd.tiers) {
        await prisma.priceTier.create({ data: { productId: product.id, ...tier } });
      }
    }
    results.push(`✅ Ценовые уровни: ${priceTiersData.length} товаров`);

    // 3. Опции товаров
    const baseOptions = [
      { category: 'color', name: 'Белый', price: 0, isDefault: true },
      { category: 'color', name: 'Черный', price: 0, isDefault: false },
      { category: 'color', name: 'Серый', price: 0, isDefault: false },
      { category: 'color', name: 'Темно-синий', price: 0, isDefault: false },
      { category: 'color', name: 'Индивидуальный', price: 50, isDefault: false },
      { category: 'design', name: 'Не нужен', price: 0, isDefault: true },
      { category: 'design', name: 'Нужен дизайн', price: 150, isDefault: false },
      { category: 'print', name: 'Без нанесения', price: 0, isDefault: true },
      { category: 'print', name: 'Шелкография (1 цвет)', price: 35, isDefault: false },
      { category: 'print', name: 'Шелкография (2-3 цвета)', price: 55, isDefault: false },
      { category: 'print', name: 'Шелкография (4+ цветов)', price: 75, isDefault: false },
      { category: 'print', name: 'Термотрансфер', price: 45, isDefault: false },
      { category: 'print', name: 'Вышивка (до 10 000 стежков)', price: 120, isDefault: false },
      { category: 'print', name: 'Прямая цифровая печать', price: 95, isDefault: false },
      { category: 'label', name: 'Без дополнительных элементов', price: 0, isDefault: true },
      { category: 'label', name: 'Составник (уход за изделием)', price: 15, isDefault: false },
      { category: 'label', name: 'Размерная бирка', price: 12, isDefault: false },
      { category: 'label', name: 'Брендовая этикетка', price: 25, isDefault: false },
      { category: 'label', name: 'Полный комплект бирок', price: 45, isDefault: false },
      { category: 'packaging', name: 'Без упаковки', price: 0, isDefault: true },
      { category: 'packaging', name: 'Полиэтиленовый пакет', price: 8, isDefault: false },
      { category: 'packaging', name: 'Крафт-пакет', price: 15, isDefault: false },
      { category: 'packaging', name: 'Брендированная коробка', price: 35, isDefault: false },
      { category: 'packaging', name: 'Подарочная упаковка', price: 55, isDefault: false },
    ];

    const allProducts = await prisma.product.findMany();
    for (const product of allProducts) {
      await prisma.productOption.deleteMany({ where: { productId: product.id } });
      for (const opt of baseOptions) {
        await prisma.productOption.create({ data: { productId: product.id, ...opt, isActive: true } });
      }
    }
    results.push(`✅ Опции: ${baseOptions.length} × ${allProducts.length} товаров`);

    // 4. Услуги
    const services = [
      { name: 'Дизайн изделия', slug: 'product-design', description: 'Разработка уникального дизайна для вашего изделия.', priceFrom: 1500000, priceTo: null, category: 'design', isActive: true },
      { name: 'Дизайн дропа', slug: 'drop-design', description: 'Комплексная разработка дизайна для всего дропа (коллекции).', priceFrom: 5000000, priceTo: null, category: 'design', isActive: true },
    ];
    for (const s of services) {
      await prisma.service.upsert({ where: { slug: s.slug }, update: s, create: s });
    }
    results.push(`✅ Услуги: ${services.length}`);

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
