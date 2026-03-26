'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import UserDataForm from '@/components/UserDataForm';
import ProfileModal from '@/components/ProfileModal';
import Footer from '@/components/Footer';

interface CartItem {
  id: string;
  productName: string;
  productSlug: string;
  quantity: number;
  basePrice: number;
  selectedOptions: {[category: string]: string[]};
  optionsDetails: {
    id: string;
    name: string;
    category: string;
    price: number;
  }[];
  totalPrice: number;
  image?: string;
  detailedProposal?: boolean; // Требуется ли подробное КП для этой позиции
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

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletedItem, setDeletedItem] = useState<CartItem | null>(null);
  const [undoTimer, setUndoTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(10);
  const [showUserDataForm, setShowUserDataForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{type: 'success' | 'error' | 'test', message: string} | null>(null);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalStatus, setProposalStatus] = useState<'creating' | 'sending' | 'success' | 'error'>('creating');
  const [configExpanded, setConfigExpanded] = useState<{[id: string]: boolean}>({});
  // Track when cart has been loaded from localStorage to avoid wiping it on first render
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  
  // Состояние модального окна с ошибкой
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    logs: string[];
    timestamp: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    logs: [],
    timestamp: ''
  });

  // Данные о продуктах (для градации и опций)
  type PriceTier = { minQuantity: number; maxQuantity: number | null; price: number };
  type ProductOptionBrief = { id: string; category: string; name: string; price: number; isActive: boolean; description?: string };
  type ProductBrief = { slug: string; price: number; priceTiers: PriceTier[]; optionsByCategory: Record<string, ProductOptionBrief[]> };
  const [productsBySlug, setProductsBySlug] = useState<Record<string, ProductBrief>>({});

  // Состояние модалки опций
  const [optionsModal, setOptionsModal] = useState<{ itemId: string | null; category: 'design' | 'print' | 'label' | 'packaging' | null }>({ itemId: null, category: null });
  const [modalSelected, setModalSelected] = useState<string[]>([]);

  // Средняя фиксированная цена за принт
  const PRINT_FLAT_PRICE = 300;
  // Фиксированная цена за бирки
  const LABEL_FLAT_PRICE = 50;
  // Фиксированная цена за упаковку
  const PACKAGING_FLAT_PRICE = 50;

  // Блокируем скролл фона при открытой модалке
  const anyModalOpen = !!showUserDataForm || !!showProfileModal || (!!optionsModal.itemId && !!optionsModal.category) || errorModal.isOpen;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [anyModalOpen]);

  // Обработка клавиши ESC для закрытия модальных окон
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (errorModal.isOpen) {
          setErrorModal(prev => ({ ...prev, isOpen: false }));
        } else if (showUserDataForm) {
          setShowUserDataForm(false);
        } else if (showProfileModal) {
          setShowProfileModal(false);
        } else if (optionsModal.itemId && optionsModal.category) {
          setOptionsModal({ itemId: null, category: null });
        }
      }
    };

    if (anyModalOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [anyModalOpen, errorModal.isOpen, showUserDataForm, showProfileModal, optionsModal.itemId, optionsModal.category]);

  // Помощники расчётов и представления
  function getTierBasePrice(productSlug: string, quantity: number, fallbackBase: number): number {
    const key = (productSlug || '').toLowerCase();
    const product = productsBySlug[key];
    const tiers = (product?.priceTiers || []).slice().sort((a, b) => a.minQuantity - b.minQuantity);
    if (tiers.length === 0) return fallbackBase;
    // Сначала ищем подходящий диапазон
    for (const t of tiers) {
      const withinMax = t.maxQuantity === null || quantity <= t.maxQuantity;
      if (quantity >= t.minQuantity && withinMax) {
        return Number(t.price || 0);
      }
    }
    // Фоллбек — самый высокий tier, у которого minQuantity <= quantity
    const eligible = tiers.filter(t => quantity >= t.minQuantity);
    if (eligible.length > 0) {
      return Number(eligible[eligible.length - 1].price || 0);
    }
    // Иначе минимальная цена/база
    return Number(tiers[0].price || fallbackBase || 0);
  }

  function getOptionsByCategory(item: CartItem): Record<'design' | 'print' | 'label' | 'packaging', string[]> {
    const res: Record<'design' | 'print' | 'label' | 'packaging', string[]> = {
      design: [],
      print: [],
      label: [],
      packaging: []
    };
    for (const d of item.optionsDetails || []) {
      if (d.category === 'design' || d.category === 'print' || d.category === 'label' || d.category === 'packaging') {
        res[d.category].push(d.name);
      }
    }
    return res;
  }

  function getOptionsPrice(item: CartItem): number {
    // Если подробная конфигурация выключена — не учитываем опции в цене
    if (!item.detailedProposal) return 0;
    return (item.optionsDetails || [])
      .filter(d => d.category !== 'design')
      .reduce((sum, d) => sum + Number(d.price || 0), 0);
  }

  function computeUnitPrice(item: CartItem, quantity: number): number {
    const base = getTierBasePrice(item.productSlug, quantity, item.basePrice);
    const options = getOptionsPrice(item);
    return Number(base) + Number(options);
  }

  function computeLineTotal(item: CartItem, quantity: number): number {
    return computeUnitPrice(item, quantity) * quantity;
  }

  function getTotalItems(): number {
    return cartItems.reduce((sum, i) => sum + Number(i.quantity || 0), 0);
  }

  function getTotalAmount(): number {
    return cartItems.reduce((sum, i) => sum + computeLineTotal(i, i.quantity), 0);
  }

  // Настраиваем пустые значения для userData по умолчанию
  const defaultUserData = {
    telegramId: '123456789',
    firstName: '',
    lastName: '',
    username: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    inn: ''
  };

  // 1. Устанавливаем флаг, что компонент смонтирован
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Загружаем корзину и данные пользователя после монтирования
  useEffect(() => {
    if (!isMounted) return;

    // Загрузка корзины
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem('tlbot_cart');
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          setCartItems(cartData);
        }
      } catch (error) {
        console.error('Ошибка при загрузке корзины:', error);
      } finally {
        setIsLoading(false);
        // Mark cart as loaded (even if empty) to let dependent effects run safely
        setHasLoadedCart(true);
      }
    };
    loadCart();

    // Mock Telegram WebApp для разработки
    if (process.env.NODE_ENV === 'development') {
      (window as any).Telegram = {
        WebApp: {
          initDataUnsafe: {
            user: {
              id: 123456789,
              first_name: 'Тестовый',
              last_name: 'Пользователь',
              username: 'testuser',
              language_code: 'ru'
            }
          },
          initData: '',
          ready: () => console.log('Telegram WebApp ready'),
          expand: () => console.log('Telegram WebApp expanded'),
          close: () => console.log('Telegram WebApp closed'),
          MainButton: {
            text: '',
            color: '#229ED9',
            textColor: '#FFFFFF',
            isVisible: false,
            isActive: true,
            isProgressVisible: false,
            setText: () => {},
            onClick: () => {},
            offClick: () => {},
            show: () => {},
            hide: () => {},
            enable: () => {},
            disable: () => {},
            showProgress: () => {},
            hideProgress: () => {},
            setParams: () => {}
          },
          sendData: () => {}
        }
      } as any;
      console.log('🔧 Mock Telegram WebApp инициализирован для разработки');
    }
    loadUserData();
  }, [isMounted]);

  // Функция для показа модального окна с ошибкой и логами
  const showErrorModal = (title: string, message: string, logs: string[] = []) => {
    const timestamp = new Date().toLocaleString('ru-RU');
    setErrorModal({
      isOpen: true,
      title,
      message,
      logs,
      timestamp
    });
    
    // Логируем ошибку в консоль для отладки
    console.error(`❌ [${timestamp}] ${title}:`, message);
    if (logs.length > 0) {
      console.error('📋 Детальные логи:', logs);
    }
  };

  // Функция для загрузки данных пользователя
  const loadUserData = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Проверяем, доступен ли Telegram WebApp
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('🟢 Telegram пользователь найден:', tgUser);
        console.log('🆔 Telegram ID:', tgUser.id);
        setIsLoadingUserData(true);
        
        // Получаем данные пользователя из API
        const response = await fetch(`/api/users?telegramId=${tgUser.id}`);
        console.log('📡 API response status:', response.status);
        
        let completeUserData: UserData;
        
        if (response.ok) {
          const apiUserData = await response.json();
          console.log('✅ Данные из API:', apiUserData);
          
          // Формируем объект данных пользователя с данными из API
          completeUserData = {
            telegramId: tgUser.id.toString(),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            phoneNumber: apiUserData?.organization?.phone,
            email: apiUserData?.organization?.email,
            companyName: apiUserData?.organization?.contactName,
            inn: apiUserData?.organization?.inn
          };
        } else {
          console.log('❌ API вернул ошибку:', response.status, '- пользователь не найден в БД');
          console.log('📝 Создаем userData только с данными из Telegram');
          
          // Создаем базовые данные только из Telegram WebApp
          completeUserData = {
            telegramId: tgUser.id.toString(),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            phoneNumber: undefined,
            email: undefined,
            companyName: undefined,
            inn: undefined
          };
        }
        
        console.log('✅ Сформированные данные пользователя:', completeUserData);
        
        // Пытаемся объединить с сохраненными данными профиля
        try {
          const savedProfileData = localStorage.getItem('userProfileData');
          if (savedProfileData) {
            const profileData = JSON.parse(savedProfileData);
            console.log('📝 Найдены сохраненные данные профиля:', profileData);
            
            // Объединяем данные: Telegram данные приоритетнее, профиль дополняет
            completeUserData = {
              ...profileData, // Сначала данные профиля
              ...completeUserData, // Затем перезаписываем данными из Telegram
              // Но телефон, email, компанию и ИНН берем из профиля, если есть
              phoneNumber: profileData.phoneNumber || completeUserData.phoneNumber,
              email: profileData.email || completeUserData.email,
              companyName: profileData.companyName || completeUserData.companyName,
              inn: profileData.inn || completeUserData.inn
            };
            console.log('🔄 Объединенные данные:', completeUserData);
          }
        } catch (profileError) {
          console.error('❌ Ошибка объединения данных профиля:', profileError);
        }
        
        setUserData(completeUserData);
      } else {
        console.log('❌ Telegram WebApp недоступен, пробуем localStorage');
        // Fallback - пытаемся загрузить из localStorage или профиля
        const savedData = localStorage.getItem('tlbot_user_data');
        const savedProfileData = localStorage.getItem('userProfileData');
        
        let fallbackUserData: UserData | null = null;
        
        if (savedData) {
          console.log('Данные найдены в tlbot_user_data:', savedData);
          fallbackUserData = JSON.parse(savedData);
        }
        
        if (savedProfileData) {
          console.log('Данные найдены в userProfileData:', savedProfileData);
          const profileData = JSON.parse(savedProfileData);
          
          if (fallbackUserData) {
            // Объединяем данные
            fallbackUserData = { ...fallbackUserData, ...profileData };
          } else {
            fallbackUserData = profileData;
          }
        }
        
        if (fallbackUserData) {
          console.log('📋 Итоговые fallback данные:', fallbackUserData);
          setUserData(fallbackUserData);
        } else {
          console.log('Данные пользователя не найдены нигде');
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleSendProposal = async () => {
    // Пытаемся загрузить сохраненные данные профиля
    if (typeof window !== 'undefined') {
      try {
        const savedProfileData = localStorage.getItem('userProfileData');
        if (savedProfileData) {
          const profileData = JSON.parse(savedProfileData);
          console.log("Найдены сохраненные данные профиля:", profileData);
          
          // Объединяем данные профиля с данными из Telegram (если есть)
          const mergedData = {
            ...profileData,
            telegramId: userData?.telegramId || profileData.telegramId,
            username: userData?.username || profileData.username
          };
          
          setUserData(mergedData);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных профиля:", error);
      }
    }
    
    // Всегда показываем форму для подтверждения данных (особенно телефона)
    console.log("Показываем форму для ввода/подтверждения данных пользователя");
    setShowUserDataForm(true);
  };

  const handleSendProposalHTML = async (userDataToUse: UserData | null) => {
    console.log("Начинаем отправку HTML КП с данными:", userDataToUse);
    
    // Проверяем наличие данных пользователя
    if (!userDataToUse?.telegramId) {
      console.error("Ошибка: данные пользователя отсутствуют");
      setProposalStatus('error');
      setSendResult({
        type: 'error', 
        message: '❌ Не удалось определить получателя. Пожалуйста, откройте мини-приложение через Telegram бот.'
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);
    setProposalStatus('creating');
    
    try {
      // Добавляем задержку для демонстрации процесса создания
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setProposalStatus('sending');
      
      // Отправляем данные через Telegram WebApp, если он доступен
      if (window.Telegram?.WebApp?.sendData) {
        try {
          console.log('📱 Отправляем данные через Telegram WebApp');
          window.Telegram.WebApp.sendData(JSON.stringify({
            type: 'commercial_proposal_html',
            cartItems,
            userData: userDataToUse
          }));
          console.log('✅ Данные отправлены в Telegram бот');
        } catch (telegramError) {
          console.error('❌ Ошибка отправки через Telegram WebApp:', telegramError);
        }
      } else {
        console.log('⚠️ Telegram WebApp.sendData недоступен, используем только API');
      }
      
      console.log("Отправка КП на сервер, telegramId:", userDataToUse.telegramId);
      
      // Формируем данные для отправки
      const formData = new FormData();
      formData.append('telegramId', userDataToUse.telegramId || '');
      
      // Добавляем данные заказа
      const orderData = {
        userId: userDataToUse.telegramId,
        customerName: `${userDataToUse.firstName || ''} ${userDataToUse.lastName || ''}`.trim() || 'Не указано',
        customerEmail: userDataToUse.email || '',
        customerPhone: userDataToUse.phoneNumber || '',
        customerUsername: userDataToUse.username || '',
        customerCompany: userDataToUse.companyName || '',
        customerInn: userDataToUse.inn || '',
        items: cartItems,
        totalAmount: getTotalAmount()
      };
      
      formData.append('orderData', JSON.stringify(orderData));
      
      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData
      });

      console.log("Ответ сервера:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Результат запроса:", result);
        
        setProposalStatus('success');
        
        // Показываем успех в течение 2 секунд, затем закрываем модальное окно
        setTimeout(() => {
          setShowProposalModal(false);
          setProposalStatus('creating');
        }, 2000);
        
        setSendResult({
          type: 'success', 
          message: '✅ Коммерческое предложение успешно отправлено в ваш Telegram!'
        });
      } else {
        let errorMessage = 'Неизвестная ошибка';
        let detailedLogs: string[] = [];
        
        // Сначала получаем текст ответа
        const responseText = await response.text();
        console.error("Ответ сервера (текст):", responseText);
        
        try {
          // Пытаемся парсить как JSON
          const errorData = JSON.parse(responseText);
          console.error("Детальная ошибка API:", errorData);
          errorMessage = errorData.details || errorData.error || 'Ошибка сервера';
          
          // Собираем детальные логи для модального окна
          detailedLogs = [
            `Статус ответа: ${response.status}`,
            `URL: /api/proposals`,
            `Время: ${new Date().toLocaleString('ru-RU')}`,
            `Telegram ID: ${userDataToUse.telegramId}`,
            `Количество товаров: ${cartItems.length}`,
            `Ошибка API: ${errorData.error || 'Не указана'}`,
            `Детали: ${errorData.details || 'Не указаны'}`
          ];
          
          // Специальная обработка ошибки "чат не найден"
          if (errorData.error === 'Чат с ботом не найден') {
            errorMessage = '🤖 Сначала напишите боту /start в Telegram, а затем попробуйте снова';
          }
        } catch (parseError) {
          console.error("Не удалось разобрать JSON ответ с ошибкой:", parseError);
          console.error("Сырой ответ:", responseText);
          
          // Если не JSON, используем сырой текст
          errorMessage = responseText || `HTTP ${response.status} ошибка`;
          detailedLogs = [
            `Статус ответа: ${response.status}`,
            `URL: /api/proposals`,
            `Время: ${new Date().toLocaleString('ru-RU')}`,
            `Telegram ID: ${userDataToUse.telegramId}`,
            `Количество товаров: ${cartItems.length}`,
            `Сырой ответ: ${responseText}`,
            `Ошибка парсинга: ${parseError}`
          ];
        }
        
        // Показываем модальное окно с ошибкой
        showErrorModal(
          'Ошибка отправки КП',
          errorMessage,
          detailedLogs
        );
        setProposalStatus('error');
        setSendResult({type: 'error', message: `Ошибка при отправке: ${errorMessage}`});
      }
    } catch (error) {
      console.error('❌ Критическая ошибка при отправке HTML КП:', error);
      
      const detailedLogs = [
        `Время: ${new Date().toLocaleString('ru-RU')}`,
        `Telegram ID: ${userDataToUse?.telegramId || 'undefined'}`,
        `Количество товаров: ${cartItems.length}`,
        `Стек ошибки: ${error instanceof Error ? error.stack : 'Недоступен'}`,
        `Сообщение ошибки: ${error instanceof Error ? error.message : String(error)}`
      ];
      
      showErrorModal(
        'Критическая ошибка',
        'Произошла неожиданная ошибка при отправке КП',
        detailedLogs
      );
      
      setProposalStatus('error');
      setSendResult({type: 'error', message: 'Произошла неожиданная ошибка. Попробуйте еще раз.'});
    } finally {
      setIsSending(false);
    }
  };

  const handleSendProposalWithData = async (userDataToUse: UserData | null) => {
    // Показываем модальное окно и начинаем процесс
    setShowProposalModal(true);
    setProposalStatus('creating');
    
    // Добавляем небольшую задержку для показа анимации
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Для локального тестирования создаем тестовые данные если их нет
    if (!userDataToUse?.telegramId) {
      console.log("Данные пользователя отсутствуют, создаем тестовые данные для локального тестирования");
      userDataToUse = {
        telegramId: '123456789', // Тестовый ID для локальной разработки
        username: 'test_user',
        firstName: 'Тест',
        lastName: 'Пользователь',
        phoneNumber: '+7 (900) 123-45-67',
        email: 'test@example.com',
        companyName: 'Тестовая компания',
        inn: '1234567890'
      };
      console.log("Созданы тестовые данные:", userDataToUse);
    }

    console.log("Начинаем отправку КП в Telegram с данными:", userDataToUse);
    setIsSending(true);
    setSendResult(null);
    
    try {
      // Формируем данные для отправки
      const formData = new FormData();
      formData.append('telegramId', userDataToUse.telegramId || '');
      
      // Добавляем данные заказа
      const orderData = {
        userId: userDataToUse.telegramId,
        customerName: `${userDataToUse.firstName || ''} ${userDataToUse.lastName || ''}`.trim() || 'Не указано',
        customerEmail: userDataToUse.email || '',
        customerPhone: userDataToUse.phoneNumber || '',
        customerUsername: userDataToUse.username || '',
        customerCompany: userDataToUse.companyName || '',
        customerInn: userDataToUse.inn || '',
        items: cartItems,
        totalAmount: getTotalAmount() * 100 // Конвертируем в копейки
      };
      
      console.log('📦 Данные заказа для отправки:', orderData);
      formData.append('orderData', JSON.stringify(orderData));
      
      // Отправляем данные через Telegram WebApp, если он доступен
      if (window.Telegram?.WebApp?.sendData) {
        try {
          console.log('📱 Отправляем данные через Telegram WebApp');
          // Отправляем только основные данные заказа без PDF
          window.Telegram.WebApp.sendData(JSON.stringify({
            type: 'commercial_proposal',
            orderData
          }));
          console.log('✅ Данные отправлены в Telegram бот');
        } catch (telegramError) {
          console.error('❌ Ошибка отправки через Telegram WebApp:', telegramError);
        }
      } else {
        console.log('⚠️ Telegram WebApp.sendData недоступен, используем только API');
      }
      
      console.log("Отправка на сервер, telegramId:", userDataToUse.telegramId);
      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData,
      });

      console.log("Ответ сервера:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Результат запроса:", result);
        
        setProposalStatus('success');
        
        // Показываем успех в течение 2 секунд, затем закрываем модальное окно
        setTimeout(() => {
          setShowProposalModal(false);
          setProposalStatus('creating');
        }, 2000);
        
        if (result.mode === 'development') {
          setSendResult({
            type: 'test', 
            message: '🧪 Коммерческое предложение создано! (Тестовый режим - отправка в Telegram пропущена)'
          });
        } else {
          setSendResult({
            type: 'success', 
            message: '✅ Коммерческое предложение успешно отправлено в ваш Telegram!'
          });
        }
      } else {
        let errorMessage = 'Неизвестная ошибка';
        let detailedLogs: string[] = [];
        
        // Сначала получаем текст ответа
        const responseText = await response.text();
        console.error("Ответ сервера (текст):", responseText);
        
        try {
          // Пытаемся парсить как JSON
          const errorData = JSON.parse(responseText);
          console.error("Детальная ошибка API:", errorData);
          errorMessage = errorData.details || errorData.error || 'Ошибка сервера';
          
          // Собираем детальные логи для модального окна
          detailedLogs = [
            `Статус ответа: ${response.status}`,
            `URL: /api/proposals`,
            `Время: ${new Date().toLocaleString('ru-RU')}`,
            `Telegram ID: ${userDataToUse.telegramId}`,
            `Размер файла: N/A байт`,
            `Ошибка API: ${errorData.error || 'Не указана'}`,
            `Детали: ${errorData.details || 'Не указаны'}`
          ];
          
          // Добавляем диагностику, если есть
          if (errorData.diagnostics) {
            console.error("Диагностика:", errorData.diagnostics);
            detailedLogs.push(`Диагностика: ${JSON.stringify(errorData.diagnostics, null, 2)}`);
          }
          
          // Специальная обработка ошибки "чат не найден"
          if (errorData.error === 'Чат с ботом не найден') {
            errorMessage = '🤖 Сначала напишите боту /start в Telegram, а затем попробуйте снова';
          }
        } catch (parseError) {
          console.error("Не удалось разобрать JSON ответ с ошибкой:", parseError);
          console.error("Сырой ответ:", responseText);
          
          // Если не JSON, используем сырой текст
          errorMessage = responseText || `HTTP ${response.status} ошибка`;
          detailedLogs = [
            `Статус ответа: ${response.status}`,
            `URL: /api/proposals`,
            `Время: ${new Date().toLocaleString('ru-RU')}`,
            `Telegram ID: ${userDataToUse.telegramId}`,
            `Размер файла: N/A байт`,
            `Сырой ответ: ${responseText}`,
            `Ошибка парсинга: ${parseError}`
          ];
        }
        
        // Показываем модальное окно с ошибкой
        showErrorModal(
          'Ошибка отправки КП',
          errorMessage,
          detailedLogs
        );
        setProposalStatus('error');
        setSendResult({type: 'error', message: `Ошибка при отправке: ${errorMessage}`});
      }
    } catch (error) {
      console.error("Ошибка при отправке КП:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Собираем логи для модального окна
      const errorLogs = [
        `Время: ${new Date().toLocaleString('ru-RU')}`,
        `Тип ошибки: ${error instanceof Error ? error.constructor.name : typeof error}`,
        `Сообщение: ${errorMessage}`,
        `Stack: ${error instanceof Error ? error.stack || 'Не доступен' : 'Не доступен'}`,
        `Пользователь: ${userDataToUse.firstName} ${userDataToUse.lastName}`,
        `Telegram ID: ${userDataToUse.telegramId}`,
        `Количество товаров в корзине: ${cartItems.length}`,
        `Общая сумма: ${getTotalAmount()} ₽`
      ];
      
      // Показываем модальное окно с ошибкой
      showErrorModal(
        'Критическая ошибка при отправке КП',
        `Произошла непредвиденная ошибка: ${errorMessage}`,
        errorLogs
      );
      
      setProposalStatus('error');
      setSendResult({type: 'error', message: `Произошла ошибка при отправке: ${errorMessage}`});
    } finally {
      setIsSending(false);
    }
  };

  // Создание и скачивание КП локально (больше не используется)
  const handleCreateCommercialOffer = async () => {
    try {
      setIsGeneratingPDF(true);
      // Функция отключена, так как мы больше не используем PDF
      setSendResult({type: 'error', message: 'PDF генерация отключена. Используйте отправку через Telegram.'});
    } catch (e) {
      console.error('Не удалось создать/скачать PDF', e);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Сабмит формы пользователя и отправка КП
  const handleFormSubmit = async (data: UserData) => {
    try {
      setUserData(data);
      setShowUserDataForm(false);
      await handleSendProposalWithData(data);
    } catch (e) {
      console.error('Ошибка отправки с данными пользователя', e);
    }
  };

  // Обработчик сохранения данных профиля
  const handleProfileSave = (data: UserData) => {
    setUserData(data);
    console.log('Данные профиля сохранены:', data);
  };

  // Таймер для отмены удаления
  useEffect(() => {
    if (undoTimer) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Время истекло - окончательно удаляем товар
            setDeletedItem(null);
            setUndoTimer(null);
            clearInterval(timer);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [undoTimer]);

  // Функция для удаления товара из корзины с возможностью отмены
  const removeFromCart = (itemId: string) => {
    const itemToDelete = cartItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    // Убираем товар из отображения
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));

    // Сохраняем удаленный товар для возможности восстановления
    setDeletedItem(itemToDelete);
    setTimeLeft(10);
    setUndoTimer(Date.now());
  };

  // Функция для восстановления удаленного товара
  const undoDelete = () => {
    if (deletedItem) {
      const updatedCart = [...cartItems, deletedItem];
      setCartItems(updatedCart);
      localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));
      
      // Сбрасываем состояние отмены
      setDeletedItem(null);
      setUndoTimer(null);
      setTimeLeft(10);
    }
  };

  // Функция для изменения количества товара
  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 10) return;

    const updatedCart = cartItems.map(item => {
      if (item.id === itemId) {
        const newTotal = computeLineTotal(item, newQuantity);
        return { ...item, quantity: newQuantity, totalPrice: newTotal };
      }
      return item;
    });

    setCartItems(updatedCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));
  };

  // Загружаем продукты для доступа к priceTiers и опциям
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?t=${Date.now()}`, { cache: 'no-store' as RequestCache });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success && Array.isArray(data.products)) {
          const map: Record<string, ProductBrief> = {};
          data.products.forEach((p: any) => {
            const key = (p.slug || '').toString().toLowerCase();
            const optionsByCategory: Record<string, ProductOptionBrief[]> = {};
            (p.options || []).forEach((opt: any) => {
              if (!optionsByCategory[opt.category]) optionsByCategory[opt.category] = [];
              optionsByCategory[opt.category].push({
                id: String(opt.id),
                category: opt.category,
                name: opt.name,
                price: Number(opt.price || 0),
                isActive: !!opt.isActive,
                description: opt.description || ''
              });
            });
            map[key] = { slug: key, price: p.price, priceTiers: p.priceTiers || [], optionsByCategory };
          });
          setProductsBySlug(map);
        }
      } catch (e) {
        console.warn('Не удалось загрузить продукты для корзины', e);
      }
    };
    fetchProducts();
  }, []);

  const openOptionsModal = (itemId: string, category: 'design' | 'print' | 'label' | 'packaging') => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;
    const current = item.selectedOptions?.[category] || [];
    setModalSelected(current);
    setOptionsModal({ itemId, category });
  };

  const closeOptionsModal = () => {
    setOptionsModal({ itemId: null, category: null });
    setModalSelected([]);
  };

  const toggleModalOption = (optionId: string) => {
    if (!optionsModal.category) return;
    setModalSelected(prev => {
      // Все категории теперь поддерживают множественный выбор
      return prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId];
    });
  };

  const saveModalOptions = () => {
    const { itemId, category } = optionsModal;
    if (!itemId || !category) return;
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const slugKey = (item.productSlug || '').toLowerCase();
    const prod = productsBySlug[slugKey];
    const opts = (prod?.optionsByCategory?.[category] || []) as ProductOptionBrief[];

    const selectedDetails = modalSelected.map(id => {
      const found = opts.find(o => o.id === id);
      return found ? { id: found.id, name: found.name, category: found.category, price: found.price } : null;
    }).filter(Boolean) as { id: string; name: string; category: string; price: number }[];

    const updatedItem: CartItem = {
      ...item,
      selectedOptions: { ...item.selectedOptions, [category]: modalSelected },
      optionsDetails: [
        // оставляем другие категории как есть
        ...item.optionsDetails.filter(o => o.category !== category),
        // добавляем выбранные из модалки
        ...selectedDetails
      ]
    };

    const newTotal = computeLineTotal(updatedItem, updatedItem.quantity);
    updatedItem.totalPrice = newTotal;

    const newCart = cartItems.map(ci => ci.id === updatedItem.id ? updatedItem : ci);
    setCartItems(newCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(newCart));
    closeOptionsModal();
  };

  // Переключатель плоской опции принта (+300₽ за единицу)
  const togglePrint = (itemId: string, enable: boolean) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const updatedDetails = (item.optionsDetails || []).filter(o => o.category !== 'print');
    if (enable) {
      updatedDetails.push({ id: 'print-flat', name: 'Принт', category: 'print', price: PRINT_FLAT_PRICE });
    }

    const updatedItem: CartItem = {
      ...item,
      selectedOptions: { ...item.selectedOptions, print: enable ? ['print-flat'] : [] },
      optionsDetails: updatedDetails
    };
    updatedItem.totalPrice = computeLineTotal(updatedItem, updatedItem.quantity);

    const newCart = cartItems.map(ci => ci.id === itemId ? updatedItem : ci);
    setCartItems(newCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(newCart));
  };

  // Переключатель плоской опции бирок (+50₽ за единицу)
  const toggleLabel = (itemId: string, enable: boolean) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const updatedDetails = (item.optionsDetails || []).filter(o => o.category !== 'label');
    if (enable) {
      updatedDetails.push({ id: 'label-flat', name: 'Бирки', category: 'label', price: LABEL_FLAT_PRICE });
    }

    const updatedItem: CartItem = {
      ...item,
      selectedOptions: { ...item.selectedOptions, label: enable ? ['label-flat'] : [] },
      optionsDetails: updatedDetails
    };
    updatedItem.totalPrice = computeLineTotal(updatedItem, updatedItem.quantity);

    const newCart = cartItems.map(ci => ci.id === itemId ? updatedItem : ci);
    setCartItems(newCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(newCart));
  };

  // Переключатель плоской опции упаковки (+50₽ за единицу)
  const togglePackaging = (itemId: string, enable: boolean) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const updatedDetails = (item.optionsDetails || []).filter(o => o.category !== 'packaging');
    if (enable) {
      updatedDetails.push({ id: 'packaging-flat', name: 'Упаковка', category: 'packaging', price: PACKAGING_FLAT_PRICE });
    }

    const updatedItem: CartItem = {
      ...item,
      selectedOptions: { ...item.selectedOptions, packaging: enable ? ['packaging-flat'] : [] },
      optionsDetails: updatedDetails
    };
    updatedItem.totalPrice = computeLineTotal(updatedItem, updatedItem.quantity);

    const newCart = cartItems.map(ci => ci.id === itemId ? updatedItem : ci);
    setCartItems(newCart);
    localStorage.setItem('tlbot_cart', JSON.stringify(newCart));
  };

  // Пересчитываем totalPrice у товаров при переключении подробной конфигурации
  // Guard to avoid clearing cart in localStorage on first mount before it loads
  useEffect(() => {
    if (!hasLoadedCart) return;
    setCartItems(prev => {
      const updated = prev.map(item => ({
        ...item,
        totalPrice: computeLineTotal(item, item.quantity)
      }));
      try { localStorage.setItem('tlbot_cart', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, [configExpanded, hasLoadedCart]);

  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
          <p className="text-gray-600 mt-4">Загружаем корзину...</p>
        </div>
      </div>
    );
  }

  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* PDF generation is deprecated — no hidden renderer */}

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

          {/* Заголовок */}
          <span className="text-[15px] font-semibold tracking-tight text-[#303030]">Корзина</span>

          {/* Кнопка профиля */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 active:bg-black/10 transition-colors -mr-1"
            title="Профиль"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#303030" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4"/>
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </button>

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
                    <div className="text-xs text-gray-600 mt-0.5">🛒 Настройте опции и отправьте КП</div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        
        if (selectedService === 'design') {
          const typeText = designType === 'single-item' ? 'Дизайн одного изделия' : 'Дизайн коллекции';
          return (
            <div className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              <div className="max-w-md mx-auto px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4z" />
                  </svg>
                  <div>
                    <div className="font-medium">{typeText}</div>
                    <div className="text-xs text-gray-600 mt-0.5">📞 Заявка отправлена, ожидайте звонка</div>
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

      <div className="max-w-md mx-auto p-4">
        {/* Заголовок корзины */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#303030] mb-2">Корзина</h1>
          {cartItems.length > 0 && (
            <p className="text-gray-600 text-sm">
              {getTotalItems()} товара на сумму {getTotalAmount().toLocaleString('ru-RU')}₽
            </p>
          )}
        </div>

        {cartItems.length === 0 ? (
          // Пустая корзина
          <div className="flex flex-col items-center justify-center p-8 mt-10 text-center">
            <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Image
                src="/teenyicons_bag-outline.svg"
                alt="Пустая корзина"
                width={32}
                height={32}
                className="w-8 h-8 opacity-60"
              />
            </div>
            <h3 className="text-xl font-medium text-[#303030] mb-2">
              Корзина пуста
            </h3>
            <p className="text-gray-500 mb-8 max-w-[280px]">
              {(() => {
                const selectedService = localStorage.getItem('tl_selected_service');
                if (selectedService === 'production') {
                  return 'Добавьте товары из каталога для расчёта стоимости производства';
                }
                return 'Добавьте товары из каталога, чтобы начать оформление заказа';
              })()}
            </p>
            <Link
              href="/catalog"
              className="w-full px-6 py-4 bg-[#303030] text-white rounded-2xl font-medium hover:bg-black shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all flex items-center justify-center"
            >
              Перейти в каталог
            </Link>
          </div>
        ) : (
          <>
            {/* Список товаров в корзине */}
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => {
                const categorizedOptions = getOptionsByCategory(item);
                const optionsPrice = getOptionsPrice(item);
                const unitPrice = computeUnitPrice(item, item.quantity);
                const lineTotal = unitPrice * item.quantity;
                const baseUnitPrice = getTierBasePrice(item.productSlug, item.quantity, item.basePrice);
                const printEnabled = (item.optionsDetails || []).some(d => d.category === 'print');
                const labelEnabled = (item.optionsDetails || []).some(d => d.category === 'label');
                const packagingEnabled = (item.optionsDetails || []).some(d => d.category === 'packaging');
                const hasLabels = (categorizedOptions.label?.length || 0) > 0;
                const hasPackaging = (categorizedOptions.packaging?.length || 0) > 0;

                return (
                  <div key={item.id} className="bg-white rounded-2xl p-4 border border-black/5">
                    {/* Основная информация о товаре */}
                    <div className="flex gap-4 mb-4">
                      <div className="w-20 h-[100px] bg-[#F7F7F7] rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            width={80}
                            height={100}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-[#303030] leading-tight mb-1.5">{item.productName}</h3>
                        <p className="text-sm text-gray-500 mb-3">
                          Артикул: {item.productSlug.toUpperCase()}
                        </p>
                        
                        {/* Количество */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 10}
                              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-[#303030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="font-medium text-[#303030] min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-black/10 flex items-center justify-center hover:border-[#303030] transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto p-2 -mr-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Переключатель «Опции» */}
                    <div className="border-t border-black/5 mt-4 pt-4">
                      <div 
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => {
                          const updatedCart = cartItems.map(cartItem => 
                            cartItem.id === item.id 
                              ? { ...cartItem, detailedProposal: !cartItem.detailedProposal }
                              : cartItem
                          );
                          setCartItems(updatedCart);
                          localStorage.setItem('tlbot_cart', JSON.stringify(updatedCart));
                          setConfigExpanded(prev => ({ ...prev, [item.id]: !item.detailedProposal }));
                        }}
                      >
                        <div>
                          <h4 className="font-medium text-sm text-[#303030]">Детализация</h4>
                          <p className="text-xs text-gray-500 mt-1">Принт, бирки, упаковка</p>
                        </div>
                        <button
                          type="button"
                          className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${item.detailedProposal ? 'bg-[#303030]' : 'bg-black/10'}`}
                          role="switch"
                          aria-checked={!!item.detailedProposal}
                           aria-label="Переключить подробное КП"
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${item.detailedProposal ? 'translate-x-4' : ''} group-active:scale-95`} />
                        </button>
                      </div>
                    </div>

                    {item.detailedProposal && (
                      <>
                        {/* Опции товара */}
                        <div className="space-y-3 border-t border-gray-100 pt-4 mt-3">
                          {/* Цвет — скрыт */}
                          {/* Принт */}
                          <div className="w-full flex justify-between items-center text-sm py-2 px-2 rounded">
                            <span className="text-gray-600">Принт</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {printEnabled ? `+${PRINT_FLAT_PRICE.toLocaleString('ru-RU')}₽` : 'Без нанесения'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePrint(item.id, !printEnabled)}
                                className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${printEnabled ? 'bg-gray-800' : 'bg-gray-300'}`}
                                role="switch"
                                aria-checked={printEnabled}
                                 aria-label="Переключить принт"
                               >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${printEnabled ? 'translate-x-4' : ''} group-active:scale-95`} />
                               </button>
                            </div>
                          </div>
                          {/* Бирки */}
                          <div className="w-full flex justify-between items-center text-sm py-2 px-2 rounded">
                            <span className="text-gray-600">Бирки</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {labelEnabled ? `+${LABEL_FLAT_PRICE.toLocaleString('ru-RU')}₽` : 'Без бирок'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleLabel(item.id, !labelEnabled)}
                                className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${labelEnabled ? 'bg-gray-800' : 'bg-gray-300'}`}
                                role="switch"
                                aria-checked={labelEnabled}
                                aria-label="Переключить бирки"
                               >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${labelEnabled ? 'translate-x-4' : ''} group-active:scale-95`} />
                               </button>
                            </div>
                          </div>
                          {/* Упаковка */}
                          <div className="w-full flex justify-between items-center text-sm py-2 px-2 rounded">
                            <span className="text-gray-600">Упаковка</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {packagingEnabled ? `+${PACKAGING_FLAT_PRICE.toLocaleString('ru-RU')}₽` : 'Без упаковки'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePackaging(item.id, !packagingEnabled)}
                                className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${packagingEnabled ? 'bg-gray-800' : 'bg-gray-300'}`}
                                role="switch"
                                aria-checked={packagingEnabled}
                                aria-label="Переключить упаковку"
                               >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${packagingEnabled ? 'translate-x-4' : ''} group-active:scale-95`} />
                               </button>
                            </div>
                          </div>
                          
                          {/* Цена за единицу и общая сумма за позицию */}
                          <div className="space-y-2 pt-2 mt-2 border-t border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Цена за единицу</span>
                              <span className="font-medium text-[#303030]">{unitPrice.toLocaleString('ru-RU')}₽</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-gray-600">Общая сумма за позицию</span>
                              <span className="font-bold text-[#303030] text-lg">{lineTotal.toLocaleString('ru-RU')}₽</span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Итоговая сумма заказа */}
            <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
              <h3 className="text-lg font-semibold text-[#303030] mb-4">Итого по заказу</h3>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Товары ({getTotalItems()} шт):</span>
                  <span className="font-medium">{getTotalAmount().toLocaleString('ru-RU')}₽</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-700">К оплате:</span>
                    <span className="text-2xl font-bold text-[#303030]">
                      {getTotalAmount().toLocaleString('ru-RU')}₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Статус данных пользователя */}
              {userData && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Данные для КП загружены из профиля</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {userData.companyName && `${userData.companyName} • `}
                    {userData.firstName} {userData.lastName}
                  </p>
                </div>
              )}
            </div>

            {/* Кнопки действий */}
            <div className="space-y-3">
              {/* Кнопка отправки в Telegram */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🚀 КНОПКА НАЖАТА! Начинаем отправку КП');
                  console.log('📋 userData:', userData);
                  console.log('🔧 Event:', e.type);
                  handleSendProposal();
                }}
                onTouchStart={(e) => {
                  console.log('👆 Touch начался на кнопке КП');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  console.log('👆 Touch закончился на кнопке КП');
                }}
                disabled={isSending}
                style={{ 
                  touchAction: 'manipulation',
                  WebkitTapHighlightColor: 'transparent',
                  position: 'relative',
                  zIndex: 10
                }}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border ${
                  isSending
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-[#303030] border-gray-300 hover:bg-gray-50 active:bg-gray-100 active:scale-[0.98]'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.864 13.63l-2.915-.918c-.636-.194-.648-.636.137-.942L17.926 7.08c.529-.194.99.123.824.73-.001.006-.002.012-.003.018z"/>
                </svg>
                {isSending 
                  ? 'Отправляем КП...' 
                  : 'Отправить КП'
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Футер */}
      <Footer />

      {/* Уведомление об удалении с возможностью отмены */}
      {deletedItem && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <div className="bg-gray-800 text-white rounded-lg p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">
                  Товар удален из корзины
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {deletedItem?.productName}
                </p>
                
                <button
                  onClick={undoDelete}
                  className="bg-gray-800 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-900 transition-colors"
                >
                  Отменить
                </button>
                
                <button
                  onClick={() => {
                    setDeletedItem(null);
                    setUndoTimer(null);
                    setTimeLeft(10);
                  }}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Прогресс-бар */}
            <div className="mt-3 w-full bg-gray-700 rounded-full h-1">
              <div 
                className="bg-gray-800 h-1 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для ввода данных пользователя */}
      {showUserDataForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] overscroll-contain">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90dvh] overflow-y-auto">
            <UserDataForm
              onSubmit={handleFormSubmit}
              onCancel={() => setShowUserDataForm(false)}
              initialData={userData || {}}
            />
          </div>
        </div>
      )}

      {/* Модальное окно профиля */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userData={userData}
        onSave={handleProfileSave}
      />

      {/* Модальное окно выбора опций */}
      {optionsModal.itemId && optionsModal.category && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] overscroll-contain" onClick={closeOptionsModal}>
          <div className="bg-white rounded-lg w-full max-w-md p-4 shadow-2xl max-h-[90dvh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#303030] mb-3">
              {optionsModal.category === 'print' && 'Принт'}
              {optionsModal.category === 'label' && 'Бирки'}
              {optionsModal.category === 'packaging' && 'Упаковка'}
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="space-y-2 pr-1">
                {(() => {
                  if (!optionsModal.itemId) return null;
                  const item = cartItems.find(i => i.id === optionsModal.itemId);
                  if (!item) return null;
                  
                  const slugKey = (item.productSlug || '').toLowerCase();
                  if (!productsBySlug[slugKey]?.optionsByCategory?.[optionsModal.category]) return null;
                  
                  const activeOptions = productsBySlug[slugKey].optionsByCategory[optionsModal.category].filter(o => o.isActive);
                  
                  if (activeOptions.length === 0) {
                    return <p className="text-sm text-gray-500">Опции отсутствуют</p>;
                  }

                  return activeOptions.map(opt => {
                    const checked = modalSelected.includes(opt.id);
                    return (
                      <label key={opt.id} className={`flex items-center justify-between gap-3 p-2 rounded-md border ${checked ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-[#303030]">{opt.name}</span>
                          <span className="text-xs text-gray-500">{opt.price > 0 ? `+${opt.price.toLocaleString('ru-RU')}₽` : 'Бесплатно'}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleModalOption(opt.id)}
                          className="w-5 h-5"
                        />
                      </label>
                    );
                  });
                })()}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={saveModalOptions} className="flex-1 py-2 bg-[#303030] text-white rounded-md hover:bg-[#404040]">Готово</button>
              <button onClick={closeOptionsModal} className="flex-1 py-2 bg-gray-100 text-[#303030] rounded-md hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с ошибкой и логами */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] overscroll-contain">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90dvh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{errorModal.title}</h3>
                  <p className="text-sm text-gray-500">{errorModal.timestamp}</p>
                </div>
              </div>
              <p className="text-gray-700">{errorModal.message}</p>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 pb-3">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Техническая информация:</h4>
              </div>
              <div className="flex-1 px-6 overflow-y-auto">
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs leading-relaxed">
                  {errorModal.logs.map((log, index) => (
                    <div key={index} className="mb-1 text-gray-700">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 pt-3 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${errorModal.title}\n${errorModal.message}\n\nЛоги:\n${errorModal.logs.join('\n')}`
                    );
                  }}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  📋 Скопировать логи
                </button>
                <button
                  onClick={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно статуса создания КП */}
      {showProposalModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="text-center">
              {proposalStatus === 'creating' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Создаем коммерческое предложение</h3>
                  <p className="text-gray-600">Подготавливаем документы и расчеты...</p>
                </>
              )}
              
              {proposalStatus === 'sending' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Отправляем в Telegram</h3>
                  <p className="text-gray-600">Передаем КП в чат бот...</p>
                </>
              )}
              
              {proposalStatus === 'success' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">КП успешно отправлено!</h3>
                  <p className="text-gray-600 mb-4">Коммерческое предложение отправлено в чат бот. Проверьте Telegram.</p>
                  <button
                    onClick={() => {
                      setShowProposalModal(false);
                      setProposalStatus('creating');
                    }}
                    className="w-full py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                  >
                    Отлично!
                  </button>
                </>
              )}
              
              {proposalStatus === 'error' && (
                <>
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ошибка отправки</h3>
                  <p className="text-gray-600 mb-4">Не удалось отправить КП. Попробуйте еще раз.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowProposalModal(false);
                        setProposalStatus('creating');
                      }}
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Закрыть
                    </button>
                    <button
                      onClick={() => handleSendProposal()}
                      className="flex-1 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 transition-colors"
                    >
                      Повторить
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
