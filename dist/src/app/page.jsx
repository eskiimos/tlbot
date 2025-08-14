"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomePage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
// Используем типы из src/types/telegram-webapp.d.ts
function HomePage() {
    const router = (0, navigation_1.useRouter)();
    (0, react_1.useEffect)(() => {
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
