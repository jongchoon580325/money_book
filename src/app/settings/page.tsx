'use client';

import { PageHeader } from '@/components/common/PageHeader';
import { CategoryTabs } from '@/components/settings/CategoryTabs';
import { Toast } from '@/components/common/Toast';
import { parseCSV, validateTransactionData, validateCategoryData, exportToCSV } from '@/utils/csvHandler';
import { formatDateForFilename } from '@/utils/dateFormatter';
import { categoryDB, transactionDB } from '@/utils/indexedDB';
import { useState, useEffect } from 'react';
import { Category } from '@/types/category';
import { Transaction } from '@/types/transaction';
import PasswordModal from '@/components/settings/PasswordModal';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/common/ConfirmModal';
import AccordionCategoryTabs from '@/components/settings/AccordionCategoryTabs';

export default function SettingsPage() {
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwModalMode, setPwModalMode] = useState<'change' | 'reset'>('change');
  const router = useRouter();
  const [showExportModal, setShowExportModal] = useState<'transaction' | 'category' | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('isLoggedIn') !== 'true') {
      router.replace('/');
      return;
    }
  }, [router]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImportTransactions = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const data = await parseCSV(file);
        if (!validateTransactionData(data)) {
          showToast('CSV 파일 형식이 올바르지 않습니다.', 'error');
          return;
        }

        // 거래내역 데이터 저장
        for (const item of data) {
          const transaction: Transaction = {
            id: crypto.randomUUID(),
            date: item.date,
            type: item.type,
            section: item.section,
            category: item.category,
            subcategory: item.subcategory || '',
            amount: parseFloat(String(item.amount).replace(/,/g, '')),
            memo: item.memo || ''
          };
          await transactionDB.addTransaction(transaction);
        }

        showToast('거래내역을 성공적으로 가져왔습니다.', 'success');
        window.dispatchEvent(new CustomEvent('transactionUpdate'));
        setTimeout(() => window.location.reload(), 800);
      } catch (error) {
        console.error('거래내역 가져오기 실패:', error);
        showToast('거래내역 가져오기에 실패했습니다.', 'error');
      }
    };
    input.click();
  };

  const handleExportTransactions = async () => {
    setShowExportModal('transaction');
  };

  const handleExportCategories = async () => {
    setShowExportModal('category');
  };

  const doExportTransactions = async () => {
    try {
      const transactions = await transactionDB.getAllTransactions();
      const exportData = transactions.length > 0 
        ? transactions.map(transaction => ({
            date: transaction.date || '',
            type: transaction.type || 'expense',
            section: transaction.section || '',
            category: transaction.category || '',
            subcategory: transaction.subcategory || '',
            amount: typeof transaction.amount === 'number' ? transaction.amount : 0,
            memo: transaction.memo || ''
          }))
        : [];
      const dateStr = formatDateForFilename();
      const filename = `${dateStr}-거래내역_내보내기.csv`;
      if (transactions.length === 0) {
        showToast('내보낼 데이터가 없습니다. 빈 파일이 생성됩니다.', 'success');
      }
      exportToCSV(exportData, filename, false);
      showToast('거래내역을 성공적으로 내보냈습니다.', 'success');
    } catch (error) {
      console.error('거래내역 내보내기 실패:', error);
      showToast('거래내역 내보내기에 실패했습니다.', 'error');
    }
    setShowExportModal(null);
  };

  const doExportCategories = async () => {
    try {
      const categories = await categoryDB.getAllCategories();
      const exportCategories = categories.map(({ type, section, category, subcategory }) => ({ type, section, category, subcategory }));
      const dateStr = formatDateForFilename();
      const filename = `${dateStr}-카테고리_내보내기.csv`;
      if (categories.length === 0) {
        showToast('내보낼 데이터가 없습니다. 빈 파일이 생성됩니다.', 'success');
      }
      exportToCSV(exportCategories, filename, true);
      showToast('카테고리를 성공적으로 내보냈습니다.', 'success');
    } catch (error) {
      console.error('카테고리 내보내기 실패:', error);
      showToast('카테고리 내보내기에 실패했습니다.', 'error');
    }
    setShowExportModal(null);
  };

  const handleImportCategories = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const data = await parseCSV(file);
        if (!validateCategoryData(data)) {
          showToast('CSV 파일 형식이 올바르지 않습니다.', 'error');
          return;
        }

        // 카테고리 데이터 저장
        for (const item of data) {
          const category: Category = {
            id: crypto.randomUUID(),
            type: item.type,
            section: item.section,
            category: item.category,
            subcategory: item.subcategory || '',
            order: item.order !== undefined ? parseInt(item.order) || 0 : 0
          };
          await categoryDB.addCategory(category);
        }

        showToast('카테고리를 성공적으로 가져왔습니다.', 'success');
        window.dispatchEvent(new CustomEvent('categoryUpdate'));
        setTimeout(() => window.location.reload(), 800);
      } catch (error) {
        console.error('카테고리 가져오기 실패:', error);
        showToast('카테고리 가져오기에 실패했습니다.', 'error');
      }
    };
    input.click();
  };

  // 위로가기 버튼 핸들러
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetAllClick = () => {
    setShowResetModal(true);
  };

  const handleResetAllConfirm = async () => {
    setResetLoading(true);
    try {
      // 모든 거래내역, 카테고리 삭제
      await transactionDB.clearAllTransactions();
      await categoryDB.clearAllCategories();
      setToast({ show: true, message: '모든 데이터가 초기화되었습니다.', type: 'success' });
      setTimeout(() => window.location.reload(), 800);
    } catch (e) {
      setToast({ show: true, message: '초기화에 실패했습니다.', type: 'error' });
    } finally {
      setResetLoading(false);
      setShowResetModal(false);
      window.dispatchEvent(new CustomEvent('transactionUpdate'));
      window.dispatchEvent(new CustomEvent('categoryUpdate'));
    }
  };

  const handleResetAllCancel = () => {
    setShowResetModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* 위로가기 버튼 */}
      <button
        onClick={handleScrollTop}
        className={`fixed bottom-8 right-8 z-50 bg-white/90 hover:bg-blue-500 text-blue-900 hover:text-white font-bold py-3 px-4 rounded-full shadow-lg transition-colors border-2 border-blue-500 transition-opacity duration-300 ${showScrollTop ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-label="위로 가기"
      >
        ↑ 위로가기
      </button>
      <div className="container mx-auto px-4 py-8">
        <PageHeader title="거래 설정" description="거래와 관련된 설정을 관리합니다." />
        <hr className="my-8 border-gray-700" />
        
        {/* 2:1 Split Layout */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Section (2/3) */}
          <div className="lg:w-2/3">
            <h2 className="text-3xl font-bold mb-6 text-white">카테고리 관리</h2>
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
              {/* 기존: <CategoryTabs /> → 신규: AccordionCategoryTabs */}
              <AccordionCategoryTabs />
            </div>
          </div>

          {/* Right Section (1/3) */}
          <div className="lg:w-1/3 space-y-6">
            <h2 className="text-3xl font-bold mb-6 text-white">관리 설정</h2>
            
            {/* Data Management Section */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
              <h3 className="text-xl font-semibold mb-4 text-white">데이터 관리</h3>
              
              {/* 거래내역 데이터 관리 */}
              <div className="mb-6">
                <h4 className="text-lg font-medium mb-3 text-white">거래내역 데이터</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleImportTransactions}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <span>가져오기</span>
                    <span className="text-xs ml-1">(CSV)</span>
                  </button>
                  <button 
                    onClick={handleExportTransactions}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center"
                  >
                    <span>내보내기</span>
                    <span className="text-xs ml-1">(CSV)</span>
                  </button>
                </div>
              </div>

              {/* 카테고리 데이터 관리 */}
              <div>
                <h4 className="text-lg font-medium mb-3 text-white">카테고리 데이터</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleImportCategories}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <span>가져오기</span>
                    <span className="text-xs ml-1">(CSV)</span>
                  </button>
                  <button 
                    onClick={handleExportCategories}
                    className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center"
                  >
                    <span>내보내기</span>
                    <span className="text-xs ml-1">(CSV)</span>
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleResetAllClick}
                  className="w-full py-2 px-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition font-bold text-base shadow"
                >
                  모든 데이터 초기화
                </button>
              </div>
            </div>

            {/* Password Management Section */}
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6 flex flex-col items-center">
              <h3 className="text-xl font-semibold mb-4 text-white">비밀번호 관리</h3>
              <div className="flex flex-col gap-3 w-full">
                <button
                  className="w-full py-2 px-4 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-bold text-base transition"
                  onClick={() => { setPwModalMode('change'); setShowPwModal(true); }}
                >
                  비밀번호 변경
                </button>
                <button
                  className="w-full py-2 px-4 bg-pink-300 hover:bg-pink-400 text-white rounded-lg font-bold text-base transition"
                  onClick={() => { setPwModalMode('reset'); setShowPwModal(true); }}
                >
                  비밀번호 초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type as 'success' | 'error'} 
          onClose={() => setToast({ show: false, message: '', type: '' })} 
        />
      )}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-xs w-full border-4 border-pink-200">
            <div className="text-4xl mb-2">🧹✨</div>
            <div className="text-lg font-bold text-pink-600 mb-2">정말 모든 데이터를 초기화할까요?</div>
            <div className="text-sm text-gray-600 mb-4 text-center">이 작업은 되돌릴 수 없어요!<br/>꼭 필요한 경우에만 사용해 주세요!</div>
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={handleResetAllConfirm}
                className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow whitespace-nowrap min-w-fit"
                disabled={resetLoading}
              >
                {resetLoading ? '초기화 중...' : '네, 모두 지울래요'}
              </button>
              <button
                onClick={handleResetAllCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow whitespace-nowrap min-w-fit"
                disabled={resetLoading}
              >
                취소할래요
              </button>
            </div>
          </div>
        </div>
      )}
      <PasswordModal
        open={showPwModal}
        mode={pwModalMode}
        onClose={() => setShowPwModal(false)}
        onSuccess={(pw) => {
          setShowPwModal(false);
          showToast(pw === '0411' ? '비밀번호가 초기화되었습니다.' : '비밀번호가 변경되었습니다.', 'success');
        }}
      />
      {showExportModal && (
        <ConfirmModal
          isOpen={!!showExportModal}
          title={showExportModal === 'transaction' ? '거래내역 내보내기' : '카테고리 내보내기'}
          message={showExportModal === 'transaction' ? '정말 거래내역을 내보내시겠습니까?' : '정말 카테고리를 내보내시겠습니까?'}
          onConfirm={async () => {
            if (showExportModal === 'transaction') await doExportTransactions();
            else await doExportCategories();
          }}
          onClose={() => setShowExportModal(null)}
        />
      )}
    </div>
  );
} 