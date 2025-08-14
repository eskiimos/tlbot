"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestErrorModalPage;
const react_1 = require("react");
function TestErrorModalPage() {
    const [errorModal, setErrorModal] = (0, react_1.useState)({
        isOpen: false,
        title: '',
        message: '',
        logs: [],
        timestamp: ''
    });
    const showErrorModal = (title, message, logs = []) => {
        const timestamp = new Date().toLocaleString('ru-RU');
        setErrorModal({
            isOpen: true,
            title,
            message,
            logs,
            timestamp
        });
    };
    // Обработка клавиши ESC для закрытия модального окна
    (0, react_1.useEffect)(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && errorModal.isOpen) {
                setErrorModal(prev => ({ ...prev, isOpen: false }));
            }
        };
        if (errorModal.isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = '';
        };
    }, [errorModal.isOpen]);
    const testAPIError = () => {
        showErrorModal('Ошибка отправки КП', '🤖 Сначала напишите боту /start в Telegram, а затем попробуйте снова', [
            'Статус ответа: 400',
            'URL: /api/proposals',
            'Время: ' + new Date().toLocaleString('ru-RU'),
            'Telegram ID: 228594178',
            'Размер файла: 15342 байт',
            'Ошибка API: Чат с ботом не найден',
            'Детали: Пользователь должен сначала написать боту /start. ID: 228594178',
            'Диагностика: {\n  "telegramId": "228...",\n  "fileExists": true,\n  "fileSize": 15342,\n  "botToken": "exists",\n  "nodeEnv": "development"\n}'
        ]);
    };
    const testCriticalError = () => {
        showErrorModal('Критическая ошибка при отправке КП', 'Произошла непредвиденная ошибка: Network Error', [
            'Время: ' + new Date().toLocaleString('ru-RU'),
            'Тип ошибки: TypeError',
            'Сообщение: Network Error',
            'Stack: TypeError: Failed to fetch\n    at Object.fetch (/Users/app/src/cart/page.tsx:395:30)',
            'Пользователь: Иван Петров',
            'Telegram ID: 228594178',
            'Количество товаров в корзине: 3',
            'Общая сумма: 125000 ₽'
        ]);
    };
    return (<div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Тест модального окна с ошибками</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Ошибка API</h3>
          <p className="text-gray-600 mb-4">
            Симулирует ошибку когда пользователь не написал боту /start
          </p>
          <button onClick={testAPIError} className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            Тест ошибки API
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4 text-orange-600">Критическая ошибка</h3>
          <p className="text-gray-600 mb-4">
            Симулирует непредвиденную ошибку сети или JavaScript
          </p>
          <button onClick={testCriticalError} className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
            Тест критической ошибки
          </button>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">Функциональность модального окна</h3>
        <ul className="space-y-2 text-sm text-blue-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Показывает заголовок и описание ошибки</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Отображает timestamp когда произошла ошибка</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Содержит детальные технические логи</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Кнопка "Скопировать логи" для отправки разработчикам</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500">•</span>
            <span>Блокирует скролл фона и управляется ESC клавишей</span>
          </li>
        </ul>
      </div>

      {/* Модальное окно с ошибкой и логами */}
      {errorModal.isOpen && (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] overscroll-contain">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{errorModal.title}</h3>
                  <p className="text-sm text-gray-500">{errorModal.timestamp}</p>
                </div>
              </div>
              <p className="text-gray-700">{errorModal.message}</p>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 pb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Техническая информация:</h4>
              </div>
              <div className="flex-1 px-6 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
                  {errorModal.logs.map((log, index) => (<div key={index} className="mb-1 text-gray-700">
                      {log}
                    </div>))}
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-3 border-t border-gray-200">
              <div className="flex gap-3">
                <button onClick={() => {
                navigator.clipboard.writeText(`${errorModal.title}\n${errorModal.message}\n\nЛоги:\n${errorModal.logs.join('\n')}`);
            }} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                  📋 Скопировать логи
                </button>
                <button onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))} className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
