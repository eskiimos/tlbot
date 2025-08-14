"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DebugAPIPage;
const react_1 = require("react");
function DebugAPIPage() {
    const [result, setResult] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const testAPI = async () => {
        setLoading(true);
        setResult('');
        try {
            console.log('🧪 Тестируем API endpoint...');
            // Создаем тестовый PDF blob
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'red';
                ctx.fillRect(0, 0, 100, 100);
            }
            const blob = await new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob || new Blob());
                }, 'image/png');
            });
            const formData = new FormData();
            formData.append('file', new File([blob], 'test.pdf', { type: 'application/pdf' }));
            formData.append('telegramId', '228594178'); // Ваш реальный Telegram ID
            formData.append('orderData', JSON.stringify({ test: true }));
            console.log('📤 Отправляем запрос на /api/proposals');
            const response = await fetch('/api/proposals', {
                method: 'POST',
                body: formData,
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
      <h1 className="text-2xl font-bold mb-4">🔍 Диагностика API endpoint</h1>
      
      <div className="mb-4">
        <button onClick={testAPI} disabled={loading} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50">
          {loading ? '⏳ Тестируем...' : '🧪 Тестировать API'}
        </button>
      </div>
      
      {result && (<div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Результат:</h2>
          <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-96">
            {result}
          </pre>
        </div>)}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>Эта страница тестирует API endpoint /api/proposals и показывает точный ответ сервера.</p>
        <p>Используйте для диагностики проблем с парсингом JSON на продакшене.</p>
      </div>
    </div>);
}
