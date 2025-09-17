import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  try {
    console.log('🔍 Проверяем заказы в базе данных...\n');
    
    // Получаем все заказы
    const allOrders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log(`📊 Всего заказов в БД: ${allOrders.length}\n`);
    
    if (allOrders.length > 0) {
      allOrders.forEach((order, index) => {
        console.log(`${index + 1}. Заказ №${order.id.slice(-6).toUpperCase()}`);
        console.log(`   Telegram ID: ${order.telegramId}`);
        console.log(`   Клиент: ${order.customerName}`);
        console.log(`   Статус: ${order.status}`);
        console.log(`   Сумма: ${order.totalAmount}₽`);
        console.log(`   Дата: ${order.createdAt.toLocaleDateString('ru-RU')}`);
        console.log('');
      });
      
      // Проверяем заказы конкретного пользователя
      console.log('🔍 Заказы для Telegram ID: 123456789');
      const userOrders = await prisma.order.findMany({
        where: { telegramId: '123456789' },
        orderBy: { createdAt: 'desc' }
      });
      
      if (userOrders.length > 0) {
        console.log(`✅ Найдено заказов: ${userOrders.length}`);
        userOrders.forEach((order, index) => {
          console.log(`   ${index + 1}. ${order.customerName} - ${order.status} - ${order.totalAmount}₽`);
        });
      } else {
        console.log('❌ Заказов для данного пользователя не найдено');
      }
      
    } else {
      console.log('❌ Заказы в базе данных не найдены');
    }
    
  } catch (error) {
    console.error('❌ Ошибка проверки заказов:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrders();