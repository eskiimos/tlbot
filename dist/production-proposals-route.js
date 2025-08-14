"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const telegraf_1 = require("telegraf");
const telegraf_2 = require("telegraf");
const generateProposalHTML_1 = require("@/lib/generateProposalHTML");
async function POST(request) {
    console.log('🚀 API /api/proposals вызван');
    console.log('📍 Environment:', process.env.NODE_ENV);
    console.log('🔑 Bot token exists:', Boolean(process.env.TELEGRAM_BOT_TOKEN));
    let telegramId = null;
    let orderData = null;
    try {
        const formData = await request.formData();
        telegramId = formData.get('telegramId');
        // Получаем данные заказа из формы
        const orderDataString = formData.get('orderData');
        if (orderDataString) {
            try {
                orderData = JSON.parse(orderDataString);
                console.log('📦 Order data parsed successfully');
            }
            catch (jsonError) {
                console.error('❌ Ошибка парсинга orderData JSON:', jsonError);
                return server_1.NextResponse.json({ error: 'Invalid order data format' }, { status: 400 });
            }
        }
        console.log('📨 Получен запрос на отправку КП:', {
            telegramId: telegramId,
            hasOrderData: Boolean(orderData)
        });
        if (!telegramId || !orderData) {
            return server_1.NextResponse.json({ error: 'Missing telegram ID or order data' }, { status: 400 });
        }
        // Проверяем токен бота
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            console.error('❌ TELEGRAM_BOT_TOKEN не найден');
            return server_1.NextResponse.json({ error: 'Bot configuration missing' }, { status: 500 });
        }
        // Проверяем тестовый режим
        if (telegramId === '123456789' && process.env.NODE_ENV === 'development') {
            console.log('🧪 Тестовый режим: пропускаем отправку в Telegram');
            return server_1.NextResponse.json({
                message: 'Test mode: proposal generated successfully',
                mode: 'development'
            }, { status: 200 });
        }
        // Инициализируем бот
        const bot = new telegraf_1.Telegraf(botToken);
        console.log('📤 Отправка КП через бота...');
        try {
            // Добавляем отладочную информацию
            console.log('📋 Данные для КП:', {
                detailedProposal: orderData.detailedProposal,
                items: orderData.items?.length,
                customer: orderData.customerName
            });
            // Генерируем HTML документ с правильной структурой данных
            const htmlContent = (0, generateProposalHTML_1.generateProposalHTML)({
                orderData,
                cartItems: (orderData.items || []).map((item) => ({
                    ...item,
                    // detailedProposal берется из каждого товара отдельно
                    detailedProposal: item.detailedProposal || false
                })),
                userData: {
                    telegramId: telegramId,
                    firstName: orderData.customerName,
                    email: orderData.customerEmail,
                    companyName: orderData.companyName
                }
            });
            // Создаем Buffer из HTML строки
            const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
            // Генерируем имя файла
            const fileName = `КП_${orderData?.customerName?.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') || 'Total_Lookas'}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.html`;
            // Отправляем HTML файл как документ
            const sentMessage = await bot.telegram.sendDocument(telegramId, telegraf_2.Input.fromBuffer(htmlBuffer, fileName), {
                caption: `🎉 Ваше коммерческое предложение готово!\n\n` +
                    `📋 Откройте файл в браузере для просмотра.\n\n` +
                    `💬 Есть вопросы или нужны изменения? Мы всегда готовы обсудить детали!\n\n` +
                    `🚀 Total Lookas — превращаем мерч в арт-объекты!`
            });
            console.log('✅ HTML документ отправлен');
            return server_1.NextResponse.json({
                message: 'HTML proposal sent successfully to Telegram',
                messageId: sentMessage.message_id
            }, { status: 200 });
        }
        catch (telegramError) {
            console.error('❌ Ошибка Telegram:', telegramError);
            // Обработка специфических ошибок Telegram
            const errorMessage = telegramError.message || 'Unknown Telegram error';
            if (errorMessage.includes('chat not found')) {
                return server_1.NextResponse.json({
                    error: 'Чат с ботом не найден',
                    details: 'Пожалуйста, начните диалог с ботом командой /start'
                }, { status: 400 });
            }
            return server_1.NextResponse.json({
                error: 'Telegram API error',
                details: errorMessage
            }, { status: 500 });
        }
    }
    catch (error) {
        console.error('❌ Общая ошибка:', error);
        return server_1.NextResponse.json({
            error: 'Internal server error',
            details: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
