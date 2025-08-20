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
    <div ref={cardRef} className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Простой слайдер изображений с touch поддержкой */}
      <div 
        className="relative aspect-square overflow-hidden cursor-grab active:cursor-grabbing"
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
                  <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse"></div>
                  </div>
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
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {product.images.map((_, index) => (
              <button
                key={index}
                onClick={() => goToImage(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentImageIndex 
                    ? 'w-6 bg-white' 
                    : 'w-2 bg-white/50'
                }`}
                aria-label={`Перейти к изображению ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Информация о товаре */}
      <div className={`p-4 ${isCompact ? 'p-3' : 'p-4'}`}>
        <Link href={`/product/${product.slug}`} className="block hover:text-gray-700 transition-colors">
          <h3 className={`font-medium text-gray-900 mb-2 ${isCompact ? 'text-sm' : 'text-base'}`}>
            {product.name}
          </h3>
        </Link>
        <p className={`text-gray-900 font-semibold ${isCompact ? 'text-lg' : 'text-xl'}`}>
          от {getLowestPrice().toLocaleString('ru-RU')}₽
        </p>
        <Link 
          href={`/product/${product.slug}`}
          className={`inline-block mt-3 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors ${
            isCompact ? 'text-sm px-3 py-1.5' : 'text-base px-4 py-2'
          }`}
        >
          Подробнее
        </Link>
      </div>
    </div>
  );
}
