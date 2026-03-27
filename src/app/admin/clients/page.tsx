'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

interface ClientOrder {
  id: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface Client {
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
  orders: ClientOrder[];
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DESIGN: 'Дизайн',
  PRODUCTION: 'Производство',
  READY: 'Готов',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-amber-50 text-amber-700',
  DESIGN: 'bg-violet-50 text-violet-700',
  PRODUCTION: 'bg-orange-50 text-orange-700',
  READY: 'bg-emerald-50 text-emerald-700',
  COMPLETED: 'bg-black/5 text-black/50',
  CANCELLED: 'bg-red-50 text-red-600',
};

function formatRub(n: number) {
  return n.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 });
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filtered, setFiltered] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'name'>('spent');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = clients.filter(c =>
      c.customerName.toLowerCase().includes(q) ||
      (c.customerCompany || '').toLowerCase().includes(q) ||
      (c.customerEmail || '').toLowerCase().includes(q)
    );
    if (sortBy === 'spent') result = [...result].sort((a, b) => b.totalSpent - a.totalSpent);
    if (sortBy === 'orders') result = [...result].sort((a, b) => b.totalOrders - a.totalOrders);
    if (sortBy === 'name') result = [...result].sort((a, b) => a.customerName.localeCompare(b.customerName));
    setFiltered(result);
  }, [search, sortBy, clients]);

  const load = async () => {
    try {
      const res = await fetch('/api/admin/clients');
      if (!res.ok) { router.push('/admin'); return; }
      const json = await res.json();
      setClients(json.clients);
      setFiltered(json.clients);
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

  const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#303030] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <AdminNav onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* Сводка */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Клиентов', value: clients.length },
            { label: 'Общая выручка', value: formatRub(totalRevenue) },
            { label: 'Ср. чек на клиента', value: formatRub(clients.length ? Math.round(totalRevenue / clients.length) : 0) },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-black/5 rounded-2xl p-5">
              <p className="text-xs text-black/40 mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-[#303030]">{c.value}</p>
            </div>
          ))}
        </div>

        {/* Поиск и сортировка */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-48 relative">
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени, компании, email..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm placeholder-black/25 focus:outline-none focus:border-[#303030] transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-white border border-black/10 rounded-xl p-1">
            {([['spent', 'По выручке'], ['orders', 'По заказам'], ['name', 'По имени']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${sortBy === key ? 'bg-[#303030] text-white' : 'text-black/50 hover:text-[#303030]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Таблица клиентов */}
        <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#303030]">Клиентская база</h2>
            <span className="text-xs text-black/40">{filtered.length} из {clients.length}</span>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-black/30">Нет клиентов по запросу</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {filtered.map((client) => {
                const isExpanded = expandedId === client.telegramId;
                const completedCount = client.orders.filter(o => o.status === 'COMPLETED').length;
                const conversionRate = client.totalOrders > 0
                  ? Math.round((completedCount / client.totalOrders) * 100)
                  : 0;

                return (
                  <div key={client.telegramId}>
                    {/* Строка клиента */}
                    <div
                      className="px-6 py-4 hover:bg-black/[0.02] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : client.telegramId)}
                    >
                      <div className="flex items-center gap-4">
                        {/* Аватар */}
                        <div className="w-10 h-10 rounded-full bg-[#303030] flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-semibold">{initials(client.customerName)}</span>
                        </div>

                        {/* Инфо */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#303030] truncate">{client.customerName}</p>
                            {client.customerCompany && (
                              <span className="text-xs text-black/40 truncate hidden sm:block">· {client.customerCompany}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {client.customerEmail && (
                              <span className="text-xs text-black/40 truncate">{client.customerEmail}</span>
                            )}
                            {client.customerPhone && (
                              <span className="text-xs text-black/30 hidden md:block">{client.customerPhone}</span>
                            )}
                          </div>
                        </div>

                        {/* Метрики */}
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <p className="text-xs text-black/40">Заказов</p>
                            <p className="text-sm font-semibold text-[#303030]">{client.totalOrders}</p>
                          </div>
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-black/40">Конверсия</p>
                            <p className="text-sm font-semibold text-[#303030]">{conversionRate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-black/40">Выручка</p>
                            <p className="text-sm font-semibold text-[#303030]">{formatRub(client.totalSpent)}</p>
                          </div>
                          <div className="text-right hidden lg:block">
                            <p className="text-xs text-black/40">Последний</p>
                            <p className="text-xs text-black/60">{formatDate(client.lastOrderAt)}</p>
                          </div>
                          <svg
                            className={`w-4 h-4 text-black/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Раскрытая история заказов */}
                    {isExpanded && (
                      <div className="px-6 pb-4 bg-black/[0.02] border-t border-black/5">
                        <div className="pt-4">
                          {/* Доп инфо по клиенту */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {client.customerInn && (
                              <div className="bg-white rounded-xl px-4 py-3 border border-black/5">
                                <p className="text-xs text-black/40 mb-0.5">ИНН</p>
                                <p className="text-sm text-[#303030] font-mono">{client.customerInn}</p>
                              </div>
                            )}
                            {client.customerPhone && (
                              <div className="bg-white rounded-xl px-4 py-3 border border-black/5">
                                <p className="text-xs text-black/40 mb-0.5">Телефон</p>
                                <a href={`tel:${client.customerPhone}`} className="text-sm text-[#303030] underline underline-offset-2">{client.customerPhone}</a>
                              </div>
                            )}
                            <div className="bg-white rounded-xl px-4 py-3 border border-black/5">
                              <p className="text-xs text-black/40 mb-0.5">Закрыто</p>
                              <p className="text-sm text-[#303030]">{completedCount} из {client.totalOrders}</p>
                            </div>
                            <div className="bg-white rounded-xl px-4 py-3 border border-black/5">
                              <p className="text-xs text-black/40 mb-0.5">Telegram ID</p>
                              <p className="text-sm text-[#303030] font-mono">{client.telegramId}</p>
                            </div>
                          </div>

                          {/* История заказов */}
                          <p className="text-xs font-medium text-black/40 mb-2">История заказов</p>
                          <div className="space-y-2">
                            {client.orders.map((order) => (
                              <div
                                key={order.id}
                                className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-black/5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                                onClick={(e) => { e.stopPropagation(); router.push(`/admin/orders/${order.id}`); }}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-mono text-black/40">#{order.id.slice(-8)}</span>
                                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-lg ${STATUS_COLORS[order.status]}`}>
                                    {STATUS_LABELS[order.status]}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-black/40">{formatDate(order.createdAt)}</span>
                                  <span className="text-sm font-semibold text-[#303030]">{formatRub(order.totalAmount)}</span>
                                  <svg className="w-4 h-4 text-black/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
