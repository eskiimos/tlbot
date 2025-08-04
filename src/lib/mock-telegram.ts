// Mock Telegram WebApp для тестирования
export const mockTelegramWebApp = () => {
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
