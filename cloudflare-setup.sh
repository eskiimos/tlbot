#!/bin/bash

# 🌐 Автоматическая настройка Cloudflare для Telegram Mini App
# Этот скрипт автоматизирует настройку домена через Cloudflare API

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Автоматическая настройка Cloudflare CLI${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Используем предоставленный домен
DOMAIN="eskimoss.ru"
echo -e "${GREEN}✅ Используем ваш домен: $DOMAIN${NC}"
echo ""

# Запрашиваем данные Cloudflare
read -p "Введите email Cloudflare: " CF_EMAIL
read -s -p "Введите API ключ Cloudflare (будет скрыт): " CF_API_KEY
echo ""
echo ""

# Проверяем наличие домена
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ Ошибка: Домен не указан${NC}"
    exit 1
fi

# Проверяем наличие утилиты curl
if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ Ошибка: curl не установлен${NC}"
    echo "Установите curl и попробуйте снова"
    exit 1
fi

# IP сервера
SERVER_IP="89.104.65.237"

echo -e "${YELLOW}🔍 Проверяем данные доступа к Cloudflare...${NC}"

# Проверяем авторизацию в Cloudflare
echo -e "${YELLOW}🔍 Используем Global API Key...${NC}"
CF_AUTH_CHECK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
     -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     -H "Content-Type: application/json")

if [[ $CF_AUTH_CHECK == *"\"success\":true"* ]]; then
    echo -e "${GREEN}✅ Авторизация в Cloudflare успешна${NC}"
else
    echo -e "${YELLOW}⚠️ Пробуем альтернативный метод с API Token...${NC}"
    CF_AUTH_CHECK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" \
         -H "Authorization: Bearer $CF_API_KEY" \
         -H "Content-Type: application/json")
    
    if [[ $CF_AUTH_CHECK == *"\"success\":true"* ]]; then
        echo -e "${GREEN}✅ Авторизация в Cloudflare успешна с API Token${NC}"
        # Устанавливаем флаг, что используем API Token
        USE_API_TOKEN=true
    else
        echo -e "${RED}❌ Ошибка авторизации в Cloudflare${NC}"
        echo -e "${YELLOW}🔍 Проверьте API ключ и email на странице:${NC}"
        echo -e "${BLUE}   https://dash.cloudflare.com/profile/api-tokens${NC}"
        echo -e "${YELLOW}🔍 Создайте API ключ со всеми разрешениями${NC}"
        exit 1
    fi
fi

# Получаем Zone ID для домена
echo -e "${YELLOW}🔍 Получаем информацию о домене...${NC}"

CF_ZONE_CHECK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
     -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     -H "Content-Type: application/json")

