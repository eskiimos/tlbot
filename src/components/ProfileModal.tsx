import React, { useState, useEffect } from 'react';
import Image from 'next/image';

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

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userData: UserData | null;
  onSave: (data: UserData) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userData,
  onSave
}) => {
  const [formData, setFormData] = useState<UserData>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    companyName: '',
    inn: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Функция для форматирования номера телефона
  const formatPhoneNumber = (value: string) => {
    // Удаляем все символы кроме цифр
    const numbers = value.replace(/\D/g, '');
    
    // Если номер начинается с 8, заменяем на 7
    const normalizedNumbers = numbers.startsWith('8') ? '7' + numbers.slice(1) : numbers;
    
    // Применяем маску +7 (999) 999-99-99
    if (normalizedNumbers.length === 0) return '';
    if (normalizedNumbers.length === 1) return `+${normalizedNumbers}`;
    if (normalizedNumbers.length <= 4) return `+${normalizedNumbers.slice(0, 1)} (${normalizedNumbers.slice(1)}`;
    if (normalizedNumbers.length <= 7) {
      return `+${normalizedNumbers.slice(0, 1)} (${normalizedNumbers.slice(1, 4)}) ${normalizedNumbers.slice(4)}`;
    }
    if (normalizedNumbers.length <= 9) {
      return `+${normalizedNumbers.slice(0, 1)} (${normalizedNumbers.slice(1, 4)}) ${normalizedNumbers.slice(4, 7)}-${normalizedNumbers.slice(7)}`;
    }
    return `+${normalizedNumbers.slice(0, 1)} (${normalizedNumbers.slice(1, 4)}) ${normalizedNumbers.slice(4, 7)}-${normalizedNumbers.slice(7, 9)}-${normalizedNumbers.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData(prev => ({ ...prev, phoneNumber: formatted }));
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: '' }));
    }
  };

  // Загружаем данные при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      // Загружаем данные из localStorage
      const savedData = localStorage.getItem('userProfileData');
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setFormData(parsed);
        } catch (e) {
          console.error('Ошибка парсинга сохраненных данных профиля:', e);
        }
      } else if (userData) {
        // Если нет сохраненных данных, используем данные из Telegram
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          phoneNumber: userData.phoneNumber || '',
          email: userData.email || '',
          companyName: userData.companyName || '',
          inn: userData.inn || ''
        });
      }
    }
  }, [isOpen, userData]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'Имя обязательно для заполнения';
    }

    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Номер телефона обязателен для заполнения';
    } else {
      // Проверяем корректность номера телефона
      const numbers = formData.phoneNumber.replace(/\D/g, '');
      if (numbers.length !== 11) {
        newErrors.phoneNumber = 'Номер телефона должен содержать 11 цифр';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      // Сохраняем в localStorage
      localStorage.setItem('userProfileData', JSON.stringify(formData));
      
      // Возвращаем данные с telegramId если он есть
      const dataToSave = {
        ...formData,
        telegramId: userData?.telegramId,
        username: userData?.username
      };
      
      onSave(dataToSave);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
        {/* Заголовок */}
        <div className="flex-shrink-0 bg-white border-b border-black/5 p-5 sm:p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#303030]">Мой профиль</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/5 rounded-full transition-colors -mr-2"
            >
              <Image
                src="/material-symbols_info-outline.svg"
                alt="Закрыть"
                width={20}
                height={20}
                className="w-5 h-5 rotate-45"
              />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Данные будут использоваться для быстрого оформления коммерческих предложений
          </p>
          <div className="bg-black/5 p-2 rounded-xl mt-2">
            <p className="text-xs text-[#303030]">
              💡 После сохранения, форма КП будет автоматически заполнена этими данными
            </p>
          </div>
        </div>

        {/* Контент формы */}
        <div className="p-4 space-y-4">
          {/* Имя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Имя *
            </label>
            <input
              type="text"
              value={formData.firstName || ''}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, firstName: e.target.value }));
                if (errors.firstName) {
                  setErrors(prev => ({ ...prev, firstName: '' }));
                }
              }}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#303030] focus:border-transparent ${
                errors.firstName ? 'border-red-500' : 'border-black/10'
              }`}
              placeholder="Введите ваше имя"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Фамилия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фамилия
            </label>
            <input
              type="text"
              value={formData.lastName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full p-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-[#303030] focus:border-transparent"
              placeholder="Введите вашу фамилию"
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер телефона *
            </label>
            <input
              type="tel"
              value={formData.phoneNumber || ''}
              onChange={handlePhoneChange}
              className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-[#303030] focus:border-transparent ${
                errors.phoneNumber ? 'border-red-500' : 'border-black/10'
              }`}
              placeholder="+7 (999) 999-99-99"
            />
            {errors.phoneNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full p-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-[#303030] focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          {/* Компания */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название компании
            </label>
            <input
              type="text"
              value={formData.companyName || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
              className="w-full p-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-[#303030] focus:border-transparent"
              placeholder="ООО «Ваша компания»"
            />
          </div>

          {/* ИНН */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ИНН (необязательно)
            </label>
            <input
              type="text"
              value={formData.inn || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, inn: e.target.value }))}
              className="w-full p-3 border border-black/10 rounded-xl focus:ring-2 focus:ring-[#303030] focus:border-transparent"
              placeholder="1234567890"
              maxLength={12}
            />
            <p className="text-xs text-gray-500 mt-1">
              ИНН поможет нам подготовить документы для юридических лиц
            </p>
          </div>

          {/* Telegram данные (если есть) */}
          {userData?.username && (
            <div className="bg-black/5 p-3 rounded-xl">
              <p className="text-sm text-[#303030]">
                <strong>Telegram:</strong> @{userData.username}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Данные из вашего Telegram аккаунта
              </p>
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className="sticky bottom-0 bg-white border-t border-black/5 p-4 rounded-b-3xl sm:rounded-b-3xl mt-auto">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3.5 text-[#303030] bg-white border border-[#303030]/20 rounded-xl hover:bg-black/5 transition-colors font-medium text-sm"
            >
              Отмена
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3.5 bg-[#303030] text-white rounded-xl hover:bg-black shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all font-medium text-sm"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
