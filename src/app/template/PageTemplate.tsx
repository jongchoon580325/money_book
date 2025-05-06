'use client';

import { ReactNode } from 'react';
import { PageHeader } from '@/components/common/PageHeader';

interface PageTemplateProps {
  header?: ReactNode;
  financialStatus?: ReactNode;
  transactionTabs?: ReactNode;
  categorySection?: ReactNode;
  periodFilterSection?: ReactNode;
  children?: ReactNode;
}

export default function PageTemplate({
  header = (
    <>
      <PageHeader
        title="샘플 템플릿 페이지"
        description="이 페이지는 신규 페이지 생성을 위한 템플릿입니다."
      />
    </>
  ),
}: PageTemplateProps) {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[#365749] text-white p-6">
      {/* 위로가기 버튼 (복제 시 필요에 따라 커스텀) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 right-8 z-50 bg-white/90 hover:bg-blue-500 text-blue-900 hover:text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors border-2 border-blue-500 transition-opacity duration-300`}
        aria-label="위로 가기"
      >
        ↑ 위로가기
      </button>
      <div className="container mx-auto">
        {/* 헤더 영역 */}
        {header}
      </div>
    </main>
  );
} 