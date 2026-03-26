'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white mt-12">
      <div className="max-w-md mx-auto px-4 py-8">

        {/* Логотип + слоган */}
        <div className="mb-6">
          <Image
            src="/TLlogo.svg"
            alt="Total Lookas"
            width={80}
            height={28}
            className="h-7 w-auto mb-2"
          />
          <p className="text-xs text-gray-400 leading-relaxed">
            B2B платформа для производства брендированного мерча
          </p>
        </div>

        {/* Навигация */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Каталог</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/catalog" className="text-sm text-[#303030] hover:text-black transition-colors">
                  Все товары
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=футболки" className="text-sm text-[#303030] hover:text-black transition-colors">
                  Футболки
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=худи" className="text-sm text-[#303030] hover:text-black transition-colors">
                  Худи
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=свитшоты" className="text-sm text-[#303030] hover:text-black transition-colors">
                  Свитшоты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Компания</p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/?welcome=true" className="text-sm text-[#303030] hover:text-black transition-colors">
                  Наши услуги
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-sm text-[#303030] hover:text-black transition-colors">
                  Корзина
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/totallookas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#303030] hover:text-black transition-colors"
                >
                  Telegram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Разделитель */}
        <div className="border-t border-black/5 pt-5 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            © {new Date().getFullYear()} Total Lookas
          </p>
          <p className="text-[11px] text-gray-400">
            Все права защищены
          </p>
        </div>

      </div>
    </footer>
  );
}
