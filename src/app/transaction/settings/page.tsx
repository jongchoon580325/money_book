'use client';

import { Suspense, useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/PageHeader';

export default function TransactionSettings() {
  // 위로가기 버튼 핸들러
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-[calc(100vh-8rem)] bg-[#365749] text-white p-6">
      {/* 위로가기 버튼 */}
      <button
        onClick={handleScrollTop}
        className={`fixed bottom-8 right-8 z-50 bg-white/90 hover:bg-blue-500 text-blue-900 hover:text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors border-2 border-blue-500 transition-opacity duration-300 ${showScrollTop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-label="위로 가기"
      >
        ↑ 위로가기
      </button>
      <div className="container mx-auto">
        <PageHeader 
          title="거래 설정" 
          description="거래 내역 관리를 위한 설정을 구성하세요."
        />
        {/* 추후 설정 옵션 구현 */}
      </div>
    </main>
  );
} 