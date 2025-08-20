import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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

// GET - получить комментарии к заказу
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await checkAuth(request);

    const { id: orderId } = await params;

    let comments: any[] = [];
    try {
      comments = await prisma.orderComment.findMany({
        where: { orderId },
        orderBy: { createdAt: 'asc' }
      });
    } catch (dbError) {
      console.warn('⚠️ Таблица комментариев недоступна, возвращаем пустой массив:', dbError);
      comments = [];
    }

    return NextResponse.json({
      comments: comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt ? comment.createdAt.toISOString() : new Date().toISOString()
      }))
    });
  } catch (error) {
    console.error('Ошибка получения комментариев:', error);
    const message = error instanceof Error ? error.message : 'Ошибка сервера';
    const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// POST - добавить комментарий к заказу
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await checkAuth(request);
    const { content } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Комментарий не может быть пустым' }, { status: 400 });
    }

    const { id: orderId } = await params;

    // Проверяем что заказ существует
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    });

    if (!order) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    // Создаем комментарий только если таблица существует
    let comment;
    try {
      comment = await prisma.orderComment.create({
        data: {
          orderId,
          content: content.trim(),
          isAdmin: true,
          authorName: admin.username
        }
      });
    } catch (dbError) {
      console.warn('⚠️ Не удалось создать комментарий, таблица недоступна:', dbError);
      return NextResponse.json({ 
        error: 'Система комментариев временно недоступна' 
      }, { status: 503 });
    }

    return NextResponse.json({
      message: 'Комментарий добавлен',
      comment: {
        ...comment,
        createdAt: comment.createdAt.toISOString()
      }
    });
  } catch (error) {
    console.error('Ошибка добавления комментария:', error);
    const message = error instanceof Error ? error.message : 'Ошибка сервера';
    const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
