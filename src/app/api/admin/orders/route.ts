import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
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
    // Простая проверка - если токен валидный, то админ авторизован
    return { id: 'admin', username: 'admin' };
  } catch (error) {
    throw new Error('Неверный токен');
  }
}

// Получить все заказы
export async function GET(request: NextRequest) {
  try {
    await checkAuth(request);

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Преобразуем BigInt в строки для JSON
    const serializedOrders = orders.map(order => ({
      ...order,
      items: order.items,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }));

    return NextResponse.json({ orders: serializedOrders });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    const message = error instanceof Error ? error.message : 'Ошибка сервера';
    const status = message.includes('авторизован') || message.includes('токен') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// Создать заказ (будет вызываться при отправке КП)
export async function POST(request: NextRequest) {
  try {
    const { 
      userId, 
      telegramId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerCompany, 
      customerInn,
      items, 
      totalAmount 
    } = await request.json();

    const order = await prisma.order.create({
      data: {
        userId,
        telegramId,
        customerName,
        customerEmail,
        customerPhone,
        customerCompany,
        customerInn,
        items,
        totalAmount,
        status: 'NEW'
      }
    });

    console.log(`Создан новый заказ #${order.id} для пользователя ${customerName}`);

    return NextResponse.json({ 
      message: 'Заказ создан', 
      orderId: order.id 
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    return NextResponse.json({ error: 'Ошибка создания заказа' }, { status: 500 });
  }
}
