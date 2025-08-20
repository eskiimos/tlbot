// Типы для работы с услугами

export interface Service {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceFrom: string; // В копейках, как строка для JSON
  priceTo: string | null; // В копейках, как строка для JSON
  category: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceData {
  name: string;
  slug: string;
  description?: string;
  priceFrom: number; // В копейках
  priceTo?: number; // В копейках
  category: string;
}

export interface ServiceCategory {
  design: 'design';
  development: 'development';
  consulting: 'consulting';
  marketing: 'marketing';
}

export const SERVICE_CATEGORIES = {
  design: 'Дизайн',
  development: 'Разработка',
  consulting: 'Консультации',
  marketing: 'Маркетинг'
} as const;

// Вспомогательные функции
export function formatServicePrice(priceFromKopecks: string, priceToKopecks?: string | null): string {
  const priceFrom = parseInt(priceFromKopecks) / 100;
  
  if (priceToKopecks) {
    const priceTo = parseInt(priceToKopecks) / 100;
    return `${priceFrom.toLocaleString('ru-RU')} - ${priceTo.toLocaleString('ru-RU')} руб`;
  }
  
  return `от ${priceFrom.toLocaleString('ru-RU')} руб`;
}

export function convertRublesToKopecks(rubles: number): number {
  return rubles * 100;
}

export function convertKopecksToRubles(kopecks: string | number): number {
  const kopecksNum = typeof kopecks === 'string' ? parseInt(kopecks) : kopecks;
  return kopecksNum / 100;
}
