'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  totalAmount: number;
  status: string;
  items: any[];
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
}

const statusLabels = {
  'NEW': 'Новая заявка',
  'IN_PROGRESS': 'В обработке',
  'DESIGN': 'Дизайн',
  'PRODUCTION': 'Производство',
  'READY': 'Готов',
  'COMPLETED': 'Завершён',
  'CANCELLED': 'Отменён'
};

const statusColors = {
  'NEW': 'bg-blue-50 text-blue-700',
  'IN_PROGRESS': 'bg-amber-50 text-amber-700',
  'DESIGN': 'bg-violet-50 text-violet-700',
  'PRODUCTION': 'bg-orange-50 text-orange-700',
  'READY': 'bg-emerald-50 text-emerald-700',
  'COMPLETED': 'bg-black/5 text-black/50',
  'CANCELLED': 'bg-red-50 text-red-600'
};

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth');
      if (!response.ok) {
        router.push('/admin');
      }
    } catch (error) {
      router.push('/admin');
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminComment: adminComment.trim() || undefined
        }),
      });

      if (response.ok) {
        await loadOrders();
        setSelectedOrder(null);
        setNewStatus('');
        setAdminComment('');
      }
    } catch (error) {
      console.error('Ошибка обновления заказа:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  const formatPrice = (price: number) => {
    // Автоматически определяем формат цены
    // Если цена больше 100000, вероятно она в копейках (старые данные)
    const actualPrice = price > 100000 ? price / 100 : price;
    return actualPrice.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#303030] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-black/40">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Заголовок */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[#303030] rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <span className="text-sm font-semibold text-[#303030]">Total Lookas</span>
                <span className="text-sm text-black/30 ml-2">Заказы</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-black/40 hover:text-[#303030] transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Всего', value: orders.length, color: 'text-[#303030]' },
            { label: 'Новые', value: orders.filter(o => o.status === 'NEW').length, color: 'text-blue-600' },
            { label: 'В работе', value: orders.filter(o => ['IN_PROGRESS', 'DESIGN', 'PRODUCTION'].includes(o.status)).length, color: 'text-amber-600' },
            { label: 'Завершено', value: orders.filter(o => o.status === 'COMPLETED').length, color: 'text-emerald-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-black/5 rounded-2xl p-5">
              <p className="text-xs text-black/40 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Список заказов */}
        <div className="bg-white border border-black/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-black/5">
            <h2 className="text-sm font-semibold text-[#303030]">Все заказы</h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-black/30">Заказов пока нет</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="px-6 py-3 text-left text-xs font-medium text-black/40">Заказ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black/40">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black/40">Сумма</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black/40">Статус</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black/40">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-black/40">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-black/[0.02] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-[#303030]">#{order.id.slice(-8)}</div>
                        <div className="text-xs text-black/30 mt-0.5">
                          {Array.isArray(order.items) ? order.items.length : 0} поз.
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-[#303030]">{order.customerName}</div>
                        {order.customerCompany && (
                          <div className="text-xs text-black/40 mt-0.5">{order.customerCompany}</div>
                        )}
                        {order.customerEmail && (
                          <div className="text-xs text-black/30">{order.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-[#303030]">{formatPrice(order.totalAmount)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${statusColors[order.status as keyof typeof statusColors]}`}>
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-black/40">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                        <button
                          onClick={() => router.push(`/admin/orders/${order.id}`)}
                          className="text-[#303030] font-medium hover:underline"
                        >
                          Открыть
                        </button>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                            setAdminComment(order.adminComment || '');
                          }}
                          className="text-black/40 hover:text-[#303030] transition-colors"
                        >
                          Изменить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно редактирования */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md">
            <h3 className="text-base font-semibold text-[#303030] mb-5">
              Заказ <span className="font-mono text-black/40">#{selectedOrder.id.slice(-8)}</span>
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-black/40 mb-1.5">Статус</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#303030] transition-colors"
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-black/40 mb-1.5">Комментарий</label>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm placeholder-black/25 focus:outline-none focus:border-[#303030] resize-none transition-colors"
                  placeholder="Дополнительная информация..."
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={updateOrderStatus}
                disabled={isUpdating}
                className="flex-1 bg-[#303030] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#404040] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                onClick={() => { setSelectedOrder(null); setNewStatus(''); setAdminComment(''); }}
                className="px-5 py-3 border border-black/10 rounded-xl text-sm text-[#303030] hover:bg-black/5 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
