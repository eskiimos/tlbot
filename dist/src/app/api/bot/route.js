"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const telegraf_1 = require("telegraf");
const prisma_1 = require("../../../lib/prisma");
// Инициализируем бота
const bot = new telegraf_1.Telegraf(process.env.TELEGRAM_BOT_TOKEN);
// Функция для создания/обновления пользователя
async function upsertUser(telegramUser) {
    const userDataForDb = {
        telegramId: telegramUser.id.toString(),
        username: telegramUser.username || null,
        firstName: telegramUser.first_name || null,
        lastName: telegramUser.last_name || null,
        languageCode: telegramUser.language_code || null,
    };
    const user = await prisma_1.prisma.user.upsert({
        where: { telegramId: userDataForDb.telegramId },
        update: userDataForDb,
        create: userDataForDb,
    });
    return user;
}
// Обработчики команд бота
bot.start(async (ctx) => {
    try {
        console.log('Bot /start command received');
        const user = await upsertUser(ctx.from);
        console.log('User upserted:', user.id);
        const welcome = `Привет! 👋
    
Добро пожаловать в TL Bot! 
Здесь ты можешь:

🛍️ Посмотреть наш каталог товаров
📱 Оформить заказ через веб-приложение
💬 Связаться с нами

Выбери действие:`;
        const keyboard = {
            inline_keyboard: [
                [{ text: '🛍️ Открыть каталог', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }],
                [{ text: '📞 Связаться с нами', callback_data: 'contact' }],
                [{ text: 'ℹ️ О нас', callback_data: 'about' }]
            ]
        };
        await ctx.reply(welcome, { reply_markup: keyboard });
        console.log('Reply sent successfully');
    }
    catch (error) {
        console.error('Error in start command:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});
bot.command('webapp', async (ctx) => {
    try {
        console.log('Bot /webapp command received');
        const user = await upsertUser(ctx.from);
        const keyboard = {
            inline_keyboard: [
                [{ text: '🛍️ Открыть каталог TL', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` } }]
            ]
        };
        await ctx.reply('Нажмите на кнопку ниже, чтобы открыть каталог:', { reply_markup: keyboard });
        console.log('Webapp reply sent successfully');
    }
    catch (error) {
        console.error('Error in webapp command:', error);
        await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
});
bot.action('contact', async (ctx) => {
    try {
        console.log('Contact action received');
        await ctx.answerCbQuery();
        await ctx.reply('📞 Свяжитесь с нами:\n\n📧 Email: info@tl-clothing.com\n📱 Telegram: @tl_support\n🌐 Сайт: tl-clothing.com');
    }
    catch (error) {
        console.error('Error in contact action:', error);
    }
});
bot.action('about', async (ctx) => {
    try {
        console.log('About action received');
        await ctx.answerCbQuery();
        await ctx.reply('ℹ️ О TL Clothing:\n\nМы специализируемся на производстве качественной одежды. Наша миссия - предоставить вам комфортную и стильную одежду по доступным ценам.\n\n🎯 Индивидуальный подход к каждому заказу\n⚡ Быстрое производство\n💯 Гарантия качества');
    }
    catch (error) {
        console.error('Error in about action:', error);
    }
});
// Обработка веб-приложения данных
bot.on('web_app_data', async (ctx) => {
    try {
        console.log('Web app data received');
        const user = await upsertUser(ctx.from);
        const webAppData = ctx.webAppData?.data;
        if (webAppData) {
            // Сохраняем данные в базу
            await prisma_1.prisma.webAppData.create({
                data: {
                    userId: user.id,
                    data: JSON.parse(webAppData.text()),
                },
            });
            await ctx.reply('✅ Спасибо! Ваш заказ принят. Мы свяжемся с вами в ближайшее время.');
            console.log('Web app data processed successfully');
        }
    }
    catch (error) {
        console.error('Error processing web app data:', error);
        await ctx.reply('Произошла ошибка при обработке заказа. Попробуйте еще раз.');
    }
});
// GET endpoint для проверки статуса
async function GET() {
    console.log('GET /api/bot - Bot webhook endpoint is active');
    return server_1.NextResponse.json({
        message: 'Telegram bot webhook endpoint is active',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
}
// POST endpoint для обработки webhook
async function POST(request) {
    try {
        console.log('POST /api/bot - Webhook received');
        const body = await request.json();
        console.log('Webhook body:', JSON.stringify(body, null, 2));
        // Проверяем, что токен корректный (базовая безопасность)
        if (!process.env.TELEGRAM_BOT_TOKEN) {
            console.error('TELEGRAM_BOT_TOKEN not configured');
            return server_1.NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
        }
        // Обрабатываем обновление через бота
        await bot.handleUpdate(body);
        console.log('Webhook processed successfully');
        return server_1.NextResponse.json({ ok: true });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        return server_1.NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
