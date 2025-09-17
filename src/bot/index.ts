import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { prisma } from '../lib/prisma';

// Загружаем переменные окружения
dotenv.config({ path: '.env.local' });

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Храним ID последних сообщений для каждого пользователя
const userMessages = new Map<number, number[]>();

// Функция для очистки предыдущих сообщений
async function deleteUserMessages(chatId: number) {
  const messageIds = userMessages.get(chatId);
  if (messageIds && messageIds.length > 0) {
    try {
      // Удаляем все предыдущие сообщения бота
      for (const messageId of messageIds) {
        try {
          await bot.telegram.deleteMessage(chatId, messageId);
        } catch (err) {
          // Игнорируем ошибки удаления (сообщение уже удалено или старое)
          console.log(`Не удалось удалить сообщение ${messageId}:`, err instanceof Error ? err.message : err);
        }
      }
    } catch (error) {
      console.error('Ошибка при удалении сообщений:', error);
    }
    // Очищаем список после удаления
    userMessages.set(chatId, []);
  }
}

// Функция для сохранения ID отправленного сообщения
function saveMessageId(chatId: number, messageId: number) {
  const messages = userMessages.get(chatId) || [];
  messages.push(messageId);
  // Храним только последние 10 сообщений
  if (messages.length > 10) {
    messages.shift();
  }
  userMessages.set(chatId, messages);
}

