import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import { Telegraf } from 'telegraf';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

// Middleware для проверки авторизации
async function checkAuth(request: NextRequest) {
  const token = request.cookies.get('admin-token')?.value;
  if (!token) {
    throw new Error('Не авторизован');
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Простая проверка без БД
    if (decoded.adminId !== 'admin') {
      throw new Error('Неверный токен');
    }
    
    return { id: 'admin', username: decoded.username || 'admin' };
  } catch (error) {
    throw new Error('Неверный токен');
  }
}

// POST - отправить сообщение клиенту и добавить как комментарий
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAuth(request);
    const { content } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 });
    }

    const { id: orderId } = await params;

    // Проверяем что заказ существует и получаем информацию о клиенте
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { 
        id: true, 
        telegramId: true, 
        customerName: true,
        userId: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    // Создаем комментарий в базе
    const comment = await prisma.orderComment.create({
      data: {
        orderId,
        content: content.trim(),
        isAdmin: true,
        authorName: admin.username
      }
    });

    // Отправляем сообщение в Telegram
    try {
      const message = 
        `💬 Сообщение от менеджера по заказу #${order.id.slice(-8)}:\n\n` +
        `${content.trim()}\n\n` +
        `📝 Вы можете ответить прямо в этом чате.`;

      await bot.telegram.sendMessage(order.telegramId, message, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '📋 Мои заказы', callback_data: 'my_orders' },
              { text: `💬 Чат по заказу #${order.id.slice(-8)}`, callback_data: `chat_${order.id}` }
            ]
          ]
        }
      });

      console.log(`✅ Сообщение отправлено клиенту ${order.telegramId} по заказу ${orderId}`);
    } catch (telegramError) {
      console.error('❌ Ошибка отправки в Telegram:', telegramError);
      // Даже если не удалось отправить в Telegram, комментарий остается в базе
    }

    return NextResponse.json({
      message: 'Сообщение отправлено клиенту и добавлено в переписку',
      comment: {
        ...comment,
        createdAt: comment.createdAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    const message = error instanceof Error ? error.message : 'Ошибка сервера';
    const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
