'use client';

import { useEffect, useState, TouchEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Footer from '@/components/Footer';

interface PriceTier {
  id: string;
  minQuantity: number;
  maxQuantity: number | null;
  price: number;
}

interface ProductOption {
  id: string;
  category: string;
  name: string;
  price: number;
  isDefault: boolean;
  isActive: boolean;
  description?: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  description?: string;
  priceTiers: PriceTier[];
  options: ProductOption[];
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(10); // Минимальный заказ 10 штук
  const [imageError, setImageError] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<{[category: string]: string[]}>({});
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  
  // Touch слайдер состояния
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  // Состояние для сворачивания блоков
  const [showPriceTiers, setShowPriceTiers] = useState(false);

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

  // Обновляем счетчик при загрузке страницы
  useEffect(() => {
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

  // Touch события для плавных свайпов
  const handleTouchStart = (e: TouchEvent) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.targetTouches[0].clientX;
    const diff = currentX - touchStart;
    
    // Ограничиваем смещение для лучшего UX
    const maxOffset = 100;
    const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    
    setDragOffset(limitedOffset);
    setTouchEnd(currentX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && product && product.images.length > 1) {
      nextImage();
    } else if (isRightSwipe && product && product.images.length > 1) {
      prevImage();
    }
    
    // Сбрасываем состояние
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  // Функция для добавления товара в корзину
  const addToCart = () => {
    if (!product || typeof window === 'undefined') return;

    // Получаем выбранные опции с деталями
    const optionsDetails = Object.values(selectedOptions).flat().map(optionId => {
      const option = product.options.find(opt => opt.id === optionId);
      return option ? {
        id: option.id,
        name: option.name,
        category: option.category,
        price: option.price
      } : null;
    }).filter(Boolean);

    // Создаем объект товара для корзины
    const cartItem = {
      id: `${product.id}_${Date.now()}`, // Уникальный ID для позиции в корзине
      productName: product.name,
      productSlug: product.slug,
      quantity: quantity,
      basePrice: getPriceForQuantity(quantity) - Object.values(selectedOptions).flat().reduce((total, optionId) => {
        const option = product.options.find(opt => opt.id === optionId);
        return total + (option ? option.price : 0);
      }, 0), // Базовая цена без опций
      selectedOptions: selectedOptions,
      optionsDetails: optionsDetails,
      totalPrice: getTotalPriceWithOptions() * quantity,
      image: product.images.length > 0 ? product.images[0] : undefined
    };

    // Загружаем текущую корзину из localStorage
    let currentCart = [];
    try {
      const savedCart = localStorage.getItem('tlbot_cart');
      if (savedCart) {
        currentCart = JSON.parse(savedCart);
      }
    } catch (error) {
      console.error('Ошибка при загрузке корзины:', error);
    }

    // Добавляем новый товар
    currentCart.push(cartItem);

    // Сохраняем обновленную корзину
    try {
      localStorage.setItem('tlbot_cart', JSON.stringify(currentCart));
      // Обновляем счетчик товаров
      updateCartCount();
    } catch (error) {
      console.error('Ошибка при сохранении корзины:', error);
    }
  };

  // Функция для проверки, заполнен ли шаг
  const isStepCompleted = (step: number): boolean => {
    switch (step) {
      case 1: // Количество
        return quantity >= 10; // Всегда завершен, если количество >= 10
      case 2: // Цвет - любой выбор считается завершением
        const selectedColors = selectedOptions.color || [];
        return selectedColors.length > 0;
      case 3: // Дизайн - любой выбор считается завершением
        const selectedDesigns = selectedOptions.design || [];
        return selectedDesigns.length > 0;
      case 4: // Принт - только платные опции считаются завершением
        const selectedPrints = selectedOptions.print || [];
        return selectedPrints.some(optionId => {
          const option = product?.options.find(opt => opt.id === optionId);
          return option && option.price > 0;
        });
      case 5: // Бирки и упаковка - только платные опции считаются завершением
        const selectedLabels = selectedOptions.label || [];
        const selectedPackaging = selectedOptions.packaging || [];
        const hasPayedLabel = selectedLabels.some(optionId => {
          const option = product?.options.find(opt => opt.id === optionId);
          return option && option.price > 0;
        });
        const hasPayedPackaging = selectedPackaging.some(optionId => {
          const option = product?.options.find(opt => opt.id === optionId);
          return option && option.price > 0;
        });
        return hasPayedLabel || hasPayedPackaging;
      default:
        return false;
    }
  };

  // Функция для проверки, есть ли выбор в шаге (для разблокировки следующего шага)
  const hasStepSelection = (step: number): boolean => {
    switch (step) {
      case 1: // Количество
        return quantity >= 10; // Всегда разблокирован
      case 2: // Цвет
        return (selectedOptions.color || []).length > 0;
      case 3: // Дизайн
        return (selectedOptions.design || []).length > 0;
      case 4: // Принт
        return (selectedOptions.print || []).length > 0;
      case 5: // Бирки и упаковка
        return (selectedOptions.label || []).length > 0 || (selectedOptions.packaging || []).length > 0;
      default:
        return false;
    }
  };

  // Автоматический переход отключен - используем только ручную навигацию
  // useEffect(() => {
  //   if (!isInitialized || isManualNavigation) return;
  //   
  //   if (currentStep < 4 && hasStepSelection(currentStep)) {
  //     const timer = setTimeout(() => {
  //       setCurrentStep(prev => Math.min(prev + 1, 4));
  //     }, 500);
  //     
  //     return () => clearTimeout(timer);
  //   }
  // }, [selectedOptions, currentStep, isInitialized, isManualNavigation]);

  // Функция для ручного перехода к шагу
  const goToStep = (step: number) => {
    if (step >= 1 && step <= 5) {
      // Можем переходить назад к любому пройденному шагу
      if (step < currentStep) {
        setCurrentStep(step);
      }
      // Можем переходить вперёд только на один шаг и только если текущий заполнен
      else if (step === currentStep + 1 && hasStepSelection(currentStep)) {
        setCurrentStep(step);
      }
      // Остаёмся на текущем шаге
      else if (step === currentStep) {
        setCurrentStep(step);
      }
    }
  };

  // Закрытие подсказки при клике вне её
  useEffect(() => {
    const handleClickOutside = () => {
      setShowTooltip(null);
    };
    
    if (showTooltip) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showTooltip]);

  // Инициализация выбранных опций по умолчанию
  useEffect(() => {
    if (product && product.options.length > 0) {
      const defaultOptions: {[category: string]: string[]} = {};
      
      // Группируем опции по категориям
      const optionsByCategory = product.options.reduce((acc, option) => {
        if (!acc[option.category]) acc[option.category] = [];
        acc[option.category].push(option);
        return acc;
      }, {} as {[category: string]: ProductOption[]});

      // Устанавливаем опции по умолчанию
      Object.entries(optionsByCategory).forEach(([category, options]) => {
        const defaultOption = options.find(opt => opt.isDefault);
        if (defaultOption) {
          defaultOptions[category] = [defaultOption.id];
        } else {
          defaultOptions[category] = [];
        }
      });

      setSelectedOptions(defaultOptions);
      setIsInitialized(true);
    }
  }, [product]);

  // Функция для получения цены за единицу в зависимости от количества и опций
  const getPriceForQuantity = (quantity: number): number => {
    if (!product || !product.priceTiers.length) return product?.price || 0;
    
    const tier = product.priceTiers.find(tier => 
      quantity >= tier.minQuantity && 
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    );
    
    const basePrice = tier ? tier.price : product.price;
    
    // Добавляем стоимость выбранных опций
    const optionsPrice = Object.values(selectedOptions).flat().reduce((total, optionId) => {
      const option = product.options.find(opt => opt.id === optionId);
      return total + (option ? option.price : 0);
    }, 0);
    
    return basePrice + optionsPrice;
  };

  // Функция для получения активного ценового уровня
  const getActivePriceTier = (quantity: number): PriceTier | null => {
    if (!product || !product.priceTiers.length) return null;
    
    return product.priceTiers.find(tier => 
      quantity >= tier.minQuantity && 
      (tier.maxQuantity === null || quantity <= tier.maxQuantity)
    ) || null;
  };

  // Функция для получения опций по категории
  const getOptionsByCategory = (category: string): ProductOption[] => {
    if (!product) return [];
    return product.options.filter(opt => opt.category === category && opt.isActive);
  };

  // Функция для подсчета стоимости опций в категории
  const getCategoryPrice = (category: string): number => {
    const selectedIds = selectedOptions[category] || [];
    return selectedIds.reduce((total, optionId) => {
      const option = product?.options.find(opt => opt.id === optionId);
      return total + (option ? option.price : 0);
    }, 0);
  };

  // Функция для подсчета общей цены с опциями
  const getTotalPriceWithOptions = (): number => {
    const basePrice = getPriceForQuantity(quantity);
    return basePrice;
  };

  // Функция для обработки выбора опции
  const handleOptionSelect = (category: string, optionId: string) => {
    setSelectedOptions(prev => {
      const currentOptions = prev[category] || [];
      const isSelected = currentOptions.includes(optionId);
      const selectedOption = product?.options.find(opt => opt.id === optionId);
      
      if (!selectedOption) return prev;
      
      // Для цвета и дизайна - только один выбор
      if (category === 'color' || category === 'design') {
        if (isSelected) {
          // Убираем выбор (разрешаем снять выбор)
          return {
            ...prev,
            [category]: []
          };
        } else {
          // Заменяем предыдущий выбор новым
          return {
            ...prev,
            [category]: [optionId]
          };
        }
      }
      
      // Для остальных категорий - множественный выбор с логикой бесплатных/платных
      if (isSelected) {
        // Убираем выбранную опцию
        return {
          ...prev,
          [category]: currentOptions.filter(id => id !== optionId)
        };
      } else {
        // Добавляем новую опцию
        const isFreeOption = selectedOption.price === 0;
        const hasPayedOptions = currentOptions.some(id => {
          const option = product?.options.find(opt => opt.id === id);
          return option && option.price > 0;
        });
        const hasFreeOptions = currentOptions.some(id => {
          const option = product?.options.find(opt => opt.id === id);
          return option && option.price === 0;
        });
        
        if (isFreeOption) {
          // Если выбираем бесплатную опцию и есть платные - убираем все платные
          if (hasPayedOptions) {
            const freeOptions = currentOptions.filter(id => {
              const option = product?.options.find(opt => opt.id === id);
              return option && option.price === 0;
            });
            return {
              ...prev,
              [category]: [...freeOptions, optionId]
            };
          } else {
            // Просто добавляем к существующим бесплатным
            return {
              ...prev,
              [category]: [...currentOptions, optionId]
            };
          }
        } else {
          // Если выбираем платную опцию и есть бесплатные - убираем все бесплатные
          if (hasFreeOptions) {
            const payedOptions = currentOptions.filter(id => {
              const option = product?.options.find(opt => opt.id === id);
              return option && option.price > 0;
            });
            return {
              ...prev,
              [category]: [...payedOptions, optionId]
            };
          } else {
            // Просто добавляем к существующим платным
            return {
              ...prev,
              [category]: [...currentOptions, optionId]
            };
          }
        }
      }
    });
  };

  const currentPrice = getPriceForQuantity(quantity);
  const activeTier = getActivePriceTier(quantity);

  // Маппинг размерных сеток для товаров
  const getSizeChartImage = (slug: string): string | null => {
    const sizeChartMap: {[key: string]: string | null} = {
      't-shirt': '/products/t-shirt/R_t-shirt (OS) TL.png',
      'longsleeve': '/products/t-shirt/R_t-shirt (OS) TL.png', // Используем размерную сетку футболки
      'sweatshirt': '/products/sweatshirt/R_sweatshirt (K) TL.png',
      'hoodies': '/products/hoodies/R_hoodie (K) TL.png',
      'halfzip': '/products/halfzip/R_halfzip (K) TL.png',
      'zip-hoodie': '/products/zip-hoodie/R_zip_hoodie (K) TL.png',
      'pants': '/products/pants/R_Pants TL.png',
      'shorts': '/products/shorts/R_shorts TL.png',
      'jeans': '/products/pants/R_Pants TL.png', // Используем размерную сетку штанов
      'shopper': null // Для сумки размерная сетка не нужна
    };
    
    return sizeChartMap[slug] || null;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch('/api/products');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.products) {
          const foundProduct = data.products.find((p: Product) => p.slug === params.slug);
          setProduct(foundProduct || null);
        }
      } catch (error) {
        console.error('Ошибка при загрузке товара:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.slug) {
      fetchProduct();
    }
  }, [params.slug]);

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    setQuantity(prev => prev > 10 ? prev - 1 : 10); // Минимум 10 штук
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
          <p className="text-gray-600 mt-4">Загружаем товар...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Товар не найден</h1>
          <Link 
            href="/catalog"
            className="px-4 py-2 bg-[#303030] text-white rounded-lg hover:bg-[#404040] transition-colors"
          >
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const currentImage = product.images.length > 0 ? product.images[currentImageIndex] : '';

  return (
    <div className="min-h-screen bg-white">
      {/* Хэдер */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">

          {/* Кнопка назад */}
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors -ml-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          {/* Логотип-ссылка на каталог */}
          <Link href="/catalog" title="Вернуться в каталог">
            <Image
              src="/TLlogo.svg"
              alt="TL Logo"
              width={88}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>

          {/* Кнопка корзины */}
          <button
            onClick={() => router.push('/cart')}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors relative -mr-1"
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
                    <div className="text-xs text-gray-600 mt-0.5">📊 Выберите необходимое количество товара</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      <div className="max-w-md mx-auto p-4">
        {/* 1. Фото товара (touch слайдер) */}
        <div className="bg-white rounded-lg overflow-hidden mb-6">
          <div 
            className="relative aspect-square bg-white cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {!imageError && product.images.length > 0 ? (
              <div 
                className={`flex h-full ${isDragging ? '' : 'transition-transform duration-300'} ease-out`}
                style={{ 
                  transform: `translateX(calc(-${currentImageIndex * (100 / product.images.length)}% + ${dragOffset}px))`,
                  width: `${product.images.length * 100}%`
                }}
              >
                {product.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="flex-shrink-0 h-full relative"
                    style={{ width: `${100 / product.images.length}%` }}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - изображение ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                      sizes="(max-width: 768px) 100vw, 400px"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Фото скоро</p>
                </div>
              </div>
            )}
                
            {/* Пагинация с овальной активной точкой */}
            {product.images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex 
                        ? 'w-6 bg-white shadow-md' 
                        : 'w-2 bg-white/50'
                    }`}
                    aria-label={`Перейти к изображению ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 2. Название товара */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[#303030]">
            {product.name}
          </h1>
        </div>

        {/* 3. Стоимость */}
        <div className="mb-6">
          <p className="text-3xl font-bold text-[#303030]">
            {currentPrice.toLocaleString('ru-RU')}₽
          </p>
          <p className="text-gray-500 text-sm mt-1">
            за единицу товара
            {activeTier && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {activeTier.minQuantity}-{activeTier.maxQuantity || '∞'} шт
              </span>
            )}
          </p>
        </div>

        {/* Ценовые уровни */}
        {product.priceTiers.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-[#303030] mb-4">
              Ценовые уровни
            </h3>
            <div className="flex flex-wrap gap-2">
              {product.priceTiers.map((tier, index) => (
                <button 
                  key={tier.id}
                  onClick={() => {
                    setQuantity(tier.minQuantity);
                  }}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeTier?.id === tier.id 
                      ? 'bg-gray-800 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>
                    {tier.minQuantity}-{tier.maxQuantity || '∞'} шт
                  </span>
                  <span className="text-xs opacity-75">•</span>
                  <span className="font-bold">
                    {tier.price.toLocaleString('ru-RU')}₽
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Количество заказа */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-[#303030]">Количество</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={decrementQuantity}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={quantity <= 10}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xl font-semibold text-[#303030] min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={incrementQuantity}
                className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#303030]">
                {(currentPrice * quantity).toLocaleString('ru-RU')}₽
              </p>
              <p className="text-sm text-gray-500">итого</p>
              {quantity > 1 && (
                <p className="text-xs text-gray-400">
                  {currentPrice.toLocaleString('ru-RU')}₽ × {quantity}
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-3">Минимальный заказ: 10 штук</p>
        </div>

        {/* Кнопка добавления в корзину */}
        <div className="mb-6">
          <button
            onClick={() => {
              addToCart();
              setShowCartModal(true);
            }}
            className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
          >
            В корзину
          </button>
        </div>

        {/* Описание товара */}
        {product.description && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="text-lg font-semibold text-[#303030] mb-4">
              Описание товара
            </h3>
            <div className="prose prose-sm max-w-none">
              <div 
                className="text-gray-700 leading-relaxed space-y-3"
                dangerouslySetInnerHTML={{
                  __html: product.description
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .split('\n')
                    .map(line => {
                      if (line.startsWith('• ')) {
                        return `<li>${line.substring(2)}</li>`;
                      }
                      return line;
                    })
                    .join('\n')
                    .replace(/(<li>.*<\/li>\n*)+/g, (match) => 
                      `<ul class="list-disc list-inside space-y-1 ml-2">${match}</ul>`
                    )
                    .replace(/\n\n/g, '</p><p class="mt-3">')
                    .replace(/^/, '<p>')
                    .replace(/$/, '</p>')
                }}
              />
            </div>
          </div>
        )}

        {/* Размерная сетка */}
        {getSizeChartImage(product.slug) && (
          <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
            <h3 className="text-base font-semibold text-[#303030] mb-3">
              Размерная сетка
            </h3>
            <div className="relative w-full">
              <Image
                src={getSizeChartImage(product.slug)!}
                alt={`Размерная сетка для ${product.name}`}
                width={400}
                height={300}
                className="w-full h-auto rounded-md"
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно подтверждения добавления в корзину */}
      {showCartModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCartModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Иконка успеха */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#303030] mb-2">
                Товар добавлен в корзину!
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {product.name}
              </p>
              <p className="text-sm text-gray-600 mb-1">
                Количество: {quantity} шт.
              </p>
              <p className="text-base font-semibold text-[#303030]">
                Итого: {(getTotalPriceWithOptions() * quantity).toLocaleString('ru-RU')}₽
              </p>
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowCartModal(false);
                  router.push('/cart');
                }}
                className="w-full py-3 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
              >
                Перейти в корзину
              </button>
              
              <button
                onClick={() => {
                  setShowCartModal(false);
                  router.push('/catalog');
                }}
                className="w-full py-3 bg-gray-100 text-[#303030] rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Продолжить покупки
              </button>
            </div>

            {/* Кнопка закрытия */}
            <button
              onClick={() => setShowCartModal(false)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Футер */}
      <Footer />
    </div>
  );
}
