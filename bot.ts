import { Telegraf } from 'telegraf';
import { prisma } from './src/lib/prisma';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Создаем экземпляр бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

console.log('🤖 Инициализация бота...');

// Обработчик команды /start
bot.start(async (ctx) => {
  console.log(`Новый пользователь: ${ctx.from?.username || ctx.from?.first_name}`);
  
  const welcomeMessage = `👋 Добро пожаловать в Total Lookas!

🏢 Мы - компания по производству качественной корпоративной одежды с вашим логотипом.

📱 Выберите действие:`;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📖 О компании', callback_data: 'about' },
          { text: '📞 Контакты', callback_data: 'contact' }
        ],
        [
          { text: '👕 Каталог', callback_data: 'catalog' },
          { text: '💰 Получить КП', callback_data: 'proposal' }
        ]
      ]
    }
  });
});

// Обработчик кнопок
bot.action('about', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(`🏢 О компании Total Lookas

Мы специализируемся на производстве качественной корпоративной одежды:

✅ Футболки, поло, худи
✅ Нанесение вашего логотипа
✅ Быстрые сроки производства
✅ Конкурентные цены

Работаем с компаниями любого размера!`);
});

bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(`📞 Наши контакты:

📧 Email: info@totallookas.com
📱 Telegram: @totalookas_support
🌐 Сайт: www.totallookas.com

Время работы: ПН-ПТ 9:00-18:00`);
});

bot.action('catalog', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(`👕 Наш каталог:

🔸 Футболки (от 500₽)
🔸 Поло (от 800₽)  
🔸 Худи (от 1200₽)
🔸 Толстовки (от 1000₽)
🔸 Куртки (от 2000₽)

Все цены указаны без нанесения логотипа.
Для подробного каталога обратитесь к менеджеру!`);
});

bot.action('proposal', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(`💰 Для получения коммерческого предложения:

1️⃣ Напишите нашему менеджеру: @totalookas_support
2️⃣ Укажите:
   • Тип изделия
   • Количество
   • Размеры
   • Логотип (если есть)

⚡ Ответим в течение 30 минут!`);
});

// Новый обработчик для "Мои заказы"
bot.action('my_orders', async (ctx) => {
  await ctx.answerCbQuery();
  
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  try {
    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (!user) {
      await ctx.reply('Пользователь не найден. Используйте /start для регистрации.');
      return;
    }

    // Ищем заказы пользователя
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    if (orders.length === 0) {
      await ctx.reply('У вас пока нет заказов. Создайте первый заказ!', {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 Получить КП', callback_data: 'proposal' }]
          ]
        }
      });
      return;
    }

    let message = '📋 Ваши заказы:\n\n';
    const keyboard = [];

    for (const order of orders) {
      const statusEmoji = {
        'NEW': '📝',
        'IN_PROGRESS': '⚙️',
        'DESIGN': '🎨',
        'PRODUCTION': '🏭',
        'READY': '✅',
        'COMPLETED': '🎉',
        'CANCELLED': '❌'
      }[order.status] || '📄';

      message += `${statusEmoji} Заказ #${order.id.slice(-8)}\n`;
      message += `👤 ${order.customerName}\n`;
      message += `📅 ${order.createdAt.toLocaleDateString('ru-RU')}\n`;
      message += `💰 ${(order.totalAmount / 100).toLocaleString('ru-RU')} ₽\n\n`;

      keyboard.push([
        { text: `💬 Чат по заказу #${order.id.slice(-8)}`, callback_data: `chat_${order.id}` }
      ]);
    }

    keyboard.push([
      { text: '🆕 Новый заказ', callback_data: 'proposal' }
    ]);

    await ctx.reply(message, {
      reply_markup: { inline_keyboard: keyboard }
    });

  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    await ctx.reply('Произошла ошибка при получении заказов.');
  }
});

