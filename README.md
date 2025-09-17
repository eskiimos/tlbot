# Telegram Bot и Mini App

Проект для создания Telegram бота с интегрированным мини-приложением на Next.js и базой данных PostgreSQL.

## Структура проекта

- **Telegram Bot** - создан с использованием библиотеки Telegraf
- **Mini App** - веб-приложение на Next.js с поддержкой Telegram WebApp API
- **База данных** - PostgreSQL с ORM Prisma
- **shadcn/ui** - библиотека компонентов для красивого интерфейса

## Технологии

- Next.js 15 с App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Telegraf (Telegram Bot Framework)
- Telegram WebApp API
- Prisma ORM
- PostgreSQL

## Установка и запуск

1. Установите зависимости:
```bash
npm install
```

2. Создайте файл `.env.local` и добавьте ваш токен бота:
```env
TELEGRAM_BOT_TOKEN=ваш_токен_бота
NEXT_PUBLIC_APP_URL=http://localhost:3001
DATABASE_URL="prisma+postgres://localhost:51213/..."
```

3. Запустите локальную базу данных:
```bash
npm run db:dev
```

4. Примените миграции и заполните тестовыми данными:
```bash
npm run db:migrate
npm run db:seed
```

5. Запустите мини-приложение:
```bash
npm run dev
```

6. В другом терминале запустите Telegram бота:
```bash
npm run bot
```

## Команды разработки

### Основные команды
- `npm run dev` - запуск Next.js приложения в режиме разработки
- `npm run build` - сборка приложения для продакшена
- `npm run start` - запуск собранного приложения
- `npm run bot` - запуск Telegram бота
- `npm run dev:bot` - запуск бота в режиме разработки с автоперезагрузкой
- `npm run lint` - проверка кода ESLint

### Команды базы данных
- `npm run db:dev` - запуск локальной PostgreSQL базы данных через Prisma
- `npm run db:migrate` - применение миграций базы данных
- `npm run db:generate` - генерация Prisma Client
- `npm run db:studio` - открытие Prisma Studio для просмотра данных
- `npm run db:seed` - заполнение базы тестовыми данными

## Использование

1. Запустите бота командой `/start`
2. Используйте команду `/webapp` для открытия мини-приложения
3. Используйте команду `/stats` для просмотра статистики
4. В мини-приложении введите сообщение и нажмите кнопку "Отправить данные"
5. Данные будут сохранены в базе данных и переданы обратно в бот

## База данных

Схема базы данных включает следующие таблицы:

- **users** - пользователи Telegram
- **messages** - сообщения от пользователей
- **sessions** - сессии для хранения состояния бота
- **webapp_data** - данные из мини-приложения
- **bot_settings** - настройки бота

### Просмотр данных

- Тестовая страница: `http://localhost:3001/test`
- Prisma Studio: `npm run db:studio`

## Файловая структура

```
├── src/
│   ├── app/                 # Next.js приложение
│   │   ├── api/             # API маршруты
│   │   │   ├── bot/         # API для бота
│   │   │   ├── users/       # API пользователей
│   │   │   ├── messages/    # API сообщений
│   │   │   └── webapp-data/ # API данных приложения
│   │   ├── test/            # Тестовая страница БД
│   │   ├── globals.css      # Глобальные стили
│   │   ├── layout.tsx       # Корневой layout
│   │   └── page.tsx         # Главная страница мини-приложения
│   ├── bot/
│   │   └── index.ts         # Логика Telegram бота
│   └── lib/
│       ├── prisma.ts        # Prisma Client
│       └── utils.ts         # Утилиты
├── prisma/
│   ├── schema.prisma        # Схема базы данных
│   ├── seed.ts              # Файл заполнения тестовыми данными
│   └── migrations/          # Миграции базы данных
├── .env.local               # Переменные окружения
├── bot.ts                   # Точка входа для бота
└── components.json          # Конфигурация shadcn/ui
```

## API Endpoints

- `GET /api/users` - получить всех пользователей
- `POST /api/users` - создать/обновить пользователя
- `GET /api/messages` - получить сообщения
- `POST /api/messages` - создать сообщение
- `GET /api/webapp-data` - получить данные веб-приложения
- `POST /api/webapp-data` - сохранить данные веб-приложения

## Деплой

Для развертывания в продакшене:

1. **Next.js приложение** можно развернуть на Vercel, Netlify или любом другом хостинге
2. **Telegram Bot** можно развернуть на VPS, Render или других платформах
3. **База данных** можно развернуть на Neon, Supabase или других PostgreSQL хостингах
4. Не забудьте обновить переменные окружения на продакшн значения

## Возможности расширения

- Добавление аутентификации пользователей
- Интеграция с платежными системами через Telegram Payments
- Добавление новых команд и функций бота
- Создание административной панели
- Добавление уведомлений и рассылок
- Интеграция с внешними API
