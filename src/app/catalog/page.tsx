'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProfileModal from '@/components/ProfileModal';

interface PriceTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  description?: string;
  priceTiers?: PriceTier[];
}

interface UserData {
  telegramId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  email?: string;
  companyName?: string;
  inn?: string;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'single' | 'double'>('single'); // single = 1 в ряд, double = 2 в ряд
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [displayedProductsCount, setDisplayedProductsCount] = useState(6); // Показываем сначала 6 товаров
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Функция для подсчета товаров в корзине
  const updateCartCount = () => {
    // Проверяем, что мы находимся в браузере
    if (typeof window === 'undefined') {
      setCartItemsCount(0);
      return;
    }
    
    try {
      const savedCart = localStorage.getItem('tlbot_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        const totalItems = cartData.reduce((total: number, item: any) => total + item.quantity, 0);
        setCartItemsCount(totalItems);
      } else {
        setCartItemsCount(0);
      }
    } catch (error) {
      console.error('Ошибка при подсчете товаров в корзине:', error);
      setCartItemsCount(0);
    }
  };

  // Категории товаров
  const categories = [
    { id: 'all', name: 'Все товары' },
    { id: 'outerwear', name: 'Верхняя одежда' },
    { id: 'clothing', name: 'Одежда' },
    { id: 'bottoms', name: 'Низ' },
    { id: 'accessories', name: 'Аксессуары' }
  ];

  // Функция для определения категории товара
  const getCategoryForProduct = (productName: string, slug: string): string => {
    const name = productName.toLowerCase();
    const productSlug = slug.toLowerCase();
    
    if (name.includes('худи') || name.includes('халфзип') || name.includes('зип')) {
      return 'outerwear';
    }
    if (name.includes('джинсы') || name.includes('штаны') || name.includes('шорты')) {
      return 'bottoms';
    }
    if (name.includes('шоппер')) {
      return 'accessories';
    }
    // Футболка, лонгслив, свитшот - основная одежда
    return 'clothing';
  };

  // Помощник для определения «шоппера»
  const isShopper = (p: Product) =>
    p.slug?.toLowerCase() === 'shopper' || p.name?.toLowerCase().includes('шоппер');

