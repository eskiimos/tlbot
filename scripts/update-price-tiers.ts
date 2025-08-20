#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePriceTiers() {
  try {
    console.log('🏷️ Обновляем ценовые уровни для футболок...');

    // Находим футболку TL
    const tshirt = await prisma.product.findFirst({
      where: {
        slug: 't-shirt'
      },
      include: {
        priceTiers: true
      }
    });

    if (!tshirt) {
      console.log('❌ Футболка не найдена');
      return;
    }

    console.log(`📦 Найдена футболка: ${tshirt.name}`);

    // Удаляем старые ценовые уровни
    await prisma.priceTier.deleteMany({
      where: {
        productId: tshirt.id
      }
    });

    console.log('🗑️ Удалены старые ценовые уровни');

    // Базовая цена (самая низкая за единицу при максимальном заказе)
    const basePrice = 900; // 900₽ за футболку при заказе 100+ шт

    // Создаем градиентную систему ценообразования
    const priceTiers = [
      {
        minQuantity: 10,
        maxQuantity: 24,
        price: Math.round(basePrice * 1.5), // +50% к базовой = 1350₽
        productId: tshirt.id
      },
      {
        minQuantity: 25,
        maxQuantity: 49,
        price: Math.round(basePrice * 1.4), // +40% к базовой = 1260₽
        productId: tshirt.id
      },
      {
        minQuantity: 50,
        maxQuantity: 74,
        price: Math.round(basePrice * 1.3), // +30% к базовой = 1170₽
        productId: tshirt.id
      },
      {
        minQuantity: 75,
        maxQuantity: 99,
        price: Math.round(basePrice * 1.2), // +20% к базовой = 1080₽
        productId: tshirt.id
      },
      {
        minQuantity: 100,
        maxQuantity: null, // без ограничений
        price: basePrice, // базовая цена = 900₽
        productId: tshirt.id
      }
    ];

    // Добавляем новые ценовые уровни
    for (const tier of priceTiers) {
      await prisma.priceTier.create({
        data: tier
      });
      console.log(`✅ Добавлен уровень: ${tier.minQuantity}-${tier.maxQuantity || '∞'} шт = ${tier.price}₽`);
    }

    // Обновляем базовую цену товара на стартовую цену
    await prisma.product.update({
      where: { id: tshirt.id },
      data: {
        price: priceTiers[0].price // 1350₽ - стартовая цена
      }
    });

    console.log(`🏷️ Обновлена базовая цена товара: ${priceTiers[0].price}₽`);
    console.log('🎉 Градиентная система ценообразования настроена!');

  } catch (error) {
    console.error('❌ Ошибка при обновлении ценовых уровней:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePriceTiers();
