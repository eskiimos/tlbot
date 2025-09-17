// Тестовый скрипт для проверки API заказов (Node.js 18+)
const baseURL = 'http://localhost:3000';

async function testOrdersAPI() {
  try {
    console.log('🧪 Тестируем API заказов...\n');
    
    // 1. Тестируем получение всех заказов (без авторизации - должно вернуть ошибку)
    console.log('1. Тестируем доступ к заказам без авторизации:');
    try {
      const response = await fetch(`${baseURL}/api/admin/orders`);
      if (response.status === 401) {
        console.log('✅ Правильно отклонен доступ без авторизации (401)');
      } else {
        console.log('❌ Неожиданный статус:', response.status);
      }
    } catch (error) {
      console.log('❌ Ошибка сети:', error.message);
    }
    
    // 2. Тестируем проверку существования заказов в БД через webhook симуляцию
    console.log('\n2. Проверяем заказы в БД через webhook симуляцию:');
    
    // Симулируем запрос от Telegram бота для пользователя с заказом
    const webhookData = {
      update_id: 123456,
      callback_query: {
        id: 'test_callback',
        from: {
          id: 123456789, // ID пользователя из тестового заказа
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
      const webhookResponse = await fetch(`${baseURL}/api/bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData)
      });
      
      console.log('✅ Webhook обработан');
      console.log('Статус:', webhookResponse.status);
      
      if (webhookResponse.ok) {
        const result = await webhookResponse.text();
        console.log('Ответ:', result || 'Пустой ответ (нормально для webhook)');
      } else {
        const errorText = await webhookResponse.text();
        console.log('Ошибка:', errorText);
      }
      
    } catch (error) {
      console.log('❌ Ошибка webhook:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Общая ошибка тестирования:', error.message);
  }
}

testOrdersAPI();