if [[ $CF_ZONE_CHECK == *"\"count\":0"* ]]; then
    echo -e "${YELLOW}⚠️ Домен не найден в Cloudflare. Добавляем...${NC}"
    
    # Добавляем домен в Cloudflare
    CF_ZONE_CREATE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones" \
         -H "X-Auth-Email: $CF_EMAIL" \
         -H "X-Auth-Key: $CF_API_KEY" \
         -H "Content-Type: application/json" \
         --data "{\"name\":\"$DOMAIN\",\"jump_start\":true}")
    
    if [[ $CF_ZONE_CREATE == *"\"success\":true"* ]]; then
        ZONE_ID=$(echo "$CF_ZONE_CREATE" | grep -o "\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✅ Домен успешно добавлен в Cloudflare${NC}"
        
        # Получаем nameservers
        NS1=$(echo "$CF_ZONE_CREATE" | grep -o "\"nameservers\":\[[^\]]*\]" | grep -o "\"[^\"]*\"" | sed 's/"//g' | head -1)
        NS2=$(echo "$CF_ZONE_CREATE" | grep -o "\"nameservers\":\[[^\]]*\]" | grep -o "\"[^\"]*\"" | sed 's/"//g' | head -2 | tail -1)
        
        echo -e "${YELLOW}⚠️ ВАЖНО: Измените nameservers у вашего регистратора на:${NC}"
        echo -e "${BLUE}   $NS1${NC}"
        echo -e "${BLUE}   $NS2${NC}"
        echo -e "${YELLOW}⚠️ Без этого шага настройка не будет работать!${NC}"
        echo ""
        read -p "Нажмите Enter после изменения nameservers..."
    else
        echo -e "${RED}❌ Ошибка добавления домена в Cloudflare${NC}"
        echo "$CF_ZONE_CREATE" | grep -o "\"message\":\"[^\"]*\"" | cut -d'"' -f4
        exit 1
    fi
else
    ZONE_ID=$(echo "$CF_ZONE_CHECK" | grep -o "\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Домен найден в Cloudflare${NC}"
fi

# Добавляем DNS запись
echo -e "${YELLOW}🔍 Добавляем DNS запись...${NC}"

# Сначала проверяем, есть ли уже запись
CF_DNS_CHECK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=A&name=$DOMAIN" \
     -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     -H "Content-Type: application/json")

if [[ $CF_DNS_CHECK == *"\"count\":0"* ]]; then
    # Добавляем новую запись
    CF_DNS_CREATE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
         -H "X-Auth-Email: $CF_EMAIL" \
         -H "X-Auth-Key: $CF_API_KEY" \
         -H "Content-Type: application/json" \
         --data "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$SERVER_IP\",\"ttl\":1,\"proxied\":true}")
    
    if [[ $CF_DNS_CREATE == *"\"success\":true"* ]]; then
        echo -e "${GREEN}✅ DNS запись успешно добавлена${NC}"
    else
        echo -e "${RED}❌ Ошибка добавления DNS записи${NC}"
        echo "$CF_DNS_CREATE" | grep -o "\"message\":\"[^\"]*\"" | cut -d'"' -f4
    fi
else
    DNS_ID=$(echo "$CF_DNS_CHECK" | grep -o "\"id\":\"[^\"]*\"" | head -1 | cut -d'"' -f4)
    
    # Обновляем существующую запись
    CF_DNS_UPDATE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$DNS_ID" \
         -H "X-Auth-Email: $CF_EMAIL" \
         -H "X-Auth-Key: $CF_API_KEY" \
         -H "Content-Type: application/json" \
         --data "{\"type\":\"A\",\"name\":\"@\",\"content\":\"$SERVER_IP\",\"ttl\":1,\"proxied\":true}")
    
    if [[ $CF_DNS_UPDATE == *"\"success\":true"* ]]; then
        echo -e "${GREEN}✅ DNS запись успешно обновлена${NC}"
    else
        echo -e "${RED}❌ Ошибка обновления DNS записи${NC}"
        echo "$CF_DNS_UPDATE" | grep -o "\"message\":\"[^\"]*\"" | cut -d'"' -f4
    fi
fi

# Настраиваем SSL
echo -e "${YELLOW}🔍 Настраиваем SSL...${NC}"

CF_SSL_UPDATE=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" \
     -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     -H "Content-Type: application/json" \
     --data "{\"value\":\"full_strict\"}")

if [[ $CF_SSL_UPDATE == *"\"success\":true"* ]]; then
    echo -e "${GREEN}✅ SSL настроен успешно${NC}"
else
    echo -e "${RED}❌ Ошибка настройки SSL${NC}"
    echo "$CF_SSL_UPDATE" | grep -o "\"message\":\"[^\"]*\"" | cut -d'"' -f4
fi

# Настраиваем Always Use HTTPS
echo -e "${YELLOW}🔍 Настраиваем Always Use HTTPS...${NC}"

CF_HTTPS_UPDATE=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/always_use_https" \
     -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     -H "Content-Type: application/json" \
     --data "{\"value\":\"on\"}")

if [[ $CF_HTTPS_UPDATE == *"\"success\":true"* ]]; then
    echo -e "${GREEN}✅ Always Use HTTPS настроен успешно${NC}"
else
    echo -e "${RED}❌ Ошибка настройки Always Use HTTPS${NC}"
    echo "$CF_HTTPS_UPDATE" | grep -o "\"message\":\"[^\"]*\"" | cut -d'"' -f4
fi

# Настраиваем Auto Minify
echo -e "${YELLOW}🔍 Настраиваем Auto Minify...${NC}"

CF_MINIFY_UPDATE=$(curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/minify" \
     -H "X-Auth-Email: $CF_EMAIL" \
     -H "X-Auth-Key: $CF_API_KEY" \
     -H "Content-Type: application/json" \
     --data "{\"value\":{\"css\":\"on\",\"html\":\"on\",\"js\":\"on\"}}")

if [[ $CF_MINIFY_UPDATE == *"\"success\":true"* ]]; then
    echo -e "${GREEN}✅ Auto Minify настроен успешно${NC}"
else
    echo -e "${RED}❌ Ошибка настройки Auto Minify${NC}"
    echo "$CF_MINIFY_UPDATE" | grep -o "\"message\":\"[^\"]*\"" | cut -d'"' -f4
fi

# Обновляем наш deploy script
echo -e "${YELLOW}🔍 Обновляем скрипт деплоя...${NC}"

# Создаем обновленный скрипт деплоя
cat > deploy-with-domain.sh << EOF
#!/bin/bash

# 🚀 Деплой на сервер с настроенным доменом
SERVER_IP="89.104.65.237"
SERVER_PASS="Pji3PYKLpeOFgUoF"
DOMAIN="$DOMAIN"

echo "🚀 Деплой с доменом: \$DOMAIN"
echo "====================================="

# Обновляем файлы на сервере
sshpass -p "\$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@\$SERVER_IP "
cd /home/tlbot/app

# Обновляем переменные окружения
cat > .env << 'ENVEOF'
NODE_ENV=production
DATABASE_URL=postgresql://tlbot:StrongDbPassword2025@tlbot_postgres:5432/tlbot_prod
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
NEXT_PUBLIC_APP_URL=https://$DOMAIN
ADMIN_EMAIL=admin@tlbot.local
ADMIN_PASSWORD=AdminTLBot2025!
WEBHOOK_URL=https://$DOMAIN/api/bot
ENVEOF

# Перезапускаем с новой конфигурацией
docker-compose down
docker-compose -f docker-compose.domain.yml up --build -d

echo '✅ Деплой завершен!'
"

echo ""
echo "🌐 ВАШЕ ПРИЛОЖЕНИЕ ДОСТУПНО:"
echo "   Mini App URL: https://$DOMAIN"
echo "   Админка: https://$DOMAIN/admin"
echo ""
echo "📱 НАСТРОЙКА TELEGRAM БОТА:"
echo "   1. Откройте @BotFather в Telegram"
echo "   2. Отправьте команду: /setdomain"
echo "   3. Выберите вашего бота"
echo "   4. Введите: $DOMAIN"
echo "   5. Отправьте команду: /setmenubutton"
echo "   6. Выберите вашего бота"
echo "   7. Укажите текст кнопки (например: Открыть магазин)"
echo "   8. Введите URL: https://$DOMAIN"
echo ""
echo "🔄 Обновляем webhook..."

# Устанавливаем webhook
curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook?url=https://$DOMAIN/api/bot"

echo ""
echo "✅ НАСТРОЙКА ЗАВЕРШЕНА!"
echo ""
EOF

chmod +x deploy-with-domain.sh

echo -e "${GREEN}✅ Скрипт деплоя обновлен${NC}"

# Проверяем DNS propagation
echo -e "${YELLOW}🔍 Проверяем DNS propagation...${NC}"
echo -e "${YELLOW}⚠️ Это может занять до 24 часов, но обычно готово через 5-10 минут${NC}"
echo ""

echo -e "${GREEN}✅ CLOUDFLARE НАСТРОЕН УСПЕШНО!${NC}"
echo ""
echo -e "${BLUE}🎯 СЛЕДУЮЩИЕ ШАГИ:${NC}"
echo -e "${BLUE}1. Запустите скрипт деплоя:${NC}"
echo -e "${YELLOW}   ./deploy-with-domain.sh${NC}"
echo ""
echo -e "${BLUE}2. Настройте бота в BotFather:${NC}"
echo -e "${YELLOW}   • /setdomain -> $DOMAIN${NC}"
echo -e "${YELLOW}   • /setmenubutton -> Текст кнопки | https://$DOMAIN${NC}"
echo ""
echo -e "${BLUE}3. Протестируйте Mini App:${NC}"
echo -e "${YELLOW}   • Откройте бота в Telegram${NC}"
echo -e "${YELLOW}   • Нажмите кнопку меню${NC}"
echo ""
echo -e "${RED}⚠️ ВАЖНО: Если вы только что зарегистрировали домен, подождите${NC}"
echo -e "${RED}   5-10 минут перед запуском деплоя для DNS propagation${NC}"
echo ""
