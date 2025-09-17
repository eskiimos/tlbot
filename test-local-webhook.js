// Тест локального webhook'а с правильными данными

const baseURL = 'http://localhost:3000';

async function testLocalWebhook() {
  try {
    console.log('🧪 Тестируем локальный webhook с командой /start...\n');
    
    // Симулируем команду /start
    const startData = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: 123456789,
          first_name: 'Тест',
          username: 'testuser',
          is_bot: false
        },
        chat: {
          id: 123456789,
          first_name: 'Тест',
          username: 'testuser',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
        entities: [{
          offset: 0,
          length: 6,
          type: 'bot_command'
        }]
      }
    };
    
    console.log('Отправляем команду /start...');
    
    const response = await fetch(`${baseURL}/api/bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startData)
    });
    
    console.log('Статус ответа:', response.status);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Webhook успешно обработан');
      console.log('Ответ:', result || '(пустой ответ - нормально)');
    } else {
      const error = await response.text();
      console.log('❌ Ошибка:', error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testLocalWebhook();

async function testLocalWebhook() {
  try {
    console.log('🧪 Тестируем локальный webhook с командой /start...\n');
    
    // Симулируем команду /start
    const startData = {
      update_id: Date.now(),
      message: {
        message_id: Date.now(),
        from: {
          id: 123456789,
          first_name: 'Тест',
          username: 'testuser',
          is_bot: false
        },
        chat: {
          id: 123456789,
          first_name: 'Тест',
          username: 'testuser',
          type: 'private'
        },
        date: Math.floor(Date.now() / 1000),
        text: '/start',
        entities: [{
          offset: 0,
          length: 6,
          type: 'bot_command'
        }]
      }
    };
    
    console.log('Отправляем команду /start...');
    
    const response = await fetch(`${baseURL}/api/bot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(startData)
    });
    
    console.log('Статус ответа:', response.status);
    
    if (response.ok) {
      const result = await response.text();
      console.log('✅ Webhook успешно обработан');
      console.log('Ответ:', result || '(пустой ответ - нормально)');
    } else {
      const error = await response.text();
      console.log('❌ Ошибка:', error);
    }
    
  } catch (error) {
    console.error('❌ Ошибка тестирования:', error.message);
  }
}

testLocalWebhook();