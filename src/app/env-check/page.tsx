'use client';

export default function EnvCheckPage() {
  const checkEnv = () => {
    // Это будет показано только на клиенте, но переменные окружения сервера мы проверим через API
    console.log('Проверяем переменные окружения...');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">🔧 Проверка переменных окружения</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Клиентские переменные:</h2>
          <div className="space-y-2 text-sm">
            <div>NODE_ENV: {process.env.NODE_ENV || 'не установлена'}</div>
            <div>NEXT_PUBLIC_APP_URL: {process.env.NEXT_PUBLIC_APP_URL || 'не установлена'}</div>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">⚠️ Возможная проблема:</h2>
          <p className="text-sm">
            Если TELEGRAM_BOT_TOKEN не установлен в Vercel, API будет возвращать ошибку 500 
            с сообщением "Конфигурация бота отсутствует".
          </p>
        </div>
        
        <div className="bg-green-50 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">✅ Как исправить:</h2>
          <ol className="list-decimal list-inside text-sm space-y-1">
            <li>Зайти в панель управления Vercel</li>
            <li>Перейти в Settings → Environment Variables</li>
            <li>Добавить TELEGRAM_BOT_TOKEN со значением: YOUR_BOT_TOKEN_HERE</li>
            <li>Сохранить и пересобрать проект</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
