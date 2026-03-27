import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEMO_USERS = [
  {
    telegramId: BigInt('100000001'),
    username: 'aleksey_ivanov',
    firstName: 'Алексей',
    lastName: 'Иванов',
    customerName: 'Алексей Иванов',
    customerEmail: 'a.ivanov@sportlife.ru',
    customerPhone: '+7 (916) 234-56-78',
    customerCompany: 'SportLife Group',
    customerInn: '7704567890',
  },
  {
    telegramId: BigInt('100000002'),
    username: 'marina_petrova',
    firstName: 'Марина',
    lastName: 'Петрова',
    customerName: 'Марина Петрова',
    customerEmail: 'mpetrova@freshteam.com',
    customerPhone: '+7 (903) 345-67-89',
    customerCompany: 'Fresh Team Agency',
    customerInn: '7743198234',
  },
  {
    telegramId: BigInt('100000003'),
    username: 'dmitry_volkov',
    firstName: 'Дмитрий',
    lastName: 'Волков',
    customerName: 'Дмитрий Волков',
    customerEmail: 'volkov@techcorp.io',
    customerPhone: '+7 (926) 456-78-90',
    customerCompany: 'TechCorp Solutions',
    customerInn: '7719823456',
  },
  {
    telegramId: BigInt('100000004'),
    username: 'olga_smirnova',
    firstName: 'Ольга',
    lastName: 'Смирнова',
    customerName: 'Ольга Смирнова',
    customerEmail: 'o.smirnova@brandhouse.ru',
    customerPhone: '+7 (495) 567-89-01',
    customerCompany: 'BrandHouse Moscow',
    customerInn: '7701234567',
  },
  {
    telegramId: BigInt('100000005'),
    username: 'artem_kozlov',
    firstName: 'Артём',
    lastName: 'Козлов',
    customerName: 'Артём Козлов',
    customerEmail: 'kozlov@fit-club.ru',
    customerPhone: '+7 (962) 678-90-12',
    customerCompany: 'FitClub Сеть',
    customerInn: '7736541098',
  },
];

const MOCK_ORDERS = [
  // Завершённые
  {
    userIdx: 0,
    status: 'COMPLETED',
    daysAgo: 45,
    items: [
      {
        productName: 'Футболка TL',
        productSlug: 't-shirt',
        quantity: 50,
        basePrice: 750,
        totalPrice: 37500,
        image: '/products/t-shirt/t-shirt_1.webp',
        optionsDetails: [
          { name: 'Хлопок 100%', category: 'Материал', price: 0 },
          { name: 'Белый', category: 'Цвет', price: 0 },
          { name: 'DTF печать', category: 'Нанесение', price: 150 },
        ],
      },
      {
        productName: 'Шоппер TL',
        productSlug: 'shopper',
        quantity: 50,
        basePrice: 350,
        totalPrice: 17500,
        image: '/products/shopper/black.webp',
        optionsDetails: [
          { name: 'Чёрный', category: 'Цвет', price: 0 },
          { name: 'Шелкотрафарет', category: 'Нанесение', price: 0 },
        ],
      },
    ],
    totalAmount: 55000,
    adminComment: 'Заказ выполнен, выдан курьеру 12.02. Клиент доволен качеством.',
  },
  {
    userIdx: 1,
    status: 'COMPLETED',
    daysAgo: 30,
    items: [
      {
        productName: 'Худи TL',
        productSlug: 'hoodies',
        quantity: 30,
        basePrice: 2100,
        totalPrice: 63000,
        image: '/products/hoodies/hoodies_1.webp',
        optionsDetails: [
          { name: 'Трёхнитка с начёсом', category: 'Материал', price: 200 },
          { name: 'Чёрный', category: 'Цвет', price: 0 },
          { name: 'Вышивка', category: 'Нанесение', price: 350 },
          { name: 'Без капюшона', category: 'Конструкция', price: 0 },
        ],
      },
    ],
    totalAmount: 63000,
    adminComment: 'Отгрузка 05.03. Вышивка выполнена в 2 цвета по макету клиента.',
  },

  // Производство
  {
    userIdx: 2,
    status: 'PRODUCTION',
    daysAgo: 10,
    items: [
      {
        productName: 'Свитшот TL',
        productSlug: 'sweatshirt',
        quantity: 40,
        basePrice: 1700,
        totalPrice: 68000,
        image: '/products/sweatshirt/sweatshirt_1.webp',
        optionsDetails: [
          { name: 'Футер 2-х нитка', category: 'Материал', price: 0 },
          { name: 'Серый меланж', category: 'Цвет', price: 0 },
          { name: 'DTG печать', category: 'Нанесение', price: 250 },
        ],
      },
      {
        productName: 'Штаны TL',
        productSlug: 'pants',
        quantity: 40,
        basePrice: 1900,
        totalPrice: 76000,
        image: '/products/pants/pants_1.webp',
        optionsDetails: [
          { name: 'Двунитка', category: 'Материал', price: 0 },
          { name: 'Серый меланж', category: 'Цвет', price: 0 },
        ],
      },
    ],
    totalAmount: 144000,
    adminComment: 'Пошив в процессе. Готовность ~5 апреля.',
  },
  {
    userIdx: 3,
    status: 'PRODUCTION',
    daysAgo: 7,
    items: [
      {
        productName: 'Зип худи TL',
        productSlug: 'zip-hoodie',
        quantity: 25,
        basePrice: 2600,
        totalPrice: 65000,
        image: '/products/zip-hoodie/zip-hoodie_1.webp',
        optionsDetails: [
          { name: 'Трёхнитка петля', category: 'Материал', price: 300 },
          { name: 'Чёрный', category: 'Цвет', price: 0 },
          { name: 'Вышивка на груди', category: 'Нанесение', price: 400 },
          { name: 'Молния YKK', category: 'Фурнитура', price: 150 },
        ],
      },
    ],
    totalAmount: 65000,
    adminComment: null,
  },

  // Дизайн
  {
    userIdx: 4,
    status: 'DESIGN',
    daysAgo: 4,
    items: [
      {
        productName: 'Лонгслив TL',
        productSlug: 'longsleeve',
        quantity: 60,
        basePrice: 1100,
        totalPrice: 66000,
        image: '/products/longsleeve/long_sleeve_1.webp',
        optionsDetails: [
          { name: 'Хлопок 100%', category: 'Материал', price: 0 },
          { name: 'Белый', category: 'Цвет', price: 0 },
          { name: 'DTF печать (рукав + грудь)', category: 'Нанесение', price: 200 },
        ],
        designComment: 'Логотип на левой груди и принт на рукаве. Файлы в AI.',
      },
    ],
    totalAmount: 66000,
    adminComment: 'Ожидаем макет от дизайнера.',
  },

  // В обработке
  {
    userIdx: 0,
    status: 'IN_PROGRESS',
    daysAgo: 2,
    items: [
      {
        productName: 'Халфзип TL',
        productSlug: 'halfzip',
        quantity: 35,
        basePrice: 2100,
        totalPrice: 73500,
        image: '/products/halfzip/halfzip_1.webp',
        optionsDetails: [
          { name: 'Трёхнитка с начёсом', category: 'Материал', price: 200 },
          { name: 'Тёмно-синий', category: 'Цвет', price: 0 },
          { name: 'Вышивка', category: 'Нанесение', price: 350 },
        ],
      },
      {
        productName: 'Шорты TL',
        productSlug: 'shorts',
        quantity: 35,
        basePrice: 1350,
        totalPrice: 47250,
        image: '/products/shorts/short_1.webp',
        optionsDetails: [
          { name: 'Двунитка', category: 'Материал', price: 0 },
          { name: 'Тёмно-синий', category: 'Цвет', price: 0 },
          { name: 'Шелкотрафарет', category: 'Нанесение', price: 100 },
        ],
      },
    ],
    totalAmount: 120750,
    adminComment: 'Согласовываем раскладку размеров.',
  },

  // Готов к выдаче
  {
    userIdx: 2,
    status: 'READY',
    daysAgo: 1,
    items: [
      {
        productName: 'Джинсы TL',
        productSlug: 'jeans',
        quantity: 20,
        basePrice: 3500,
        totalPrice: 70000,
        image: '/products/jeans/black.webp',
        optionsDetails: [
          { name: 'Деним 12 oz', category: 'Материал', price: 0 },
          { name: 'Чёрный', category: 'Цвет', price: 0 },
          { name: 'Вышивка на кармане', category: 'Нанесение', price: 300 },
        ],
      },
    ],
    totalAmount: 70000,
    adminComment: 'Заказ готов, ожидает самовывоза. Контакт: +7 (926) 456-78-90',
  },

  // Новые заявки
  {
    userIdx: 1,
    status: 'NEW',
    daysAgo: 0,
    items: [
      {
        productName: 'Футболка TL',
        productSlug: 't-shirt',
        quantity: 100,
        basePrice: 700,
        totalPrice: 70000,
        image: '/products/t-shirt/t-shirt_2.webp',
        optionsDetails: [
          { name: 'Хлопок 100%', category: 'Материал', price: 0 },
          { name: 'Белый', category: 'Цвет', price: 0 },
          { name: 'Шелкотрафарет', category: 'Нанесение', price: 100 },
        ],
      },
      {
        productName: 'Худи TL',
        productSlug: 'hoodies',
        quantity: 100,
        basePrice: 2100,
        totalPrice: 210000,
        image: '/products/hoodies/hoodies_2.webp',
        optionsDetails: [
          { name: 'Трёхнитка с начёсом', category: 'Материал', price: 200 },
          { name: 'Чёрный', category: 'Цвет', price: 0 },
          { name: 'Шелкотрафарет', category: 'Нанесение', price: 150 },
        ],
      },
    ],
    totalAmount: 280000,
    adminComment: null,
  },
  {
    userIdx: 3,
    status: 'NEW',
    daysAgo: 0,
    items: [
      {
        productName: 'Свитшот TL',
        productSlug: 'sweatshirt',
        quantity: 15,
        basePrice: 2000,
        totalPrice: 30000,
        image: '/products/sweatshirt/sweatshirt_2.webp',
        optionsDetails: [
          { name: 'Футер 3-х нитка', category: 'Материал', price: 150 },
          { name: 'Бежевый', category: 'Цвет', price: 0 },
          { name: 'Вышивка', category: 'Нанесение', price: 350 },
        ],
        designComment: 'Логотип компании на груди, размер 8x8 см',
      },
    ],
    totalAmount: 30000,
    adminComment: null,
  },
];

