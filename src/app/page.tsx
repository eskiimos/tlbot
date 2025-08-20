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
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDesignType, setSelectedDesignType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hasBrandbook, setHasBrandbook] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Функция для генерации номера заказа
  const generateOrderNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TL-${timestamp.toString().slice(-6)}${random}`;
  };

  useEffect(() => {
    console.log('🚀 Инициализация HomePage');
    
    // Инициализация Telegram WebApp, если есть
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      console.log('🔄 Инициализация Telegram WebApp');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
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
      // Сразу переходим в каталог для производства
      localStorage.setItem('tl_has_visited', 'true');
      localStorage.setItem('tl_selected_service', 'production');
      router.push('/catalog');
    } else if (service === 'design') {
      // Переходим ко второму шагу для выбора типа дизайна
      setCurrentStep(2);
    } else if (service === 'full-cycle') {
      // Переходим к информации о полном цикле
      setCurrentStep(3);
    }
  };

  const handleDesignSelect = (designType: string) => {
    setSelectedDesignType(designType);
    setCurrentStep(4); // Переходим к выбору категории товаров
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentStep(5); // Переходим к вопросу о брендбуке
  };

  const handleBrandbookSelect = (answer: string) => {
    setHasBrandbook(answer);
    setCurrentStep(6); // Переходим к финальной информации
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
      setCurrentStep(7);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
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
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Йоу, привет!
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Выберите подходящую услугу для вашего бренда
            </p>

            <div className="space-y-4">
              {/* Производство мерча */}
              <button
                onClick={() => handleServiceSelect('production')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
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
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Нужен дизайн мерча</h3>
                    <p className="text-sm text-gray-600">
                      Создам уникальный дизайн для вашего бренда
                    </p>
                  </div>
                </div>
              </button>

              {/* Полный цикл */}
              <button
                onClick={() => handleServiceSelect('full-cycle')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Дизайн + производство</h3>
                    <p className="text-sm text-gray-600">
                      Полный цикл от идеи до готового товара
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Design Type Selection */}
        {currentStep === 2 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Какой дизайн нужен?
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Выберите масштаб дизайн-проекта
            </p>

            <div className="space-y-4">
              {/* Дизайн одного изделия */}
              <button
                onClick={() => handleDesignSelect('single-item')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Дизайн одного изделия</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Создание дизайна для одного товара (футболка, худи, кружка и т.д.)
                    </p>
                    <p className="text-lg font-bold text-gray-900">от 15 000 ₽</p>
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
                    <p className="text-lg font-bold text-gray-900">от 50 000 ₽</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Full Cycle Info */}
        {currentStep === 3 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setCurrentStep(1)}
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

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Дизайн + производство
            </h1>
            
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

        {/* Step 4: Category Selection for Design */}
        {currentStep === 4 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Какие товары интересуют?
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Выберите категорию для дизайна
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleCategorySelect('clothing')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Одежда</h3>
                    <p className="text-sm text-gray-600">
                      Футболки, худи, свитшоты, лонгсливы
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect('accessories')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Аксессуары</h3>
                    <p className="text-sm text-gray-600">
                      Кружки, шопперы, канцелярия, стикеры
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleCategorySelect('everything')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Все сразу</h3>
                    <p className="text-sm text-gray-600">
                      Комплексная линейка товаров
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Brandbook Question */}
        {currentStep === 5 && (
          <div className="text-center mb-8">
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Назад
            </button>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Есть ли готовый брендбук?
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Это поможет нам лучше понять ваш стиль
            </p>

            <div className="space-y-4">
              <button
                onClick={() => handleBrandbookSelect('yes')}
                className="w-full p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Да, есть брендбук</h3>
                    <p className="text-sm text-gray-600">
                      У нас есть готовые гайдлайны и фирменный стиль
                    </p>
                  </div>
                </div>
              </button>

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
          <div className="text-center mb-8">
            <button
              onClick={() => setCurrentStep(5)}
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

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Отлично! Составляем бриф
            </h1>
            
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              Теперь у нас есть вся необходимая информация для создания вашего дизайна
            </p>

            <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Ваш заказ:</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Тип дизайна:</span>{' '}
                  {selectedDesignType === 'single-item' ? 'Дизайн одного изделия (от 15,000 ₽)' : 'Дизайн коллекции (от 50,000 ₽)'}
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
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Заявка отправлена!
            </h1>
            
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
                onClick={() => router.push('/catalog')}
                className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:bg-gray-900 transition-all duration-200"
              >
                Посмотреть каталог товаров
              </button>
              
              <button
                onClick={() => setCurrentStep(1)}
                className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200"
              >
                Выбрать другую услугу
              </button>
            </div>
          </div>
        )}
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
