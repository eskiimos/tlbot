import { NextResponse } from 'next/server';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram credentials not configured');
      return NextResponse.json(
        { error: 'Telegram not configured' },
        { status: 500 }
      );
    }

    // Формируем сообщение для Telegram
    const products = orderData.products || [];
    const quantities = orderData.quantities || {};
    
    let productsList = '';
    let totalQuantity = 0;
    
    products.forEach((product: string) => {
      const quantity = quantities[product] || 10;
      productsList += `• ${product}: ${quantity} шт.\n`;
      totalQuantity += quantity;
    });

    const message = `🏭 НОВАЯ ЗАЯВКА НА ПРОИЗВОДСТВО\n\n` +
      `📋 Номер заказа: #${orderData.orderNumber}\n` +
      `🎯 Услуга: Производство мерча\n` +
      `📅 Дата: ${new Date(orderData.timestamp).toLocaleString('ru-RU')}\n\n` +
      `📦 ТОВАРЫ:\n${productsList}\n` +
      `📊 Общее количество: ${totalQuantity} шт.\n` +
      `💼 Количество позиций: ${products.length}\n\n` +
      `👤 КЛИЕНТ:\n` +
      `${orderData.user ? 
        `• Имя: ${orderData.user.first_name || 'Не указано'} ${orderData.user.last_name || ''}\n` +
        `• Username: @${orderData.user.username || 'Не указан'}\n` +
        `• ID: ${orderData.user.id || 'Не указан'}`
        : '• Анонимный пользователь'
      }\n\n` +
      `🌐 Источник: ${orderData.source || 'webapp'}`;

    // Отправляем сообщение в Telegram
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.text();
      console.error('Telegram API error:', errorData);
      throw new Error('Failed to send to Telegram');
    }

    console.log('Production order sent to Telegram successfully');
    return NextResponse.json({ success: true, orderNumber: orderData.orderNumber });

  } catch (error) {
    console.error('Error processing production order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
