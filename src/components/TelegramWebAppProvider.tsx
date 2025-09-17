import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TelegramWebAppContextType {
  isReady: boolean;
  webApp: any | null;
  user: any | null;
  initData: string | null;
  showMainButton: (text: string, onClick: () => void) => void;
  hideMainButton: () => void;
  closeApp: () => void;
  sendData: (data: any) => void;
  expandApp: () => void;
}

const TelegramWebAppContext = createContext<TelegramWebAppContextType>({
  isReady: false,
  webApp: null,
  user: null,
  initData: null,
  showMainButton: () => {},
  hideMainButton: () => {},
  closeApp: () => {},
  sendData: () => {},
  expandApp: () => {}
});

export const useTelegramWebApp = () => useContext(TelegramWebAppContext);

interface TelegramWebAppProviderProps {
  children: ReactNode;
}

export const TelegramWebAppProvider: React.FC<TelegramWebAppProviderProps> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [webApp, setWebApp] = useState<any | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    // Инициализация Telegram WebApp, если есть
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tgWebApp = window.Telegram.WebApp;
      
      try {
        // Базовая инициализация
        console.log('🔄 Инициализация Telegram WebApp в провайдере');
        tgWebApp.ready();
        tgWebApp.expand();

        // Сохраняем данные
        setWebApp(tgWebApp);
        setIsReady(true);
        setInitData(tgWebApp.initData);
        
        // Проверяем наличие данных пользователя
        if (tgWebApp.initDataUnsafe?.user) {
          setUser(tgWebApp.initDataUnsafe.user);
        }
        
      } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
      }
    }
  }, []);

  // Функции работы с MainButton
  const showMainButton = (text: string, onClick: () => void) => {
    if (!webApp?.MainButton) return;
    
    try {
      webApp.MainButton.setText(text);
      webApp.MainButton.onClick(onClick);
      webApp.MainButton.show();
    } catch (e) {
      console.error('Ошибка при показе MainButton:', e);
    }
  };
  
  const hideMainButton = () => {
    if (!webApp?.MainButton) return;
    
    try {
      webApp.MainButton.hide();
    } catch (e) {
      console.error('Ошибка при скрытии MainButton:', e);
    }
  };
  
  // Другие функции
  const closeApp = () => {
    if (!webApp) return;
    
    try {
      webApp.close();
    } catch (e) {
      console.error('Ошибка при закрытии приложения:', e);
    }
  };
  
  const sendData = (data: any) => {
    if (!webApp) return;
    
    try {
      webApp.sendData(JSON.stringify(data));
    } catch (e) {
      console.error('Ошибка при отправке данных:', e);
    }
  };
  
  const expandApp = () => {
    if (!webApp) return;
    
    try {
      webApp.expand();
    } catch (e) {
      console.error('Ошибка при развертывании приложения:', e);
    }
  };

  const value = {
    isReady,
    webApp,
    user,
    initData,
    showMainButton,
    hideMainButton,
    closeApp,
    sendData,
    expandApp
  };

  return (
    <TelegramWebAppContext.Provider value={value}>
      {children}
    </TelegramWebAppContext.Provider>
  );
};

export default TelegramWebAppProvider;
