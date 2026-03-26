'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import ProfileModal from '@/components/ProfileModal';
import Footer from '@/components/Footer';

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
  const [viewMode, setViewMode] = useState<'single' | 'double'>('double'); // single = 1 в ряд, double = 2 в ряд
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
    <div className="min-h-screen bg-white">
      {/* Хэдер */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">

          {/* Левая кнопка — профиль */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors"
            title="Профиль"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </button>

          {/* Центр — логотип */}
          <Image
            src="/TLlogo.svg"
            alt="TL Logo"
            width={88}
            height={32}
            className="h-8 w-auto"
            priority
          />

          {/* Правая кнопка — корзина */}
          <button
            onClick={() => { window.location.href = '/cart'; }}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors relative"
            title="Корзина"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {isMounted && cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#303030] text-white text-[10px] font-semibold rounded-full flex items-center justify-center leading-none">
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </button>

        </div>
      </header>

      {/* Индикатор выбранной услуги */}
      {isMounted && (() => {
        const selectedService = localStorage.getItem('tl_selected_service');
        const designType = localStorage.getItem('tl_design_type');
        
        if (selectedService === 'production') {
          return (
            <div className="bg-[#fafafa] border-b border-black/5 sticky top-[57px] sm:top-[61px] z-40">
              <div className="max-w-md mx-auto px-4 py-2.5">
                <div className="flex items-center gap-2.5 text-[#303030]">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">Производство мерча</div>
                    <div className="text-[11px] text-[#8e8e93] leading-tight mt-0.5">Выберите товары для производства</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        if (selectedService === 'design') {
          const typeText = designType === 'single-item' ? 'Дизайн одного изделия' : 'Дизайн коллекции';
          return (
            <div className="bg-[#fafafa] border-b border-black/5 sticky top-[57px] sm:top-[61px] z-40">
              <div className="max-w-md mx-auto px-4 py-2.5">
                <div className="flex items-center gap-2.5 text-[#303030]">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">{typeText}</div>
                    <div className="text-[11px] text-[#8e8e93] leading-tight mt-0.5">Мы обрабатываем заявку</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        if (selectedService === 'full-cycle') {
          return (
            <div className="bg-[#fafafa] border-b border-black/5 sticky top-[57px] sm:top-[61px] z-40">
              <div className="max-w-md mx-auto px-4 py-2.5">
                <div className="flex items-center gap-2.5 text-[#303030]">
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold leading-tight">Под ключ</div>
                    <div className="text-[11px] text-[#8e8e93] leading-tight mt-0.5">Ожидайте звонка менеджера</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Контент каталога */}
      <div className="max-w-md mx-auto p-4 pt-2">
        {isLoading ? (
          <>
            {/* Skeleton для кнопок категорий */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-9 bg-black/5 rounded-full animate-pulse" style={{width: `${60 + i * 20}px`}}></div>
              ))}
            </div>
            
            {/* Skeleton для товаров */}
            <div className="grid gap-x-3 gap-y-6 grid-cols-2">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-3xl overflow-hidden border border-black/5 animate-pulse">
                  <div className="aspect-[4/5] bg-black/5"></div>
                  <div className="p-3">
                    <div className="h-3 bg-black/10 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-black/10 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-black/5 rounded-xl w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* Фильтры-теги */}
            <div className="mb-4 pt-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-[20px] text-[15px] font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                      selectedCategory === category.id
                        ? 'bg-[#303030] text-white'
                        : 'bg-black/[0.04] text-[#303030] font-normal hover:bg-black/[0.08]'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Заголовок со счетчиком и переключателем вида */}
            <div className="flex items-center justify-between mb-5 px-1">
              <p className="text-[#8e8e93] text-[15px] font-medium tracking-tight">
                {filteredProducts.length} товар{filteredProducts.length % 10 === 1 && filteredProducts.length !== 11 ? '' : filteredProducts.length % 10 >= 2 && filteredProducts.length % 10 <= 4 && (filteredProducts.length < 10 || filteredProducts.length > 20) ? 'а' : 'ов'}
              </p>
              
              <div className="bg-black/5 rounded-full p-1 flex items-center">
                <button
                  onClick={() => setViewMode('single')}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    viewMode === 'single'
                      ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#303030]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="1 товар в ряд"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('double')}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    viewMode === 'double'
                      ? 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[#303030]'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="2 товара в ряд"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                    <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                    <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                  </svg>
                </button>
              </div>
            </div>

            {/* Сетка товаров */}
            <div className={`grid gap-x-3 gap-y-6 ${viewMode === 'single' ? 'grid-cols-1 mb-8' : 'grid-cols-2 mb-8'}`}>
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
              <div className="text-center mt-6 mb-12">
                <button
                  onClick={() => setDisplayedProductsCount(prev => prev + 6)}
                  className="px-6 py-3.5 bg-black/[0.04] rounded-2xl text-[15px] font-medium text-[#303030] hover:bg-black/[0.08] transition-colors w-full"
                >
                  Показать еще ({filteredProducts.length - displayedProductsCount})
                </button>
              </div>
            )}

            {filteredProducts.length === 0 && products.length > 0 && (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-[#303030] font-medium mb-1">Ничего не найдено</p>
                <p className="text-[#8e8e93] text-sm mb-6">В этой категории пока нет товаров</p>
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="px-6 py-2.5 bg-black/[0.04] rounded-2xl text-[15px] font-medium text-[#303030] hover:bg-black/[0.08] transition-colors"
                >
                  Показать все товары
                </button>
              </div>
            )}

            {products.length === 0 && (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className="text-[#303030] font-medium mb-1">Каталог пуст</p>
                <p className="text-[#8e8e93] text-sm">Товары еще не добавлены</p>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Футер */}
      <Footer />

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
