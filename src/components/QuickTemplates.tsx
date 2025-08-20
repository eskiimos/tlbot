'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QuickTemplate, quickTemplates } from '@/lib/quickTemplates';

interface QuickTemplateCardProps {
  template: QuickTemplate;
  onSelect: (template: QuickTemplate) => void;
}

function QuickTemplateCard({ template, onSelect }: QuickTemplateCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {template.popular && (
        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mb-3">
          🔥 Популярно
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {template.name}
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        {template.description}
      </p>
      
      <div className="space-y-2 mb-4">
        {template.items.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span className="text-gray-700">{item.productName}</span>
            <span className="text-gray-500">{item.price}₽</span>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <div className="text-sm text-gray-500 line-through">
              {template.originalPrice.toLocaleString()}₽
            </div>
            <div className="text-lg font-bold text-gray-900">
              {template.discountedPrice.toLocaleString()}₽
            </div>
          </div>
          <div className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm font-medium">
            -{template.discount}%
          </div>
        </div>
        
        <button
          onClick={() => onSelect(template)}
          className="w-full bg-[#303030] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#404040] transition-colors"
        >
          Выбрать комбо
        </button>
      </div>
    </div>
  );
}

interface QuickTemplatesProps {
  onTemplateSelect: (template: QuickTemplate) => void;
}

export default function QuickTemplates({ onTemplateSelect }: QuickTemplatesProps) {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🚀 Быстрые шаблоны
        </h1>
        <p className="text-gray-600">
          Готовые комбинации товаров со скидкой 10%
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {quickTemplates.map((template) => (
          <QuickTemplateCard
            key={template.id}
            template={template}
            onSelect={onTemplateSelect}
          />
        ))}
      </div>
      
      <div className="text-center">
        <Link
          href="/catalog"
          className="inline-flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          Посмотреть весь каталог
        </Link>
      </div>
    </div>
  );
}
