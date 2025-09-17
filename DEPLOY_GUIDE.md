# Деплой на Vercel - Пошаговая инструкция

## 🚀 Быстрый старт

### 1. Подключение к Vercel

```bash
# Установите Vercel CLI (если еще не установлен)
npm i -g vercel

# Логин в Vercel
vercel login

# Деплой проекта
vercel --prod
```

### 2. Альтернативный способ - через веб-интерфейс

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите "Import Project"  
3. Выберите GitHub репозиторий `eskiimos/tlbot`
4. Настройте переменные окружения (см. VERCEL_ENV.md)
5. Нажмите "Deploy"

## 🔧 Настройка переменных окружения

### Обязательные переменные:

```bash
# База данных (можно использовать Vercel Postgres)
DATABASE_URL="postgresql://..."

# Токен Telegram бота  
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN_HERE"

# URL приложения (замените после деплоя)
NEXT_PUBLIC_APP_URL="https://your-domain.vercel.app"
```

### Опциональные:

```bash
# Chat ID админа для уведомлений о дизайне
TELEGRAM_ADMIN_CHAT_ID="228594178"
```

## 🗄️ Настройка базы данных

### Вариант 1: Vercel Postgres (рекомендуется)

1. В панели Vercel перейдите в Storage
2. Создайте Postgres базу данных
3. Скопируйте DATABASE_URL
4. Добавьте в Environment Variables

### Вариант 2: Внешняя база (Supabase, Neon, etc.)

1. Создайте PostgreSQL базу на выбранном сервисе
2. Скопируйте строку подключения
3. Добавьте как DATABASE_URL

## 📡 Настройка Telegram Webhook

После успешного деплоя обновите webhook:

```bash
# Замените на ваш домен
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.vercel.app/api/bot"}'
```

## ✅ Проверка деплоя

1. Откройте `https://your-domain.vercel.app`
2. Проверьте, что приложение загружается
3. Проверьте `https://your-domain.vercel.app/api/products`
4. Проверьте работу Telegram бота

## 🔍 Отладка проблем

### Логи функций:
```bash
vercel logs your-project-name --all
```

### Переменные окружения:
1. Vercel Dashboard → Settings → Environment Variables
2. Убедитесь, что все переменные добавлены
3. Сделайте redeploy если изменили переменные

### База данных:
```bash
# Проверка подключения
npx prisma db push --preview-feature
npx prisma generate
```

## 🎯 Готовые команды для копирования

```bash
# Полный деплой с нуля
vercel --prod

# Обновление после изменений в коде
git push origin main
# Vercel автоматически пересоберет

# Обновление webhook после деплоя
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"${VERCEL_URL}/api/bot\"}"
```