// Обработчик для активации чата по конкретному заказу
bot.action(/^chat_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();
  
  const orderId = ctx.match[1];
  const telegramId = ctx.from?.id.toString();
  
  if (!telegramId) return;

  try {
    // Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (!user) return;

    // Проверяем что заказ принадлежит пользователю
    const order = await prisma.order.findFirst({
      where: { 
        id: orderId,
        userId: user.id 
      }
    });

    if (!order) {
      await ctx.reply('Заказ не найден.');
      return;
    }

    // Устанавливаем активный контекст заказа
    await prisma.userOrderContext.upsert({
      where: { userId: user.id },
      update: { orderId: orderId },
      create: { 
        userId: user.id,
        orderId: orderId 
      }
    });

    await ctx.reply(
      `💬 Чат по заказу #${order.id.slice(-8)} активирован!\n\n` +
      `📋 ${order.customerName}\n` +
      `📅 ${order.createdAt.toLocaleDateString('ru-RU')}\n\n` +
      `Теперь все ваши сообщения будут переданы менеджеру по этому заказу.\n\n` +
      `✍️ Напишите ваш вопрос:`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 Мои заказы', callback_data: 'my_orders' },
              { text: '❌ Завершить чат', callback_data: 'end_chat' }
            ]
          ]
        }
      }
    );

  } catch (error) {
    console.error('Ошибка активации чата:', error);
    await ctx.reply('Произошла ошибка при активации чата.');
  }
});

// Обработчик завершения чата
bot.action('end_chat', async (ctx) => {
  await ctx.answerCbQuery();
  
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) }
    });

    if (user) {
      await prisma.userOrderContext.upsert({
        where: { userId: user.id },
        update: { orderId: null },
        create: { 
          userId: user.id,
          orderId: null 
        }
      });
    }

    await ctx.reply('💤 Чат завершен. Для новой переписки выберите заказ из списка.', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📋 Мои заказы', callback_data: 'my_orders' },
            { text: '🆕 Новый заказ', callback_data: 'proposal' }
          ]
        ]
      }
    });

  } catch (error) {
    console.error('Ошибка завершения чата:', error);
  }
});

// Обработчик текстовых сообщений
bot.on('text', async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  const content = ctx.message.text;
  
  if (!telegramId || !content) return;

  try {
    // Создаем или обновляем пользователя
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(telegramId) },
      update: {
        username: ctx.from?.username || null,
        firstName: ctx.from?.first_name || 'Пользователь',
        lastName: ctx.from?.last_name || null,
      },
      create: {
        telegramId: BigInt(telegramId),
        username: ctx.from?.username || null,
        firstName: ctx.from?.first_name || 'Пользователь',
        lastName: ctx.from?.last_name || null,
      }
    });

    // Сохраняем сообщение в базу
    await prisma.message.create({
      data: {
        telegramId: BigInt(telegramId),
        content: content,
        type: 'TEXT',
        userId: user.id
      }
    });

    // Ищем активный контекст заказа для пользователя
    const orderContext = await prisma.userOrderContext.findUnique({
      where: { userId: user.id }
    });

    if (orderContext && orderContext.orderId) {
      // Если есть активный заказ, добавляем сообщение как комментарий к заказу
      await prisma.orderComment.create({
        data: {
          orderId: orderContext.orderId,
          content: content,
          isAdmin: false,
          authorName: `${user.firstName} ${user.lastName || ''}`.trim(),
          telegramMessageId: ctx.message.message_id.toString()
        }
      });

      await ctx.reply(
        `✅ Ваше сообщение получено и передано менеджеру!\n\n` +
        `📝 "${content}"\n\n` +
        `💬 Ответ поступит в этот чат в ближайшее время.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '📋 Мои заказы', callback_data: 'my_orders' },
                { text: '🆕 Новый заказ', callback_data: 'proposal' }
              ]
            ]
          }
        }
      );
    } else {
      // Если нет активного заказа, предлагаем создать
      await ctx.reply(
        `👋 Спасибо за сообщение!\n\n` +
        `Для полноценной поддержки создайте заказ или свяжитесь с менеджером.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: '💰 Получить КП', callback_data: 'proposal' },
                { text: '📞 Связаться с менеджером', callback_data: 'contact' }
              ],
              [
                { text: '📖 О компании', callback_data: 'about' },
                { text: '👕 Каталог', callback_data: 'catalog' }
              ]
            ]
          }
        }
      );
    }

  } catch (error) {
    console.error('Ошибка обработки сообщения:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже или воспользуйтесь командой /start');
  }
});

// Экспортируем бота
export { bot };