// Функция для создания/обновления пользователя
async function upsertUser(ctx: any) {
  const user = ctx.from;
  if (!user) return null;

  // В режиме разработки возвращаем объект пользователя без записи в БД
  if (process.env.NODE_ENV !== 'production') {
    return {
      id: 1,
      telegramId: BigInt(user.id),
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      language: user.language_code || 'ru',
      isPremium: user.is_premium || false,
      isBot: user.is_bot || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  try {
    const dbUser = await prisma.user.upsert({
      where: { telegramId: BigInt(user.id) },
      update: {
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        language: user.language_code || 'ru',
        isPremium: user.is_premium || false,
        updatedAt: new Date()
      },
      create: {
        telegramId: BigInt(user.id),
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        language: user.language_code || 'ru',
        isPremium: user.is_premium || false,
        isBot: user.is_bot || false
      }
    });

    return dbUser;
  } catch (error) {
    console.error('Error upserting user:', error);
    return null;
  }
}

// Команда /start
bot.start(async (ctx) => {
  const user = await upsertUser(ctx);
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Очищаем предыдущие сообщения бота
  await deleteUserMessages(ctx.chat.id);
  
  // В режиме разработки отправляем картинку с сообщением
  if (process.env.NODE_ENV !== 'production') {
    const message = await ctx.replyWithPhoto(
      { source: './public/start_1.png' },
      {
        caption: `Привет! 👋 Total Lookas — твой мерч на заказ!\n\n` +
          `📱 Открой каталог → выбери товар → получи КП\n\n` +
          `🔧 Тест-режим: ${webAppUrl}`,
        reply_markup: {
          inline_keyboard: [
            [{ text: '🛍️ ОТКРЫТЬ КАТАЛОГ', callback_data: 'start_catalog' }],
            [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
            [{ text: 'ℹ️ О компании', callback_data: 'about' }]
          ]
        }
      }
    );
    if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
    return;
  }
  
  // В продакшене отправляем картинку с веб-приложением
  const message = await ctx.replyWithPhoto(
    { source: './public/start_1.png' },
    {
      caption: `Привет! 👋 Total Lookas — твой мерч на заказ!\n\n` +
        `📱 Открой каталог → выбери товар → получи КП`,
      reply_markup: {
        inline_keyboard: [
          [{ text: '� НАЧАТЬ', web_app: { url: webAppUrl } }],
          [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
          [{ text: 'ℹ️ О компании', callback_data: 'about' }]
        ]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

// Обработчики inline кнопок с заменой сообщений
bot.action('start_catalog', async (ctx) => {
  await ctx.answerCbQuery();
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Удаляем предыдущее сообщение
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  // Отправляем новое сообщение с ссылкой на каталог
  const message = await ctx.reply(
    `🚀 **Каталог Total Lookas**\n\n` +
    `Откройте каталог в браузере для выбора товаров:\n` +
    `${webAppUrl}\n\n` +
    `В каталоге вы сможете:\n` +
    `• Просмотреть все товары\n` +
    `• Выбрать нужные опции\n` +
    `• Указать количество\n` +
    `• Сформировать КП`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🌐 Открыть каталог', url: webAppUrl }],
          [{ text: '↩️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

bot.action('contact', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await upsertUser(ctx);
  
  // Удаляем предыдущее сообщение
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  // Отправляем новое сообщение с контактами
  const message = await ctx.reply(
    `📞 **Связаться с нами**\n\n` +
    `💬 **Telegram:** @totallookas\n` +
    `📱 **WhatsApp:** +7 (999) 123-45-67\n` +
    `📧 **Email:** hello@totallookas.com\n` +
    `🌐 **Сайт:** www.totallookas.com\n\n` +
    `📍 **Офис:** г. Москва, ул. Креативная, 15\n\n` +
    `⏰ **Время работы:**\n` +
    `Пн-Пт: 10:00 - 19:00\n` +
    `Сб-Вс: 11:00 - 17:00\n\n` +
    `🚀 Готовы обсудить ваш проект прямо сейчас!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '↩️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

bot.action('about', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await upsertUser(ctx);
  
  // Удаляем предыдущее сообщение
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  // Отправляем новое сообщение о компании
  const message = await ctx.reply(
    `ℹ️ **О компании Total Lookas**\n\n` +
    `🎨 **Кто мы?**\n` +
    `Креативное агентство полного цикла, которое с 2017 года превращает корпоративный мерч в настоящие арт-объекты!\n\n` +
    `💪 **Наши преимущества:**\n` +
    `• Полный цикл производства под ключ\n` +
    `• Собственная дизайн-студия\n` +
    `• Контроль качества на каждом этапе\n` +
    `• Быстрые сроки: от идеи до продукта за 30 дней\n` +
    `• Работаем с брендами любого масштаба\n\n` +
    `🏆 **Наша миссия:**\n` +
    `Объединяем дерзкий стиль с корпоративным сервисом. Делаем мерч, который хочется носить!\n\n` +
    `📈 **Цифры:**\n` +
    `• Более 500 довольных клиентов\n` +
    `• Свыше 10,000 единиц продукции\n` +
    `• 8 лет успешной работы на рынке`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
          [{ text: '↩️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

bot.action('catalog', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await upsertUser(ctx);
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Удаляем предыдущее сообщение
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  // Отправляем сообщение с каталогом
  const message = await ctx.reply(
    `🛍 **Каталог товаров Total Lookas**\n\n` +
    `👕 **Одежда:**\n` +
    `• Футболки и поло\n` +
    `• Худи и свитшоты\n` +
    `• Zip-худи\n` +
    `• Лонгсливы\n\n` +
    `👖 **Низ:**\n` +
    `• Джинсы и брюки\n` +
    `• Шорты\n` +
    `• Спортивные штаны\n\n` +
    `🎒 **Аксессуары:**\n` +
    `• Шопперы и сумки\n` +
    `• Кепки и шапки\n` +
    `• Ювелирные изделия\n\n` +
    `🎨 **Возможности кастомизации:**\n` +
    `• Вышивка логотипов\n` +
    `• Печать (шелкография, DTF)\n` +
    `• Лазерная гравировка\n` +
    `• Индивидуальный дизайн\n\n` +
    `💡 Откройте интерактивный каталог для детального просмотра!`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Открыть интерактивный каталог', web_app: { url: webAppUrl } }],
          [{ text: '↩️ Назад в главное меню', callback_data: 'back_to_main' }]
        ]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

bot.action('back_to_main', async (ctx) => {
  await ctx.answerCbQuery();
  const user = await upsertUser(ctx);
  const firstName = user?.firstName || ctx.from?.first_name || 'друг';
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Удаляем предыдущее сообщение
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log('Cannot delete message:', error);
  }
  
  // Возвращаемся к главному меню (как при /start)
  const message = await ctx.reply(
    `👋 **Главное меню Total Lookas**\n\n` +
    `🎨 Мы — креативное агентство полного цикла, с 2017 года превращающее корпоративный мерч в арт-объекты! ` +
    `Объединяем дерзкий стиль с корпоративным сервисом и можем всё — быстро, смело и качественно.\n\n` +
    `⚡️ От идеи до готового продукта всего за 30 дней!\n` +
    `🎯 Полный цикл: дизайн → лекала → производство → логистика\n` +
    `👕 Ассортимент: от футболок и худи до ювелирных аксессуаров\n\n` +
    `Что вас интересует, ${firstName}? 🚀`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Открыть каталог', web_app: { url: webAppUrl } }],
          [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
          [{ text: 'ℹ️ О компании', callback_data: 'about' }]
        ]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

// Команда /id - показать Telegram ID пользователя (для разработки)
bot.command('id', async (ctx) => {
  if (process.env.NODE_ENV === 'development') {
    const userId = ctx.from?.id;
    ctx.reply(
      `🆔 Ваш Telegram ID: \`${userId}\`\n\n` +
      `Этот ID можно использовать для тестирования отправки КП в режиме разработки.`,
      { parse_mode: 'Markdown' }
    );
  } else {
    ctx.reply('Эта команда доступна только в режиме разработки.');
  }
});

// Перехватываем все сообщения для повторного предложения открыть приложение
bot.on('text', async (ctx) => {
  const user = await upsertUser(ctx);
  const webAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Очищаем предыдущие сообщения бота
  if (ctx.chat) {
    await deleteUserMessages(ctx.chat.id);
  }
  
  // В режиме разработки логируем сообщения
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] Получено сообщение от ${user?.firstName || ctx.from?.first_name}: ${ctx.message.text}`);
    
    // В режиме разработки отправляем простое сообщение без Web App кнопки
    const message = await ctx.reply(
      `Привет! 😊 Для просмотра каталога откройте ${webAppUrl} в браузере.\n\n` +
      `🔧 Режим разработки: Web App кнопки не работают с HTTP, используйте прямую ссылку.`
    );
    if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
    return;
  }
  
  // В продакшене используем Web App кнопку
  const message = await ctx.reply(
    'Привет! 😊 Для удобного просмотра каталога и создания заказа лучше использовать наше мини-приложение — там вся магия происходит! ✨',
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🛍 Открыть каталог',
            web_app: { url: webAppUrl }
          }
        ]]
      }
    }
  );
  if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
});

// Обработка данных из веб-приложения
bot.on('web_app_data', async (ctx) => {
  const user = await upsertUser(ctx);
  
  // Очищаем предыдущие сообщения бота
  if (ctx.chat) {
    await deleteUserMessages(ctx.chat.id);
  }
  
  try {
    // Проверяем наличие данных веб-приложения
    const webAppData = ctx.message?.web_app_data?.data;
    if (!webAppData) {
      console.log('Нет данных от веб-приложения');
      return;
    }

    const data = JSON.parse(webAppData);
    console.log('Получены данные из веб-приложения:', data);

    // Сохраняем данные в базу
    if (process.env.NODE_ENV === 'production') {
      await prisma.webAppData.create({
        data: {
          userId: user?.id?.toString() || 'unknown',
          data: data
        }
      });
    }

    // Создаем сообщение для пользователя
    await prisma.message.create({
      data: {
        userId: user?.id?.toString() || 'unknown',
        content: `Данные из веб-приложения: ${JSON.stringify(data)}`,
        type: 'WEBAPP_DATA'
      }
    });

    // Проверяем тип данных и обрабатываем соответствующим образом
    if (data.type === 'commercial_proposal') {
      // Обработка коммерческого предложения
      const orderData = data.orderData;
      
      // Отправляем пользователю сообщение о начале генерации КП
      const processingMessage = await ctx.reply(
        '🔄 Генерируем коммерческое предложение...\n' +
        'Это может занять несколько секунд.'
      );
      if (ctx.chat) saveMessageId(ctx.chat.id, processingMessage.message_id);
      
      // Формируем сообщение для администратора
      const adminMessage = `🔔 *Новое коммерческое предложение!*\n\n` +
        `👤 *Клиент:* ${orderData.customerName}\n` +
        `🏢 *Компания:* ${orderData.customerCompany || 'Не указана'}\n` +
        `🔢 *ИНН:* ${orderData.customerInn || 'Не указан'}\n` +
        `📱 *Телефон:* ${orderData.customerPhone || 'Не указан'}\n` +
        `📧 *Email:* ${orderData.customerEmail || 'Не указан'}\n\n` +
        `🛒 *Товаров в заказе:* ${orderData.items.length}\n` +
        `💰 *Сумма заказа:* ${(orderData.totalAmount/100).toLocaleString('ru-RU')} ₽\n\n` +
        `📎 КП будет отправлено клиенту автоматически.`;
      
      // Отправляем уведомление администратору
      try {
        // Здесь можно добавить отправку уведомления администратору
        console.log('Отправка уведомления администратору:', adminMessage);
      } catch (err) {
        console.error('Ошибка отправки уведомления администратору:', err);
      }
      
      try {
        // Пытаемся отправить уведомление администратору
        if (process.env.ADMIN_CHAT_ID) {
          await bot.telegram.sendMessage(
            process.env.ADMIN_CHAT_ID,
            adminMessage,
            { parse_mode: 'Markdown' }
          );
        }

        // Отвечаем пользователю
        const message = await ctx.reply(
          '✅ Ваше коммерческое предложение готово и будет отправлено через несколько секунд!\n\n' +
          '📋 После получения КП вы можете:\n' +
          '1. Проверить все детали заказа\n' +
          '2. Показать КП вашему руководителю\n' +
          '3. Связаться с нами для уточнения деталей\n\n' +
          '💡 Если у вас возникнут вопросы, просто напишите их в этот чат.'
        );
        if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);

        // Добавляем паузу перед отправкой следующего сообщения
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('Ошибка при обработке КП:', error);
        const errorMessage = await ctx.reply(
          '❌ Произошла ошибка при обработке коммерческого предложения.\n' +
          'Пожалуйста, попробуйте еще раз или свяжитесь с нашим менеджером.'
        );
        if (ctx.chat) saveMessageId(ctx.chat.id, errorMessage.message_id);
      }
    } else {
      // Стандартный ответ для других типов данных
      const message = await ctx.reply('Спасибо! Ваши данные получены и обрабатываются.');
      if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
    }
  } catch (error) {
    console.error('Ошибка при обработке данных веб-приложения:', error);
    const message = await ctx.reply('Произошла ошибка при обработке данных. Попробуйте еще раз.');
    if (ctx.chat) saveMessageId(ctx.chat.id, message.message_id);
  }
});

// Функция для запуска бота
export async function startBot() {
  try {
    console.log('Инициализация бота...');
    
    // Получаем информацию о боте
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 Бот запущен: @${botInfo.username} (ID: ${botInfo.id})`);
    
    if (process.env.NODE_ENV !== 'production') {
      // Запускаем бота через Long Polling только в режиме разработки
      // Сначала удаляем вебхук
      console.log('Удаляем вебхук...');
      await bot.telegram.deleteWebhook();
      console.log('Вебхук успешно удален');
      
      // Перехватываем ошибки базы данных для локального режима
      console.log('Настройка обработчика ошибок...');
      bot.catch((err, ctx) => {
        console.error('Ошибка при обработке обновления Telegram:', err);
      });
      
      console.log('Запуск Long Polling...');
      bot.launch().then(() => {
        console.log('�� Telegram бот запущен в режиме разработки и готов к работе!');
      }).catch((error) => {
        console.error('Ошибка при запуске Long Polling:', error);
      });
      
      // Даем время боту инициализироваться
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Инициализация завершена, бот слушает обновления...');
      
      // Обработка завершения процесса
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    } else {
      // В production режиме используем Long Polling
      console.log('🔄 Запуск в режиме Long Polling...');
      
      await bot.launch().catch((error) => {
        console.error('Ошибка при запуске Long Polling:', error);
      });
      
      // Даем время боту инициализироваться
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ Инициализация завершена, бот слушает обновления...');
      
      // Обработка завершения процесса
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации бота:', error);
    return false;
  }
}

export default bot;
