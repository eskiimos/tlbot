// Генерация HTML коммерческого предложения
type ProposalData = {
  orderData: any;
  cartItems: Array<{
    productName: string;
    productSlug: string;
    quantity: number;
    basePrice: number;
    selectedOptions: {[key: string]: string[]};
    optionsDetails: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
    }>;
    totalPrice: number;
    image?: string;
    detailedProposal?: boolean;
  }>;
  userData: {
    telegramId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    companyName?: string;
    inn?: string;
  };
};

// Константы для перевода категорий
const CATEGORY_TRANSLATIONS: {[key: string]: string} = {
  'color': 'Цвет',
  'design': 'Дизайн',
  'label': 'Этикетка',
  'packaging': 'Упаковка',
  'print': 'Печать'
};

function formatItemOptions(
  options: {[key: string]: string[]}, 
  showDetails: boolean,
  optionsDetails: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
  }> = []
): string {
  if (!showDetails || !options) return '';

  // Создаем мапу для быстрого поиска названий опций по ID
  const optionsMap = new Map(optionsDetails.map(opt => [opt.id, opt]));
  
  // Фильтруем и форматируем опции, исключая цвет
  return Object.entries(options)
    .filter(([category]) => category !== 'color') // Исключаем опцию цвета
    .map(([category, values]) => {
      const translatedCategory = CATEGORY_TRANSLATIONS[category] || category;
      const translatedValues = values.map(value => {
        if (optionsMap.has(value)) {
          return optionsMap.get(value)?.name || value;
        }
        return value.startsWith('cmd') ? 'Индивидуально' : value;
      }).join(', ');
      
      return `
        <div class="option-group">
          <strong>${translatedCategory}:</strong>
          ${translatedValues}
        </div>
      `;
    })
    .join('');
}

// Экспортируем функцию генерации HTML
export function generateProposalHTML(data: ProposalData): string {
  const { orderData, cartItems, userData } = data;
  const date = new Date().toLocaleDateString('ru-RU');

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Коммерческое предложение - Total Lookas</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
        }
        
        body {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
        }

        h1 {
          font-size: 24px;
          margin-bottom: 20px;
          color: #111;
        }

        .header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #eee;
        }

        .date {
          color: #666;
          font-size: 14px;
          margin-bottom: 10px;
        }

        .company-info {
          margin-bottom: 30px;
        }

        .client-info {
          margin-bottom: 30px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .client-info h2 {
          font-size: 18px;
          margin-bottom: 10px;
          color: #111;
        }

        .client-info p {
          margin: 5px 0;
          color: #444;
        }

        .product-list {
          margin-bottom: 30px;
        }

        .product-item {
          display: flex;
          justify-content: space-between;
          padding: 15px 20px;
          border: 1px solid #eee;
          border-radius: 8px;
          margin-bottom: 15px;
          background: #fff;
        }

        .product-details {
          flex: 1;
          padding-right: 20px;
        }

        .product-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #111;
        }

        .product-options {
          font-size: 14px;
          color: #666;
        }

        .option-group {
          margin: 5px 0;
        }

        .totals {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #eee;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 16px;
        }

        .total-row.final {
          font-weight: 600;
          font-size: 18px;
          color: #111;
          padding-top: 10px;
          border-top: 1px solid #eee;
        }

        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #eee;
          font-size: 14px;
          color: #666;
        }

        .note {
          font-style: italic;
          margin: 20px 0;
          padding: 15px;
          background: #fff9e6;
          border-radius: 8px;
          border: 1px solid #ffe0b2;
        }

        .product-total {
          text-align: right;
          min-width: 120px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ</h1>
        <div class="date">от ${date}</div>
      </div>

      <div class="company-info">
        <h2>Total Lookas</h2>
        <p>Производство корпоративного мерча</p>
        <p>г. Казань, ул. Сибирский Тракт, 78, офис 301</p>
      </div>

      <div class="client-info">
        <h2>Информация о клиенте</h2>
        ${userData.companyName ? `<p><strong>Компания:</strong> ${userData.companyName}</p>` : ''}
        <p><strong>Контактное лицо:</strong> ${userData.firstName || ''} ${userData.lastName || ''}</p>
        ${userData.email ? `<p><strong>Email:</strong> ${userData.email}</p>` : ''}
        ${userData.phoneNumber ? `<p><strong>Телефон:</strong> ${userData.phoneNumber}</p>` : ''}
        ${userData.inn ? `<p><strong>ИНН:</strong> ${userData.inn}</p>` : ''}
      </div>

      <div class="product-list">
        ${cartItems.map((item) => `
          <div class="product-item">
            <div class="product-details">
              <div class="product-name">${item.productName}</div>
              <div class="product-options">
                <div class="option-group">
                  <strong>Количество:</strong> ${item.quantity} шт.
                </div>
                <div class="option-group">
                  <strong>Цена за единицу:</strong> ${Math.round(item.totalPrice / item.quantity).toLocaleString('ru-RU')} ₽
                </div>
                ${formatItemOptions(item.selectedOptions, item.detailedProposal || false, item.optionsDetails)}
              </div>
            </div>
            <div class="product-total">
              <strong>${item.totalPrice.toLocaleString('ru-RU')} ₽</strong>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="totals">
        <div class="total-row">
          <span>Итого:</span>
          <span>${cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('ru-RU')} ₽</span>
        </div>
        <div class="total-row">
          <span>НДС:</span>
          <span>Не облагается</span>
        </div>
        <div class="total-row final">
          <span>К оплате:</span>
          <span>${cartItems.reduce((sum, item) => sum + item.totalPrice, 0).toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div class="note">
        <p><strong>Примечание:</strong></p>
        <p>Цены указаны с учетом всех выбранных опций. Окончательная стоимость может быть скорректирована после согласования макета и уточнения деталей заказа.</p>
        <p><strong>Цвет изделий согласовывается с менеджером отдельно.</strong></p>
      </div>

      <div class="footer">
        <p><strong>Условия оплаты:</strong> 100% предоплата</p>
        <p><strong>Срок изготовления:</strong> от 30 дней с момента согласования макета и оплаты</p>
        <p><strong>Срок действия предложения:</strong> 5 рабочих дней</p>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div>
            <p>Исполнитель:</p>
            <p style="margin-top: 30px;">________________</p>
            <p>Total Lookas</p>
          </div>
          <div style="text-align: right;">
            <p>Заказчик:</p>
            <p style="margin-top: 30px;">________________</p>
            <p>${userData.firstName || ''} ${userData.lastName || ''}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
