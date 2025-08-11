#!/bin/bash
set -e

echo "🔧 Настройка сервера начата..."

# Переходим в корневую директорию
cd /root

# Извлекаем архив
echo "📦 Извлекаем архив..."
tar -xzf tlbot-deploy.tar.gz

# Запускаем автонастройку сервера
echo "⚙️ Запускаем автонастройку сервера..."
chmod +x quick-setup.sh
./quick-setup.sh

echo "✅ Автонастройка сервера завершена"

# Переходим в пользователя tlbot и настраиваем проект
echo "👤 Настраиваем проект для пользователя tlbot..."
su - tlbot << 'TLBOT_EOF'
set -e

# Создаем директорию приложения
mkdir -p /home/tlbot/app

# Копируем файлы проекта
sudo cp -r /root/* /home/tlbot/app/ 2>/dev/null || true
cd /home/tlbot/app

# Устанавливаем права
sudo chown -R tlbot:tlbot /home/tlbot/app

# Делаем скрипты исполняемыми
chmod +x *.sh 2>/dev/null || true

echo "📋 Файлы проекта скопированы в /home/tlbot/app"
echo "🚀 Готов к деплою!"

TLBOT_EOF

echo "🎉 Настройка завершена!"
echo "======================================="
echo "📁 Файлы проекта находятся в: /home/tlbot/app"
echo "👤 Для продолжения выполните:"
echo "   su - tlbot"
echo "   cd /home/tlbot/app"
echo "   ./deploy-regoblako.sh"