export async function POST() {
  try {
    // Создаём демо-пользователей (или находим существующих)
    const createdUsers: { id: string; telegramId: string }[] = [];

    for (const u of DEMO_USERS) {
      const user = await prisma.user.upsert({
        where: { telegramId: u.telegramId },
        update: {},
        create: {
          telegramId: u.telegramId,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
        },
      });
      createdUsers.push({ id: user.id, telegramId: user.telegramId.toString() });
    }

    // Создаём заказы
    let ordersCreated = 0;
    for (const mock of MOCK_ORDERS) {
      const user = createdUsers[mock.userIdx];
      const demo = DEMO_USERS[mock.userIdx];

      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - mock.daysAgo);
      createdAt.setHours(Math.floor(Math.random() * 8) + 9); // 9:00–17:00

      await prisma.order.create({
        data: {
          userId: user.id,
          telegramId: user.telegramId,
          customerName: demo.customerName,
          customerEmail: demo.customerEmail,
          customerPhone: demo.customerPhone,
          customerCompany: demo.customerCompany,
          customerInn: demo.customerInn,
          items: mock.items as any,
          totalAmount: mock.totalAmount,
          status: mock.status as any,
          adminComment: mock.adminComment ?? null,
          createdAt,
          updatedAt: createdAt,
        },
      });

      ordersCreated++;
    }

    return NextResponse.json({
      ok: true,
      results: [
        `✅ Пользователей: ${createdUsers.length}`,
        `✅ Заказов: ${ordersCreated}`,
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
