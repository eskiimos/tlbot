"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const telegraf_1 = require("telegraf");
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
// Загружаем переменные окружения
dotenv_1.default.config({ path: '.env.local' });
const app = (0, express_1.default)();
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Храним ID последних сообщений для каждого пользователя
const userMessages = new Map();
// Функция для очистки предыдущих сообщений
async function deleteUserMessages(chatId) {
    const messageIds = userMessages.get(chatId);
    if (messageIds && messageIds.length > 0) {
        try {
            // Удаляем все предыдущие сообщения бота
            for (const messageId of messageIds) {
                try {
                    await bot.telegram.deleteMessage(chatId, messageId);
                }
                catch (err) {
                    // Игнорируем ошибки удаления (сообщение уже удалено или старое)
                    console.log(`Не удалось удалить сообщение ${messageId}:`, err.message);
                }
            }
        }
        catch (error) {
            console.error('Ошибка при удалении сообщений:', error);
        }
        // Очищаем список после удаления
        userMessages.set(chatId, []);
    }
}
// Функция для сохранения ID отправленного сообщения
function saveMessageId(chatId, messageId) {
    const messages = userMessages.get(chatId) || [];
    messages.push(messageId);
    // Храним только последние 10 сообщений
    if (messages.length > 10) {
        messages.shift();
    }
    userMessages.set(chatId, messages);
}
// Функция для создания/обновления пользователя
async function upsertUser(ctx) {
    const user = ctx.from;
    if (!user)
        return null;
    try {
        const dbUser = await prisma_1.prisma.user.upsert({
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
        console.log(`✅ User upserted: ${dbUser.id}`);
        return dbUser;
    }
    catch (error) {
        console.error('Error upserting user:', error);
        return null;
    }
}
// Команда /start
bot.start(async (ctx) => {
    const user = await upsertUser(ctx);
    const firstName = user?.firstName || ctx.from?.first_name || 'друг';
    const webAppUrl = process.env.WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    console.log(`📥 /start command from: ${firstName}`);
    // Очищаем предыдущие сообщения бота
    await deleteUserMessages(ctx.chat.id);
    // Отправляем приветственное сообщение
    const message = await ctx.reply(`Привет, ${firstName}! 👋 Добро пожаловать в Total Lookas!\n\n` +
        `🎨 Мы — креативное агентство полного цикла, с 2017 года превращающее корпоративный мерч в арт-объекты! ` +
        `Объединяем дерзкий стиль с корпоративным сервисом и можем всё — быстро, смело и качественно.\n\n` +
        `⚡️ От идеи до готового продукта всего за 30 дней!\n` +
        `🎯 Полный цикл: дизайн → лекала → производство → логистика\n` +
        `👕 Ассортимент: от футболок и худи до ювелирных аксессуаров\n\n` +
        `Готов "полностью одеть" свой бренд? Жми кнопку и погнали создавать что-то крутое! 🚀`, {
        reply_markup: {
            inline_keyboard: [[
                    {
                        text: '🔥 Открыть каталог',
                        web_app: { url: webAppUrl }
                    }
                ]]
        }
    });
    saveMessageId(ctx.chat.id, message.message_id);
    console.log(`✅ Welcome message sent`);
});
// Перехватываем все сообщения
bot.on('text', async (ctx) => {
    const user = await upsertUser(ctx);
    const webAppUrl = process.env.WEB_APP_URL || process.env.NEXT_PUBLIC_APP_URL;
    // Очищаем предыдущие сообщения бота
    await deleteUserMessages(ctx.chat.id);
    // Отправляем сообщение с предложением открыть приложение
    const message = await ctx.reply('Привет! 😊 Для удобного просмотра каталога и создания заказа лучше использовать наше мини-приложение — там вся магия происходит! ✨', {
        reply_markup: {
            inline_keyboard: [[
                    {
                        text: '🛍 Открыть каталог',
                        web_app: { url: webAppUrl }
                    }
                ]]
        }
    });
    saveMessageId(ctx.chat.id, message.message_id);
});
// Настройка Express
app.use(express_1.default.json());
// Webhook endpoint
app.post('/webhook', async (req, res) => {
    try {
        console.log('📨 Webhook received:', JSON.stringify(req.body, null, 2));
        // Обрабатываем update через Telegraf
        await bot.handleUpdate(req.body);
        res.status(200).json({ ok: true });
    }
    catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Запуск сервера
const PORT = process.env.PORT || 8080;
async function startWebhookServer() {
    try {
        console.log('🔄 Starting Telegram bot...');
        // Получаем информацию о боте
        const botInfo = await bot.telegram.getMe();
        console.log(`🤖 Bot connected: @${botInfo.username} (ID: ${botInfo.id})`);
        // Проверяем подключение к базе данных
        console.log('📊 Web App URL:', process.env.WEB_APP_URL);
        console.log('✅ Database connected');
        // Запускаем Express сервер
        app.listen(PORT, () => {
            console.log(`🚀 Webhook server running on port ${PORT}`);
            console.log(`📥 Webhook endpoint: /webhook`);
            console.log(`💚 Health check: /health`);
        });
    }
    catch (error) {
        console.error('❌ Error starting webhook server:', error);
        process.exit(1);
    }
}
// Запускаем сервер
startWebhookServer();
