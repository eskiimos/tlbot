#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAllProductPriceTiers() {
  try {
    console.log('🏷️ Обновляем ценовые уровни для всех товаров...');

    // Получаем все товары
    const products = await prisma.product.findMany({
      include: {
        priceTiers: true
      }
    });

    console.log(`📦 Найдено товаров: ${products.length}`);

    for (const product of products) {
      console.log(`\n🔄 Обрабатываем: ${product.name}`);

      // Удаляем старые ценовые уровни
      await prisma.priceTier.deleteMany({
        where: {
          productId: product.id
        }
      });

      // Определяем базовую цену в зависимости от типа товара
      let basePrice = 900; // по умолчанию для футболок
      
      switch (product.slug) {
        case 't-shirt':
          basePrice = 900;
          break;
        case 'longsleeve':
          basePrice = 1100;
          break;
        case 'sweatshirt':
          basePrice = 1300;
          break;
        case 'hoodies':
          basePrice = 1500;
          break;
        case 'halfzip':
          basePrice = 1600;
          break;
        case 'pants':
          basePrice = 1800;
          break;
        case 'shorts':
          basePrice = 1000;
          break;
        default:
          basePrice = 1000; // для остальных товаров
      }

      // Создаем градиентную систему ценообразования
      const priceTiers = [
        {
          minQuantity: 10,
          maxQuantity: 24,
          price: Math.round(basePrice * 1.5), // +50% к базовой
          productId: product.id
        },
        {
          minQuantity: 25,
          maxQuantity: 49,
          price: Math.round(basePrice * 1.4), // +40% к базовой
          productId: product.id
        },
        {
          minQuantity: 50,
          maxQuantity: 74,
          price: Math.round(basePrice * 1.3), // +30% к базовой
          productId: product.id
        },
        {
          minQuantity: 75,
          maxQuantity: 99,
          price: Math.round(basePrice * 1.2), // +20% к базовой
          productId: product.id
        },
        {
          minQuantity: 100,
          maxQuantity: null, // без ограничений
          price: basePrice, // базовая цена
          productId: product.id
        }
      ];

      // Добавляем новые ценовые уровни
      for (const tier of priceTiers) {
        await prisma.priceTier.create({
          data: tier
        });
      }

      // Обновляем базовую цену товара на стартовую цену
      await prisma.product.update({
        where: { id: product.id },
        data: {
          price: priceTiers[0].price // стартовая цена
        }
      });

      console.log(`✅ ${product.name}: ${priceTiers[0].price}₽ - ${basePrice}₽ (5 уровней)`);
    }

    console.log('\n🎉 Градиентная система ценообразования настроена для всех товаров!');

  } catch (error) {
    console.error('❌ Ошибка при обновлении ценовых уровней:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllProductPriceTiers();
