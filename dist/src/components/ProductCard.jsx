"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProductCard;
const react_1 = require("react");
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
function ProductCard({ product, isCompact = false }) {
    const [currentImageIndex, setCurrentImageIndex] = (0, react_1.useState)(0);
    const [imageError, setImageError] = (0, react_1.useState)(false);
    const touchStartX = (0, react_1.useRef)(null);
    const touchEndX = (0, react_1.useRef)(null);
    // Fallback изображение если основное не загружается
    const defaultImage = '/products/placeholder.jpg';
    const currentImage = product.images.length > 0 ? product.images[currentImageIndex] : defaultImage;
    const nextImage = () => {
        setCurrentImageIndex((prev) => prev === product.images.length - 1 ? 0 : prev + 1);
    };
    const prevImage = () => {
        setCurrentImageIndex((prev) => prev === 0 ? product.images.length - 1 : prev - 1);
    };
    const goToImage = (index) => {
        setCurrentImageIndex(index);
    };
    // Обработка свайпа
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchMove = (e) => {
        touchEndX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current)
            return;
        const diff = touchStartX.current - touchEndX.current;
        const threshold = 50; // минимальное расстояние свайпа
        if (Math.abs(diff) > threshold && product.images.length > 1) {
            if (diff > 0) {
                // Свайп влево
                nextImage();
            }
            else {
                // Свайп вправо
                prevImage();
            }
        }
        // Сбрасываем координаты
        touchStartX.current = null;
        touchEndX.current = null;
    };
    return (<div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Слайдер изображений с квадратным соотношением сторон */}
      <div className="relative aspect-square bg-white touch-pan-y" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {!imageError ? (<>
            <image_1.default src={currentImage} alt={product.name} fill className="object-cover" onError={() => setImageError(true)} sizes="(max-width: 768px) 100vw, 400px" priority={currentImageIndex === 0} // Приоритет загрузки для первого изображения
        />
            
            {/* Пагинация внутри изображения (полупрозрачные точки, активная — овальная) */}
            {product.images.length > 1 && (<div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                {product.images.map((_, index) => (<button key={index} onClick={() => goToImage(index)} className={`transition-all duration-200 ${index === currentImageIndex
                        ? 'w-6 h-2 rounded-full bg-white/90'
                        : 'w-2 h-2 rounded-full bg-white/50 hover:bg-white/70'}`} aria-label={`Изображение ${index + 1} из ${product.images.length}`}/>))}
              </div>)}
          </>) : (<div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p className="text-sm">Фото скоро</p>
            </div>
          </div>)}
      </div>

      {/* Информация о товаре */}
      <div className={`${isCompact ? 'p-3' : 'p-4'}`}>
        <h3 className={`font-semibold text-[#303030] mb-2 ${isCompact ? 'text-sm' : 'text-lg'}`}>
          {product.name}
        </h3>
        
        <div className={`flex items-center ${isCompact ? 'flex-col gap-2' : 'justify-between'}`}>
          <span className={`font-bold text-[#303030] ${isCompact ? 'text-lg' : 'text-xl'}`}>
            от {product.price.toLocaleString('ru-RU')}₽
          </span>
          
          <link_1.default href={`/product/${product.slug}`} className={`bg-[#303030] text-white rounded-lg hover:bg-[#404040] transition-colors font-medium text-center inline-block ${isCompact
            ? 'px-3 py-1.5 text-xs w-full'
            : 'px-4 py-2 text-sm'}`}>
            Подробнее
          </link_1.default>
        </div>
      </div>
    </div>);
}
