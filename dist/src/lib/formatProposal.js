"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatProposal = formatProposal;
// Функция форматирования сообщения для опций
function formatOptions(selectedOptions) {
    let message = '';
    for (const [category, options] of Object.entries(selectedOptions)) {
        if (Array.isArray(options) && options.length > 0) {
            message += `  • ${category}: ${options.join(', ')}\n`;
        }
    }
    return message;
}
// Функция форматирования коммерческого предложения
function formatProposal(orderData) {
    const items = orderData?.items || [];
    let totalAmount = 0;
    // Заголовок
    let message = `*КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ*\n\n`;
    // Информация о клиенте
    message += `*Информация о клиенте:*\n`;
    message += `• Имя: ${orderData?.customerName || 'Не указано'}\n`;
    if (orderData?.customerCompany) {
        message += `• Компания: ${orderData.customerCompany}\n`;
    }
    if (orderData?.customerEmail) {
        message += `• Email: ${orderData.customerEmail}\n`;
    }
    message += '\n';
    // Детали заказа
    message += `*Состав заказа:*\n\n`;
    items.forEach((item, index) => {
        const quantity = item.quantity || 1;
        const price = item.basePrice || 0;
        const itemTotal = price * quantity;
        totalAmount += itemTotal;
        message += `*${index + 1}. ${item.productName || 'Товар'}*\n`;
        message += `• Количество: ${quantity} шт.\n`;
        // Опции
        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
            message += `• Опции:\n${formatOptions(item.selectedOptions)}`;
        }
        message += `• Цена за единицу: ${price.toLocaleString('ru-RU')}₽\n`;
        message += `• Стоимость: ${itemTotal.toLocaleString('ru-RU')}₽\n\n`;
    });
    // Итоговая сумма
    message += `*Итого: ${totalAmount.toLocaleString('ru-RU')}₽*\n\n`;
    // Дополнительная информация
    message += `_Примечание: цены указаны с учетом выбранных опций и тиража._\n\n`;
    message += `*Контакты:*\n`;
    message += `• Менеджер: @zelenayaaliya\n`;
    message += `• Телефон: +7 (999) 162-77-58\n`;
    message += `• Сайт: totallookas.ru\n\n`;
    message += `_Total Lookas — превращаем мерч в арт-объекты!_`;
    return message;
}
