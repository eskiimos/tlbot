import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const services = [
  {
    name: 'Дизайн изделия',
    slug: 'product-design',
    description: 'Разработка уникального дизайна для вашего изделия. Включает концепт, макеты, техническое задание и финальный дизайн.',
    priceFrom: 1500000, // 15 000 руб в копейках
    priceTo: null,
    category: 'design',
    isActive: true
  },
  {
    name: 'Дизайн дропа',
    slug: 'drop-design', 
    description: 'Комплексная разработка дизайна для всего дропа (коллекции). Включает концепцию, дизайн всех изделий, брендинг и маркетинговые материалы.',
    priceFrom: 5000000, // 50 000 руб в копейках
    priceTo: null,
    category: 'design',
    isActive: true
  }
];

async function main() {
  console.log('🎨 Добавляем услуги...');
  
  for (const service of services) {
    try {
      const existingService = await prisma.service.findUnique({
        where: { slug: service.slug }
      });

      if (existingService) {
        console.log(`⚠️  Услуга "${service.name}" уже существует, пропускаем`);
        continue;
      }

      const created = await prisma.service.create({
        data: service
      });
      
      console.log(`✅ Добавлена услуга: ${created.name} - от ${(created.priceFrom / 100).toLocaleString('ru-RU')} руб`);
    } catch (error) {
      console.error(`❌ Ошибка при добавлении услуги "${service.name}":`, error);
    }
  }
  
  console.log('🎉 Услуги успешно добавлены!');
}

main()
  .catch((e) => {
    console.error('Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
