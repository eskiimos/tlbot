import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        images: true
      }
    });

    console.log('Товары в базе данных:');
    console.log('===================');
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} (${product.slug})`);
      console.log(`   Цена: ${product.price}₽`);
      console.log(`   Изображения: ${product.images.length > 0 ? product.images.join(', ') : 'НЕТ ИЗОБРАЖЕНИЙ'}`);
      console.log(`   Описание: ${product.description || 'НЕТ ОПИСАНИЯ'}`);
      console.log('');
    });

    console.log(`Всего товаров: ${products.length}`);
    
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getProducts();
