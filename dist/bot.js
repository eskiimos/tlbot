"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
// Загружаем переменные окружения
dotenv_1.default.config();
// Создаем экземпляр бота
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
exports.bot = bot;
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
// Обработчик неизвестных команд
bot.on('message', async (ctx) => {
    await ctx.reply('Используйте команду /start для начала работы с ботом');
});