  // Фильтрация и сортировка товаров по категории и цене (от минимальной к максимальной),
  // при этом «шоппер» всегда в конце
  const filteredProducts = (
    selectedCategory === 'all'
      ? products
      : products.filter(product => getCategoryForProduct(product.name, product.slug) === selectedCategory)
  ).sort((a, b) => {
    const aShopper = isShopper(a);
    const bShopper = isShopper(b);
    if (aShopper && !bShopper) return 1; // a в конец
    if (!aShopper && bShopper) return -1; // b в конец
    return a.price - b.price; // обычная сортировка по цене
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('Загружаем товары...');
        const response = await fetch('/api/products');
        console.log('Ответ API:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Данные товаров:', data);
        
        if (data.success && data.products) {
          setProducts(data.products);
        } else {
          console.error('Неверный формат данных:', data);
        }
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    
    // Устанавливаем флаг монтирования компонента
    setIsMounted(true);
    updateCartCount();
    
    // Обновляем счетчик при изменении localStorage
    const handleStorageChange = () => {
      updateCartCount();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, []);

  // Сбрасываем счетчик отображаемых товаров при смене категории
  useEffect(() => {
    setDisplayedProductsCount(6);
  }, [selectedCategory]);

  // Загружаем данные пользователя
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Пытаемся получить данные из Telegram WebApp
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        setUserData({
          telegramId: tgUser.id?.toString(),
          username: tgUser.username,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name
        });
      }
    }
  }, []);

  // Обработчик сохранения данных профиля
  const handleProfileSave = (data: UserData) => {
    setUserData(data);
    console.log('Данные профиля сохранены в каталоге:', data);
  };
  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Хэдер с логотипом */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Левая группа кнопок */}
            <div className="flex items-center gap-2">
              {/* Иконка профиля */}
              <button 
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Профиль и настройки"
              >
                <Image
                  src="/bx_user.svg"
                  alt="Личный кабинет"
                  width={24}
                  height={24}
                  className="w-6 h-6 text-[#303030]"
                />
              </button>
              
              {/* Кнопка "Услуги" */}
              <Link 
                href="/?welcome=true"
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Наши услуги"
              >
                <svg 
                  width={24} 
                  height={24} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth={2}
                  className="w-6 h-6 text-[#303030]"
                >
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9,9h0a3,3,0,0,1,6,0c0,2-3,3-3,3"/>
                  <path d="M12,17h0"/>
                </svg>
              </Link>
            </div>
            
            {/* Логотип по центру */}
            <div className="flex justify-center">
              <Image
                src="/TLlogo.svg"
                alt="TL Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            
            {/* Иконка корзины справа */}
            <button 
              onClick={() => {
                window.location.href = '/cart';
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
              title="Корзина"
            >
              <Image
                src="/teenyicons_bag-outline.svg"
                alt="Корзина"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              {isMounted && cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Индикатор выбранной услуги */}
      {isMounted && (() => {
        const selectedService = localStorage.getItem('tl_selected_service');
        const designType = localStorage.getItem('tl_design_type');
        
        if (selectedService === 'production') {
          return (
            <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <div className="max-w-md mx-auto px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <div>
                    <div className="font-medium">Производство мерча</div>
                    <div className="text-xs text-gray-600 mt-0.5">👆 Выберите необходимые товары из каталога</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        if (selectedService === 'design') {
          const typeText = designType === 'single-item' ? 'Дизайн одного изделия (от 15 000 ₽)' : 'Дизайн коллекции (от 50 000 ₽)';
          return (
            <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <div className="max-w-md mx-auto px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
                  </svg>
                  <div>
                    <div className="font-medium">{typeText}</div>
                    <div className="text-xs text-gray-600 mt-0.5">📞 Мы уже обрабатываем вашу заявку</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        if (selectedService === 'full-cycle') {
          return (
            <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <div className="max-w-md mx-auto px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div>
                    <div className="font-medium">Дизайн + производство</div>
                    <div className="text-xs text-gray-600 mt-0.5">📞 Ожидайте звонка для обсуждения проекта</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Контент каталога */}
      <div className="max-w-md mx-auto p-4">
        {isLoading ? (
          <>
            {/* Skeleton для кнопок категорий */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-9 bg-gray-200 rounded-full animate-pulse" style={{width: `${60 + i * 20}px`}}></div>
              ))}
            </div>
            
            {/* Skeleton для товаров */}
            <div className="grid gap-4 grid-cols-1">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Удалено промо-сообщение с заголовком и плашкой */}
            <div className="mb-4">
              <p className="text-center text-gray-500 text-sm">
                {filteredProducts.length} товар{filteredProducts.length % 10 === 1 && filteredProducts.length !== 11 ? '' : filteredProducts.length % 10 >= 2 && filteredProducts.length % 10 <= 4 && (filteredProducts.length < 10 || filteredProducts.length > 20) ? 'а' : 'ов'} в каталоге
              </p>
            </div>

            {/* Фильтры-теги */}
            <div>
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category.id
                        ? 'bg-[#303030] text-white shadow-sm'
                        : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Переключатель вида отображения */}
            <div className="mb-4">
              <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 flex w-full">
                <button
                  onClick={() => setViewMode('single')}
                  className={`flex-1 p-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    viewMode === 'single'
                      ? 'bg-gray-100 text-gray-700 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title="1 товар в ряд"
                >
                  <Image
                    src="/si_window-line1.svg"
                    alt="1 товар в ряд"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">1 в ряд</span>
                </button>
                <button
                  onClick={() => setViewMode('double')}
                  className={`flex-1 p-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
                    viewMode === 'double'
                      ? 'bg-gray-100 text-gray-700 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}
                  title="2 товара в ряд"
                >
                  <Image
                    src="/si_window-line.svg"
                    alt="2 товара в ряд"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">2 в ряд</span>
                </button>
              </div>
            </div>

            {/* Сетка товаров */}
            <div className={`grid gap-4 ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {filteredProducts.slice(0, displayedProductsCount).map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isCompact={viewMode === 'double'}
                />
              ))}
            </div>

            {/* Кнопка "Показать еще" */}
            {filteredProducts.length > displayedProductsCount && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setDisplayedProductsCount(prev => prev + 6)}
                  className="px-6 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Показать еще ({filteredProducts.length - displayedProductsCount} товаров)
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && products.length > 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">В этой категории товары не найдены</p>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="mt-2 text-[#303030] hover:underline text-sm"
                >
                  Показать все товары
                </button>
              </div>
            )}

            {products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Товары не найдены</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Скрытая ссылка на админку - по клику */}
      <div 
        className="text-center text-xs text-gray-400 mt-8 cursor-pointer select-none pb-4"
        onClick={() => {
          window.location.href = '/admin';
        }}
      >
        Total Lookas
      </div>

      {/* Модальное окно профиля */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={userData}
        onSave={handleProfileSave}
      />
    </div>
  );
}
