import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Заполнение базы данных тестовыми данными...');

  // Создаем тестового пользователя
  const testUser = await prisma.user.upsert({
    where: { telegramId: BigInt(123456789) },
    update: {},
    create: {
      telegramId: BigInt(123456789),
      username: 'testuser',
      firstName: 'Тестовый',
      lastName: 'Пользователь',
      language: 'ru',
      isPremium: false,
      isBot: false
    }
  });

  console.log('Создан тестовый пользователь:', testUser);

  // Создаем тестовые сообщения
  const messages = await Promise.all([
    prisma.message.create({
      data: {
        userId: testUser.id,
        content: 'Привет! Это тестовое сообщение.',
        type: 'TEXT'
      }
    }),
    prisma.message.create({
      data: {
        userId: testUser.id,
        content: 'Второе тестовое сообщение',
        type: 'TEXT'
      }
    })
  ]);

  console.log('Создано сообщений:', messages.length);

  // Создаем тестовые данные веб-приложения
  const webappData = await prisma.webAppData.create({
    data: {
      userId: testUser.id,
      data: {
        message: 'Тестовые данные из мини-приложения',
        action: 'test',
        timestamp: new Date().toISOString()
      }
    }
  });

  console.log('Созданы данные веб-приложения:', webappData);

  // Создаем настройки бота
  const settings = await Promise.all([
    prisma.botSettings.upsert({
      where: { key: 'welcome_message' },
      update: { value: 'Добро пожаловать в наш бот! 🤖' },
      create: {
        key: 'welcome_message',
        value: 'Добро пожаловать в наш бот! 🤖'
      }
    }),
    prisma.botSettings.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: 'false' },
      create: {
        key: 'maintenance_mode',
        value: 'false'
      }
    })
  ]);

  console.log('Созданы настройки бота:', settings.length);

  console.log('✅ База данных успешно заполнена тестовыми данными!');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
