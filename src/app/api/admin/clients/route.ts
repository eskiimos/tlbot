import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function checkAuth() {
  const cookieStore = await cookies();
  return cookieStore.get('admin_session')?.value === 'authenticated';
}

export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
  });

  // Агрегируем по telegramId (клиент)
  const clientMap: Record<string, {
    telegramId: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    customerCompany: string | null;
    customerInn: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderAt: string;
    lastOrderStatus: string;
    orders: { id: string; totalAmount: number; status: string; createdAt: string }[];
  }> = {};

  for (const order of orders) {
    const tid = order.telegramId;
    if (!clientMap[tid]) {
      clientMap[tid] = {
        telegramId: tid,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        customerCompany: order.customerCompany,
        customerInn: order.customerInn,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: order.createdAt.toISOString(),
        lastOrderStatus: order.status,
        orders: [],
      };
    }
    clientMap[tid].totalOrders += 1;
    if (order.status !== 'CANCELLED') {
      clientMap[tid].totalSpent += order.totalAmount;
    }
    clientMap[tid].orders.push({
      id: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    });
  }

  const clients = Object.values(clientMap).sort((a, b) => b.totalSpent - a.totalSpent);

  return NextResponse.json({ clients });
}
