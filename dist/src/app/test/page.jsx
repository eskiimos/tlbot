"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TestPage;
const prisma_1 = require("@/lib/prisma");
async function TestPage() {
    let users = [];
    let error = '';
    try {
        users = await prisma_1.prisma.user.findMany({
            include: {
                messages: {
                    take: 3,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { messages: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // Преобразуем BigInt в строку для рендеринга
        users = users.map(user => ({
            ...user,
            telegramId: user.telegramId.toString()
        }));
    }
    catch (e) {
        error = e.message;
    }
    return (<div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🗄️ Тест базы данных</h1>

      {error && (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Ошибка:</strong> {error}
        </div>)}

      {!error && (<div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">👥 Пользователи ({users.length})</h2>
            
            {users.length === 0 ? (<p className="text-gray-500">Пользователи не найдены</p>) : (<div className="grid gap-4">
                {users.map((user) => (<div key={user.id} className="bg-white border rounded-lg p-4 shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg">
                        {user.firstName} {user.lastName}
                      </h3>
                      <span className="text-sm text-gray-500">
                        ID: {user.telegramId}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      {user.username && <p>@{user.username}</p>}
                      <p>Язык: {user.language}</p>
                      <p>Сообщений: {user._count.messages}</p>
                      <p>Создан: {new Date(user.createdAt).toLocaleString('ru-RU')}</p>
                      {user.isPremium && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">Premium</span>}
                    </div>

                    {user.messages.length > 0 && (<div className="mt-3">
                        <h4 className="font-medium text-sm mb-2">Последние сообщения:</h4>
                        <div className="space-y-1">
                          {user.messages.map((message) => (<div key={message.id} className="bg-gray-50 p-2 rounded text-sm">
                              <span className="font-medium">{message.type}:</span> {message.content}
                            </div>))}
                        </div>
                      </div>)}
                  </div>))}
              </div>)}
          </div>
        </div>)}

      <div className="mt-8 text-center">
        <a href="/" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded inline-block">
          ← Назад к мини-приложению
        </a>
      </div>
    </div>);
}
