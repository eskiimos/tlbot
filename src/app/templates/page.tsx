'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { QuickTemplate, quickTemplates } from '@/lib/quickTemplates';

export default function TemplatesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Функция для подсчета товаров в корзине
  const updateCartCount = () => {
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

  useEffect(() => {
    console.log('🎯 Инициализация страницы шаблонов');
    
    // Инициализация Telegram WebApp, если есть
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      console.log('🔄 Инициализация Telegram WebApp для шаблонов');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    
    setIsMounted(true);
    updateCartCount();
    setIsLoading(false);
  }, []);

  const handleTemplateSelect = (template: QuickTemplate) => {
    console.log('🎯 Выбран шаблон:', template.name);
    
    // Увеличиваем количество каждого товара до минимум 10 штук
    const templateWithMinQuantity = {
      ...template,
      items: template.items.map(item => ({
        ...item,
        quantity: Math.max(item.quantity * 10, 10) // Минимум 10 штук каждой позиции
      }))
    };
    
    // Пересчитываем цену с учетом нового количества
    const newOriginalPrice = templateWithMinQuantity.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const newDiscountedPrice = Math.round(newOriginalPrice * 0.9); // 10% скидка
    
    const finalTemplate = {
      ...templateWithMinQuantity,
      originalPrice: newOriginalPrice,
      discountedPrice: newDiscountedPrice
    };
    
    // Сохраняем выбранный шаблон в localStorage
    localStorage.setItem('selectedTemplate', JSON.stringify(finalTemplate));
    
    // Переходим в корзину с параметром template
    router.push('/cart?template=true');
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % quickTemplates.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + quickTemplates.length) % quickTemplates.length);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
          <p className="text-gray-600 mt-4">Загружаем шаблоны...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Хэдер с логотипом */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Кнопка назад слева */}
            <Link 
              href="/catalog"
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="Назад к каталогу"
            >
              <svg 
                className="w-6 h-6 text-[#303030]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
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

      {/* Контент шаблонов */}
      <div className="max-w-md mx-auto p-4">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🎯 Быстрые шаблоны</h1>
          <p className="text-gray-600 text-sm">
            Готовые комбинации товаров со скидкой 10%
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
            <p className="text-gray-800 text-sm font-medium">
              ⚡ Минимальный заказ: от 10 штук каждой позиции
            </p>
          </div>
        </div>

        {/* Слайдер шаблонов */}
        <div className="relative">
          <div className="overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {quickTemplates.map((template, index) => (
                <div key={template.id} className="w-full flex-shrink-0">
                  <TemplateCard 
                    template={template}
                    onSelect={() => handleTemplateSelect(template)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Навигация слайдера */}
          {quickTemplates.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all border border-gray-200"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all border border-gray-200"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Индикаторы слайдов */}
        {quickTemplates.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {quickTemplates.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? 'bg-gray-800 w-6' : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Компонент карточки шаблона
function TemplateCard({ template, onSelect }: { template: QuickTemplate; onSelect: () => void }) {
  // Рассчитываем цены с учетом минимального количества 10 штук
  const minQuantityItems = template.items.map(item => ({
    ...item,
    quantity: Math.max(item.quantity * 10, 10)
  }));
  
  const calculatedOriginalPrice = minQuantityItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  const calculatedDiscountedPrice = Math.round(calculatedOriginalPrice * 0.9);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-2">
      {template.popular && (
        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mb-4">
          🔥 Популярно
        </div>
      )}
      
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        {template.name}
      </h3>
      
      <p className="text-gray-600 mb-4">
        {template.description}
      </p>
      
      <div className="space-y-3 mb-6">
        {minQuantityItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <span className="font-medium text-gray-900">{item.productName}</span>
              <span className="text-gray-600 font-semibold ml-2">× {item.quantity}</span>
            </div>
            <span className="text-gray-700 font-medium">{(item.price * item.quantity).toLocaleString()}₽</span>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-sm text-gray-500 line-through">
              {calculatedOriginalPrice.toLocaleString()}₽
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {calculatedDiscountedPrice.toLocaleString()}₽
            </div>
          </div>
          <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg text-lg font-bold">
            -10%
          </div>
        </div>
        
        <button
          onClick={onSelect}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 shadow-sm"
        >
          Выбрать шаблон
        </button>
      </div>
    </div>
  );
}
