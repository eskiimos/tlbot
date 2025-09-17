# Переменные окружения для Vercel

## Обязательные переменные:

### 1. DATABASE_URL
# Строка подключения к PostgreSQL базе данных
# Получить можно из:
# - Vercel Postgres
# - Supabase
# - Neon
# - или другого провайдера
DATABASE_URL="postgresql://username:password@host:port/database?schema=public"

### 2. TELEGRAM_BOT_TOKEN
# Токен Telegram бота
# Получить у @BotFather в Telegram
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

### 3. NEXT_PUBLIC_APP_URL
# URL мини-приложения (домен Vercel)
# Заменить на реальный домен после деплоя
NEXT_PUBLIC_APP_URL="https://your-app-name.vercel.app"

## Опциональные переменные:

### 4. TELEGRAM_ADMIN_CHAT_ID
# Chat ID администратора для уведомлений о заказах дизайна
# Получить у @userinfobot в Telegram
TELEGRAM_ADMIN_CHAT_ID="YOUR_ADMIN_CHAT_ID"

### 5. NODE_ENV
# Автоматически устанавливается Vercel
NODE_ENV="production"

## Инструкция по настройке в Vercel:

1. Зайдите в панель Vercel
2. Выберите ваш проект
3. Перейдите в Settings → Environment Variables
4. Добавьте каждую переменную отдельно
5. Убедитесь, что они применяются к Production и Preview

## После деплоя:

1. Обновите NEXT_PUBLIC_APP_URL на реальный домен
2. Настройте webhook для Telegram бота на новый домен
3. Запустите миграции базы данных (если нужно)
