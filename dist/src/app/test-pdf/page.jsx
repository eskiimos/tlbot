"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestPDFPage;
const react_1 = require("react");
const CommercialProposalHTML_1 = require("../../components/CommercialProposalHTML");
const PDFGenerator_1 = __importDefault(require("../../components/PDFGenerator"));
function TestPDFPage() {
    const [showPreview, setShowPreview] = (0, react_1.useState)(false);
    // Тестовые данные с длинными названиями для проверки переносов
    const testCartItems = [
        {
            id: '1',
            productName: 'Футболка базовая с длинным названием для тестирования переносов текста',
            quantity: 50,
            basePrice: 800,
            totalPrice: 40000,
            detailedProposal: true,
            image: '/products/t-shirt/1.jpg',
            optionsDetails: [
                { name: 'Шелкография односторонняя', category: 'print', price: 200 },
                { name: 'Составник (уход за изделием)', category: 'label', price: 15 },
                { name: 'Фирменная упаковка Total Lookas', category: 'packaging', price: 50 }
            ]
        },
        {
            id: '2',
            productName: 'Худи премиум класса',
            quantity: 25,
            basePrice: 2200,
            totalPrice: 55000,
            detailedProposal: false,
            image: '/products/hoodies/1.jpg',
            optionsDetails: [
                { name: 'Вышивка логотипа', category: 'print', price: 300 }
            ]
        },
        {
            id: '3',
            productName: 'Свитшот оверсайз с очень длинным описанием конфигурации',
            quantity: 15,
            basePrice: 1800,
            totalPrice: 27000,
            detailedProposal: true,
            image: '/products/sweatshirt/1.jpg',
            optionsDetails: [
                { name: 'Кастомный дизайн с уникальными элементами', category: 'design', price: 0 },
                { name: 'DTG печать полноцветная', category: 'print', price: 400 },
                { name: 'Жаккардовая этикетка размера', category: 'label', price: 25 },
                { name: 'Экологичная упаковка из переработанных материалов', category: 'packaging', price: 75 }
            ]
        }
    ];
    const testUserData = {
        firstName: 'Иван Петрович',
        phoneNumber: '+7 (999) 123-45-67',
        email: 'test@company.ru',
        inn: '1234567890'
    };
    const { generatePdfBlob, ProposalComponent } = (0, PDFGenerator_1.default)({
        cartItems: testCartItems,
        userData: testUserData
    });
    const handleDownloadPDF = async () => {
        try {
            const pdfBlob = await generatePdfBlob();
            if (pdfBlob) {
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'test-commercial-proposal.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
        catch (error) {
            console.error('Ошибка создания PDF:', error);
        }
    };
    return (<div className="p-8 max-w-6xl mx-auto">
      <div className="flex gap-4 mb-8">
        <h1 className="text-3xl font-bold">Тест оптимизированного PDF v2.0</h1>
        
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            {showPreview ? 'Скрыть превью' : 'Показать превью'}
          </button>
          
          <button onClick={handleDownloadPDF} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Скачать PDF
          </button>
        </div>
      </div>

      {/* Превью оптимизированной таблицы */}
      {showPreview && (<div className="border-2 border-gray-300 rounded-lg p-4 mb-8 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Превью PDF:</h2>
          <div className="bg-white shadow-lg" style={{ transform: 'scale(0.8)', transformOrigin: 'top left' }}>
            <CommercialProposalHTML_1.CommercialProposalHTML cartItems={testCartItems} userData={testUserData}/>
          </div>
        </div>)}

      {/* Информация об улучшениях */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-green-600">✅ Реализованные улучшения</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Фиксированная ширина колонок таблицы (№-3%, Фото-8%, Наименование-55%, Кол-во-8%, Цена-13%, Сумма-13%)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Сжатые отступы (p-0.5 вместо p-1, mb-0.5 вместо mb-1)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Уменьшенные размеры шрифтов (text-xs для таблицы)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Квадратные изображения продуктов (w-8 h-8)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Оптимизация переносов текста (break-words)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">•</span>
              <span>Условное отображение конфигурации (только при detailedProposal: true)</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-600">📊 Тестовые данные</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Товары в корзине:</h4>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Футболка с подробным КП (длинное название)</li>
                <li>• Худи без подробного КП</li>
                <li>• Свитшот с множественными опциями</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Особенности теста:</h4>
              <ul className="mt-1 space-y-1 text-gray-600">
                <li>• Длинные названия товаров</li>
                <li>• Различные конфигурации опций</li>
                <li>• Разные типы печати и упаковки</li>
                <li>• Комбинация товаров с подробным и стандартным КП</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Скрытый компонент для генерации PDF */}
      {ProposalComponent}
    </div>);
}
