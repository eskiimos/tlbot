"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bot_1 = require("./bot");
console.log('🚀 Запуск Telegram бота в продакшене...');
// Создаем HTTP сервер для health check
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
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
        // В продакшене бот будет работать через webhook
        // Webhook будет настроен Railway автоматически
        console.log('✅ Telegram бот готов к обработке webhook запросов!');
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
process.on('SIGINT', () => {
    console.log('Получен сигнал SIGINT, завершение работы...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    console.log('Получен сигнал SIGTERM, завершение работы...');
    process.exit(0);
});
exports.default = app;
