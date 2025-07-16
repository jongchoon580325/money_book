// '수입/지출'별 관-항-목 계층형 아코디언 카테고리 관리 UI 최상위 컴포넌트
'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryType } from '@/types/category';
import { categoryDB } from '@/utils/indexedDB';
import AccordionCategoryGroup from './AccordionCategoryGroup';

// 아코디언 탭(수입/지출) + 관 그룹
export default function AccordionCategoryTabs() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<CategoryType>('income');

  // DB에서 전체 카테고리 로드
  const loadCategories = async () => {
    const all = await categoryDB.getAllCategories();
    setCategories(all);
  };
  useEffect(() => { loadCategories(); }, []);

  // 관 목록 추출(중복 제거)
  const gwanList = Array.from(
    new Set(categories.filter(c => c.type === tab).map(c => c.section))
  ).filter(Boolean);

  return (
    <div className="w-full">
      {/* 수입/지출 탭 */}
      <div className="flex w-full rounded-xl bg-gray-700/50 p-1 mb-4">
        {['income', 'expense'].map((type) => (
          <button
            key={type}
            className={`w-1/2 rounded-lg py-3 text-lg font-medium transition-all ${
              tab === type
                ? type === 'income'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-red-600 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
            onClick={() => setTab(type as CategoryType)}
          >
            {type === 'income' ? '수입' : '지출'}
          </button>
        ))}
      </div>
      {/* 관별 아코디언 그룹 */}
      <div className="space-y-2">
        {gwanList.length === 0 && (
          <div className="text-gray-400 text-center py-8">카테고리가 없습니다.</div>
        )}
        {gwanList.map((gwan) => (
          <AccordionCategoryGroup
            key={gwan}
            gwan={gwan}
            categories={categories.filter(c => c.type === tab && c.section === gwan)}
            onUpdate={loadCategories}
            type={tab}
          />
        ))}
      </div>
    </div>
  );
} 