'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Компонент для работы с URL параметрами
function WelcomePageContent() {
  const router = useRouter();
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [nextStep, setNextStep] = useState<number | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDesignType, setSelectedDesignType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productQuantities, setProductQuantities] = useState<{[key: string]: number}>({});
  const [hasBrandbook, setHasBrandbook] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [animationPhase, setAnimationPhase] = useState<'exit' | 'enter'>('exit');

  // Список доступных товаров из базы данных (без префикса "TL")
  const availableProducts = [
    { id: 't-shirt', name: 'Футболка', category: 'clothing' },
    { id: 'longsleeve', name: 'Лонгслив', category: 'clothing' },
    { id: 'sweatshirt', name: 'Свитшот', category: 'clothing' },
    { id: 'hoodies', name: 'Худи', category: 'clothing' },
    { id: 'halfzip', name: 'Халфзип', category: 'clothing' },
    { id: 'zip-hoodie', name: 'Зип худи', category: 'clothing' },
    { id: 'pants', name: 'Штаны', category: 'clothing' },
    { id: 'jeans', name: 'Джинсы', category: 'clothing' },
    { id: 'shorts', name: 'Шорты', category: 'clothing' },
    { id: 'shopper', name: 'Шоппер', category: 'accessories' },
  ];

  // Определяем этапы квиза в зависимости от выбранной услуги
  const getQuizSteps = () => {
    if (selectedService === 'production' && currentStep >= 8) {
      return [
        { id: 1, title: 'Товары', description: 'Выберите товары и количество' },
        { id: 2, title: 'Готово', description: 'Получить предложение' }
      ];
    }
    return [
      { id: 1, title: 'Услуга', description: 'Выберите услугу' },
      { id: 2, title: 'Детали', description: 'Укажите детали проекта' },
      { id: 3, title: 'Товары', description: 'Выберите товары и количество' },
      { id: 4, title: 'Настройки', description: 'Дополнительная информация' },
      { id: 5, title: 'Готово', description: 'Заявка готова' }
    ];
  };

  const quizSteps = getQuizSteps();

  // Функция для получения заголовка текущего шага
  const getCurrentStepTitle = () => {
    const stepNumber = getCurrentStepNumber();
    return quizSteps[stepNumber - 1]?.description || '';
  };

  // Функция для определения текущего этапа
  const getCurrentStepNumber = () => {
    if (currentStep === 1) return 1; // Выбор услуги
    if (currentStep === 2 || currentStep === 3) return 2; // Детали (тип дизайна или полный цикл)
    if (currentStep === 4) return 3; // Товары с тегами для дизайна
    if (currentStep === 5) return 4; // Брендбук и дополнительно
    if (currentStep === 6 || currentStep === 7) return 5; // Готово (дизайн)
    if (currentStep === 8) return 1; // Товары для производства (этап 1 из 2)
    if (currentStep === 9 || currentStep === 10) return 2; // Получить предложение/готово (этап 2 из 2)
    return 1;
  };

  // Компонент прогресса
  const ProgressSteps = () => {
    const currentStepNumber = getCurrentStepNumber();
    
    return (
      <div className="w-full">
        {/* Заголовок шага - выше прогресс-бара */}
        <div className="text-center mb-2 w-full">
          <h2 className="text-lg font-semibold text-gray-900">
            {getCurrentStepTitle()}
          </h2>
          <div className="text-xs text-gray-500 mt-1">
            Шаг {getCurrentStepNumber()} из {quizSteps.length}
          </div>
        </div>

        {/* Мобильная версия - центрированная полоса с точками */}
        <div className="flex items-center justify-center w-full">
          <div className="flex items-center">
            {quizSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Точка этапа */}
                <div className={`
                  relative flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300
                  ${currentStepNumber >= step.id 
                    ? 'bg-[#303030] text-white' 
                    : 'bg-gray-300 text-gray-500'
                  }
                `}>
                  {currentStepNumber > step.id ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-2 h-2 bg-current rounded-full"></div>
                  )}
                </div>
                
                {/* Линия между точками */}
                {index < quizSteps.length - 1 && (
                  <div className={`
                    w-8 h-0.5 mx-2 transition-all duration-300
                    ${currentStepNumber > step.id ? 'bg-[#303030]' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Функции для работы с товарами
  const toggleProduct = (productId: string) => {
    if (!selectedProducts.includes(productId)) {
      setSelectedProducts([...selectedProducts, productId]);
      setProductQuantities({ ...productQuantities, [productId]: 10 });
    }
    // Не удаляем товар при клике - только добавляем
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity >= 10) {
      setProductQuantities({ ...productQuantities, [productId]: quantity });
    }
  };

  const increaseQuantity = (productId: string) => {
    const currentQuantity = productQuantities[productId] || 10;
    setProductQuantities({ ...productQuantities, [productId]: currentQuantity + 1 });
  };

  const decreaseQuantity = (productId: string) => {
    const currentQuantity = productQuantities[productId] || 10;
    if (currentQuantity > 10) {
      setProductQuantities({ ...productQuantities, [productId]: currentQuantity - 1 });
    } else if (currentQuantity === 10) {
      // Если количество уже минимальное (10), удаляем товар из выбора
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
      const newQuantities = { ...productQuantities };
      delete newQuantities[productId];
      setProductQuantities(newQuantities);
    }
  };

  const animatedStepChange = (newStep: number) => {
    const direction = newStep > currentStep ? 'forward' : 'backward';
    setAnimationDirection(direction);
    setNextStep(newStep);
    setIsAnimating(true);
    setAnimationPhase('exit');
    
    // Фаза 1: Убираем текущий контент
    setTimeout(() => {
      setCurrentStep(newStep);
      setNextStep(null);
      setAnimationPhase('enter');
      
      // Фаза 2: Показываем новый контент с анимацией входа
      setTimeout(() => {
        setIsAnimating(false);
        setAnimationPhase('exit');
      }, 150);
    }, 300);
  };

  const getProductsByCategory = (category: string) => {
    if (category === 'everything') return availableProducts;
    return availableProducts.filter(product => product.category === category);
  };

  const handleProductsSelection = () => {
    if (selectedProducts.length > 0) {
      animatedStepChange(5); // Переходим к вопросу о брендбуке
    }
  };

  // Функция для генерации номера заказа - только на клиенте!
  const generateOrderNumber = () => {
    // Используем заглушку на сервере, чтобы избежать ошибок гидратации
    if (typeof window === 'undefined') {
      return 'TL-000000000'; // Плейсхолдер для сервера
    }
    
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TL-${timestamp.toString().slice(-6)}${random}`;
  };

  useEffect(() => {
    console.log('🚀 Инициализация HomePage');
    
    // Инициализация Telegram WebApp, если есть
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      console.log('🔄 Инициализация Telegram WebApp');
      try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        
        // Отключаем неподдерживаемые в версии 6.0 функции, чтобы избежать ошибок
        // Не используем:
        // - setBackgroundColor
        // - setHeaderColor
        // - enableClosingConfirmation
        // - disableSwipe
      } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
      }
    }
    
    // Проверяем URL параметры (только на клиенте)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const welcomeParam = urlParams.get('welcome');
      const forceWelcome = welcomeParam === 'true';
      
      // Проверяем, был ли пользователь ранее
      const hasVisited = localStorage.getItem('tl_has_visited');
      
      if (forceWelcome) {
        // Если есть параметр welcome=true, показываем приветственную страницу
        setShowWelcome(true);
        setIsReturningUser(false);
      } else if (hasVisited) {
        setIsReturningUser(true);
        // Для возвращающихся пользователей сразу перенаправляем в каталог
        setTimeout(() => {
          router.push('/catalog');
        }, 500);
      } else {
        // Первый визит - показываем приветственную страницу
        setShowWelcome(true);
      }
    }
  }, [router]);

  const handleServiceSelect = (service: string) => {
    setSelectedService(service);
    
    if (service === 'production') {
      // Переходим к выбору товаров для производства
      animatedStepChange(8); // Новый этап для выбора товаров производства
    } else if (service === 'design') {
      // Переходим ко второму шагу для выбора типа дизайна
      animatedStepChange(2);
    } else if (service === 'full-cycle') {
      // Переходим к информации о полном цикле
      animatedStepChange(3);
    }
  };

  const handleDesignSelect = (designType: string) => {
    setSelectedDesignType(designType);
    animatedStepChange(4); // Переходим к выбору категории товаров
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    // Очищаем предыдущий выбор товаров
    setSelectedProducts([]);
    setProductQuantities({});
    // Остаемся на том же шаге, но теперь показываем товары
  };

  const handleBrandbookSelect = (answer: string) => {
    setHasBrandbook(answer);
    animatedStepChange(6); // Переходим к финальной информации
  };

  const handleDesignFinish = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Генерируем номер заказа
      const newOrderNumber = generateOrderNumber();
      setOrderNumber(newOrderNumber);
      
      // Сохраняем все выборы пользователя
      localStorage.setItem('tl_has_visited', 'true');
      localStorage.setItem('tl_selected_service', 'design');
      localStorage.setItem('tl_design_type', selectedDesignType || '');
      localStorage.setItem('tl_design_category', selectedCategory || '');
      localStorage.setItem('tl_has_brandbook', hasBrandbook || '');
      localStorage.setItem('tl_order_number', newOrderNumber);
      
      // Подготавливаем данные для отправки в бот
      const orderData = {
        orderNumber: newOrderNumber,
        service: 'design',
        designType: selectedDesignType,
        category: selectedCategory,
        brandbook: hasBrandbook,
        timestamp: new Date().toISOString(),
        source: 'webapp'
      };
      
      // Отправляем данные в чат-бот
      await sendOrderToBot(orderData);
      
      // Показываем информацию о том, что заявка отправлена
      animatedStepChange(7);
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
      setSubmitError('Произошла ошибка при отправке заявки. Попробуйте ещё раз или свяжитесь с нами напрямую.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductionFinish = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Генерируем номер заказа
      const newOrderNumber = generateOrderNumber();
      setOrderNumber(newOrderNumber);
      
      // Сохраняем все выборы пользователя
      localStorage.setItem('tl_has_visited', 'true');
      localStorage.setItem('tl_selected_service', 'production');
      localStorage.setItem('tl_order_number', newOrderNumber);
      
      // Подготавливаем данные для отправки в бот
      const orderData = {
        orderNumber: newOrderNumber,
        service: 'production',
        products: selectedProducts,
        quantities: productQuantities,
        timestamp: new Date().toISOString(),
        source: 'webapp'
      };
      
      // Отправляем данные в чат-бот
      await sendProductionOrderToBot(orderData);
      
      // Показываем информацию о том, что заявка отправлена
      animatedStepChange(10);
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
      setSubmitError('Произошла ошибка при отправке заявки. Попробуйте ещё раз или свяжитесь с нами напрямую.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Функция для отправки данных в Telegram бот
  const sendOrderToBot = async (orderData: any) => {
    try {
      // Получаем данные о пользователе из Telegram WebApp
      let userInfo = null;
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        userInfo = window.Telegram.WebApp.initDataUnsafe.user;
      }

      const payload = {
        ...orderData,
        user: userInfo
      };

      // Отправляем POST запрос на API роут для обработки заказа
      const response = await fetch('/api/design-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки данных');
      }

      const result = await response.json();
      console.log('Заказ успешно отправлен в бот:', result);
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error);
      throw error;
    }
  };

  // Функция для отправки производственного заказа в Telegram бот
  const sendProductionOrderToBot = async (orderData: any) => {
    try {
      // Получаем данные о пользователе из Telegram WebApp
      let userInfo = null;
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
        userInfo = window.Telegram.WebApp.initDataUnsafe.user;
      }

      const payload = {
        ...orderData,
        user: userInfo
      };

      // Отправляем POST запрос на API роут для обработки заказа производства
      const response = await fetch('/api/production-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки данных');
      }

      const result = await response.json();
      console.log('Производственный заказ успешно отправлен в бот:', result);
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error);
      throw error;
    }
  };

  const handleFullCycleSelect = () => {
    localStorage.setItem('tl_has_visited', 'true');
    localStorage.setItem('tl_selected_service', 'full-cycle');
    router.push('/catalog');
  };

  // Показываем загрузку для возвращающихся пользователей (без параметра welcome)
  if (isReturningUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Загружаем каталог...</p>
        </div>
      </div>
    );
  }

  // Показываем приветственную страницу только если это первый визит или есть параметр welcome=true
  if (!showWelcome) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 quiz-container">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Image
              src="/TLlogo.svg"
              alt="Total Lookas"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Survey Content */}
      <div className="max-w-md mx-auto px-4 pt-10 pb-6 overflow-x-hidden">
        <div className={`
          transition-all duration-500 ease-in-out overflow-x-hidden
          ${!isAnimating 
            ? 'fade-active'
            : animationPhase === 'exit'
              ? 'fade-exit'
              : 'fade-enter'
          }
        `}>
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
          <div className="text-center mb-8 pb-2.5">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Йоу! Привет! 👋
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              Давайте создадим что-то крутое для вашего бренда
            </p>
            <p className="text-gray-500 text-base mb-8">
              Выберите услугу, которая вам нужна ↓
            </p>

            <div className="space-y-4">
              {/* Производство мерча */}
              <button
                onClick={() => handleServiceSelect('production')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/all_sheet.svg"
                      alt="Production"
                      width={24}
                      height={24}
                      className="w-6 h-6 text-gray-700"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Произвести мерч</h3>
                    <p className="text-sm text-gray-600">
                      У меня есть готовый дизайн, нужно только изготовить товары
                    </p>
                  </div>
                </div>
              </button>

              {/* Дизайн мерча */}
              <button
                onClick={() => handleServiceSelect('design')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/ph_t-shirt.svg"
                      alt="Design"
                      width={24}
                      height={24}
                      className="w-6 h-6 text-gray-700"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Нужен дизайн мерча</h3>
                    <p className="text-sm text-gray-600">
                      Создам уникальный дизайн для вашего бренда
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Разделитель */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200"></div>
              <span className="text-sm text-gray-500">или</span>
              <div className="flex-1 h-px bg-gray-200"></div>
            </div>

            {/* Просто посмотреть каталог */}
            <button
              onClick={() => {
                localStorage.setItem('tl_has_visited', 'true');
                // Очищаем все данные о выбранных услугах
                localStorage.removeItem('tl_selected_service');
                localStorage.removeItem('tl_design_type');
                localStorage.removeItem('tl_category');
                localStorage.removeItem('tl_has_brandbook');
                router.push('/catalog');
              }}
              className="w-full p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-100 transition-all duration-200 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-700 mb-1">Смотреть каталог</h3>
                  <p className="text-sm text-gray-500">
                    Я сам выберу товары и оформлю заказ
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Step 2: Design Type Selection */}
        {currentStep === 2 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            {/* Progress Steps */}
            <div className="w-full flex justify-center">
              <ProgressSteps />
            </div>

            <div className="space-y-4">
              {/* Дизайн одного изделия */}
              <button
                onClick={() => handleDesignSelect('single-item')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Image
                      src="/ph_t-shirt.svg"
                      alt="T-shirt icon"
                      width={24}
                      height={24}
                      className="w-6 h-6 text-gray-700"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Дизайн одного изделия</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Создание дизайна для одного товара (футболка, худи, шоппер и т.д.)
                    </p>
                    {/* <p className="text-lg font-bold text-gray-900">от 15 000 ₽</p> */}
                  </div>
                </div>
              </button>

              {/* Дизайн дропа/коллекции */}
              <button
                onClick={() => handleDesignSelect('collection')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Дизайн дропа/коллекции</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Создание целой коллекции товаров в едином стиле
                    </p>
                    {/* <p className="text-lg font-bold text-gray-900">от 50 000 ₽</p> */}
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Full Cycle Info */}
        {currentStep === 3 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>

            {/* Progress Steps */}
            <div className="w-full flex justify-center">
              <ProgressSteps />
            </div>
            
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Полный цикл создания мерча от идеи до готового товара.<br/>
              Мы создадим уникальный дизайн и произведем качественные товары для вашего бренда.
            </p>

            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Что включает:</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">Консультация и анализ бренда</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">Создание уникального дизайна</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">Подготовка макетов для печати</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">Производство и контроль качества</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-gray-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">Упаковка и доставка</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleFullCycleSelect}
              className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-900 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Начать проект
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Стоимость рассчитывается индивидуально
            </p>
          </div>
        )}

        {/* Step 4: Product Selection with Tags */}
        {currentStep === 4 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(2)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            {/* Progress Steps */}
            <div className="w-full flex justify-center">
              <ProgressSteps />
            </div>

            {/* Clothing Products */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Одежда</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getProductsByCategory('clothing').map(product => (
                  <div key={product.id} className="text-center">
                    <button
                      onClick={() => toggleProduct(product.name)}
                      className={`w-full h-20 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex flex-col items-center justify-center ${
                        selectedProducts.includes(product.name)
                          ? 'border-[#303030] bg-[#303030] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      {selectedProducts.includes(product.name) && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium min-w-[40px]">
                            {productQuantities[product.name] || 10} шт.
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessories Products */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Аксессуары</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getProductsByCategory('accessories').map(product => (
                  <div key={product.id} className="text-center">
                    <button
                      onClick={() => toggleProduct(product.name)}
                      className={`w-full h-20 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex flex-col items-center justify-center ${
                        selectedProducts.includes(product.name)
                          ? 'border-[#303030] bg-[#303030] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      {selectedProducts.includes(product.name) && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium min-w-[40px]">
                            {productQuantities[product.name] || 10} шт.
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            {selectedProducts.length > 0 && (
              <button
                onClick={() => animatedStepChange(5)}
                className="w-full bg-[#303030] text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Продолжить
              </button>
            )}
          </div>
        )}

        {/* Step 5: Brandbook Question */}
        {currentStep === 5 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(4)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            {/* Progress Steps */}
            <div className="w-full flex justify-center">
              <ProgressSteps />
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleBrandbookSelect('partial')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Частично</h3>
                    <p className="text-sm text-gray-600">
                      Есть логотип и базовые элементы, но нужна доработка
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleBrandbookSelect('no')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Нет, начинаем с нуля</h3>
                    <p className="text-sm text-gray-600">
                      Нужно создать фирменный стиль с нуля
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Design Brief Summary */}
        {currentStep === 6 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(5)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Теперь у нас есть вся необходимая информация для создания вашего дизайна
            </p>

            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Ваш заказ:</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Тип дизайна:</span>{' '}
                    {selectedDesignType === 'single-item' ? 'Дизайн одного изделия (от 15,000 ₽)' : 'Дизайн коллекции (от 50,000 ₽)'}
                  </p>
                </div>
                
                {selectedProducts.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-2">Выбранные товары:</p>
                    <div className="pl-4 space-y-1">
                      {selectedProducts.map((productName) => (
                        <p key={productName} className="text-sm text-gray-600">
                          • {productName} — {productQuantities[productName] || 10} шт.
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Брендбук:</span>{' '}
                    {hasBrandbook === 'yes' ? 'Есть готовый' : 
                     hasBrandbook === 'partial' ? 'Частично готов' : 'Создаём с нуля'}
                  </p>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-800">{submitError}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleDesignFinish}
              disabled={isSubmitting}
              className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Отправляем заявку...
                </>
              ) : (
                'Получить предложение'
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-4">
              Мы свяжемся с вами в течение часа
            </p>
          </div>
        )}

        {/* Step 7: Final Success */}
        {currentStep === 7 && (
          <div className="text-center mb-8 pb-2.5">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Ваша заявка на дизайн успешно обработана и отправлена нашей команде.
            </p>

            {/* Информация о заказе */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="font-semibold text-gray-900">Сообщение отправлено в чат-бот</h3>
              </div>
              
              {orderNumber && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">Номер вашего заказа:</p>
                  <p className="text-lg font-mono font-bold text-gray-900">{orderNumber}</p>
                </div>
              )}
              
              <div className="text-left space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Тип дизайна:</span>{' '}
                  {selectedDesignType === 'single-item' ? 'Дизайн одного изделия' : 'Дизайн коллекции'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Категория:</span>{' '}
                  {selectedCategory === 'clothing' ? 'Одежда' : 
                   selectedCategory === 'accessories' ? 'Аксессуары' : 'Все категории'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Брендбук:</span>{' '}
                  {hasBrandbook === 'yes' ? 'Есть готовый' : 
                   hasBrandbook === 'partial' ? 'Частично готов' : 'Создаём с нуля'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Что дальше:</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-gray-700">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Получение в чат-боте</p>
                    <p className="text-xs text-gray-600">Детали заказа уже отправлены нашей команде через Telegram бот</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-gray-700">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Обработка заявки</p>
                    <p className="text-xs text-gray-600">Менеджер обработает заявку и свяжется с вами в течение часа</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-gray-700">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Обсуждение деталей</p>
                    <p className="text-xs text-gray-600">Составим детальный бриф и обсудим стоимость проекта</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Очищаем все данные о выбранных услугах
                  localStorage.removeItem('tl_selected_service');
                  localStorage.removeItem('tl_design_type');
                  localStorage.removeItem('tl_category');
                  localStorage.removeItem('tl_has_brandbook');
                  router.push('/catalog');
                }}
                className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-900 transition-all duration-200"
              >
                Посмотреть каталог товаров
              </button>
              
              <button
                onClick={() => animatedStepChange(1)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Выбрать другую услугу
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Production Product Selection */}
        {currentStep === 8 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            {/* Progress Steps */}
            <div className="w-full flex justify-center">
              <ProgressSteps />
            </div>

            {/* Clothing Products */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Одежда</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getProductsByCategory('clothing').map(product => (
                  <div key={product.id} className="text-center">
                    <button
                      onClick={() => toggleProduct(product.name)}
                      className={`w-full h-20 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex flex-col items-center justify-center ${
                        selectedProducts.includes(product.name)
                          ? 'border-[#303030] bg-[#303030] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      {selectedProducts.includes(product.name) && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium min-w-[40px]">
                            {productQuantities[product.name] || 10} шт.
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Accessories Products */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-left">Аксессуары</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {getProductsByCategory('accessories').map(product => (
                  <div key={product.id} className="text-center">
                    <button
                      onClick={() => toggleProduct(product.name)}
                      className={`w-full h-20 p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium flex flex-col items-center justify-center ${
                        selectedProducts.includes(product.name)
                          ? 'border-[#303030] bg-[#303030] text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      {selectedProducts.includes(product.name) && (
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            −
                          </button>
                          <span className="text-sm font-medium min-w-[40px]">
                            {productQuantities[product.name] || 10} шт.
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQuantity(product.name);
                            }}
                            className="w-6 h-6 flex items-center justify-center bg-white text-[#303030] rounded border hover:bg-gray-100 text-sm font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            {selectedProducts.length > 0 && (
              <button
                onClick={() => animatedStepChange(9)}
                className="w-full bg-[#303030] text-white py-4 px-6 rounded-lg text-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Получить предложение
              </button>
            )}
          </div>
        )}

        {/* Step 9: Production Proposal */}
        {currentStep === 9 && (
          <div className="text-center mb-8 pb-2.5">
            <button
              onClick={() => animatedStepChange(8)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            {/* Progress Steps */}
            <div className="w-full flex justify-center">
              <ProgressSteps />
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-semibold text-gray-800 mb-3">Выбранные товары:</h4>
              <div className="space-y-2">
                {selectedProducts.map(product => (
                  <div key={product} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{product}</span>
                    <span className="font-medium text-gray-900">
                      {productQuantities[product] || 10} шт.
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 mt-3 pt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span>Общее количество:</span>
                  <span>
                    {Object.values(productQuantities).reduce((sum, qty) => sum + (qty || 10), 0)} шт.
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => animatedStepChange(8)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Изменить товары
              </button>
              
              <button
                onClick={handleProductionFinish}
                disabled={isSubmitting}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-[#303030] text-white hover:bg-black'
                }`}
              >
                {isSubmitting ? 'Отправляем...' : 'Отправить заявку'}
              </button>
            </div>

            {submitError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{submitError}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 10: Production Complete */}
        {currentStep === 10 && (
          <div className="text-center mb-8 pb-2.5">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg mb-6">
                Мы получили вашу заявку и подготовим коммерческое предложение в течение рабочего дня
              </p>
              
              {orderNumber && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-1">Номер заявки:</p>
                  <p className="text-lg font-bold text-gray-900">#{orderNumber}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push('/catalog')}
                className="w-full bg-[#303030] text-white py-3 px-6 rounded-lg font-medium hover:bg-black transition-all duration-200"
              >
                Посмотреть каталог товаров
              </button>
              
              <button
                onClick={() => animatedStepChange(1)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Выбрать другую услугу
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6">
        <p className="text-xs text-gray-400">
          Total Lookas B2B Platform
        </p>
      </div>
    </div>
  );
}

// Главный экспорт
export default function HomePage() {
  return <WelcomePageContent />;
}
