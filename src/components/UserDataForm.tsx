'use client';

import { useState, useEffect } from 'react';

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

interface UserDataFormProps {
  onSubmit: (userData: UserData) => void;
  onCancel: () => void;
  initialData: UserData;
}

export default function UserDataForm({ onSubmit, onCancel, initialData }: UserDataFormProps) {
  // Функция для форматирования номера телефона
  const formatPhoneNumber = (value: string) => {
    // Удаляем все символы кроме цифр
    const numbers = value.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на 7
    let formattedNumbers = numbers;
    if (numbers.startsWith('8')) {
      formattedNumbers = '7' + numbers.slice(1);
    }
    
    // Применяем маску +7 (XXX) XXX-XX-XX
    if (formattedNumbers.length >= 1) {
      if (formattedNumbers.startsWith('7')) {
        formattedNumbers = formattedNumbers.slice(1); // Убираем 7, так как она уже есть в +7
      }
      
      let formatted = '+7';
      if (formattedNumbers.length > 0) {
        formatted += ' (' + formattedNumbers.slice(0, 3);
        if (formattedNumbers.length > 3) {
          formatted += ') ' + formattedNumbers.slice(3, 6);
          if (formattedNumbers.length > 6) {
            formatted += '-' + formattedNumbers.slice(6, 8);
            if (formattedNumbers.length > 8) {
              formatted += '-' + formattedNumbers.slice(8, 10);
            }
          }
        }
      }
      return formatted;
    }
    
    return '+7';
  };

  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    inn: '',
    ...initialData // Применяем начальные данные
  });

  // Загружаем сохраненные данные пользователя при монтировании, если нет начальных
  useEffect(() => {
    if (Object.values(initialData).every(v => !v)) {
      if (typeof window !== 'undefined') {
        try {
          const savedData = localStorage.getItem('tlbot_user_data');
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Применяем маску к телефону при загрузке
            if (parsedData.phoneNumber) {
              parsedData.phoneNumber = formatPhoneNumber(parsedData.phoneNumber);
            }
            setUserData(prev => ({ ...prev, ...parsedData }));
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
        }
      }
    } else {
      // Если есть начальные данные, применяем маску к телефону
      const updatedData = { ...initialData };
      if (updatedData.phoneNumber) {
        updatedData.phoneNumber = formatPhoneNumber(updatedData.phoneNumber);
      }
      setUserData(prev => ({ ...prev, ...updatedData }));
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 Отправка данных формы:', userData);
    if (!userData.phoneNumber?.trim()) {
      alert('Пожалуйста, укажите номер телефона');
      return;
    }
    if (!userData.firstName?.trim()) {
      alert('Пожалуйста, укажите имя');
      return;
    }
    // ИНН теперь необязателен
    // Email теперь необязателен
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('tlbot_user_data', JSON.stringify(userData));
        console.log('💾 Данные сохранены в tlbot_user_data');
        
        // Также сохраняем в профиль для будущего использования
        localStorage.setItem('userProfileData', JSON.stringify(userData));
        console.log('👤 Данные сохранены в профиль пользователя');
      } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
      }
    }
    onSubmit(userData);
  };

  // Функция для форматирования номера телефона
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleChange('phoneNumber', formatted);
  };

  const handleChange = (field: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-center text-[#303030]">
          Данные для коммерческого предложения
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон *
            </label>
            <input
              type="tel"
              value={userData.phoneNumber || ''}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+7 (999) 999-99-99"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Логин в Telegram
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">@</span>
              <input
                type="text"
                value={userData.username || ''}
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                placeholder="username"
                disabled
                readOnly
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Логин определяется автоматически</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ИНН (при желании)
            </label>
            <input
              type="text"
              value={userData.inn || ''}
              onChange={(e) => handleChange('inn', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="1234567890"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-[#303030] text-white rounded-lg font-medium hover:bg-[#404040] transition-colors"
            >
              Отправить КП
            </button>
            
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-gray-100 text-[#303030] rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4">
          * Обязательное поле: Телефон. ИНН указывается при желании.
        </p>
      </div>
    </div>
  );
}
