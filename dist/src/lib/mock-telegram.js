"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockTelegramWebApp = void 0;
// Mock Telegram WebApp для тестирования
const mockTelegramWebApp = () => {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        window.Telegram = {
            WebApp: {
                initDataUnsafe: {
                    user: {
                        id: 123456789, // ID тестового пользователя из базы
                        first_name: 'Тестовый',
                        last_name: 'Пользователь',
                        username: 'testuser',
                        language_code: 'ru'
                    }
                },
                ready: () => console.log('Telegram WebApp ready'),
                expand: () => console.log('Telegram WebApp expanded'),
                close: () => console.log('Telegram WebApp closed')
            }
        };
        console.log('🔧 Mock Telegram WebApp инициализирован');
    }
};
exports.mockTelegramWebApp = mockTelegramWebApp;
