'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import UserDataForm from '@/components/UserDataForm';
import usePDFGenerator from '@/components/PDFGenerator';

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{type: 'success' | 'error' | 'test', message: string} | null>(null);
  const [configExpanded, setConfigExpanded] = useState<{[id: string]: boolean}>({});
  // Track when cart has been loaded from localStorage to avoid wiping it on first render
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

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

  // Блокируем скролл фона при открытой модалке
  const anyModalOpen = !!showUserDataForm || (!!optionsModal.itemId && !!optionsModal.category);
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
    if (!configExpanded[item.id]) return 0;
    // Дизайн не влияет на цену (индивидуальный подход)
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

  const { generatePdfBlob, ProposalComponent } = usePDFGenerator({ 
    cartItems, 
    userData: userData || {
      telegramId: '123456789',
      firstName: '',
      lastName: '',
      username: '',
      phoneNumber: '',
      email: '',
      companyName: '',
      inn: ''
    }
  });

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

  // Функция для загрузки данных пользователя
  const loadUserData = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      // Проверяем, доступен ли Telegram WebApp
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
        const tgUser = window.Telegram.WebApp.initDataUnsafe.user;
        console.log('Telegram пользователь найден:', tgUser);
        setIsLoadingUserData(true);
        
        // Получаем данные пользователя из API
        const response = await fetch(`/api/users?telegramId=${tgUser.id}`);
        if (response.ok) {
          const apiUserData = await response.json();
          console.log('Данные из API:', apiUserData);
          
          // Формируем объект данных пользователя
          const completeUserData: UserData = {
            telegramId: tgUser.id.toString(),
            username: tgUser.username,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name,
            phoneNumber: apiUserData?.organization?.phone,
            email: apiUserData?.organization?.email,
            companyName: apiUserData?.organization?.contactName,
            inn: apiUserData?.organization?.inn
          };
          
          console.log('Сформированные данные пользователя:', completeUserData);
          setUserData(completeUserData);
        } else {
          console.log('API вернул ошибку:', response.status);
        }
      } else {
        console.log('Telegram WebApp недоступен, пробуем localStorage');
        // Fallback - пытаемся загрузить из localStorage
        const savedData = localStorage.getItem('tlbot_user_data');
        if (savedData) {
          console.log('Данные найдены в localStorage:', savedData);
          setUserData(JSON.parse(savedData));
        } else {
          console.log('Данные в localStorage не найдены');
        }
      }
    } catch (error) {
      console.error('Ошибка при загрузке данных пользователя:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  };

  const handleSendProposal = async () => {
    return handleSendProposalWithData(userData);
  };

  const handleSendProposalWithData = async (userDataToUse: UserData | null) => {
    // Для локального тестирования создаем тестовые данные если их нет
    if (!userDataToUse?.telegramId) {
      console.log("Данные пользователя отсутствуют, создаем тестовые данные для локального тестирования");
      userDataToUse = {
        telegramId: '123456789', // Тестовый ID
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
      // Генерация PDF
      console.log("Генерация PDF...");
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) {
        console.error("Не удалось создать PDF файл");
        setSendResult({type: 'error', message: 'Не удалось создать PDF файл.'});
        setIsSending(false);
        return;
      }
      console.log("PDF успешно создан, размер:", pdfBlob.size);

      // Формируем данные для отправки
      const formData = new FormData();
      const filename = `commercial-proposal-${userDataToUse.telegramId}.pdf`;
      formData.append('file', new File([pdfBlob], filename, { type: 'application/pdf' }));
      formData.append('telegramId', userDataToUse.telegramId);
      
      // Добавляем данные заказа
      const orderData = {
        userId: userDataToUse.telegramId,
        customerName: `${userDataToUse.firstName || ''} ${userDataToUse.lastName || ''}`.trim() || 'Не указано',
        customerEmail: userDataToUse.email || '',
        customerPhone: userDataToUse.phoneNumber || '',
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
      
      console.log("Отправка на сервер, telegramId:", userDataToUse.telegramId, "filename:", filename);
      const response = await fetch('/api/proposals', {
        method: 'POST',
        body: formData,
      });

      console.log("Ответ сервера:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("Результат запроса:", result);
        
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
        try {
          const errorData = await response.json();
          console.error("Детальная ошибка API:", errorData);
          errorMessage = errorData.details || errorData.error || 'Ошибка сервера';
          
          // Специальная обработка ошибки "чат не найден"
          if (errorData.error === 'Чат с ботом не найден') {
            errorMessage = '🤖 Сначала напишите боту /start в Telegram, а затем попробуйте снова';
          }
          
          // Вывод диагностической информации, если есть
          if (errorData.diagnostics) {
            console.error("Диагностика:", errorData.diagnostics);
          }
        } catch (e) {
          console.error("Не удалось разобрать JSON ответ с ошибкой:", e);
        }
        setSendResult({type: 'error', message: `Ошибка при отправке: ${errorMessage}`});
      }
    } catch (error) {
      console.error("Ошибка при отправке КП:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSendResult({type: 'error', message: `Произошла ошибка при отправке: ${errorMessage}`});
    } finally {
      setIsSending(false);
    }
  };

  // Создание и скачивание PDF локально
  const handleCreateCommercialOffer = async () => {
    try {
      setIsGeneratingPDF(true);
      const pdfBlob = await generatePdfBlob();
      if (!pdfBlob) return;
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'commercial-proposal.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
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
      const isSingle = optionsModal.category === 'design';
      if (isSingle) return [optionId];
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

  // Переключатель «Дизайн» (индивидуально, без доплаты)
  const toggleDesign = (itemId: string, enable: boolean) => {
    const item = cartItems.find(i => i.id === itemId);
    if (!item) return;

    const updatedDetails = (item.optionsDetails || []).filter(o => o.category !== 'design');
    if (enable) {
      updatedDetails.push({ id: 'design-custom', name: 'Индивидуально', category: 'design', price: 0 });
    }

    const updatedItem: CartItem = {
      ...item,
      selectedOptions: { ...item.selectedOptions, design: enable ? ['design-custom'] : [] },
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
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Скрытый компонент для рендеринга HTML для PDF */}
      {isMounted && ProposalComponent}

      {/* Хэдер */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-[#303030]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 text-center">
              <Image
                src="/TLlogo.svg"
                alt="TL Logo"
                width={120}
                height={40}
                className="h-10 w-auto mx-auto"
              />
            </div>
            <button 
              onClick={() => {
                // TODO: Переход в профиль
                alert('Профиль - в разработке');
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Image
                src="/bx_user.svg"
                alt="Профиль"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </button>
          </div>
        </div>
      </header>

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
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image
                src="/teenyicons_bag-outline.svg"
                alt="Пустая корзина"
                width={32}
                height={32}
                className="w-8 h-8 text-gray-400"
              />
            </div>
            <h3 className="text-lg font-semibold text-[#303030] mb-2">
              Корзина пуста
            </h3>
            <p className="text-gray-600 mb-6">
              Добавьте товары из каталога, чтобы начать оформление заказа
            </p>
            <Link
              href="/catalog"
              className="inline-block px-6 py-3 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
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
                const designEnabled = (item.optionsDetails || []).some(d => d.category === 'design');
                const hasLabels = (categorizedOptions.label?.length || 0) > 0;
                const hasPackaging = (categorizedOptions.packaging?.length || 0) > 0;

                return (
                  <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm">
                    {/* Основная информация о товаре */}
                    <div className="flex gap-3 mb-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#303030] mb-1">{item.productName}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Артикул: {item.productSlug.toUpperCase()}
                        </p>
                        
                        {/* Количество */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 10}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="font-medium text-[#303030] min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#303030] transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </button>
                          </div>
                          
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto p-1 text-red-500 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Переключатель «Составить подробное КП» */}
                    <div className="border-t border-gray-100 pt-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#303030]">Составить подробное КП</span>
                        <button
                          type="button"
                          onClick={() => setConfigExpanded(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${configExpanded[item.id] ? 'bg-green-500' : 'bg-gray-300'}`}
                          role="switch"
                          aria-checked={!!configExpanded[item.id]}
                           aria-label="Переключить конфигурацию"
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${configExpanded[item.id] ? 'translate-x-4' : ''} group-active:scale-95`} />
                        </button>
                      </div>
                    </div>

                    {configExpanded[item.id] && (
                      <>
                        {/* Конфигурация товара */}
                        <div className="space-y-3 border-t border-gray-100 pt-4 mt-3">
                          <h4 className="text-sm font-medium text-gray-700">Конфигурация товара</h4>
                          {/* Цвет — скрыт */}
                          {/* Дизайн */}
                          <div className="w-full flex justify-between items-center text-sm py-2 px-2 rounded">
                            <span className="text-gray-600">Дизайн</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-500">
                                {designEnabled ? 'Индивидуально' : 'Не выбрано'}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleDesign(item.id, !designEnabled)}
                                className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${designEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                role="switch"
                                aria-checked={designEnabled}
                                 aria-label="Переключить дизайн"
                               >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${designEnabled ? 'translate-x-4' : ''} group-active:scale-95`} />
                               </button>
                            </div>
                          </div>
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
                                className={`group w-10 h-6 rounded-full relative transition-colors duration-200 ease-out ${printEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                                role="switch"
                                aria-checked={printEnabled}
                                 aria-label="Переключить принт"
                               >
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ease-out ${printEnabled ? 'translate-x-4' : ''} group-active:scale-95`} />
                               </button>
                            </div>
                          </div>
                          {/* Бирки (модалка) */}
                          <button
                            type="button"
                            onClick={() => openOptionsModal(item.id, 'label')}
                            className="w-full flex items-center justify-between text-sm py-2.5 px-3 rounded-md border border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 cursor-pointer"
                            aria-haspopup="dialog"
                            aria-label="Открыть опции «Бирки»"
                          >
                            <span className="text-gray-600">Бирки</span>
                            <span className="flex items-center gap-2">
                              <span className={`${hasLabels ? 'font-medium text-[#303030]' : 'text-gray-500'} text-right`}>
                                {hasLabels ? categorizedOptions.label.join(', ') : 'Без дополнительных элементов'}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                           {/* Упаковка */}
                          <button
                            type="button"
                            onClick={() => openOptionsModal(item.id, 'packaging')}
                            className="w-full flex items-center justify-between text-sm py-2.5 px-3 rounded-md border border-gray-200 hover:bg-gray-50 active:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 cursor-pointer"
                            aria-haspopup="dialog"
                            aria-label="Открыть опции «Упаковка»"
                          >
                            <span className="text-gray-600">Упаковка</span>
                            <span className="flex items-center gap-2">
                              <span className={`${hasPackaging ? 'font-medium text-[#303030]' : 'text-gray-500'} text-right`}>
                                {hasPackaging ? categorizedOptions.packaging.join(', ') : 'Без упаковки'}
                              </span>
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </button>
                        </div>

                        {/* Расчет стоимости */}
                        <div className="space-y-2 border-t border-gray-100 pt-4 mt-4">
                          <h4 className="text-sm font-medium text-gray-700">Расчет стоимости</h4>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Базовая цена за единицу:</span>
                            <span className="font-medium">{baseUnitPrice.toLocaleString('ru-RU')}₽</span>
                          </div>
                          {optionsPrice > 0 && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">Доплата за опции:</span>
                              <span className="font-medium">+{optionsPrice.toLocaleString('ru-RU')}₽</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
                            <span className="text-gray-600">Цена за единицу:</span>
                            <span className="font-semibold text-[#303030]">{unitPrice.toLocaleString('ru-RU')}₽</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Количество:</span>
                            <span className="font-medium">{item.quantity} шт</span>
                          </div>
                          <div className="flex justify-between items-center text-base border-t border-gray-300 pt-2">
                            <span className="font-semibold text-gray-700">Итого за товар:</span>
                            <span className="font-bold text-[#303030] text-lg">{lineTotal.toLocaleString('ru-RU')}₽</span>
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
                  <div className="flex items-center gap-2 text-sm text-green-600">
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
                onClick={() => {
                  console.log('🚀 КНОПКА НАЖАТА! Начинаем отправку КП');
                  console.log('📋 userData:', userData);
                  handleSendProposal();
                }}
                disabled={isSending}
                className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 border ${
                  isSending
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                    : 'bg-white text-[#303030] border-gray-300 hover:bg-gray-50 active:bg-gray-100'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121L9.864 13.63l-2.915-.918c-.636-.194-.648-.636.137-.942L17.926 7.08c.529-.194.99.123.824.73-.001.006-.002.012-.003.018z"/>
                </svg>
                {isSending 
                  ? 'Отправляем в Telegram...' 
                  : 'Отправить КП в Telegram'
                }
              </button>
            </div>
          </>
        )}
      </div>

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
                  {deletedItem.productName}
                </p>
                
                <button
                  onClick={undoDelete}
                  className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors"
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
                className="bg-blue-500 h-1 rounded-full transition-all duration-1000 ease-linear"
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

      {/* Модальное окно выбора опций */}
      {optionsModal.itemId && optionsModal.category && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] overscroll-contain" onClick={closeOptionsModal}>
          <div className="bg-white rounded-lg w-full max-w-md p-4 shadow-2xl max-h-[90dvh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-[#303030] mb-3">
              {optionsModal.category === 'design' && 'Дизайн'}
              {optionsModal.category === 'print' && 'Принт'}
              {optionsModal.category === 'label' && 'Бирки'}
              {optionsModal.category === 'packaging' && 'Упаковка'}
            </h3>
            {(() => {
              const item = cartItems.find(i => i.id === optionsModal.itemId)!;
              const slugKey = (item.productSlug || '').toLowerCase();
              const list = (productsBySlug[slugKey]?.optionsByCategory?.[optionsModal.category!] || []).filter(o => o.isActive);
              const isSingle = optionsModal.category === 'design';
              return (
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="space-y-2 pr-1">
                    {list.map(opt => {
                      const checked = modalSelected.includes(opt.id);
                      return (
                        <label key={opt.id} className={`flex items-center justify-between gap-3 p-2 rounded-md border ${checked ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-[#303030]">{opt.name}</span>
                            <span className="text-xs text-gray-500">{opt.price > 0 ? `+${opt.price.toLocaleString('ru-RU')}₽` : 'Бесплатно'}</span>
                          </div>
                          <input
                            type={isSingle ? 'radio' : 'checkbox'}
                            name={`opt-${optionsModal.category}`}
                            checked={checked}
                            onChange={() => toggleModalOption(opt.id)}
                            className="w-5 h-5"
                          />
                        </label>
                      );
                    })}
                    {list.length === 0 && (
                      <p className="text-sm text-gray-500">Опции отсутствуют</p>
                    )}
                  </div>
                </div>
              );
            })()}
            <div className="mt-4 flex gap-2">
              <button onClick={saveModalOptions} className="flex-1 py-2 bg-[#303030] text-white rounded-md hover:bg-[#404040]">Готово</button>
              <button onClick={closeOptionsModal} className="flex-1 py-2 bg-gray-100 text-[#303030] rounded-md hover:bg-gray-200">Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
