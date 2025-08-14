"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestHTMLAPIPage;
const react_1 = require("react");
function TestHTMLAPIPage() {
    const [result, setResult] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const testHTMLAPI = async () => {
        setLoading(true);
        setResult('');
        try {
            console.log('🧪 Тестируем HTML API endpoint...');
            const testData = {
                cartItems: [
                    {
                        id: '1',
                        productName: 'Тестовая футболка',
                        quantity: 2,
                        basePrice: 1500,
                        totalPrice: 3000,
                        detailedProposal: true,
                        optionsDetails: [
                            { name: 'Черный', category: 'Цвет', price: 0 },
                            { name: 'L', category: 'Размер', price: 0 },
                            { name: 'Шелкография', category: 'Печать', price: 500 }
                        ]
                    },
                    {
                        id: '2',
                        productName: 'Кепка TL',
                        quantity: 1,
                        basePrice: 2000,
                        totalPrice: 2000,
                        detailedProposal: false,
                        optionsDetails: []
                    }
                ],
                userData: {
                    telegramId: '228594178',
                    firstName: 'Тестовый',
                    phoneNumber: '+7 (900) 123-45-67',
                    email: 'test@example.com'
                }
            };
            console.log('📤 Отправляем запрос на /api/proposals-html');
            const response = await fetch('/api/proposals-html', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testData),
            });
            console.log('📥 Получен ответ:', response.status, response.statusText);
            // Получаем headers
            const headers = Array.from(response.headers.entries());
            console.log('📋 Headers:', headers);
            // Получаем сырой текст ответа
            const responseText = await response.text();
            console.log('📄 Сырой ответ:', responseText);
            let resultText = `Статус: ${response.status} ${response.statusText}\n\n`;
            resultText += `Headers:\n${headers.map(([key, value]) => `${key}: ${value}`).join('\n')}\n\n`;
            resultText += `Сырой ответ:\n${responseText}\n\n`;
            // Пытаемся парсить как JSON
            try {
                const jsonData = JSON.parse(responseText);
                resultText += `JSON данные:\n${JSON.stringify(jsonData, null, 2)}`;
            }
            catch (parseError) {
                resultText += `Ошибка парсинга JSON: ${parseError}`;
            }
            setResult(resultText);
        }
        catch (error) {
            console.error('❌ Ошибка теста:', error);
            setResult(`Ошибка: ${error}`);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">🧪 Тестирование HTML API</h1>
      
      <div className="mb-4">
        <button onClick={testHTMLAPI} disabled={loading} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
          {loading ? '⏳ Тестируем...' : '🧪 Тестировать HTML API'}
        </button>
      </div>
      
      {result && (<div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Результат:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {result}
          </pre>
        </div>)}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Эта страница тестирует новый HTML API endpoint /api/proposals-html</p>
        <p>Отправляет тестовые данные корзины и проверяет ответ сервера.</p>
        <p>Если все работает, должно отправиться сообщение в Telegram с HTML КП.</p>
      </div>
    </div>);
}
