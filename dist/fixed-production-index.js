"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bot_1 = require("./bot");
console.log('🚀 Запуск Telegram бота в продакшене...');
// Создаем HTTP сервер для health check и webhook
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middleware для обработки JSON
app.use(express_1.default.json());
// Health check endpoint для Railway
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'telegram-bot'
    });
});
app.get('/', (req, res) => {
    res.status(200).json({
        message: 'Total Lookas Telegram Bot is running!',
        timestamp: new Date().toISOString()
    });
});
// Webhook endpoint для Telegram
app.post('/webhook', (req, res) => {
    try {
        bot_1.bot.handleUpdate(req.body);
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});
// Запуск HTTP сервера
app.listen(port, () => {
    console.log(`Health check server running on port ${port}`);
});
// Функция для запуска бота
async function startBot() {
    try {
        console.log('Инициализация бота...');
        // Получаем информацию о боте
        const botInfo = await bot_1.bot.telegram.getMe();
        console.log(`🤖 Бот запущен: @${botInfo.username} (ID: ${botInfo.id})`);
        // Устанавливаем webhook
        const webhookUrl = 'https://tlbot-production-production.up.railway.app/webhook';
        console.log('Устанавливаем webhook:', webhookUrl);
        await bot_1.bot.telegram.setWebhook(webhookUrl);
        console.log('✅ Webhook установлен успешно!');
        return true;
    }
    catch (error) {
        console.error('❌ Ошибка при запуске бота:', error);
        process.exit(1);
    }
}
// Запуск бота
startBot();
// Обработка завершения процесса
process.on('SIGINT', async () => {
    console.log('Получен сигнал SIGINT, завершение работы...');
    await bot_1.bot.telegram.deleteWebhook();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Получен сигнал SIGTERM, завершение работы...');
    await bot_1.bot.telegram.deleteWebhook();
    process.exit(0);
});
exports.default = app;
