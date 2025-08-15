import express from 'express';
import { bot } from './bot';

console.log('🚀 Запуск Telegram бота в продакшене...');

// Создаем HTTP сервер для health check
const app = express();
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
    const botInfo = await bot.telegram.getMe();
    console.log(`🤖 Бот запущен: @${botInfo.username} (ID: ${botInfo.id})`);
    
    // Запускаем бота в режиме polling для простоты
    await bot.launch();
    console.log('✅ Telegram бот успешно запущен и готов к работе!');
    
    return true;
  } catch (error) {
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

export default app;
