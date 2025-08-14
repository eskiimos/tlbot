"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommercialProposalHTML = void 0;
const react_1 = __importDefault(require("react"));
// Функция для получения суммы доплат за опции
const getOptionsPrice = (item) => {
    // Доплаты за опции считаются только если включено подробное КП
    if (!item.detailedProposal) {
        return 0;
    }
    return item.optionsDetails.reduce((total, option) => total + option.price, 0);
};
// Функция для получения названий опций по категориям
const getOptionsByCategory = (item) => {
    const categorizedOptions = {};
    item.optionsDetails.forEach(option => {
        if (!categorizedOptions[option.category]) {
            categorizedOptions[option.category] = [];
        }
        categorizedOptions[option.category].push(option.name);
    });
    return categorizedOptions;
};
// Словарь для перевода категорий опций (цвет убран, так как обсуждается с менеджером)
const categoryTranslations = {
    design: 'Дизайн',
    print: 'Принт',
    label: 'Бирки',
    packaging: 'Упаковка',
};
exports.CommercialProposalHTML = react_1.default.forwardRef(({ cartItems, userData }, ref) => {
    const totalAmount = cartItems.reduce((total, item) => total + item.totalPrice, 0);
    const currentDate = new Date().toLocaleDateString('ru-RU');
    const proposalNumber = Math.floor(Date.now() / 1000);
    return (<div className="p-6 bg-white min-h-[297mm] w-[210mm]" style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '11px',
            letterSpacing: '-0.01em',
        }}>
        {/* Шапка документа */}
        <header className="flex justify-between items-start pb-2 border-b-2 border-gray-800">
          <div>
            <h1 className="text-xl font-bold">Коммерческое предложение</h1>
            <p className="text-xs text-gray-600">№ {proposalNumber} от {currentDate}</p>
          </div>
          <div className="text-right">
            <img src="/TLlogo.svg" alt="TL Brand Logo" className="h-8 w-auto ml-auto mb-1"/>
            <p className="text-xs">Email: totallookas@yandex.ru</p>
            <p className="text-xs">Телефон: +7 (XXX) XXX-XX-XX</p>
          </div>
        </header>

        {/* Информация о клиенте и исполнителе */}
        <section className="grid grid-cols-2 gap-4 my-4 text-xs">
          <div>
            <h2 className="font-bold mb-1 text-xs">Заказчик:</h2>
            <p><strong>ИНН:</strong> {userData.inn || 'Не указано'}</p>
            <p><strong>Имя:</strong> {userData.firstName || 'Не указано'}</p>
            <p><strong>Телефон:</strong> {userData.phoneNumber || 'Не указано'}</p>
            <p><strong>Email:</strong> {userData.email || 'Не указано'}</p>
          </div>
          <div>
            <h2 className="font-bold mb-1 text-xs">Исполнитель:</h2>
            <p><strong>Компания:</strong> Total Lookas</p>
            <p><strong>Адрес:</strong> Казань, ул. Сибирский Тракт, 78, офис 301</p>
            <p><strong>Телефон:</strong> +7 (999) 162-77-58</p>
            <p><strong>Email:</strong> totallookas@yandex.ru</p>
            <p><strong>Сайт:</strong> totallookas.ru</p>
          </div>
        </section>

        {/* Таблица с товарами */}
        <section>
          <table className="w-full text-xs text-left border-collapse table-fixed">
            <colgroup>
              <col style={{ width: '3%' }}/>
              <col style={{ width: '8%' }}/>
              <col style={{ width: '55%' }}/>
              <col style={{ width: '8%' }}/>
              <col style={{ width: '13%' }}/>
              <col style={{ width: '13%' }}/>
            </colgroup>
            <thead className="bg-gray-100">
              <tr>
                <th className="p-0.5 border text-xs">№</th>
                <th className="p-0.5 border text-xs">Фото</th>
                <th className="p-0.5 border text-xs">Наименование и конфигурация</th>
                <th className="p-0.5 border text-center text-xs">Кол-во</th>
                <th className="p-0.5 border text-right text-xs">Цена за ед.</th>
                <th className="p-0.5 border text-right text-xs">Сумма</th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map((item, index) => {
            const categorizedOptions = getOptionsByCategory(item);
            const unitPrice = item.totalPrice / item.quantity;
            return (<tr key={item.id}>
                    <td className="p-0.5 border align-top text-center text-xs">{index + 1}</td>
                    <td className="p-0.5 border align-top text-center">
                      {item.image ? (<img src={item.image.replace(/\.(jpg|jpeg|png)/, '_thumb.$1')} // Используем маленькие версии изображений
                 alt={item.productName} className="w-6 h-6 object-cover rounded mx-auto" // Уменьшаем размер с w-8 h-8 до w-6 h-6
                 style={{
                        aspectRatio: '1/1',
                        imageRendering: 'pixelated',
                    }} onError={(e) => {
                        const target = e.target;
                        // Если миниатюра не найдена, пробуем оригинал
                        if (!target.src.includes('_thumb')) {
                            target.style.display = 'none';
                        }
                        else {
                            target.src = item.image;
                        }
                    }}/>) : (<div className="w-6 h-6 bg-gray-200 rounded mx-auto flex items-center justify-center text-[10px] text-gray-500">
                          Нет фото
                        </div>)}
                    </td>
                    <td className="p-0.5 border align-top">
                      <p className="font-semibold text-xs mb-0.5">{item.productName}</p>
                      
                      {/* Базовая цена */}
                      <div className="text-xs mb-0.5">
                        <span className="text-gray-600">Базовая цена: </span>
                        <span className="font-medium">{item.basePrice.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      
                      {/* Конфигурация - показываем только если включено подробное КП */}
                      {Object.keys(categorizedOptions).length > 0 && item.detailedProposal && (<div className="mb-1">
                          <p className="text-xs font-medium text-gray-700 mb-0.5">Конфигурация:</p>
                          <div className="text-xs text-gray-600 space-y-0">
                            {Object.entries(categorizedOptions).map(([category, names]) => {
                        // Находим цену опции для этой категории только если включено подробное КП
                        const categoryOptions = item.optionsDetails?.filter(opt => opt.category === category) || [];
                        const categoryPrice = item.detailedProposal ? categoryOptions.reduce((sum, opt) => sum + opt.price, 0) : 0;
                        return (<div key={category} className="flex justify-between items-start">
                                  <span className="text-xs break-words">
                                    <strong>{categoryTranslations[category] || category}:</strong> {names.join(', ')}
                                  </span>
                                  {categoryPrice > 0 && item.detailedProposal && (<span className="text-green-600 font-medium text-xs ml-1">
                                      +{categoryPrice.toLocaleString('ru-RU')} ₽
                                    </span>)}
                                </div>);
                    })}
                          </div>
                        </div>)}
                      
                      {/* Итоговая доплата за опции */}
                      {getOptionsPrice(item) > 0 && item.detailedProposal && (<div className="text-xs border-t pt-0.5 mt-0.5">
                          <span className="text-gray-600">Доплата за опции: </span>
                          <span className="font-medium text-green-600">+{getOptionsPrice(item).toLocaleString('ru-RU')} ₽</span>
                        </div>)}
                      
                      {/* Статус подробного КП */}
                      <div className="text-xs border-t pt-0.5 mt-0.5">
                        <span className="text-gray-600">Подробное КП: </span>
                        <span className={`font-medium ${item.detailedProposal ? 'text-blue-600' : 'text-gray-500'}`}>
                          {item.detailedProposal ? '✓ Требуется' : '○ Стандартное'}
                        </span>
                        {item.detailedProposal && (<div className="text-xs text-blue-600 mt-0.5">
                            Менеджер свяжется для обсуждения деталей
                          </div>)}
                      </div>
                    </td>
                    <td className="p-0.5 border text-center align-top font-medium text-xs">{item.quantity}</td>
                    <td className="p-0.5 border text-right align-top font-medium text-xs">{unitPrice.toLocaleString('ru-RU')} ₽</td>
                    <td className="p-0.5 border text-right align-top font-bold text-xs">{item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                  </tr>);
        })}
            </tbody>
          </table>
        </section>

        {/* Итоговая сумма */}
        <section className="flex justify-end mt-4 text-xs">
          <div className="w-1/3">
            <div className="flex justify-between">
              <span className="text-gray-600">Итого:</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">В том числе НДС:</span>
              <span>Без НДС</span>
            </div>
            <div className="flex justify-between font-bold text-xs border-t border-gray-800 mt-1 pt-1">
              <span>Всего к оплате:</span>
              <span>{totalAmount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </section>

        {/* Условия и подписи */}
        <footer className="mt-8 pt-6 border-t text-xs text-gray-600">
          <p className='mb-3 font-semibold'>* Данное коммерческое предложение носит ознакомительный характер. Подробное КП будет составлено и выслано менеджером.</p>
          <p><strong>Условия оплаты:</strong> 100% предоплата.</p>
          <p><strong>Срок поставки:</strong> от 30 дней с момента согласования макета и оплаты.</p>
          <p><strong>Срок действия предложения:</strong> 5 рабочих дней.</p>
          <div className="flex justify-between mt-12">
            <div>
              <p>Исполнитель: ____________________ (Тotal Lookas)</p>
            </div>
            <div>
              <p>Заказчик: ____________________ ({userData.firstName || ''})</p>
            </div>
          </div>
        </footer>
      </div>);
});
exports.CommercialProposalHTML.displayName = 'CommercialProposalHTML';
