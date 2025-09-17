#!/bin/bash

# 🚀 Быстрый запуск Mini App через Ngrok

echo "🚀 Быстрый запуск Mini App через Ngrok"
echo "====================================="
echo ""
echo "📱 Этот метод позволит СРАЗУ протестировать Mini App!"
echo ""

# Проверяем, установлен ли ngrok
if ! command -v ngrok &> /dev/null; then
    echo "📦 Устанавливаю ngrok..."
    
    # Для macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install ngrok/ngrok/ngrok
        else
            echo "❌ Установите Homebrew или скачайте ngrok с https://ngrok.com/download"
            exit 1
        fi
    else
        echo "❌ Установите ngrok с https://ngrok.com/download"
        exit 1
    fi
fi

echo "✅ ngrok установлен!"
echo ""

# Запускаем локальный dev сервер
echo "🔧 Запускаю локальный сервер..."
echo "   (Откроется в новом терминале)"
echo ""

# Создаем временный .env для локального тестирования
cat > .env.local.test << EOF
NODE_ENV=development
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/tlbot_dev
ADMIN_EMAIL=admin@tlbot.local
ADMIN_PASSWORD=AdminTLBot2025!
EOF

echo "1️⃣  Запустите локальную базу данных:"
echo "   npm run db:dev"
echo ""
echo "2️⃣  В новом терминале запустите приложение:"
echo "   cp .env.local.test .env.local"
echo "   npm run dev"
echo ""
echo "3️⃣  В третьем терминале запустите ngrok:"
echo "   ngrok http 3000"
echo ""
echo "4️⃣  Скопируйте HTTPS URL из ngrok (например: https://abc123.ngrok.io)"
echo ""
echo "5️⃣  В BotFather установите этот URL для Mini App"
echo ""

read -p "🤔 Запустить автоматически? (y/n): " auto_start

if [[ $auto_start == "y" || $auto_start == "Y" ]]; then
    
    echo "🚀 Автоматический запуск..."
    
    # Копируем env файл
    cp .env.local.test .env.local
    
    # Запускаем в фоне локальную БД (если есть Docker)
    if command -v docker &> /dev/null; then
        echo "📦 Запускаю PostgreSQL в Docker..."
        docker run -d --name tlbot_dev_db \
            -e POSTGRES_DB=tlbot_dev \
            -e POSTGRES_USER=postgres \
            -e POSTGRES_PASSWORD=password \
            -p 5432:5432 \
            postgres:13 2>/dev/null || echo "БД уже запущена или порт занят"
        
        sleep 3
        
        # Применяем миграции
        echo "🔄 Применяю миграции..."
        npx prisma migrate dev --name init || echo "Миграции уже применены"
    fi
    
    # Запускаем dev сервер в фоне
    echo "🌐 Запускаю Next.js сервер..."
    npm run dev &
    DEV_PID=$!
    
    sleep 5
    
    # Запускаем ngrok
    echo "🌍 Запускаю ngrok..."
    ngrok http 3000 &
    NGROK_PID=$!
    
    echo ""
    echo "✅ Все запущено!"
    echo ""
    echo "📋 СЛЕДУЮЩИЕ ШАГИ:"
    echo "1. Откройте http://localhost:4040 - панель ngrok"
    echo "2. Скопируйте HTTPS URL (например: https://abc123.ngrok.io)"
    echo "3. В Telegram найдите @BotFather"
    echo "4. Отправьте: /setmenubutton"
    echo "5. Выберите вашего бота"
    echo "6. Введите: Mini App|<ваш_ngrok_url>"
    echo "7. Протестируйте бота!"
    echo ""
    echo "⚠️  Для остановки нажмите Ctrl+C"
    
    # Ждем завершения
    trap "kill $DEV_PID $NGROK_PID 2>/dev/null; exit" INT
    wait
    
else
    echo ""
    echo "📖 РУЧНАЯ ИНСТРУКЦИЯ:"
    echo ""
    echo "1️⃣  Установите и настройте ngrok:"
    echo "   • Зарегистрируйтесь на ngrok.com"
    echo "   • Скачайте и установите ngrok"
    echo "   • ngrok config add-authtoken <your_token>"
    echo ""
    echo "2️⃣  Запустите локально:"
    echo "   • cp .env.local.test .env.local"
    echo "   • npm run dev"
    echo ""
    echo "3️⃣  В новом терминале:"
    echo "   • ngrok http 3000"
    echo ""
    echo "4️⃣  Настройте бота:"
    echo "   • BotFather -> /setmenubutton"
    echo "   • Введите ngrok URL"
    echo ""
fi

echo ""
echo "💡 ПОСТОЯННОЕ РЕШЕНИЕ:"
echo "   Для продакшена используйте настоящий домен!"
echo "   Запустите: ./setup-domain.sh"
echo ""
