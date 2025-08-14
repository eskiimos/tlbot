"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DebugHTML;
const react_1 = require("react");
function DebugHTML() {
    const [telegramId, setTelegramId] = (0, react_1.useState)('123456789');
    const [result, setResult] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const testAPI = async () => {
        setLoading(true);
        setResult(null);
        try {
            console.log('🔍 Тестируем HTML API с Telegram ID:', telegramId);
            const formData = new FormData();
            formData.append('telegramId', telegramId);
            formData.append('cartItems', JSON.stringify([
                {
                    productId: 'test-product',
                    name: 'Тестовый товар',
                    price: 1000,
                    quantity: 1,
                    configurations: { color: 'Черный', size: 'M' },
                    detailedProposal: true
                }
            ]));
            formData.append('userData', JSON.stringify({
                telegramId: telegramId,
                firstName: 'Тестовый',
                lastName: 'Пользователь',
                companyName: 'Тестовая компания'
            }));
            const response = await fetch('/api/proposals-html', {
                method: 'POST',
                body: formData,
            });
            const responseText = await response.text();
            console.log('📝 Ответ сервера (текст):', responseText);
            let responseData;
            try {
                responseData = JSON.parse(responseText);
                console.log('📊 Ответ сервера (JSON):', responseData);
            }
            catch (e) {
                console.error('❌ Не удалось парсить JSON:', e);
                responseData = { error: 'Invalid JSON', raw: responseText };
            }
            setResult({
                status: response.status,
                ok: response.ok,
                data: responseData,
                raw: responseText
            });
        }
        catch (error) {
            console.error('❌ Ошибка при тестировании:', error);
            setResult({
                error: error.message,
                stack: error.stack
            });
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug HTML API</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Тест HTML API</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Telegram ID:
            </label>
            <input type="text" value={telegramId} onChange={(e) => setTelegramId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" placeholder="Введите Telegram ID"/>
          </div>
          
          <button onClick={testAPI} disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md disabled:opacity-50">
            {loading ? 'Тестируем...' : 'Тестировать API'}
          </button>
        </div>

        {result && (<div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Результат:</h3>
            <div className="space-y-4">
              <div>
                <strong>Status:</strong> {result.status} ({result.ok ? 'OK' : 'Error'})
              </div>
              
              {result.data && (<div>
                  <strong>Данные:</strong>
                  <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto text-sm">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>)}
              
              {result.raw && (<div>
                  <strong>Raw ответ:</strong>
                  <pre className="bg-gray-100 p-4 rounded mt-2 overflow-x-auto text-sm">
                    {result.raw}
                  </pre>
                </div>)}
              
              {result.error && (<div>
                  <strong>Ошибка:</strong>
                  <pre className="bg-red-100 p-4 rounded mt-2 overflow-x-auto text-sm text-red-700">
                    {result.error}
                    {result.stack && '\n\n' + result.stack}
                  </pre>
                </div>)}
            </div>
          </div>)}
      </div>
    </div>);
}
