import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateProductImages() {
  console.log('🖼️ Обновляем изображения товаров...');

  // Обновление изображений для каждого товара на основе реально существующих файлов
  const updates = [
    {
      slug: 't-shirt',
      images: [
        '/products/t-shirt/t-shirt 1.webp',
        '/products/t-shirt/t-shirt 2.webp',
        '/products/t-shirt/t-shirt 3.webp',
        '/products/t-shirt/t-shirt 4.webp',
        '/products/t-shirt/t-shirt 5.webp'
      ]
    },
    {
      slug: 'longsleeve',
      images: [
        '/products/longsleeve/long_sleeve_1.webp',
        '/products/longsleeve/long_sleeve_2.webp',
        '/products/longsleeve/long_sleeve_3.webp',
        '/products/longsleeve/long_sleeve_4.webp',
        '/products/longsleeve/long_sleeve_5.webp'
      ]
    },
    {
      slug: 'sweatshirt',
      images: [
        '/products/sweatshirt/sweatshirt_1.webp',
        '/products/sweatshirt/sweatshirt_2.webp',
        '/products/sweatshirt/sweatshirt_3.webp',
        '/products/sweatshirt/sweatshirt_4.webp',
        '/products/sweatshirt/sweatshirt_5.webp'
      ]
    },
    {
      slug: 'hoodies',
      images: [
        '/products/hoodies/hoodies_1.webp',
        '/products/hoodies/hoodies_2.webp',
        '/products/hoodies/hoodies_3.webp'
      ]
    },
    {
      slug: 'halfzip',
      images: [
        '/products/halfzip/halfzip_1.webp',
        '/products/halfzip/halfzip_2.webp',
        '/products/halfzip/halfzip_3.webp',
        '/products/halfzip/halfzip_4.webp',
        '/products/halfzip/halfzip_5.webp'
      ]
    },
    {
      slug: 'shopper',
      images: [
        '/products/shopper/black.webp',
        '/products/shopper/white.webp'
      ]
    },
    {
      slug: 'zip-hoodie',
      images: [
        '/products/zip-hoodie/zip-hoodie_1.webp',
        '/products/zip-hoodie/zip-hoodie_2.webp',
        '/products/zip-hoodie/zip-hoodie_3.webp'
      ]
    },
    {
      slug: 'pants',
      images: [
        '/products/pants/pants_1.webp',
        '/products/pants/pants_2.webp',
        '/products/pants/pants_3.webp',
        '/products/pants/pants_4.webp',
        '/products/pants/pants_5.webp'
      ]
    },
    {
      slug: 'jeans',
      images: [
        '/products/jeans/black.webp',
        '/products/jeans/white.webp'
      ]
    },
    {
      slug: 'shorts',
      images: [
        '/products/shorts/short_1.webp',
        '/products/shorts/short_2.webp',
        '/products/shorts/short_3.webp',
        '/products/shorts/short_4.webp',
        '/products/shorts/short_5.webp'
      ]
    }
  ];

  for (const update of updates) {
    try {
      const product = await prisma.product.findUnique({
        where: { slug: update.slug }
      });

      if (product) {
        await prisma.product.update({
          where: { slug: update.slug },
          data: { images: update.images }
        });
        console.log(`✅ Обновлены изображения для ${product.name}: ${update.images.length} файлов`);
      } else {
        console.log(`⚠️ Товар с slug "${update.slug}" не найден`);
      }
    } catch (error) {
      console.error(`❌ Ошибка при обновлении ${update.slug}:`, error);
    }
  }

  console.log('🎉 Обновление изображений завершено!');
}

updateProductImages()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
