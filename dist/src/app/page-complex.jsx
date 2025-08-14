"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
function HomeContent() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const isEditMode = searchParams.get('edit') === 'true';
    const [tg, setTg] = (0, react_1.useState)(null);
    const [userData, setUserData] = (0, react_1.useState)(null);
    const [formData, setFormData] = (0, react_1.useState)({
        contactName: '',
        inn: '',
        phone: '',
        email: ''
    });
    const [errors, setErrors] = (0, react_1.useState)({});
    const [isSubmitting, setIsSubmitting] = (0, react_1.useState)(false);
    const [isMounted, setIsMounted] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [isRedirecting, setIsRedirecting] = (0, react_1.useState)(false);
    // Валидация формы
    const validateForm = () => {
        const newErrors = {};
        if (!formData.contactName.trim()) {
            newErrors.contactName = 'Имя контактного лица обязательно';
        }
        if (!formData.inn.trim()) {
            newErrors.inn = 'ИНН организации обязателен';
        }
        else if (!/^\d{10}$|^\d{12}$/.test(formData.inn)) {
            newErrors.inn = 'ИНН должен содержать 10 или 12 цифр';
        }
        if (!formData.phone.trim()) {
            newErrors.phone = 'Номер телефона обязателен';
        }
        else if (!/^[\+]?[0-9\(\)\-\s]+$/.test(formData.phone)) {
            newErrors.phone = 'Некорректный формат телефона';
        }
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Некорректный формат email';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    // Обработка отправки формы
    const handleSubmit = async () => {
        if (validateForm()) {
            setIsSubmitting(true);
            try {
                // Создаем тестового пользователя если его нет (для тестирования вне Telegram)
                const testUser = userData || {
                    id: 12345,
                    first_name: 'Тестовый',
                    username: 'test_user'
                };
                console.log('Отправляем данные:', {
                    contactName: formData.contactName,
                    inn: formData.inn,
                    phone: formData.phone,
                    email: formData.email,
                    user: testUser,
                });
                // Сохраняем данные в базе данных
                const response = await fetch('/api/organizations', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contactName: formData.contactName,
                        inn: formData.inn,
                        phone: formData.phone,
                        email: formData.email,
                        user: testUser,
                    }),
                });
                const responseData = await response.json();
                console.log('Ответ сервера:', responseData);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${responseData.error || 'Ошибка при сохранении данных'}`);
                }
                const data = {
                    formType: 'organization_registration',
                    contactName: formData.contactName,
                    inn: formData.inn,
                    phone: formData.phone,
                    email: formData.email,
                    user: userData,
                    timestamp: new Date().toISOString()
                };
                // Отправляем данные в Telegram если доступно
                if (tg) {
                    tg.sendData(JSON.stringify(data));
                }
                // Переходим на страницу каталога
                setTimeout(() => {
                    router.push('/catalog');
                }, 500);
            }
            catch (error) {
                console.error('Ошибка при сохранении:', error);
                setIsSubmitting(false);
                const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
                alert(`Ошибка: ${errorMessage}`);
            }
        }
    };
    // Загрузка существующих данных организации
    const loadExistingOrganization = async (telegramId) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/organizations?telegramId=${telegramId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.organization) {
                    console.log('Найдена существующая организация');
                    // Если это режим редактирования, загружаем данные в форму
                    if (isEditMode) {
                        setFormData({
                            contactName: data.organization.contactName,
                            inn: data.organization.inn,
                            phone: data.organization.phone,
                            email: data.organization.email || '',
                        });
                        return false; // Не перенаправляем, показываем форму для редактирования
                    }
                    else {
                        // Обычный режим - перенаправляем в каталог
                        console.log('Перенаправляем в каталог...');
                        setIsRedirecting(true);
                        setTimeout(() => {
                            router.push('/catalog');
                        }, 1000);
                        return true; // Организация найдена, перенаправляем
                    }
                }
            }
            return false; // Организация не найдена
        }
        catch (error) {
            console.error('Ошибка при загрузке данных организации:', error);
            return false;
        }
        finally {
            setIsLoading(false);
        }
    };
    (0, react_1.useEffect)(() => {
        // Устанавливаем флаг монтирования
        setIsMounted(true);
        // Асинхронная функция для инициализации
        const initializeApp = async () => {
            // Инициализация Telegram WebApp
            if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                const webapp = window.Telegram.WebApp;
                setTg(webapp);
                // Готовность приложения
                webapp.ready();
                webapp.expand();
                // Получение данных пользователя
                if (webapp.initDataUnsafe?.user) {
                    setUserData(webapp.initDataUnsafe.user);
                    // Загружаем существующие данные организации и проверяем перенаправление
                    const organizationExists = await loadExistingOrganization(webapp.initDataUnsafe.user.id);
                    // Если организация не найдена, предзаполняем форму
                    if (!organizationExists) {
                        setFormData(prev => ({
                            ...prev,
                            contactName: webapp.initDataUnsafe.user?.first_name || ''
                        }));
                    }
                }
                else {
                    // Если нет данных пользователя, создаем тестового пользователя для разработки
                    const testUserId = 12345;
                    const organizationExists = await loadExistingOrganization(testUserId);
                    if (!organizationExists) {
                        setFormData(prev => ({
                            ...prev,
                            contactName: 'Тестовый пользователь'
                        }));
                    }
                }
                // Настройка главной кнопки
                webapp.MainButton.text = isEditMode ? 'Сохранить изменения' : 'Далее';
                webapp.MainButton.show();
                webapp.MainButton.onClick(handleSubmit);
            }
            else {
                // Если не в Telegram, также проверяем тестового пользователя
                const testUserId = 12345;
                const organizationExists = await loadExistingOrganization(testUserId);
                if (!organizationExists) {
                    setFormData(prev => ({
                        ...prev,
                        contactName: 'Тестовый пользователь'
                    }));
                }
            }
        };
        initializeApp();
    }, []);
    // Обновляем состояние кнопки при изменении формы
    (0, react_1.useEffect)(() => {
        if (tg && isMounted) {
            const isFormValid = formData.contactName && formData.inn && formData.phone;
            if (isFormValid && !isSubmitting) {
                tg.MainButton.text = isEditMode ? 'Сохранить изменения' : 'Далее';
            }
            else {
                tg.MainButton.text = 'Заполните обязательные поля';
            }
        }
    }, [formData, isSubmitting, tg, isMounted, isEditMode]);
    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
        // Очищаем ошибку при вводе
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };
    return (<div className="min-h-screen bg-[#f8f8f8] p-4">
      {isMounted ? (<div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6">
          {/* Кнопка "Назад" в режиме редактирования */}
          {isEditMode && (<div className="mb-6">
              <button onClick={() => router.push('/catalog')} className="flex items-center text-gray-600 hover:text-[#303030] transition-colors">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                </svg>
                Назад в каталог
              </button>
            </div>)}
          
          <h1 className="text-2xl font-bold text-center text-[#303030] mb-8">
            {isEditMode ? 'Редактирование данных' : 'Регистрация организации'}
          </h1>
          
          {isLoading ? (<div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#303030] mx-auto"></div>
              <p className="text-gray-600 mt-4">Проверяем регистрацию...</p>
            </div>) : isRedirecting ? (<div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-green-600 mt-4">Вы уже зарегистрированы!</p>
              <p className="text-gray-500 text-sm mt-2">Переходим в каталог...</p>
            </div>) : (<>
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                {/* Контактное лицо */}
                <div>
                  <label htmlFor="contactName" className="block text-sm font-medium text-[#303030] mb-2">
                    Контактное лицо <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="contactName" value={formData.contactName} onChange={handleInputChange('contactName')} className={`w-full px-4 py-3 border-2 rounded-lg bg-white text-[#303030] placeholder-gray-400 transition-colors focus:outline-none ${errors.contactName
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-[#303030]'}`} placeholder="Введите имя контактного лица"/>
                  {errors.contactName && (<p className="text-red-500 text-sm mt-1">{errors.contactName}</p>)}
                </div>

                {/* ИНН организации */}
                <div>
                  <label htmlFor="inn" className="block text-sm font-medium text-[#303030] mb-2">
                    ИНН организации <span className="text-red-500">*</span>
                  </label>
                  <input type="text" id="inn" value={formData.inn} onChange={handleInputChange('inn')} className={`w-full px-4 py-3 border-2 rounded-lg bg-white text-[#303030] placeholder-gray-400 transition-colors focus:outline-none ${errors.inn
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-[#303030]'}`} placeholder="1234567890" maxLength={12}/>
                  {errors.inn && (<p className="text-red-500 text-sm mt-1">{errors.inn}</p>)}
                </div>

                {/* Номер телефона */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-[#303030] mb-2">
                    Номер телефона <span className="text-red-500">*</span>
                  </label>
                  <input type="tel" id="phone" value={formData.phone} onChange={handleInputChange('phone')} className={`w-full px-4 py-3 border-2 rounded-lg bg-white text-[#303030] placeholder-gray-400 transition-colors focus:outline-none ${errors.phone
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-[#303030]'}`} placeholder="+7 (XXX) XXX-XX-XX"/>
                  {errors.phone && (<p className="text-red-500 text-sm mt-1">{errors.phone}</p>)}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#303030] mb-2">
                    Email
                  </label>
                  <input type="email" id="email" value={formData.email} onChange={handleInputChange('email')} className={`w-full px-4 py-3 border-2 rounded-lg bg-white text-[#303030] placeholder-gray-400 transition-colors focus:outline-none ${errors.email
                    ? 'border-red-500 focus:border-red-600'
                    : 'border-gray-300 focus:border-[#303030]'}`} placeholder="company@example.com"/>
                  {errors.email && (<p className="text-red-500 text-sm mt-1">{errors.email}</p>)}
                </div>

                {/* Кнопка для тестирования */}
                {isMounted && (<button type="button" onClick={handleSubmit} disabled={isSubmitting} className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${isSubmitting
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-[#303030] text-white hover:bg-[#404040] active:bg-[#202020]'}`}>
                    {isSubmitting ? (isEditMode ? 'Сохранение...' : 'Отправка...') : (isEditMode ? 'Сохранить изменения' : 'Далее')}
                  </button>)}
              </form>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500">
                  Поля отмеченные <span className="text-red-500">*</span> обязательны для заполнения
                </p>
              </div>
            </>)}
        </div>) : (<div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-6">
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>)}
    </div>);
}
function Home() {
    return (<react_1.Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-xl p-6">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-8"></div>
              <div className="space-y-6">
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
                <div className="h-16 bg-gray-100 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>}>
      <HomeContent />
    </react_1.Suspense>);
}
