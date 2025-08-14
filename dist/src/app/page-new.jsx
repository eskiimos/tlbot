"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
function Home() {
    const [tg, setTg] = (0, react_1.useState)(null);
    const [userData, setUserData] = (0, react_1.useState)(null);
    const [message, setMessage] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        // Инициализация Telegram WebApp
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
            const webapp = window.Telegram.WebApp;
            setTg(webapp);
            // Готовность приложения
            webapp.ready();
            webapp.expand();
            // Получение данных пользователя
            if (webapp.initDataUnsafe?.user) {
                setUserData(webapp.initDataUnsafe.user);
            }
            // Настройка главной кнопки
            webapp.MainButton.text = 'Отправить данные';
            webapp.MainButton.show();
            webapp.MainButton.onClick(() => {
                const data = {
                    message: message,
                    user: userData,
                    timestamp: new Date().toISOString()
                };
                webapp.sendData(JSON.stringify(data));
            });
        }
    }, [message, userData]);
    const handleInputChange = (e) => {
        setMessage(e.target.value);
    };
    return (<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Telegram Mini App
        </h1>
        
        {userData && (<div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-lg font-semibold text-blue-800 mb-2">
              Привет, {userData.first_name}!
            </h2>
            <p className="text-blue-600">
              ID: {userData.id}
            </p>
            {userData.username && (<p className="text-blue-600">
                @{userData.username}
              </p>)}
          </div>)}

        <div className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Введите сообщение:
            </label>
            <input type="text" id="message" value={message} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ваше сообщение..."/>
          </div>

          <div className="space-y-2">
            <button onClick={() => tg?.close()} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
              Закрыть приложение
            </button>
          </div>
        </div>

        <div className="mt-6 text-xs text-gray-500 text-center">
          Telegram Mini App на Next.js
        </div>
      </div>
    </div>);
}
