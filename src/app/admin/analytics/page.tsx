'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

interface KPI {
  totalRevenue: number;
  completedRevenue: number;
  avgOrderValue: number;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  uniqueClients: number;
  cancelledOrders: number;
}

interface RevenueMonth {
  label: string;
  revenue: number;
  count: number;
}

interface TopProduct {
  name: string;
  revenue: number;
  count: number;
}

interface FunnelItem {
  status: string;
  count: number;
}

interface AnalyticsData {
  kpi: KPI;
  revenueByMonth: RevenueMonth[];
  topProducts: TopProduct[];
  statusCount: Record<string, number>;
  funnel: FunnelItem[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новые',
  IN_PROGRESS: 'В обработке',
  DESIGN: 'Дизайн',
  PRODUCTION: 'Производство',
  READY: 'Готов',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  DESIGN: '#8b5cf6',
  PRODUCTION: '#f97316',
  READY: '#10b981',
  COMPLETED: '#303030',
  CANCELLED: '#ef4444',
};

const PIE_COLORS = ['#303030', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#f97316', '#ef4444'];

function formatRub(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} млн ₽`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} тыс ₽`;
  return `${n} ₽`;
}

function formatRubFull(n: number) {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
}

const CustomTooltipRevenue = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-black/10 rounded-xl px-4 py-3 shadow-lg text-xs">
        <p className="font-semibold text-[#303030] mb-1">{label}</p>
        <p className="text-black/60">Выручка: <span className="text-[#303030] font-medium">{formatRubFull(payload[0].value)}</span></p>
        {payload[1] && <p className="text-black/60">Заказов: <span className="text-[#303030] font-medium">{payload[1].value}</span></p>}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) { router.push('/admin'); return; }
      const json = await res.json();
      setData(json);
    } catch {
      router.push('/admin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#303030] border-t-transparent"></div>
      </div>
    );
  }

  if (!data) return null;

  const { kpi, revenueByMonth, topProducts, statusCount, funnel } = data;

  const pieData = Object.entries(statusCount)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: STATUS_LABELS[key] || key, value, key }));

  const maxProductRevenue = topProducts[0]?.revenue || 1;

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* KPI карточки */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Общая выручка', value: formatRub(kpi.totalRevenue), sub: 'все заказы', accent: true },
            { label: 'Ср. чек', value: formatRub(kpi.avgOrderValue), sub: 'на заказ' },
            { label: 'Клиентов', value: kpi.uniqueClients, sub: 'уникальных' },
            { label: 'Завершено', value: kpi.completedOrders, sub: `из ${kpi.totalOrders} заказов` },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl p-5 border ${card.accent ? 'bg-[#303030] border-transparent' : 'bg-white border-black/5'}`}>
              <p className={`text-xs mb-1 ${card.accent ? 'text-white/50' : 'text-black/40'}`}>{card.label}</p>
              <p className={`text-2xl font-bold ${card.accent ? 'text-white' : 'text-[#303030]'}`}>{card.value}</p>
              <p className={`text-xs mt-1 ${card.accent ? 'text-white/40' : 'text-black/30'}`}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Revenue & Count chart */}
        <div className="bg-white border border-black/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#303030]">Выручка по месяцам</h2>
            <span className="text-xs text-black/40">последние 6 месяцев</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueByMonth} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#303030" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#303030" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => formatRub(v)} tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltipRevenue />} />
              <Area type="monotone" dataKey="revenue" stroke="#303030" strokeWidth={2} fill="url(#revGrad)" dot={{ fill: '#303030', r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Два чарта в ряд */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Статусы — пирог */}
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#303030] mb-5">Заказы по статусам</h2>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="value" paddingAngle={2} strokeWidth={0}>
                    {pieData.map((entry, index) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key] || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} шт.`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 flex-1">
                {pieData.map((entry, i) => (
                  <div key={entry.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: STATUS_COLORS[entry.key] || PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-black/60">{entry.name}</span>
                    </div>
                    <span className="text-xs font-medium text-[#303030]">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Воронка */}
          <div className="bg-white border border-black/5 rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[#303030] mb-5">Воронка заказов</h2>
            <div className="space-y-2">
              {funnel.filter(f => f.count > 0).map((f) => {
                const maxCount = Math.max(...funnel.map(x => x.count), 1);
                const pct = Math.round((f.count / maxCount) * 100);
                return (
                  <div key={f.status}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-black/60">{STATUS_LABELS[f.status]}</span>
                      <span className="text-xs font-medium text-[#303030]">{f.count}</span>
                    </div>
                    <div className="h-1.5 bg-black/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, background: STATUS_COLORS[f.status] || '#303030' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Топ продуктов */}
        <div className="bg-white border border-black/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-[#303030]">Топ продуктов по выручке</h2>
            <span className="text-xs text-black/40">{topProducts.length} позиций</span>
          </div>
          <div className="space-y-3">
            {topProducts.map((p, i) => {
              const pct = Math.round((p.revenue / maxProductRevenue) * 100);
              return (
                <div key={p.name}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black/25 w-4 text-right">{i + 1}</span>
                      <span className="text-sm text-[#303030]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-black/40">{p.count} шт.</span>
                      <span className="text-sm font-semibold text-[#303030]">{formatRub(p.revenue)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-black/5 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full bg-[#303030] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, opacity: 1 - i * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Доп KPI Strip */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Активных заказов', value: kpi.activeOrders },
            { label: 'Выручка (закрытые)', value: formatRub(kpi.completedRevenue) },
            { label: 'Отменённых', value: kpi.cancelledOrders },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-black/5 rounded-2xl p-4 text-center">
              <p className="text-xs text-black/40 mb-1">{c.label}</p>
              <p className="text-xl font-bold text-[#303030]">{c.value}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
