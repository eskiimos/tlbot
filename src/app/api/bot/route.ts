import { NextRequest, NextResponse } from 'next/server';
import { Telegraf, Context } from 'telegraf';
import { prisma } from '../../../lib/prisma';

// Инициализируем бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Функция для создания/обновления пользователя
async function upsertUser(telegramUser: any) {
  const userDataForDb = {
    telegramId: BigInt(telegramUser.id),
    username: telegramUser.username || null,
    firstName: telegramUser.first_name || null,
    lastName: telegramUser.last_name || null,
    language: telegramUser.language_code || 'ru',
  };

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(telegramUser.id) },
    update: userDataForDb,
    create: userDataForDb,
  });

  return user;
}

// Обработчики команд бота
bot.start(async (ctx: Context) => {
  try {
    console.log('Bot /start command received');
    const user = await upsertUser(ctx.from!);
    console.log('User upserted:', user.id);
    
    const welcome = `Привет! 👋
    
Добро пожаловать в TL Bot! 
Здесь ты можешь:

• Посмотреть наш каталог товаров
• Оформить заказ через веб-приложение
• Связаться с нами

Выбери действие:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍 Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
        [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
        [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
        [{ text: 'ℹ️ О нас', callback_data: 'about' }]
      ]
    };

    await ctx.reply(welcome, { reply_markup: keyboard });
    console.log('Reply sent successfully');
  } catch (error) {
    console.error('Error in start command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.command('webapp', async (ctx: Context) => {
  try {
    console.log('Bot /webapp command received');
    const user = await upsertUser(ctx.from!);
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍 Открыть каталог TL', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }]
      ]
    };
    
    await ctx.reply('Нажмите на кнопку ниже, чтобы открыть каталог:', { reply_markup: keyboard });
    console.log('Webapp reply sent successfully');
  } catch (error) {
    console.error('Error in webapp command:', error);
    await ctx.reply('Произошла ошибка. Попробуйте позже.');
  }
});

bot.action('contact', async (ctx: Context) => {
  try {
    console.log('Contact action received');
    await ctx.answerCbQuery();
    
    const contactMessage = `📞 Свяжитесь с нами:

• Email: info@totallookas.ru
• Telegram: @dinaryarmy
• Сайт: totallookas.ru`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍 Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
        [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
        [{ text: 'ℹ️ О нас', callback_data: 'about' }],
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]
    };

    await ctx.editMessageText(contactMessage, { reply_markup: keyboard });
  } catch (error) {
    console.error('Error in contact action:', error);
  }
});

bot.action('about', async (ctx: Context) => {
  try {
    console.log('About action received');
    await ctx.answerCbQuery();
    
    const aboutMessage = `TOTAL LOOKAS

Мы создаём мерч с характером.
Футболки, худи, сумки, аксессуары и сувенирка — всё «под ключ»: от идеи и дизайна до готового продукта.
Работаем для корпораций, фестивалей, артистов и брендов, которые хотят выделяться.

Total Lookas — мерч, который меняет правила игры.`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍 Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
        [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
        [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]
    };

    await ctx.editMessageText(aboutMessage, { reply_markup: keyboard });
  } catch (error) {
    console.error('Error in about action:', error);
  }
});

bot.action('main_menu', async (ctx: Context) => {
  try {
    console.log('Main menu action received');
    await ctx.answerCbQuery();
    
    const welcome = `Привет! 👋
    
Добро пожаловать в TL Bot! 
Здесь ты можешь:

• Посмотреть наш каталог товаров
• Оформить заказ через веб-приложение
• Связаться с нами

Выбери действие:`;

    const keyboard = {
      inline_keyboard: [
        [{ text: '🛍 Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
        [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
        [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
        [{ text: 'ℹ️ О нас', callback_data: 'about' }]
      ]
    };

    await ctx.editMessageText(welcome, { reply_markup: keyboard });
  } catch (error) {
    console.error('Error in main menu action:', error);
  }
});

// Обработчик "Мои заказы"
bot.action('my_orders', async (ctx: Context) => {
  try {
    console.log('My orders action received');
    await ctx.answerCbQuery();
    
    const user = await upsertUser(ctx.from!);
    
    // Получаем заказы пользователя по telegramId
    const orders = await prisma.order.findMany({
      where: { 
        telegramId: user.telegramId.toString() 
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Показываем последние 10 заказов
    });
    
    if (orders.length === 0) {
      const noOrdersMessage = `📦 У вас пока нет заказов
      
Чтобы сделать заказ:
• Откройте каталог и выберите товары
• Заполните форму заказа
• Мы свяжемся с вами для обработки`;

      const keyboard = {
        inline_keyboard: [
          [{ text: '🛍 Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
        ]
      };
      
      await ctx.editMessageText(noOrdersMessage, { reply_markup: keyboard });
      return;
    }
    
    // Показываем список заказов
    let ordersText = `📦 Ваши заказы (${orders.length}):\n\n`;
    
    const orderButtons: any[][] = [];
    
    orders.forEach((order, index) => {
      const statusEmoji = getStatusEmoji(order.status);
      const statusText = getStatusText(order.status);
      const orderDate = order.createdAt.toLocaleDateString('ru-RU');
      const orderNumber = order.id.slice(-6).toUpperCase(); // Последние 6 символов ID
      
      ordersText += `${index + 1}. Заказ №${orderNumber}\n`;
      ordersText += `   ${statusEmoji} ${statusText}\n`;
      ordersText += `   Дата: ${orderDate}\n`;
      ordersText += `   Сумма: ${order.totalAmount}₽\n\n`;
      
      // Добавляем кнопку для каждого заказа
      orderButtons.push([{ 
        text: `Заказ №${orderNumber}`, 
        callback_data: `order_${order.id}` 
      }]);
    });
    
    // Ограничиваем количество кнопок (максимум 5)
    const limitedButtons = orderButtons.slice(0, 5);
    limitedButtons.push([{ text: '🏠 Главное меню', callback_data: 'main_menu' }]);
    
    await ctx.editMessageText(ordersText, { 
      reply_markup: { inline_keyboard: limitedButtons }
    });
    
  } catch (error) {
    console.error('Error in my orders action:', error);
    await ctx.editMessageText('Произошла ошибка при загрузке заказов. Попробуйте позже.', {
      reply_markup: {
        inline_keyboard: [[{ text: '🏠 Главное меню', callback_data: 'main_menu' }]]
      }
    });
  }
});

// Функции для отображения статусов
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'NEW': return '🆕';
    case 'IN_PROGRESS': return '⏳';
    case 'DESIGN': return '🎨';
    case 'PRODUCTION': return '🏭';
    case 'READY': return '✅';
    case 'COMPLETED': return '🎉';
    case 'CANCELLED': return '❌';
    default: return '📋';
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'NEW': return 'Новый заказ';
    case 'IN_PROGRESS': return 'В обработке';
    case 'DESIGN': return 'Создание дизайна';
    case 'PRODUCTION': return 'В производстве';
    case 'READY': return 'Готов к выдаче';
    case 'COMPLETED': return 'Завершен';
    case 'CANCELLED': return 'Отменен';
    default: return 'Неизвестный статус';
  }
}

// Обработчик деталей конкретного заказа
bot.action(/^order_(.+)$/, async (ctx: any) => {
  try {
    console.log('Order details action received');
    await ctx.answerCbQuery();
    
    const orderId = ctx.match[1];
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { comments: true }
    });
    
    if (!order) {
      await ctx.editMessageText('Заказ не найден.', {
        reply_markup: {
          inline_keyboard: [[{ text: '📦 Мои заказы', callback_data: 'my_orders' }]]
        }
      });
      return;
    }
    
    const statusEmoji = getStatusEmoji(order.status);
    const statusText = getStatusText(order.status);
    const orderDate = order.createdAt.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const orderNumber = order.id.slice(-6).toUpperCase();
    
    let orderDetails = `📦 Заказ №${orderNumber}\n\n`;
    orderDetails += `${statusEmoji} Статус: ${statusText}\n`;
    orderDetails += `📅 Дата: ${orderDate}\n`;
    orderDetails += `💰 Сумма: ${order.totalAmount}₽\n`;
    orderDetails += `👤 Клиент: ${order.customerName}\n`;
    
    if (order.customerPhone) {
      orderDetails += `📱 Телефон: ${order.customerPhone}\n`;
    }
    
    if (order.customerEmail) {
      orderDetails += `📧 Email: ${order.customerEmail}\n`;
    }
    
    if (order.adminComment) {
      orderDetails += `\n💬 Комментарий:\n${order.adminComment}\n`;
    }
    
    // Показываем товары из заказа
    try {
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      if (Array.isArray(items) && items.length > 0) {
        orderDetails += `\n🛍 Товары:\n`;
        items.forEach((item: any, index: number) => {
          orderDetails += `${index + 1}. ${item.name || 'Товар'} - ${item.quantity || 1} шт.\n`;
        });
      }
    } catch (e) {
      console.error('Error parsing order items:', e);
    }
    
    const keyboard = {
      inline_keyboard: [
        [{ text: '📦 Мои заказы', callback_data: 'my_orders' }],
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]
    };
    
    await ctx.editMessageText(orderDetails, { reply_markup: keyboard });
    
  } catch (error) {
    console.error('Error in order details action:', error);
    await ctx.editMessageText('Произошла ошибка при загрузке деталей заказа.', {
      reply_markup: {
        inline_keyboard: [[{ text: '📦 Мои заказы', callback_data: 'my_orders' }]]
      }
    });
  }
});

// Обработка веб-приложения данных
bot.on('web_app_data', async (ctx: Context) => {
  try {
    console.log('Web app data received');
    const user = await upsertUser(ctx.from!);
    const webAppData = ctx.webAppData?.data;
    
    if (webAppData) {
      // Сохраняем данные в базу
      await prisma.webAppData.create({
        data: {
          userId: user.id,
          data: JSON.parse(webAppData.text()),
        },
      });
      
      await ctx.reply('✅ Спасибо! Ваш заказ принят. Мы свяжемся с вами в ближайшее время.');
      console.log('Web app data processed successfully');
    }
  } catch (error) {
    console.error('Error processing web app data:', error);
    await ctx.reply('Произошла ошибка при обработке заказа. Попробуйте еще раз.');
  }
});

// GET endpoint для проверки статуса
export async function GET() {
  console.log('GET /api/bot - Bot webhook endpoint is active');
  return NextResponse.json({ 
    message: 'Telegram bot webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
}

// POST endpoint для обработки webhook
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/bot - Webhook received');
    const body = await request.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));
    
    // Проверяем, что токен корректный (базовая безопасность)
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
    }
    
    // Обрабатываем обновление через бота
    await bot.handleUpdate(body);
    console.log('Webhook processed successfully');
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
