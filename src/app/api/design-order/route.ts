import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    // Логируем данные заказа
    console.log('Получен заказ на дизайн:', orderData);
    
    // Формируем сообщение для отправки в Telegram
    const message = formatOrderMessage(orderData);
    console.log('Сформированное сообщение:', message);
    
    // Отправляем уведомление в Telegram (если есть токен бота)
    let telegramSent = false;
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        await sendTelegramMessage(message, orderData.user);
        telegramSent = true;
        console.log('Уведомление отправлено в Telegram');
      } catch (telegramError) {
        console.error('Ошибка отправки в Telegram:', telegramError);
        // Не останавливаем процесс, если Telegram недоступен
      }
    } else {
      console.log('TELEGRAM_BOT_TOKEN не настроен, пропускаем отправку в Telegram');
    }
    
    // Здесь можно добавить сохранение в базу данных
    // await saveOrderToDatabase(orderData);
    
    return NextResponse.json({
      success: true,
      orderNumber: orderData.orderNumber,
      message: 'Заказ успешно обработан',
      telegramSent
    });
  } catch (error) {
    console.error('Ошибка обработки заказа:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Ошибка обработки заказа',
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    );
  }
}

function formatOrderMessage(orderData: any) {
  const { orderNumber, designType, category, brandbook, user } = orderData;
  
  const designTypeText = designType === 'single-item' 
    ? '🎨 Дизайн одного изделия (от 15,000 ₽)' 
    : '🎨 Дизайн коллекции (от 50,000 ₽)';
    
  const categoryText = category === 'clothing' 
    ? '👕 Одежда' 
    : category === 'accessories' 
    ? '🎒 Аксессуары' 
    : '📦 Все категории';
    
  const brandbookText = brandbook === 'yes' 
    ? '✅ Есть готовый' 
    : brandbook === 'partial' 
    ? '⚠️ Частично готов' 
    : '🆕 Создаём с нуля';

  const userInfo = user 
    ? `👤 <b>Клиент:</b> ${user.first_name} ${user.last_name || ''} ${user.username ? `(@${user.username})` : ''}`
    : '👤 <b>Клиент:</b> Анонимный пользователь';

  return `🚀 <b>НОВАЯ ЗАЯВКА НА ДИЗАЙН</b>

📋 <b>Номер заказа:</b> <code>${orderNumber}</code>

${userInfo}

� <b>Детали заказа:</b>
• ${designTypeText}
• ${categoryText}  
• <b>Брендбук:</b> ${brandbookText}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
🌐 <b>Источник:</b> Веб-приложение

<i>Требуется связаться с клиентом в течение часа</i>

#дизайн #заявка #новый_заказ`;
}

async function sendTelegramMessage(message: string, user: any) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID || user?.id;
    
    if (!botToken || !chatId) {
      console.log('Не настроены параметры Telegram бота');
      return;
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`Ошибка отправки в Telegram: ${response.statusText}`);
    }

    console.log('Сообщение успешно отправлено в Telegram');
  } catch (error) {
    console.error('Ошибка отправки в Telegram:', error);
    throw error;
  }
}
