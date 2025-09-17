// Тестовый скрипт для проверки API заказов
const axios = require('axios');

const baseURL = 'http://localhost:3000';

async function testOrdersAPI() {
  try {
    console.log('🧪 Тестируем API заказов...\n');
    
    // 1. Тестируем получение всех заказов (без авторизации - должно вернуть ошибку)
    console.log('1. Тестируем доступ к заказам без авторизации:');
    try {
      const response = await axios.get(`${baseURL}/api/admin/orders`);
      console.log('❌ Неожиданно получен доступ без авторизации');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Правильно отклонен доступ без авторизации (401)');
      } else {
        console.log('❌ Неожиданная ошибка:', error.response?.status);
      }
    }
    
    // 2. Тестируем проверку существования заказов в БД
    console.log('\n2. Проверяем заказы в БД через webhook симуляцию:');
    
    // Симулируем запрос от Telegram бота
    const webhookData = {
      update_id: 123456,
      callback_query: {
        id: 'test_callback',
        from: {
          id: 123456789,
          first_name: 'Тест',
          username: 'testuser'
        },
        data: 'my_orders',
        message: {
          message_id: 1,
          date: Math.floor(Date.now() / 1000),
          chat: {
            id: 123456789,
            type: 'private'
          },
          text: 'test'
        }
      }
    };
    
    console.log('Отправляем webhook для "my_orders" action...');
    
    try {
      const webhookResponse = await axios.post(`${baseURL}/api/bot`, webhookData, {
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Bot-Api-Secret-Token': process.env.TELEGRAM_BOT_SECRET_TOKEN || 'test'
        }
      });
      
      console.log('✅ Webhook обработан успешно');
      console.log('Статус:', webhookResponse.status);
      
    } catch (error) {
      console.log('❌ Ошибка webhook:', error.response?.status || error.message);
      if (error.response?.data) {
        console.log('Данные ошибки:', error.response.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error.message);
  }
}

testOrdersAPI();