import React from 'react';
import ReactDOM from 'react-dom';
import { Transaction } from '@/types/transaction';
import { FaTrashAlt } from 'react-icons/fa';

interface DeleteConfirmModalProps {
  transaction: Transaction;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ transaction, onConfirm, onCancel }) => {
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onCancel]);

  // 항상 디바이스(브라우저) 화면 중앙에 고정
  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 60,
  };

  // Portal로 <body>에 렌더링
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40">
      <div style={modalStyle} className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-xs w-full border-4 border-pink-200 relative">
        <div className="text-4xl mb-2 select-none">🗑️✨</div>
        <div className="text-lg font-bold text-pink-600 mb-2 flex items-center gap-2">
          <FaTrashAlt className="text-pink-400 text-2xl" />
          정말 이 거래를 삭제할까요?
        </div>
        <div className="text-sm text-gray-600 mb-4 text-center">
          <span className="block mb-1">삭제된 거래는 복구할 수 없어요!</span>
          <span className="block">신중하게 결정해 주세요 😊</span>
        </div>
        <div className="bg-pink-50 rounded-xl p-4 w-full mb-6 text-xs text-gray-700">
          <div className="grid grid-cols-2 gap-1">
              <div className="text-gray-400">유형</div>
              <div className={transaction.type === 'income' ? 'text-blue-400' : 'text-red-400'}>
                {transaction.type === 'income' ? '수입' : '지출'}
              </div>
              <div className="text-gray-400">관</div>
            <div>{transaction.section}</div>
              <div className="text-gray-400">항</div>
            <div>{transaction.category}</div>
              <div className="text-gray-400">목</div>
            <div>{transaction.subcategory}</div>
              <div className="text-gray-400">금액</div>
              <div className={transaction.type === 'income' ? 'text-blue-400' : 'text-red-400'}>
                {transaction.amount.toLocaleString()}원
              </div>
              {transaction.memo && (
                <>
                  <div className="text-gray-400">메모</div>
                <div>{transaction.memo}</div>
                </>
              )}
            </div>
          </div>
        <div className="flex gap-4 w-full justify-center mt-2">
            <button
            onClick={onConfirm}
            className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-full shadow min-w-fit flex items-center gap-1 text-base transition"
            >
            <FaTrashAlt className="inline-block text-lg mr-1" />
            네, 삭제할래요
            </button>
            <button
            onClick={onCancel}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-full shadow min-w-fit text-base transition"
            >
            취소할래요
            </button>
        </div>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
}; 