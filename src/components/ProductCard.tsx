'use client';

import { useState, useRef, TouchEvent, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

interface ProductCardProps {
  product: Product;
  isCompact?: boolean;
}

export default function ProductCard({ product, isCompact = false }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0])); // Всегда загружаем первое изображение
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer для lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Предзагрузка изображений при взаимодействии
  const preloadImage = (index: number) => {
    if (!loadedImages.has(index)) {
      setLoadedImages(prev => new Set([...prev, index]));
    }
  };

  // Функция для получения самой низкой цены
  const getLowestPrice = () => {
    if (!product.priceTiers || product.priceTiers.length === 0) {
      return product.price;
    }
    
    // Находим минимальную цену среди всех ценовых уровней
    const lowestTierPrice = Math.min(...product.priceTiers.map(tier => tier.price));
    return Math.min(product.price, lowestTierPrice);
  };

  const nextImage = () => {
    if (product.images.length === 0) return;
    const newIndex = (currentImageIndex + 1) % product.images.length;
    setCurrentImageIndex(newIndex);
    preloadImage(newIndex);
    // Предзагружаем следующее изображение
    const nextNext = (newIndex + 1) % product.images.length;
    preloadImage(nextNext);
  };

  const prevImage = () => {
    if (product.images.length === 0) return;
    const newIndex = currentImageIndex === 0 ? product.images.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(newIndex);
    preloadImage(newIndex);
    // Предзагружаем предыдущее изображение
    const prevPrev = newIndex === 0 ? product.images.length - 1 : newIndex - 1;
    preloadImage(prevPrev);
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    preloadImage(index);
  };

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
    const maxOffset = 100; // максимальное смещение в пикселях
    const limitedOffset = Math.max(-maxOffset, Math.min(maxOffset, diff));
    
    setDragOffset(limitedOffset);
    setTouchEnd(currentX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && product.images.length > 1) {
      nextImage();
    } else if (isRightSwipe && product.images.length > 1) {
      prevImage();
    }
    
    // Сбрасываем состояние
    setIsDragging(false);
    setDragOffset(0);
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div ref={cardRef} className="group flex flex-col bg-white rounded-3xl overflow-hidden border border-black/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
      {/* Простой слайдер изображений с touch поддержкой */}
      <div 
        className="relative aspect-[4/5] bg-[#F7F7F7] overflow-hidden cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {product.images.length > 0 ? (
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
                {(isVisible && loadedImages.has(index)) || index === 0 ? (
                  <Image
                    src={image}
                    alt={`${product.name} - изображение ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    sizes="(max-width: 768px) 50vw, 33vw"
                    onLoad={() => preloadImage(index)}
                  />
                ) : (
                  // Skeleton loader для неопользованных изображений
                  <div className="w-full h-full bg-[#f2f2f7] animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-500">Изображение недоступно</span>
          </div>
        )}

        {/* Точки-индикаторы с овальной активной точкой */}
        {product.images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 px-2.5 py-1.5 rounded-full bg-black/10 backdrop-blur-md">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  goToImage(index);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'w-4 bg-white shadow-sm' 
                    : 'w-1.5 bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Перейти к изображению ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Информация о товаре */}
      <Link href={`/product/${product.slug}`} className="flex flex-col flex-grow">
        <div className={`p-4 flex flex-col flex-grow justify-between ${isCompact ? 'p-3' : 'p-4'}`}>
          <div className="mb-3">
            <h3 className={`font-medium text-[#303030] leading-tight mb-1 ${isCompact ? 'text-[13px]' : 'text-[15px]'}`}>
              {product.name}
            </h3>
            <p className={`font-semibold text-black tracking-tight ${isCompact ? 'text-[15px]' : 'text-[18px]'}`}>
              от {getLowestPrice().toLocaleString('ru-RU')} ₽
            </p>
          </div>
          
          <div className={`w-full text-center font-medium rounded-xl transition-colors bg-black/[0.04] text-[#303030] group-hover:bg-black/10 ${
              isCompact ? 'text-xs py-2' : 'text-sm py-2.5'
            }`}>
            Подробнее
          </div>
        </div>
      </Link>
    </div>
  );
}
