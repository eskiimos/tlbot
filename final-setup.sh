#!/bin/bash

# 🚀 Финальная настройка TL Bot на рег.облако

echo "🚀 Финальная настройка TL Bot на сервере"
echo "========================================"

# Проверяем, что мы root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Запустите от имени root: sudo ./final-setup.sh"
    exit 1
fi

echo "📁 Создаем директорию приложения..."
mkdir -p /home/tlbot/app

echo "📋 Копируем файлы проекта..."
cp -r /root/* /home/tlbot/app/ 2>/dev/null || true

echo "🔧 Настраиваем права доступа..."
chown -R tlbot:tlbot /home/tlbot/app

echo "📋 Проверяем ключевые файлы..."
cd /home/tlbot/app

if [ -f "deploy-regoblako.sh" ]; then
    echo "✅ deploy-regoblako.sh найден"
else
    echo "❌ deploy-regoblako.sh не найден"
    exit 1
fi

if [ -f ".env.regoblako" ]; then
    echo "✅ .env.regoblako найден"
else
    echo "❌ .env.regoblako не найден"
    exit 1
fi

if [ -f "package.json" ]; then
    echo "✅ package.json найден"
else
    echo "❌ package.json не найден"
    exit 1
fi

if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile найден"
else
    echo "❌ Dockerfile не найден"
    exit 1
fi

echo ""
echo "🔧 Делаем скрипты исполняемыми..."
chmod +x *.sh 2>/dev/null || true

echo ""
echo "👤 Переходим в пользователя tlbot и запускаем деплой..."

# Переключаемся на пользователя tlbot и запускаем деплой
su - tlbot << 'EOF'
set -e

echo "👤 Выполняем настройку от имени пользователя tlbot"
cd /home/tlbot/app

echo "🔍 Проверяем текущую директорию..."
pwd
ls -la | head -5

echo ""
echo "🚀 Запускаем деплой специально для рег.облако..."

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не найден в PATH для пользователя tlbot"
    echo "🔧 Добавляем пользователя в группу docker..."
    exit 1
fi

# Запускаем деплой
chmod +x deploy-regoblako.sh
./deploy-regoblako.sh

echo ""
echo "🎉 Деплой завершен!"
echo "==================="

EOF

echo ""
echo "🤖 Настраиваем Telegram webhook..."
curl -F "url=http://89.104.65.237:3000/api/bot" \
     "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook"

echo ""
echo ""
echo "🎉 ГОТОВО! Приложение развернуто!"
echo "================================="
echo ""
echo "🌐 Доступ к приложению:"
echo "   Основное: http://89.104.65.237:3000"
echo "   Админка:  http://89.104.65.237:3000/admin"
echo ""
echo "👤 Данные для входа в админку:"
echo "   Email: admin@tlbot.local"
echo "   Пароль: AdminTLBot2025!"
echo ""
echo "📱 Найдите вашего бота в Telegram и отправьте /start"
