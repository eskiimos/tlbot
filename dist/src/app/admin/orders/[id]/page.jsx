"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OrderDetails;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
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
function OrderDetails() {
    const [order, setOrder] = (0, react_1.useState)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [isMounted, setIsMounted] = (0, react_1.useState)(false);
    const [newStatus, setNewStatus] = (0, react_1.useState)('');
    const [adminComment, setAdminComment] = (0, react_1.useState)('');
    const [isUpdating, setIsUpdating] = (0, react_1.useState)(false);
    const router = (0, navigation_1.useRouter)();
    const params = (0, navigation_1.useParams)();
    (0, react_1.useEffect)(() => {
        setIsMounted(true);
    }, []);
    (0, react_1.useEffect)(() => {
        if (isMounted) {
            checkAuth();
            if (params.id) {
                loadOrder(params.id);
            }
        }
    }, [params.id, isMounted]);
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/admin/auth');
            if (!response.ok) {
                router.push('/admin');
            }
        }
        catch (error) {
            router.push('/admin');
        }
    };
    const loadOrder = async (orderId) => {
        try {
            const response = await fetch(`/api/admin/orders/${orderId}`);
            if (response.ok) {
                const data = await response.json();
                setOrder(data.order);
                setNewStatus(data.order.status);
                setAdminComment(data.order.adminComment || '');
            }
            else {
                router.push('/admin/dashboard');
            }
        }
        catch (error) {
            console.error('Ошибка загрузки заказа:', error);
            router.push('/admin/dashboard');
        }
        finally {
            setIsLoading(false);
        }
    };
    const updateOrderStatus = async () => {
        if (!order)
            return;
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
        }
        catch (error) {
            console.error('Ошибка обновления заказа:', error);
        }
        finally {
            setIsUpdating(false);
        }
    };
    const logout = async () => {
        await fetch('/api/admin/auth', { method: 'DELETE' });
        router.push('/admin');
    };
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ru-RU');
    };
    const formatPrice = (price) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        if (isNaN(numPrice)) {
            return '0 ₽';
        }
        return `${numPrice.toLocaleString('ru-RU')} ₽`;
    };
    if (!isMounted || isLoading) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#303030] mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка заказа...</p>
        </div>
      </div>);
    }
    if (!order) {
        return (<div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Заказ не найден</p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50">
      {/* Шапка */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/admin/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                <span className="text-sm">Назад к заказам</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                Заказ #{order.id.slice(-8)}
              </h1>
            </div>
            <button onClick={logout} className="text-gray-600 hover:text-gray-900 text-sm">
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
                {order.customerEmail && (<div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:text-blue-800">
                        {order.customerEmail}
                      </a>
                    </dd>
                  </div>)}
                {order.customerPhone && (<div>
                    <dt className="text-sm font-medium text-gray-500">Телефон</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:text-blue-800">
                        {order.customerPhone}
                      </a>
                    </dd>
                  </div>)}
                {order.customerCompany && (<div>
                    <dt className="text-sm font-medium text-gray-500">Компания</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.customerCompany}</dd>
                  </div>)}
                {order.user && (<div>
                    <dt className="text-sm font-medium text-gray-500">Telegram</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      @{order.user.username} ({order.user.firstName} {order.user.lastName})
                    </dd>
                  </div>)}
              </dl>
            </div>

            {/* Состав заказа */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Состав заказа</h2>
              <div className="space-y-4">
                {Array.isArray(order.items) ? order.items.map((item, index) => (<div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        {item.image && (<img src={item.image} alt={item.productName || item.name || 'Товар'} className="w-12 h-12 object-cover rounded"/>)}
                        <h3 className="font-medium text-gray-900">
                          {item.productName || item.name || `Товар ${index + 1}`}
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500">
                        {item.totalPrice ? (`${formatPrice(item.totalPrice)} (${item.quantity || 1} шт.)`) : (`${formatPrice(item.pricePerUnit || item.basePrice || item.price || 0)} × ${item.quantity || 1} = ${formatPrice((item.pricePerUnit || item.basePrice || item.price || 0) * (item.quantity || 1))}`)}
                      </span>
                    </div>
                    
                    {/* Выбранные опции из optionsDetails */}
                    {item.optionsDetails && item.optionsDetails.length > 0 && (<div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-2">Выбранные опции:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {item.optionsDetails.map((option, optionIndex) => (<div key={optionIndex} className="flex justify-between items-center bg-gray-50 px-2 py-1 rounded text-sm">
                              <span className="text-gray-700">{option.name}</span>
                              <span className="text-gray-900 font-medium">
                                {option.price > 0 ? `+${formatPrice(option.price)}` : 'Базовая'}
                              </span>
                            </div>))}
                        </div>
                      </div>)}
                    
                    {/* Выбранные опции из selectedOptions (если есть, но нет optionsDetails) */}
                    {!item.optionsDetails && item.selectedOptions && typeof item.selectedOptions === 'object' && Object.keys(item.selectedOptions).length > 0 && (<div className="mt-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">Выбранные опции:</p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {Object.entries(item.selectedOptions).map(([key, value]) => (<li key={key} className="flex justify-between">
                              <span className="capitalize">{key}:</span>
                              <span>{String(value)}</span>
                            </li>))}
                        </ul>
                      </div>)}

                    {/* Комментарий к дизайну */}
                    {item.designComment && (<div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Пожелания к дизайну:</p>
                        <p className="text-sm text-gray-600 mt-1">{item.designComment}</p>
                      </div>)}

                    {/* Файлы дизайна */}
                    {item.designFiles && item.designFiles.length > 0 && (<div className="mt-2">
                        <p className="text-sm font-medium text-gray-700">Прикрепленные файлы:</p>
                        <ul className="text-sm text-blue-600 mt-1 space-y-1">
                          {item.designFiles.map((file, fileIndex) => (<li key={fileIndex}>
                              <a href={file} target="_blank" rel="noopener noreferrer" className="hover:text-blue-800">
                                📎 Файл {fileIndex + 1}
                              </a>
                            </li>))}
                        </ul>
                      </div>)}
                  </div>)) : (<p className="text-gray-500 text-center py-4">Товары не найдены</p>)}
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
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изменить статус
                  </label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#303030] focus:border-[#303030]">
                    {Object.entries(statusLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Комментарий для клиента
                  </label>
                  <textarea value={adminComment} onChange={(e) => setAdminComment(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#303030] focus:border-[#303030]" placeholder="Дополнительная информация для клиента..."/>
                </div>

                <button onClick={updateOrderStatus} disabled={isUpdating || (newStatus === order.status && adminComment === (order.adminComment || ''))} className="w-full bg-[#303030] text-white px-4 py-2 rounded-md hover:bg-[#404040] disabled:opacity-50 disabled:cursor-not-allowed">
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
            {order.adminComment && (<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Текущий комментарий:</h3>
                <p className="text-sm text-yellow-700">{order.adminComment}</p>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
