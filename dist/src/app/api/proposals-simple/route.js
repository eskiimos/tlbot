"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = POST;
const server_1 = require("next/server");
const telegraf_1 = require("telegraf");
const telegraf_2 = require("telegraf");
// Упрощенная версия API endpoint для отправки PDF
async function POST(request) {
    let file = null;
    let telegramId = null;
    let orderData = null;
    try {
        const formData = await request.formData();
        file = formData.get('file');
        telegramId = formData.get('telegramId');
        // Получаем данные заказа из формы
        const orderDataString = formData.get('orderData');
        if (orderDataString) {
            orderData = JSON.parse(orderDataString);
        }
        console.log('📨 Получен запрос на отправку PDF:', {
            hasFile: Boolean(file),
            fileSize: file?.size,
            telegramId: telegramId,
            hasOrderData: Boolean(orderData)
        });
        if (!file || !telegramId) {
            return server_1.NextResponse.json({ error: 'Файл или ID пользователя отсутствуют.' }, { status: 400 });
        }
        // Проверяем токен бота
        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
            return server_1.NextResponse.json({ error: 'Конфигурация бота отсутствует' }, { status: 500 });
        }
        console.log('✅ TELEGRAM_BOT_TOKEN найден, длина:', botToken.length);
        // Проверяем, если это тестовый пользователь
        if (telegramId === '123456789' && process.env.NODE_ENV === 'development') {
            console.log('🧪 Тестовый режим: PDF генерация прошла успешно, отправка в Telegram пропущена');
            return server_1.NextResponse.json({
                message: 'Файл успешно сгенерирован (тестовый режим).',
                mode: 'development'
            }, { status: 200 });
        }
        // Инициализируем бот
        const bot = new telegraf_1.Telegraf(botToken);
        // Преобразуем Blob в Buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        console.log(`📤 Отправка PDF в Telegram пользователю ${telegramId}, размер: ${fileBuffer.length} байт`);
        try {
            // Отправляем документ пользователю
            const sentMessage = await bot.telegram.sendDocument(telegramId, telegraf_2.Input.fromBuffer(fileBuffer, `commercial-proposal-${telegramId}.pdf`), {
                caption: `🎉 Ваше коммерческое предложение готово!\n\n` +
                    `📋 Это предварительный документ для ознакомления с составом и стоимостью заказа.\n\n` +
                    `💬 Есть вопросы или нужны изменения? Мы всегда готовы обсудить детали!\n\n` +
                    `🚀 Total Lookas — превращаем мерч в арт-объекты!`,
            });
            console.log(`✅ PDF успешно отправлен, message_id: ${sentMessage.message_id}`);
            return server_1.NextResponse.json({
                message: 'PDF успешно отправлен в Telegram!',
                messageId: sentMessage.message_id
            }, { status: 200 });
        }
        catch (telegramError) {
            console.error('❌ Ошибка отправки в Telegram:', telegramError);
            const errorMessage = telegramError.message || 'Неизвестная ошибка Telegram';
            if (errorMessage.includes('chat not found') || errorMessage.includes('Bad Request')) {
                return server_1.NextResponse.json({
                    error: 'Чат с ботом не найден',
                    details: `Пользователь должен сначала написать боту /start. ID: ${telegramId}`
                }, { status: 400 });
            }
            return server_1.NextResponse.json({
                error: 'Ошибка при отправке в Telegram',
                details: errorMessage
            }, { status: 500 });
        }
    }
    catch (error) {
        console.error('❌ Ошибка на сервере при отправке файла:', error);
        const errorMessage = error.message || 'Неизвестная ошибка';
        const details = {
            telegramId: telegramId ? `${telegramId.substring(0, 3)}...` : 'undefined',
            fileExists: Boolean(file),
            fileSize: file ? file.size : 0,
            botToken: process.env.TELEGRAM_BOT_TOKEN ? 'exists' : 'missing',
            nodeEnv: process.env.NODE_ENV
        };
        console.error('🔍 Детали ошибки:', details);
        return server_1.NextResponse.json({
            error: 'Внутренняя ошибка сервера.',
            details: errorMessage,
            diagnostics: details
        }, { status: 500 });
    }
}
