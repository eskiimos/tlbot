// Тестовые данные для проверки группировки корзины
// Запустить в консоли браузера на странице /cart

const testCartData = [
  // Комбо набор 1
  {
    id: 'combo1-item1',
    name: 'Футболка "Классик"',
    price: 1200,
    quantity: 1,
    image: '/products/tshirt1.jpg',
    isTemplate: true,
    templateName: 'Базовый набор'
  },
  {
    id: 'combo1-item2', 
    name: 'Шорты спортивные',
    price: 800,
    quantity: 1,
    image: '/products/shorts1.jpg',
    isTemplate: true,
    templateName: 'Базовый набор'
  },
  {
    id: 'combo1-item3',
    name: 'Кепка',
    price: 500,
    quantity: 1,
    image: '/products/cap1.jpg',
    isTemplate: true,
    templateName: 'Базовый набор'
  },
  
  // Комбо набор 2
  {
    id: 'combo2-item1',
    name: 'Худи премиум',
    price: 2500,
    quantity: 1,
    image: '/products/hoodie1.jpg',
    isTemplate: true,
    templateName: 'Премиум набор'
  },
  {
    id: 'combo2-item2',
    name: 'Джинсы slim',
    price: 3200,
    quantity: 1,
    image: '/products/jeans1.jpg',
    isTemplate: true,
    templateName: 'Премиум набор'
  },
  
  // Обычные товары
  {
    id: 'regular1',
    name: 'Носки хлопковые',
    price: 300,
    quantity: 2,
    image: '/products/socks1.jpg'
  },
  {
    id: 'regular2',
    name: 'Рюкзак городской',
    price: 1800,
    quantity: 1,
    image: '/products/backpack1.jpg'
  }
];

// Сохраняем в localStorage
localStorage.setItem('cart', JSON.stringify(testCartData));

// Перезагружаем страницу
window.location.reload();

console.log('✅ Тестовые данные загружены в корзину!');
console.log('📦 Товаров в корзине:', testCartData.length);
console.log('🎯 Комбо наборов:', [...new Set(testCartData.filter(item => item.isTemplate).map(item => item.templateName))].length);
console.log('📱 Обычных товаров:', testCartData.filter(item => !item.isTemplate).length);
