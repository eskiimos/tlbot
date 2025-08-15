import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Создаем экземпляр бота
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

console.log('🤖 Инициализация бота...');

// Обработчик команды /start
bot.start(async (ctx) => {
  console.log(`Новый пользователь: ${ctx.from?.username || ctx.from?.first_name}`);
  
  const welcomeMessage = `Эй, йоу! Добро пожаловать в Total Lookas! Мы создаем классный мерч и можем сделать тебе!

Всё просто:
1. Нажми «НАЧАТЬ»
2. Выбери нужные опции
3. Укажи тираж
4. Получи готовое КП`;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: '� Открыть приложение', callback_data: 'open_app' }
        ],
        [
          { text: '� Контакты', callback_data: 'contact' },
          { text: '� О нас', callback_data: 'about' }
        ]
      ]
    }
  });
});

// Обработчик кнопки "Открыть приложение"
bot.action('open_app', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.reply(`🚀 Каталог Total Lookas

🔸 Футболки (от 500₽)
🔸 Поло (от 800₽)  
🔸 Худи (от 1200₽)
🔸 Толстовки (от 1000₽)
🔸 Куртки (от 2000₽)

📱 Открывайте каталог и создавайте КП:
🔗 http://localhost:3000/catalog

⚠️ Примечание: В продакшене будет WebApp кнопка с HTTPS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Назад в меню', callback_data: 'back_to_menu' }]
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
  await ctx.reply(`    await ctx.answerCbQuery();
    ctx.reply('Наши контакты:
📧 Email: info@totallookas.com
📱 Instagram: @totallookas
📞 Телефон: +7 (XXX) XXX-XX-XX');
  } else if (action === 'about_us') {
    await ctx.answerCbQuery();
    ctx.reply('Total Lookas — современная компания, специализирующаяся на производстве качественной одежды с вашей символикой.

✨ Мы создаем:
🔸 Корпоративную одежду
🔸 Мерч для компаний
🔸 Униформу
🔸 Промо-продукцию

Мы работаем только с качественными материалами и современным оборудованием.');
  } else if (action === 'back_to_menu') {
    await ctx.answerCbQuery();
    // Возвращаемся к главному меню
    await ctx.reply(`Эй, йоу! 👋

Total Lookas — это бренд корпоративной одежды и мерча. Мы делаем качественные вещи с вашей символикой! 🔥

🎯 Что можем предложить:
- Футболки, поло, худи
- Толстовки и куртки  
- Брендинг и логотипы
- Быстрое производство

Готовы создать что-то крутое? 💪`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛍️ Открыть приложение', callback_data: 'open_app' }],
          [
            { text: '📞 Контакты', callback_data: 'contacts' },
            { text: 'ℹ️ О нас', callback_data: 'about_us' }
          ]
        ]
      }
    });
  }
});`);
});

bot.action('catalog', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.reply(`👕 Каталог Total Lookas

🔸 Футболки (от 500₽)
🔸 Поло (от 800₽)  
🔸 Худи (от 1200₽)
🔸 Толстовки (от 1000₽)
🔸 Куртки (от 2000₽)

📱 Для полного каталога с возможностью заказа перейдите по ссылке:
🔗 http://localhost:3000/catalog

⚠️ Примечание: В продакшене будет WebApp кнопка с HTTPS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Назад в меню', callback_data: 'back_to_menu' }]
      ]
    }
  });
});

bot.action('proposal', async (ctx) => {
  await ctx.answerCbQuery();
  
  await ctx.reply(`💰 Получение коммерческого предложения:

Вы можете:
1️⃣ Написать менеджеру: @totalookas_support
2️⃣ Или перейти в каталог для создания КП:
🔗 http://localhost:3000/catalog

⚠️ Примечание: В продакшене будет WebApp кнопка с HTTPS`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⬅️ Назад в меню', callback_data: 'back_to_menu' }]
      ]
    }
  });
});

// Команда /webapp для прямого доступа к мини-приложению
bot.command('webapp', async (ctx) => {
  await ctx.reply(`🛍️ Каталог Total Lookas:

📱 Откройте в браузере: http://localhost:3000/catalog

⚠️ Примечание: В продакшене будет работать как WebApp кнопка с HTTPS URL`);
});

// Обработчик данных из WebApp
bot.on('web_app_data', async (ctx) => {
  try {
    if (!ctx.webAppData?.data) {
      console.error('WebApp data is undefined');
      return;
    }
    
    const dataText = typeof ctx.webAppData.data === 'string' 
      ? ctx.webAppData.data 
      : ctx.webAppData.data.text();
    
    const data = JSON.parse(dataText);
    console.log('Получены данные из WebApp:', data);
    
    if (data.type === 'order') {
      await ctx.reply(`✅ Спасибо за заказ!

📦 Ваш заказ:
${data.items.map((item: any) => `• ${item.name} - ${item.quantity} шт.`).join('\n')}

💰 Сумма: ${data.totalPrice}₽

Наш менеджер свяжется с вами в ближайшее время для уточнения деталей.`);
    } else if (data.type === 'proposal_request') {
      await ctx.reply(`📄 Запрос коммерческого предложения получен!

👤 Контакт: ${data.userData?.firstName || 'Не указано'}
📧 Email: ${data.userData?.email || 'Не указано'}
📱 Телефон: ${data.userData?.phoneNumber || 'Не указано'}

Менеджер подготовит персональное КП и отправит его в течение 30 минут.`);
    }
  } catch (error) {
    console.error('Ошибка обработки данных WebApp:', error);
    await ctx.reply('Произошла ошибка при обработке данных. Попробуйте еще раз.');
  }
});

// Обработчик кнопки "Назад в меню"
bot.action('back_to_menu', async (ctx) => {
  await ctx.answerCbQuery();
  
  const welcomeMessage = `👋 Добро пожаловать в Total Lookas!

🏢 Мы - компания по производству качественной корпоративной одежды с вашим логотипом.

📱 Выберите действие:`;

  await ctx.editMessageText(welcomeMessage, {
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

// Обработчик неизвестных команд
bot.on('message', async (ctx) => {
  await ctx.reply('Используйте команду /start для начала работы с ботом');
});

// Экспортируем бота
export { bot };
