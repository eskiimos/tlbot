"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function HomePage() {
    const router = (0, navigation_1.useRouter)();
    const [isClient, setIsClient] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setIsClient(true);
    }, []);
    if (!isClient) {
        return (<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>);
    }
    const handleStartShopping = () => {
        router.push('/catalog');
    };
    return (<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Логотип */}
          <div className="mb-8">
            <Image src="/TLlogo.svg" alt="Total Lookas" width={200} height={80} className="mx-auto" priority/>
          </div>

          {/* Заголовок */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Total Lookas
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8">
            Креативное агентство полного цикла
          </p>

          {/* Описание */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              🎨 Превращаем корпоративный мерч в арт-объекты!
            </h2>
            <p className="text-gray-600 mb-6">
              С 2017 года объединяем дерзкий стиль с корпоративным сервисом. 
              Можем всё — быстро, смело и качественно.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">⚡️</span>
                <div>
                  <h3 className="font-semibold text-gray-900">20 дней</h3>
                  <p className="text-sm text-gray-600">От идеи до готового продукта</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Полный цикл</h3>
                  <p className="text-sm text-gray-600">Дизайн → лекала → производство → логистика</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <span className="text-2xl">👕</span>
                <div>
                  <h3 className="font-semibold text-gray-900">Широкий ассортимент</h3>
                  <p className="text-sm text-gray-600">От футболок до ювелирных аксессуаров</p>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопка */}
          <button onClick={handleStartShopping} className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-800 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            🔥 Открыть каталог
          </button>
        </div>
      </div>
    </div>);
}
