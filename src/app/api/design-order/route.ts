import { NextRequest, NextResponse } from 'next/server';

const ADMIN_CHAT_ID = '6021853805'; // ID админа

export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json();
    
    // Логируем данные заказа
    console.log('Получен заказ на дизайн:', orderData);
    
    // Отправляем уведомления в Telegram (если есть токен бота)
    let telegramSent = false;
    if (process.env.TELEGRAM_BOT_TOKEN) {
      try {
        // Отправляем админу техническое уведомление
        const adminMessage = formatAdminMessage(orderData);
        await sendTelegramMessage(adminMessage, ADMIN_CHAT_ID);
        
        // Отправляем клиенту клиентоориентированное сообщение
        const clientMessage = formatClientMessage(orderData);
        const clientChatId = orderData.user?.id?.toString();
        if (clientChatId) {
          await sendTelegramMessage(clientMessage, clientChatId);
        }
        
        telegramSent = true;
        console.log('Уведомления отправлены в Telegram (админу и клиенту)');
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

function formatAdminMessage(orderData: any) {
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

🛍 <b>Детали заказа:</b>
• ${designTypeText}
• ${categoryText}  
• <b>Брендбук:</b> ${brandbookText}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}
🌐 <b>Источник:</b> Веб-приложение

<i>Требуется связаться с клиентом в течение часа</i>

#дизайн #заявка #новый_заказ`;
}

function formatClientMessage(orderData: any) {
  const { orderNumber, designType, user } = orderData;
  
  const designTypeText = designType === 'single-item' 
    ? 'дизайн одного изделия' 
    : 'дизайн коллекции';

  const userName = user?.first_name || 'Клиент';

  return `✅ <b>Ваша заявка принята!</b>

Здравствуйте, ${userName}! 

Мы получили вашу заявку на <b>${designTypeText}</b>
📋 <b>Номер заказа:</b> <code>${orderNumber}</code>

🎯 <b>Что дальше:</b>
• Наш персональный менеджер @zelenayaaliya свяжется с вами в течение часа
• Обсудим детали проекта и составим техническое задание  
• Подготовим для вас коммерческое предложение

💬 <b>Есть вопросы?</b> Пишите @zelenayaaliya

Спасибо за доверие! 🚀`;
}

async function sendTelegramMessage(message: string, chatId: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
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
