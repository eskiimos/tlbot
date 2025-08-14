"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DeployTestPage;
const react_1 = require("react");
function DeployTestPage() {
    const [currentTime] = (0, react_1.useState)(new Date().toLocaleString('ru-RU'));
    return (<div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🚀 Тест деплоя Vercel</h1>
      
      <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
        <p className="font-bold">✅ Деплой работает!</p>
        <p>Время создания: {currentTime}</p>
        <p>Последний коммит: Force Vercel redeploy - update test PDF title</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">🔧 Статус системы</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Next.js приложение</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>PDF генератор</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>API endpoints</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span>Telegram интеграция</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">🧪 Быстрые тесты</h3>
          <div className="space-y-3">
            <a href="/test-pdf" className="block bg-blue-500 text-white text-center py-2 px-4 rounded hover:bg-blue-600">
              Тест PDF генератора
            </a>
            <a href="/test-api" className="block bg-green-500 text-white text-center py-2 px-4 rounded hover:bg-green-600">
              Тест API Telegram
            </a>
            <a href="/cart" className="block bg-purple-500 text-white text-center py-2 px-4 rounded hover:bg-purple-600">
              Корзина товаров
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-gray-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Информация о деплое</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Платформа:</strong> Vercel
          </div>
          <div>
            <strong>Framework:</strong> Next.js 15
          </div>
          <div>
            <strong>Node.js:</strong> {typeof window !== 'undefined' ? 'Клиент' : 'Сервер'}
          </div>
          <div>
            <strong>Environment:</strong> {process.env.NODE_ENV || 'production'}
          </div>
        </div>
      </div>
    </div>);
}
