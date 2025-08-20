export interface QuickTemplate {
  id: string;
  name: string;
  description: string;
  items: TemplateItem[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  popular?: boolean;
  image?: string;
}

export interface TemplateItem {
  productSlug: string;
  productName: string;
  quantity: number;
  selectedOptions: {[category: string]: string[]};
  price: number;
}

export const quickTemplates: QuickTemplate[] = [
  {
    id: 'basic-combo',
    name: 'Базовый комплект',
    description: 'Футболка + Шоппер с логотипом компании',
    popular: true,
    items: [
      {
        productSlug: 't-shirt',
        productName: 'Футболка TL',
        quantity: 1,
        selectedOptions: {
          color: ['Черный'],
          print: ['Шелкография'],
          design: ['Есть дизайн']
        },
        price: 900
      },
      {
        productSlug: 'shopper',
        productName: 'Шоппер TL',
        quantity: 1,
        selectedOptions: {
          color: ['Черный'],
          print: ['Шелкография'],
          design: ['Есть дизайн']
        },
        price: 400
      }
    ],
    originalPrice: 1300,
    discountedPrice: 1170, // -10%
    discount: 10
  },
  {
    id: 'office-style',
    name: 'Офисный стиль',
    description: 'Лонгслив + Шоппер для корпоративного стиля',
    items: [
      {
        productSlug: 'longsleeve',
        productName: 'Лонгслив TL',
        quantity: 1,
        selectedOptions: {
          color: ['Темно-синий'],
          print: ['Вышивка'],
          design: ['Есть дизайн']
        },
        price: 1350
      },
      {
        productSlug: 'shopper',
        productName: 'Шоппер TL',
        quantity: 1,
        selectedOptions: {
          color: ['Темно-синий'],
          print: ['Шелкография'],
          design: ['Есть дизайн']
        },
        price: 400
      }
    ],
    originalPrice: 1750,
    discountedPrice: 1575, // -10%
    discount: 10
  },
  {
    id: 'sport-team',
    name: 'Спорт команда',
    description: 'Футболка + Шорты с номерами и логотипом',
    popular: true,
    items: [
      {
        productSlug: 't-shirt',
        productName: 'Футболка TL',
        quantity: 1,
        selectedOptions: {
          color: ['Белый'],
          print: ['Термотрансфер'],
          design: ['Нужен дизайн']
        },
        price: 900
      },
      {
        productSlug: 'shorts',
        productName: 'Шорты TL',
        quantity: 1,
        selectedOptions: {
          color: ['Черный'],
          print: ['Термотрансфер'],
          design: ['Нужен дизайн']
        },
        price: 1600
      }
    ],
    originalPrice: 2500,
    discountedPrice: 2250, // -10%
    discount: 10
  },
  {
    id: 'winter-combo',
    name: 'Зимний комплект',
    description: 'Худи + Штаны для холодного сезона',
    items: [
      {
        productSlug: 'hoodies',
        productName: 'Худи TL',
        quantity: 1,
        selectedOptions: {
          color: ['Серый'],
          print: ['Термотрансфер'],
          design: ['Есть дизайн']
        },
        price: 2500
      },
      {
        productSlug: 'pants',
        productName: 'Штаны TL',
        quantity: 1,
        selectedOptions: {
          color: ['Серый'],
          print: ['Термотрансфер'],
          design: ['Есть дизайн']
        },
        price: 2200
      }
    ],
    originalPrice: 4700,
    discountedPrice: 4230, // -10%
    discount: 10
  },
  {
    id: 'premium-set',
    name: 'Премиум набор',
    description: 'Зип худи + Джинсы для VIP клиентов',
    items: [
      {
        productSlug: 'zip-hoodie',
        productName: 'Зип худи TL',
        quantity: 1,
        selectedOptions: {
          color: ['Черный'],
          print: ['Цифровая печать'],
          design: ['Есть дизайн']
        },
        price: 3000
      },
      {
        productSlug: 'jeans',
        productName: 'Джинсы TL',
        quantity: 1,
        selectedOptions: {
          color: ['Черный'],
          print: ['Вышивка'],
          design: ['Есть дизайн']
        },
        price: 4000
      }
    ],
    originalPrice: 7000,
    discountedPrice: 6300, // -10%
    discount: 10
  },
  {
    id: 'promo-action',
    name: 'Промо акция',
    description: 'Свитшот + Шоппер для промо кампаний',
    items: [
      {
        productSlug: 'sweatshirt',
        productName: 'Свитшот TL',
        quantity: 1,
        selectedOptions: {
          color: ['Белый'],
          print: ['Шелкография'],
          design: ['Есть дизайн']
        },
        price: 2000
      },
      {
        productSlug: 'shopper',
        productName: 'Шоппер TL',
        quantity: 1,
        selectedOptions: {
          color: ['Белый'],
          print: ['Шелкография'],
          design: ['Есть дизайн']
        },
        price: 400
      }
    ],
    originalPrice: 2400,
    discountedPrice: 2160, // -10%
    discount: 10
  }
];
