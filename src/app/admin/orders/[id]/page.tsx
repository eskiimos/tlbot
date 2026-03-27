'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

interface OrderItem {
  id?: string;
  productId?: string;
  productName?: string;
  name?: string; // альтернативное название
  productSlug?: string;
  pricePerUnit?: number;
  basePrice?: number; // альтернативная цена
  totalPrice?: number; // общая цена товара
  price?: number; // еще одна альтернативная цена
  quantity?: number;
  selectedOptions?: any;
  optionsDetails?: Array<{
    id: string;
    name: string;
    price: number;
    category: string;
  }>;
  designFiles?: string[];
  designComment?: string;
  image?: string;
}

interface OrderComment {
  id: string;
  content: string;
  isAdmin: boolean;
  authorName?: string;
  createdAt: string;
}

interface Order {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerCompany?: string;
  totalAmount: number;
  status: string;
  items: OrderItem[];
  adminComment?: string;
  createdAt: string;
  updatedAt: string;
  comments?: OrderComment[];
  user?: {
    username: string;
    firstName: string;
    lastName: string;
  };
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

export default function OrderDetails() {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Состояние для системы комментариев
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  
  // Состояние для отправки сообщений клиенту
  const [isSendingToClient, setIsSendingToClient] = useState(false);
  
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      checkAuth();
      if (params.id) {
        loadOrder(params.id as string);
      }
    }
  }, [params.id, isMounted]);

  const checkAuth = async () => {
    try {
      console.log('🔐 Проверка авторизации...');
      const response = await fetch('/api/admin/auth');
      console.log('🔐 Статус авторизации:', response.status);
      
      if (!response.ok) {
        console.log('❌ Не авторизован, редирект на /admin');
        router.push('/admin');
      } else {
        console.log('✅ Авторизация успешна');
      }
    } catch (error) {
      console.error('💥 Ошибка проверки авторизации:', error);
      router.push('/admin');
    }
  };

  const loadOrder = async (orderId: string) => {
    try {
      console.log('🔄 Загрузка заказа:', orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      console.log('📡 Ответ API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📦 Данные заказа получены:', data);
        setOrder(data.order);
        setNewStatus(data.order.status);
        setAdminComment(data.order.adminComment || '');
        
        // Устанавливаем комментарии из ответа
        if (data.order.comments) {
          setComments(data.order.comments);
        }
      } else {
        console.error('❌ Ошибка API:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('❌ Детали ошибки:', errorData);
        router.push('/admin/dashboard');
      }
    } catch (error) {
      console.error('💥 Исключение при загрузке заказа:', error);
      router.push('/admin/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
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
        await loadOrder(order.id);
      }
    } catch (error) {
      console.error('Ошибка обновления заказа:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const logout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin');
  };

  // Функция для добавления комментария
  const addComment = async () => {
    if (!order || !newComment.trim()) return;

    setIsAddingComment(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  // Функция для отправки сообщения клиенту в Telegram
  const sendToClient = async () => {
    if (!order || !newComment.trim()) return;

    setIsSendingToClient(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      } else {
        const errorData = await response.json();
        console.error('Ошибка отправки клиенту:', errorData.error);
      }
    } catch (error) {
      console.error('Ошибка отправки сообщения клиенту:', error);
    } finally {
      setIsSendingToClient(false);
    }
  };

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) {
      return '0 ₽';
    }
    // Автоматически определяем формат цены
    // Если цена больше 100000, вероятно она в копейках (старые данные)
    const actualPrice = numPrice > 100000 ? numPrice / 100 : numPrice;
    return actualPrice.toLocaleString('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    });
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#303030] border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-black/40">Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-black/40">Заказ не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <AdminNav onLogout={logout} />
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-center gap-2 text-sm">
          <button onClick={() => router.push('/admin/dashboard')} className="text-black/40 hover:text-[#303030] transition-colors">Заказы</button>
          <span className="text-black/20">/</span>
          <span className="font-mono text-[#303030]">#{order.id.slice(-8)}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-4">

            {/* Информация о клиенте */}
            <div className="bg-white border border-black/5 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#303030] mb-4">Клиент</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-black/40 mb-0.5">Имя</dt>
                  <dd className="text-sm text-[#303030]">{order.customerName}</dd>
                </div>
                {order.customerEmail && (
                  <div>
                    <dt className="text-xs text-black/40 mb-0.5">Email</dt>
                    <dd className="text-sm">
                      <a href={`mailto:${order.customerEmail}`} className="text-[#303030] underline underline-offset-2">
                        {order.customerEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <dt className="text-xs text-black/40 mb-0.5">Телефон</dt>
                    <dd className="text-sm">
                      <a href={`tel:${order.customerPhone}`} className="text-[#303030] underline underline-offset-2">
                        {order.customerPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {order.customerCompany && (
                  <div>
                    <dt className="text-xs text-black/40 mb-0.5">Компания</dt>
                    <dd className="text-sm text-[#303030]">{order.customerCompany}</dd>
                  </div>
                )}
                {order.user && (
                  <div>
                    <dt className="text-xs text-black/40 mb-0.5">Telegram</dt>
                    <dd className="text-sm text-[#303030]">
                      @{order.user.username} ({order.user.firstName} {order.user.lastName})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Состав заказа */}
            <div className="bg-white border border-black/5 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#303030] mb-4">Состав заказа</h2>
              <div className="space-y-3">
                {Array.isArray(order.items) ? order.items.map((item, index) => (
                  <div key={index} className="border border-black/5 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.productName || item.name || 'Товар'}
                            className="w-12 h-14 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-[#303030]">
                            {item.productName || item.name || `Товар ${index + 1}`}
                          </p>
                          <p className="text-xs text-black/40 mt-0.5">{item.quantity || 1} шт.</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-[#303030]">
                        {item.totalPrice
                          ? formatPrice(item.totalPrice)
                          : formatPrice((item.pricePerUnit || item.basePrice || item.price || 0) * (item.quantity || 1))}
                      </span>
                    </div>

                    {item.optionsDetails && item.optionsDetails.length > 0 && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {item.optionsDetails.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex justify-between items-center bg-black/[0.03] px-3 py-1.5 rounded-lg text-xs">
                            <span className="text-black/60">{option.name}</span>
                            <span className="text-[#303030] font-medium">
                              {option.price > 0 ? `+${formatPrice(option.price)}` : 'Базовая'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {!item.optionsDetails && item.selectedOptions && typeof item.selectedOptions === 'object' && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="mt-3 space-y-1">
                        {Object.entries(item.selectedOptions).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="text-black/40 capitalize">{key}</span>
                            <span className="text-[#303030]">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.designComment && (
                      <div className="mt-3 p-3 bg-black/[0.03] rounded-lg">
                        <p className="text-xs text-black/40 mb-1">Пожелания к дизайну</p>
                        <p className="text-xs text-[#303030]">{item.designComment}</p>
                      </div>
                    )}

                    {item.designFiles && item.designFiles.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {item.designFiles.map((file, fileIndex) => (
                          <a key={fileIndex} href={file} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-[#303030] underline underline-offset-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            Файл {fileIndex + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-sm text-black/30 text-center py-4">Товары не найдены</p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-black/5 flex justify-between items-center">
                <span className="text-sm font-medium text-black/40">Итого</span>
                <span className="text-lg font-bold text-[#303030]">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-4">
            {/* Управление заказом */}
            <div className="bg-white border border-black/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[#303030] mb-4">Управление</h2>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-black/40 mb-1.5">Текущий статус</p>
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${statusColors[order.status as keyof typeof statusColors]}`}>
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-black/40 mb-1.5">Изменить статус</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-black/10 rounded-xl text-sm focus:outline-none focus:border-[#303030] transition-colors"
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-black/40 mb-1.5">Комментарий</label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2.5 border border-black/10 rounded-xl text-sm placeholder-black/25 focus:outline-none focus:border-[#303030] resize-none transition-colors"
                    placeholder="Дополнительная информация..."
                  />
                </div>

                <button
                  onClick={updateOrderStatus}
                  disabled={isUpdating || (newStatus === order.status && adminComment === (order.adminComment || ''))}
                  className="w-full bg-[#303030] text-white text-sm font-medium py-3 rounded-xl hover:bg-[#404040] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>

            {/* Информация о заказе */}
            <div className="bg-white border border-black/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[#303030] mb-4">Детали</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs text-black/40">ID заказа</dt>
                  <dd className="text-xs text-[#303030] font-mono mt-0.5 break-all">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/40">Создан</dt>
                  <dd className="text-xs text-[#303030] mt-0.5">{formatDate(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/40">Обновлён</dt>
                  <dd className="text-xs text-[#303030] mt-0.5">{formatDate(order.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-black/40">Позиций</dt>
                  <dd className="text-xs text-[#303030] mt-0.5">{order.items.length}</dd>
                </div>
                <div className="pt-2 border-t border-black/5">
                  <dt className="text-xs text-black/40">Сумма</dt>
                  <dd className="text-base font-bold text-[#303030] mt-0.5">{formatPrice(order.totalAmount)}</dd>
                </div>
              </dl>
            </div>

            {/* Переписка */}
            <div className="bg-white border border-black/5 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-[#303030] mb-4">Переписка</h2>

              <div className="space-y-3 mb-4">
                {comments.length === 0 ? (
                  <p className="text-xs text-black/30">Нет сообщений</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-xl text-xs ${
                      comment.isAdmin
                        ? 'bg-[#303030] text-white ml-4'
                        : 'bg-black/[0.04] text-[#303030] mr-4'
                    }`}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`font-medium ${ comment.isAdmin ? 'text-white/70' : 'text-black/40' }`}>
                          {comment.isAdmin ? comment.authorName || 'Администратор' : 'Клиент'}
                        </span>
                        <span className={comment.isAdmin ? 'text-white/40' : 'text-black/30'}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-black/5 pt-4 space-y-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Напишите сообщение..."
                  className="w-full px-3 py-2.5 border border-black/10 rounded-xl text-sm placeholder-black/25 focus:outline-none focus:border-[#303030] resize-none transition-colors"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim() || isAddingComment || isSendingToClient}
                    className="flex-1 py-2.5 border border-black/10 text-xs font-medium text-[#303030] rounded-xl hover:bg-black/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingComment ? 'Добавление...' : 'Внутренний'}
                  </button>
                  <button
                    onClick={sendToClient}
                    disabled={!newComment.trim() || isAddingComment || isSendingToClient}
                    className="flex-1 py-2.5 bg-[#303030] text-white text-xs font-medium rounded-xl hover:bg-[#404040] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingToClient ? 'Отправка...' : 'Клиенту'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
