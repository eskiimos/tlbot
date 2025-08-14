"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestAPIPage;
const react_1 = require("react");
function TestAPIPage() {
    const [result, setResult] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const testAPI = async () => {
        setLoading(true);
        try {
            // Создаем тестовый PDF файл
            const testPDFContent = 'TEST PDF CONTENT';
            const blob = new Blob([testPDFContent], { type: 'application/pdf' });
            const formData = new FormData();
            formData.append('file', blob, 'test.pdf');
            formData.append('telegramId', '228594178'); // Ваш реальный Telegram ID
            formData.append('orderData', JSON.stringify({
                customerName: 'Test User',
                items: []
            }));
            const response = await fetch('/api/proposals-simple', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setResult(`Status: ${response.status}\nResponse: ${JSON.stringify(data, null, 2)}`);
        }
        catch (error) {
            setResult(`Error: ${error}`);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тест API отправки PDF</h1>
      
      <button onClick={testAPI} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50">
        {loading ? 'Тестируем...' : 'Тестировать API'}
      </button>

      {result && (<pre className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">
          {result}
        </pre>)}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-2">Переменные окружения:</h2>
        <ul className="space-y-1">
          <li>NODE_ENV: {process.env.NODE_ENV}</li>
          <li>TELEGRAM_BOT_TOKEN: {process.env.TELEGRAM_BOT_TOKEN ? 'Установлен' : 'Отсутствует'}</li>
          <li>DEBUG_TELEGRAM_ID: {process.env.DEBUG_TELEGRAM_ID || 'Отсутствует'}</li>
        </ul>
      </div>
    </div>);
}
