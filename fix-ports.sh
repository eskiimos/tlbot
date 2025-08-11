#!/bin/bash

# 🔧 Исправление проблемы с портами на сервере

SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="eskimoss.ru"

echo "🔧 Исправление проблемы с портами для $DOMAIN"
echo "=============================================="

# Подключаемся к серверу и решаем проблему
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_IP "
    echo '🔍 Проверяем что занимает порт 80...'
    lsof -i :80 || netstat -tulpn | grep :80
    
    echo '🛑 Останавливаем все контейнеры...'
    docker stop \$(docker ps -q) || true
    
    echo '🧹 Очищаем неиспользуемые ресурсы Docker...'
    docker system prune -f
    
    echo '🔄 Перезапускаем Docker...'
    systemctl restart docker
    
    echo '⏱️ Ждем 5 секунд...'
    sleep 5
    
    echo '🚀 Запускаем контейнеры...'
    cd /home/tlbot/app
    docker-compose up -d
    
    echo '🔄 Проверяем статус контейнеров...'
    docker ps
    
    echo '📡 Обновляем webhook...'
    curl -s 'https://api.telegram.org/bot7482550053:AAEd0XzEb3tkL1pryqkMYXn1YhoqJaMD7N0/setWebhook?url=https://$DOMAIN/api/bot'
    
    echo '✅ Готово!'
"

echo ""
echo "🔍 Проверка доступности сайта..."
curl -I -s https://$DOMAIN | head -1 || echo "Сайт пока недоступен (DNS еще не обновлены)"

echo ""
echo "🎯 СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1️⃣  Настройте DNS на reg.ru (если еще не сделали):"
echo "   • A-запись: @ -> $SERVER_IP"
echo "   • A-запись: www -> $SERVER_IP"
echo ""
echo "2️⃣  Подождите обновления DNS (5-15 минут)"
echo ""
echo "3️⃣  Настройте бота в BotFather:"
echo "   • /setdomain -> $DOMAIN"
echo "   • /setmenubutton -> Текст кнопки | https://$DOMAIN"
echo ""
echo "4️⃣  Протестируйте Mini App через бота"
echo ""
echo "⚠️ Если сайт все еще недоступен через 15 минут, проверьте DNS"
echo "   и возможные проблемы с сервером."
echo ""
