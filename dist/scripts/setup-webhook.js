#!/usr/bin/env npx tsx
"use strict";
/**
 * Скрипт для установки webhook URL для Telegram бота
 */
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
async function setupWebhook() {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL;
    if (!BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
        process.exit(1);
    }
    if (!WEBHOOK_URL) {
        console.error('❌ NEXT_PUBLIC_APP_URL не найден в переменных окружения');
        process.exit(1);
    }
    const bot = new telegraf_1.Telegraf(BOT_TOKEN);
    const webhookUrl = `${WEBHOOK_URL}/api/bot`;
    try {
        console.log(`🔧 Устанавливаем webhook: ${webhookUrl}`);
        // Устанавливаем webhook
        await bot.telegram.setWebhook(webhookUrl);
        // Проверяем, что webhook установлен
        const webhookInfo = await bot.telegram.getWebhookInfo();
        console.log('✅ Webhook успешно установлен!');
        console.log('📋 Информация о webhook:');
        console.log(`   URL: ${webhookInfo.url}`);
        console.log(`   Количество ожидающих обновлений: ${webhookInfo.pending_update_count}`);
        if (webhookInfo.last_error_date) {
            console.log(`   Последняя ошибка: ${new Date(webhookInfo.last_error_date * 1000)}`);
            console.log(`   Сообщение об ошибке: ${webhookInfo.last_error_message}`);
        }
    }
    catch (error) {
        console.error('❌ Ошибка при установке webhook:', error);
        process.exit(1);
    }
}
// Альтернативная функция для удаления webhook (для разработки)
async function removeWebhook() {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
        console.error('❌ TELEGRAM_BOT_TOKEN не найден в переменных окружения');
        process.exit(1);
    }
    const bot = new telegraf_1.Telegraf(BOT_TOKEN);
    try {
        console.log('🗑️  Удаляем webhook...');
        await bot.telegram.deleteWebhook();
        console.log('✅ Webhook удален!');
    }
    catch (error) {
        console.error('❌ Ошибка при удалении webhook:', error);
        process.exit(1);
    }
}
// Проверяем аргументы командной строки
const command = process.argv[2];
if (command === 'remove') {
    removeWebhook();
}
else {
    setupWebhook();
}
