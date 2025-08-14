"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Catalog;
const react_1 = require("react");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const ProductCard_1 = __importDefault(require("@/components/ProductCard"));
function Catalog() {
    const [products, setProducts] = (0, react_1.useState)([]);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const [selectedCategory, setSelectedCategory] = (0, react_1.useState)('all');
    const [viewMode, setViewMode] = (0, react_1.useState)('single'); // single = 1 в ряд, double = 2 в ряд
    const [cartItemsCount, setCartItemsCount] = (0, react_1.useState)(0);
    const [isMounted, setIsMounted] = (0, react_1.useState)(false);
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
                const totalItems = cartData.reduce((total, item) => total + item.quantity, 0);
                setCartItemsCount(totalItems);
            }
            else {
                setCartItemsCount(0);
            }
        }
        catch (error) {
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
    const getCategoryForProduct = (productName, slug) => {
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
    const isShopper = (p) => p.slug?.toLowerCase() === 'shopper' || p.name?.toLowerCase().includes('шоппер');
    // Фильтрация и сортировка товаров по категории и цене (от минимальной к максимальной),
    // при этом «шоппер» всегда в конце
    const filteredProducts = (selectedCategory === 'all'
        ? products
        : products.filter(product => getCategoryForProduct(product.name, product.slug) === selectedCategory)).sort((a, b) => {
        const aShopper = isShopper(a);
        const bShopper = isShopper(b);
        if (aShopper && !bShopper)
            return 1; // a в конец
        if (!aShopper && bShopper)
            return -1; // b в конец
        return a.price - b.price; // обычная сортировка по цене
    });
    (0, react_1.useEffect)(() => {
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
                }
                else {
                    console.error('Неверный формат данных:', data);
                }
            }
            catch (error) {
                console.error('Ошибка при загрузке товаров:', error);
            }
            finally {
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
    return (<div className="min-h-screen bg-[#f8f8f8]">
      {/* Хэдер с логотипом */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Иконка профиля слева */}
            <link_1.default href="/?edit=true" className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Личный кабинет">
              <image_1.default src="/bx_user.svg" alt="Личный кабинет" width={24} height={24} className="w-6 h-6 text-[#303030]"/>
            </link_1.default>
            
            {/* Логотип по центру */}
            <div className="flex justify-center">
              <image_1.default src="/TLlogo.svg" alt="TL Logo" width={120} height={40} className="h-10 w-auto"/>
            </div>
            
            {/* Иконка корзины справа */}
            <button onClick={() => {
            window.location.href = '/cart';
        }} className="p-2 rounded-full hover:bg-gray-100 transition-colors relative" title="Корзина">
              <image_1.default src="/teenyicons_bag-outline.svg" alt="Корзина" width={24} height={24} className="w-6 h-6"/>
              {isMounted && cartItemsCount > 0 && (<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center min-w-[20px]">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </span>)}
            </button>
          </div>
        </div>
      </header>

      {/* Контент каталога */}
      <div className="max-w-md mx-auto p-4">
        {isLoading ? (<div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
            <p className="text-gray-600 mt-4">Загружаем товары...</p>
          </div>) : (<>
            {/* Удалено промо-сообщение с заголовком и плашкой */}
            <div className="mb-4">
              <p className="text-center text-gray-500 text-sm">
                {filteredProducts.length} товар{filteredProducts.length % 10 === 1 && filteredProducts.length !== 11 ? '' : filteredProducts.length % 10 >= 2 && filteredProducts.length % 10 <= 4 && (filteredProducts.length < 10 || filteredProducts.length > 20) ? 'а' : 'ов'} в каталоге
              </p>
            </div>

            {/* Фильтры-теги */}
            <div>
              <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
                {categories.map((category) => (<button key={category.id} onClick={() => setSelectedCategory(category.id)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap flex-shrink-0 ${selectedCategory === category.id
                    ? 'bg-[#303030] text-white shadow-sm'
                    : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'}`}>
                    {category.name}
                  </button>))}
              </div>
            </div>

            {/* Переключатель вида отображения */}
            <div className="mb-4">
              <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 flex w-full">
                <button onClick={() => setViewMode('single')} className={`flex-1 p-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'single'
                ? 'bg-gray-100 text-gray-700 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`} title="1 товар в ряд">
                  <image_1.default src="/si_window-line1.svg" alt="1 товар в ряд" width={20} height={20} className="w-5 h-5"/>
                  <span className="text-sm font-medium">1 в ряд</span>
                </button>
                <button onClick={() => setViewMode('double')} className={`flex-1 p-3 rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'double'
                ? 'bg-gray-100 text-gray-700 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`} title="2 товара в ряд">
                  <image_1.default src="/si_window-line.svg" alt="2 товара в ряд" width={20} height={20} className="w-5 h-5"/>
                  <span className="text-sm font-medium">2 в ряд</span>
                </button>
              </div>
            </div>

            {/* Сетка товаров */}
            <div className={`grid gap-4 ${viewMode === 'single' ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {filteredProducts.map((product) => (<ProductCard_1.default key={product.id} product={product} isCompact={viewMode === 'double'}/>))}
            </div>

            {filteredProducts.length === 0 && products.length > 0 && (<div className="text-center py-12">
                <p className="text-gray-500">В этой категории товары не найдены</p>
                <button onClick={() => setSelectedCategory('all')} className="mt-2 text-[#303030] hover:underline text-sm">
                  Показать все товары
                </button>
              </div>)}

            {products.length === 0 && (<div className="text-center py-12">
                <p className="text-gray-500">Товары не найдены</p>
              </div>)}
          </>)}
      </div>
      
      {/* Скрытая ссылка на админку - по клику */}
      <div className="text-center text-xs text-gray-400 mt-8 cursor-pointer select-none pb-4" onClick={() => {
            window.location.href = '/admin';
        }}>
        Total Lookas
      </div>
    </div>);
}
