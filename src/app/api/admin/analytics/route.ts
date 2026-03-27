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
    orderBy: { createdAt: 'asc' },
  });

  // KPI
  const totalRevenue = orders
    .filter(o => o.status !== 'CANCELLED')
    .reduce((s, o) => s + o.totalAmount, 0);

  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  const completedRevenue = completedOrders.reduce((s, o) => s + o.totalAmount, 0);

  const activeOrders = orders.filter(o =>
    !['COMPLETED', 'CANCELLED'].includes(o.status)
  );

  const avgOrderValue = orders.length > 0
    ? Math.round(totalRevenue / orders.filter(o => o.status !== 'CANCELLED').length)
    : 0;

  const uniqueClients = new Set(orders.map(o => o.telegramId)).size;

  // Статусы
  const statusCount = orders.reduce((acc: Record<string, number>, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  // Revenue по месяцам (последние 6 месяцев)
  const now = new Date();
  const months: { label: string; month: number; year: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
      month: d.getMonth(),
      year: d.getFullYear(),
    });
  }

  const revenueByMonth = months.map(({ label, month, year }) => {
    const monthOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === month && d.getFullYear() === year && o.status !== 'CANCELLED';
    });
    return {
      label,
      revenue: monthOrders.reduce((s, o) => s + o.totalAmount, 0),
      count: monthOrders.length,
    };
  });

  // Топ продуктов по выручке
  const productRevenue: Record<string, { name: string; revenue: number; count: number }> = {};
  for (const order of orders) {
    if (order.status === 'CANCELLED') continue;
    const items = Array.isArray(order.items) ? order.items : [];
    for (const item of items as any[]) {
      const slug = item.productSlug || item.slug || 'unknown';
      const name = item.productName || item.name || slug;
      if (!productRevenue[slug]) {
        productRevenue[slug] = { name, revenue: 0, count: 0 };
      }
      productRevenue[slug].revenue += item.totalPrice || 0;
      productRevenue[slug].count += item.quantity || 1;
    }
  }
  const topProducts = Object.values(productRevenue)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Воронка по статусам
  const funnelOrder = ['NEW', 'IN_PROGRESS', 'DESIGN', 'PRODUCTION', 'READY', 'COMPLETED'];
  const funnel = funnelOrder.map(status => ({
    status,
    count: statusCount[status] || 0,
  }));

  return NextResponse.json({
    kpi: {
      totalRevenue,
      completedRevenue,
      avgOrderValue,
      totalOrders: orders.length,
      activeOrders: activeOrders.length,
      completedOrders: completedOrders.length,
      uniqueClients,
      cancelledOrders: statusCount['CANCELLED'] || 0,
    },
    revenueByMonth,
    topProducts,
    statusCount,
    funnel,
  });
}
