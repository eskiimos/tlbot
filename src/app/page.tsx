'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Используем типы из src/types/telegram-webapp.d.ts

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    console.log('🚀 Инициализация HomePage');
    
    // Инициализация Telegram WebApp, если есть
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      console.log('🔄 Инициализация Telegram WebApp');
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    
    // Немедленно перенаправляем на страницу каталога
    console.log('🔄 Перенаправление на /catalog');
    router.push('/catalog');
  }, [router]);

  // Этот компонент никогда не должен отображаться, так как происходит редирект
  return null;
}
