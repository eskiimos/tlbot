import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

async function checkBotWebhook() {
  try {
    console.log('🔍 Проверяем настройки webhook бота...\n');
    
    // Получаем информацию о webhook
    const webhookInfo = await bot.telegram.getWebhookInfo();
    
    console.log('📋 Информация о webhook:');
    console.log('URL:', webhookInfo.url || 'НЕ УСТАНОВЛЕН (polling режим)');
    console.log('Pending updates:', webhookInfo.pending_update_count);
    console.log('Last error:', webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000) : 'Нет');
    console.log('Max connections:', webhookInfo.max_connections);
    
    if (webhookInfo.url) {
      console.log('\n⚠️  Бот работает в webhook режиме!');
      console.log('Это объясняет, почему ваши локальные изменения не работают.');
      console.log('\n🔧 Варианты решения:');
      console.log('1. Удалить webhook: await bot.telegram.deleteWebhook()');
      console.log('2. Установить webhook на локальный URL через ngrok');
      console.log('3. Деплоить изменения на продакшн');
    } else {
      console.log('\n✅ Бот работает в polling режиме');
      console.log('Локальные изменения должны работать при запуске bot.ts');
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки webhook:', error);
  }
}

checkBotWebhook();