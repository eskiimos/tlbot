'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

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
  'NEW': '📝 Новая заявка',
  'IN_PROGRESS': '⚙️ В обработке',
  'DESIGN': '🎨 Дизайн',
  'PRODUCTION': '🏭 Производство',
  'READY': '✅ Готов',
  'COMPLETED': '🎉 Завершен',
  'CANCELLED': '❌ Отменен'
};

const statusColors = {
  'NEW': 'bg-blue-100 text-blue-800',
  'IN_PROGRESS': 'bg-yellow-100 text-yellow-800',
  'DESIGN': 'bg-purple-100 text-purple-800',
  'PRODUCTION': 'bg-orange-100 text-orange-800',
  'READY': 'bg-green-100 text-green-800',
  'COMPLETED': 'bg-gray-100 text-gray-800',
  'CANCELLED': 'bg-red-100 text-red-800'
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
    return `${numPrice.toLocaleString('ru-RU')} ₽`;
  };

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303030] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка заказа...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Заказ не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="text-sm">Назад к заказам</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Заказ #{order.id.slice(-8)}
              </h1>
            </div>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 text-sm"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Информация о клиенте */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Информация о клиенте</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Имя</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.customerName}</dd>
                </div>
                {order.customerEmail && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:text-blue-800">
                        {order.customerEmail}
                      </a>
                    </dd>
                  </div>
                )}
                {order.customerPhone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:text-blue-800">
                        {order.customerPhone}
                      </a>
                    </dd>
                  </div>
                )}
                {order.customerCompany && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Компания</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.customerCompany}</dd>
                  </div>
                )}
                {order.user && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Telegram</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      @{order.user.username} ({order.user.firstName} {order.user.lastName})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Состав заказа */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Состав заказа</h2>
              <div className="space-y-4">
                {Array.isArray(order.items) ? order.items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img 
                            src={item.image} 
                            alt={item.productName || item.name || 'Товар'} 
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <h3 className="font-medium text-gray-900">
                          {item.productName || item.name || `Товар ${index + 1}`}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500">
                        {item.totalPrice ? (
                          `${formatPrice(item.totalPrice)} (${item.quantity || 1} шт.)`
                        ) : (
                          `${formatPrice(item.pricePerUnit || item.basePrice || item.price || 0)} × ${item.quantity || 1} = ${formatPrice((item.pricePerUnit || item.basePrice || item.price || 0) * (item.quantity || 1))}`
                        )}
                      </span>
                    </div>
                    
                    {/* Выбранные опции из optionsDetails */}
                    {item.optionsDetails && item.optionsDetails.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Выбранные опции:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.optionsDetails.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-sm">
                              <span className="text-gray-700">{option.name}</span>
                              <span className="text-gray-900 font-medium">
                                {option.price > 0 ? `+${formatPrice(option.price)}` : 'Базовая'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Выбранные опции из selectedOptions (если есть, но нет optionsDetails) */}
                    {!item.optionsDetails && item.selectedOptions && typeof item.selectedOptions === 'object' && Object.keys(item.selectedOptions).length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Выбранные опции:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {Object.entries(item.selectedOptions).map(([key, value]) => (
                            <li key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span>{String(value)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Комментарий к дизайну */}
                    {item.designComment && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Пожелания к дизайну:</p>
                        <p className="text-sm text-gray-600 mt-1">{item.designComment}</p>
                      </div>
                    )}

                    {/* Файлы дизайна */}
                    {item.designFiles && item.designFiles.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Прикрепленные файлы:</p>
                        <ul className="text-sm text-blue-600 mt-1 space-y-1">
                          {item.designFiles.map((file, fileIndex) => (
                            <li key={fileIndex}>
                              <a href={file} target="_blank" rel="noopener noreferrer" className="hover:text-blue-800">
                                📎 Файл {fileIndex + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )) : (
                  <p className="text-gray-500 text-center py-4">Товары не найдены</p>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-900">Итого:</span>
                  <span className="text-xl font-bold text-gray-900">{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Статус и управление */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Управление заказом</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текущий статус
                  </label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изменить статус
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#303030] focus:border-[#303030]"
                  >
                    {Object.entries(statusLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий для клиента
                  </label>
                  <textarea
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#303030] focus:border-[#303030]"
                    placeholder="Дополнительная информация для клиента..."
                  />
                </div>

                <button
                  onClick={updateOrderStatus}
                  disabled={isUpdating || (newStatus === order.status && adminComment === (order.adminComment || ''))}
                  className="w-full bg-[#303030] text-white px-4 py-2 rounded-md hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </div>

            {/* Информация о заказе */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Информация о заказе</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">ID заказа</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Дата создания</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(order.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Последнее обновление</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(order.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Количество товаров</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.items.length} позиц{order.items.length === 1 ? 'ия' : 'ии'}</dd>
                </div>
              </dl>
            </div>

            {/* Текущий комментарий */}
            {order.adminComment && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Текущий комментарий:</h3>
                <p className="text-sm text-yellow-700">{order.adminComment}</p>
              </div>
            )}

            {/* Система комментариев */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">💬 Переписка по заказу</h3>
              
              {/* Список комментариев */}
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-gray-500 text-sm">Пока нет комментариев</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className={`p-3 rounded-lg ${
                      comment.isAdmin 
                        ? 'bg-blue-50 border border-blue-200 ml-8' 
                        : 'bg-gray-50 border border-gray-200 mr-8'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.isAdmin ? `👨‍💼 ${comment.authorName || 'Администратор'}` : '👤 Клиент'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Форма для нового комментария */}
              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Добавить комментарий
                </label>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Введите комментарий..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={addComment}
                    disabled={!newComment.trim() || isAddingComment}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isAddingComment ? 'Добавление...' : 'Добавить комментарий'}
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
