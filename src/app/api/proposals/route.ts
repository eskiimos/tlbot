import { NextRequest, NextResponse } from 'next/server';
import { Telegraf } from 'telegraf';
import { Input } from 'telegraf';
import { generateProposalHTML } from '@/lib/generateProposalHTML';
import { prisma } from '@/lib/prisma';

const ADMIN_CHAT_ID = '6021853805'; // ID админа

// Функция для отправки уведомления админу
async function sendAdminNotification(bot: Telegraf, clientTelegramId: string, orderData: any, fileName: string) {
  try {
    const clientInfo = orderData.customerName ? `${orderData.customerName}` : 'Неизвестный';
    const companyInfo = orderData.companyName ? ` (${orderData.companyName})` : '';
    const totalItems = orderData.items?.length || 0;
    const totalAmount = orderData.totalAmount || 'Не указано';
    const phoneNumber = orderData.customerPhone || 'Не указан';
    const username = orderData.customerUsername ? `@${orderData.customerUsername}` : 'Не указан';
    const inn = orderData.customerInn || 'Не указан';
    
    const adminMessage = `🔔 <b>КП ОТПРАВЛЕНО КЛИЕНТУ</b>

👤 <b>Клиент:</b> ${clientInfo}${companyInfo}
📱 <b>Telegram:</b> ${username} (ID: <code>${clientTelegramId}</code>)
📞 <b>Телефон:</b> ${phoneNumber}
🏢 <b>ИНН:</b> ${inn}
📧 <b>Email:</b> ${orderData.customerEmail || 'Не указан'}

🛍 <b>Заказ:</b>
• Товаров: ${totalItems} шт.
• Сумма: ${totalAmount}₽

📄 <b>Файл:</b> ${fileName}

⏰ <b>Время:</b> ${new Date().toLocaleString('ru-RU')}

💬 <b>Статус:</b> Ожидает ответа клиента
🔄 <b>Действие:</b> Можно дублировать КП при необходимости

#КП #отправлено #клиент`;

    await bot.telegram.sendMessage(ADMIN_CHAT_ID, adminMessage, {
      parse_mode: 'HTML'
    });
    
    console.log('✅ Уведомление админу отправлено');
  } catch (error) {
    console.error('❌ Ошибка отправки уведомления админу:', error);
    // Не прерываем основной процесс при ошибке уведомления админу
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API /api/proposals вызван');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('🔑 Bot token exists:', Boolean(process.env.TELEGRAM_BOT_TOKEN));
  console.log('📁 Import check:', Boolean(generateProposalHTML));
  console.log('🔍 generateProposalHTML type:', typeof generateProposalHTML);
  
  let telegramId: string | null = null;
  let orderData: any = null;
  
  try {
    const formData = await request.formData();
    telegramId = formData.get('telegramId') as string | null;
    
    // Получаем данные заказа из формы
    const orderDataString = formData.get('orderData') as string | null;
    if (orderDataString) {
      try {
        orderData = JSON.parse(orderDataString);
        console.log('📦 Order data parsed successfully');
      } catch (jsonError) {
        console.error('❌ Ошибка парсинга orderData JSON:', jsonError);
        return NextResponse.json({ error: 'Invalid order data format' }, { status: 400 });
      }
    }

    console.log('📨 Получен запрос на отправку КП:', {
      telegramId: telegramId,
      hasOrderData: Boolean(orderData)
    });

    if (!telegramId || !orderData) {
      return NextResponse.json({ error: 'Missing telegram ID or order data' }, { status: 400 });
    }

    // Проверяем токен бота
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    console.log('🔑 Используемый токен:', botToken ? `${botToken.substring(0, 15)}...` : 'НЕ НАЙДЕН');
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN не найден');
      return NextResponse.json({ error: 'Bot configuration missing' }, { status: 500 });
    }

    // Проверяем тестовый режим
    if (telegramId === '123456789' && process.env.NODE_ENV === 'development') {
      console.log('🧪 Тестовый режим: сохраняем заказ, но пропускаем отправку в Telegram');
      
      // В тестовом режиме тоже сохраняем заказ в базу данных
      const savedOrder = await prisma.order.create({
        data: {
          userId: telegramId,
          telegramId: telegramId,
          customerName: orderData.customerName || 'Тестовый клиент',
          customerEmail: orderData.customerEmail || null,
          customerPhone: orderData.customerPhone || null,
          customerCompany: orderData.customerCompany || null,
          customerInn: orderData.customerInn || null,
          items: orderData.items || [],
          totalAmount: Math.round(orderData.totalAmount || 0), // Сохраняем в рублях
          status: 'NEW'
        }
      });
      
      console.log('✅ Тестовый заказ сохранен с ID:', savedOrder.id);
      
      // Создаем контекст чата для пользователя
      try {
        await prisma.userOrderContext.upsert({
          where: { userId: telegramId },
          update: { orderId: savedOrder.id },
          create: { 
            userId: telegramId,
            orderId: savedOrder.id 
          }
        });
        console.log('✅ Контекст чата создан для заказа:', savedOrder.id);
      } catch (contextError) {
        console.warn('⚠️ Не удалось создать контекст чата:', contextError);
      }
      
      return NextResponse.json({ 
        message: 'Test mode: proposal generated successfully',
        mode: 'development',
        orderId: savedOrder.id
      }, { status: 200 });
    }

    // Инициализируем бот
    const bot = new Telegraf(botToken);
    console.log('📤 Отправка КП через бота...');

    try {
      // Сохраняем заказ в базу данных
      console.log('💾 Сохраняем заказ в базу данных...');
      
      const savedOrder = await prisma.order.create({
        data: {
          userId: telegramId,
          telegramId: telegramId,
          customerName: orderData.customerName || 'Не указано',
          customerEmail: orderData.customerEmail || null,
          customerPhone: orderData.customerPhone || null,
          customerCompany: orderData.customerCompany || null,
          customerInn: orderData.customerInn || null,
          items: orderData.items || [],
          totalAmount: Math.round(orderData.totalAmount || 0), // Сохраняем в рублях
          status: 'NEW'
        }
      });
      
      console.log('✅ Заказ сохранен с ID:', savedOrder.id);

      // Создаем контекст чата для пользователя
      try {
        await prisma.userOrderContext.upsert({
          where: { userId: telegramId },
          update: { orderId: savedOrder.id },
          create: { 
            userId: telegramId,
            orderId: savedOrder.id 
          }
        });
        console.log('✅ Контекст чата создан для заказа:', savedOrder.id);
      } catch (contextError) {
        console.warn('⚠️ Не удалось создать контекст чата:', contextError);
      }

      // Добавляем отладочную информацию
      console.log('📋 Данные для КП:', {
        detailedProposal: orderData.detailedProposal,
        items: orderData.items?.length,
        customer: orderData.customerName
      });

      // Генерируем HTML документ с правильной структурой данных
      const htmlContent = generateProposalHTML({
        orderData,
        cartItems: (orderData.items || []).map((item: any) => ({
          ...item,
          // detailedProposal берется из каждого товара отдельно
          detailedProposal: item.detailedProposal || false
        })),
        userData: {
          telegramId: telegramId,
          firstName: orderData.customerName,
          email: orderData.customerEmail,
          companyName: orderData.companyName
        }
      });
      
      // Создаем Buffer из HTML строки
      const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
      
      // Генерируем имя файла
      const fileName = `КП_${orderData?.customerName?.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_') || 'Total_Lookas'}_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.html`;
      
      // Отправляем HTML файл как документ
      const sentMessage = await bot.telegram.sendDocument(
        telegramId,
        Input.fromBuffer(htmlBuffer, fileName),
        {
          caption: `🎉 Ваше коммерческое предложение готово!\n\n` +
                  `📋 Откройте файл в браузере для просмотра.\n\n` +
                  `💬 Есть вопросы или нужны изменения? Мы всегда готовы обсудить детали!\n\n` +
                  `🚀 Total Lookas — превращаем мерч в арт-объекты!`
        }
      );
      
      console.log('✅ HTML документ отправлен');
      
      // Отправляем уведомление админу о том, что КП отправлено
      await sendAdminNotification(bot, telegramId, orderData, fileName);
      
      return NextResponse.json({ 
        message: 'HTML proposal sent successfully to Telegram',
        messageId: sentMessage.message_id
      }, { status: 200 });

    } catch (telegramError: any) {
      console.error('❌ Ошибка Telegram:', telegramError);
      
      // Обработка специфических ошибок Telegram
      const errorMessage = telegramError.message || 'Unknown Telegram error';
      if (errorMessage.includes('chat not found')) {
        return NextResponse.json({ 
          error: 'Чат с ботом не найден',
          details: 'Пожалуйста, начните диалог с ботом командой /start'
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        error: 'Telegram API error',
        details: errorMessage
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Общая ошибка:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
