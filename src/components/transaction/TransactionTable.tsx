'use client';

import { useState, useMemo } from 'react';
import { Transaction } from '@/types/transaction';
import { DeleteConfirmModal } from '@/components/common/DeleteConfirmModal';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: (id: string, transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

interface DailyTotal {
  income: number;
  expense: number;
  balance: number;
}

export default function TransactionTable({ transactions, onUpdate, onDelete }: TransactionTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Transaction | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // 날짜별로 거래 데이터 그룹화 및 정렬
  const groupedTransactions = useMemo(() => {
    const groups = transactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(transaction);
      return acc;
    }, {} as Record<string, Transaction[]>);

    // 날짜별 정렬 (최신순)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
      .map(([date, transactions]) => ({
        date,
        transactions: transactions.sort((a, b) => {
          // 같은 날짜 내에서는 시간 순서대로 정렬
          const timeA = new Date(a.date).getTime();
          const timeB = new Date(b.date).getTime();
          return timeB - timeA;
        }),
        totals: transactions.reduce(
          (acc, curr) => {
            const amount = typeof curr.amount === 'string' ? parseInt(curr.amount) : curr.amount;
            if (curr.type === 'income') {
              acc.income += amount;
            } else {
              acc.expense += amount;
            }
            acc.balance = acc.income - acc.expense;
            return acc;
          },
          { income: 0, expense: 0, balance: 0 } as DailyTotal
        ),
      }));
  }, [transactions]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(groupedTransactions.length / itemsPerPage);
  const paginatedGroups = groupedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditingData({ ...transaction });
  };

  const handleEditChange = (field: keyof Transaction, value: string) => {
    if (!editingData) return;

    if (field === 'amount') {
      // 숫자만 추출하고 천단위 구분자 추가
      const numericValue = value.replace(/[^0-9]/g, '');
      const amount = numericValue ? parseInt(numericValue) : 0;
      setEditingData({ ...editingData, amount });
    } else if (field === 'type') {
      setEditingData({ ...editingData, type: value as 'income' | 'expense' });
    } else {
      setEditingData({ ...editingData, [field]: value });
    }
  };

  const handleEditSave = async () => {
    if (!editingData || !editingId) return;
    
    // 수정된 데이터에 id 포함
    const updatedTransaction: Transaction = {
      ...editingData,
      id: editingId
    };
    
    try {
      await onUpdate(editingId, updatedTransaction);
      
      // 수정 완료 후 편집 상태 초기화
      setEditingId(null);
      setEditingData(null);
      
    } catch (error) {
      console.error('Failed to update transaction:', error);
      // 에러 발생 시 토스트 메시지 표시
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: '거래 내역 수정에 실패했습니다.', type: 'error' }
      }));
    }
  };

  const handleEditCancel = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingId(null);
    setEditingData(null);
  };

  const handleDelete = (transaction: Transaction, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!transaction || !transaction.id) {
      console.error('Invalid transaction data');
      return;
    }
    setSelectedTransaction(transaction);
    setShowDeleteModal(true);
  };

  const confirmDelete = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedTransaction || !selectedTransaction.id) {
      console.error('No transaction selected for deletion');
      return;
    }

    try {
      await onDelete(selectedTransaction.id);
      setShowDeleteModal(false);
      setSelectedTransaction(null);
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      window.dispatchEvent(new CustomEvent('showToast', { 
        detail: { message: '거래 내역 삭제에 실패했습니다.', type: 'error' }
      }));
    }
  };

  const handleDeleteModalClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowDeleteModal(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="space-y-4">
      {/* 페이지당 항목 수 선택 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <label className="text-sm">페이지당 항목:</label>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 bg-white/10 rounded border border-white/20"
          >
            <option value={10}>10개</option>
            <option value={20}>20개</option>
            <option value={30}>30개</option>
          </select>
        </div>
        <div className="text-sm">
          총 {groupedTransactions.length}일의 거래내역
        </div>
      </div>

      <div className="overflow-x-auto">
        {paginatedGroups.map(({ date, transactions: dailyTransactions, totals }) => (
          <div key={date} className="mb-6">
            {/* 날짜 헤더와 일별 합계 */}
            <div className="bg-white/5 p-4 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">{date}</h3>
                <div className="flex space-x-6 text-sm">
                  <span className="text-blue-400">수입: {totals.income.toLocaleString()}원</span>
                  <span className="text-red-400">지출: {totals.expense.toLocaleString()}원</span>
                  <span className={totals.balance >= 0 ? 'text-blue-400' : 'text-red-400'}>
                    잔액: {totals.balance.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* 거래 내역 테이블 */}
            <table className="w-full">
              <thead>
                <tr className="bg-white/5">
                  <th className="px-4 py-3 text-left">유형</th>
                  <th className="px-4 py-3 text-left">관</th>
                  <th className="px-4 py-3 text-left">항</th>
                  <th className="px-4 py-3 text-left">목</th>
                  <th className="px-4 py-3 text-right">금액</th>
                  <th className="px-4 py-3 text-left">메모</th>
                  <th className="px-4 py-3 text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {dailyTransactions.map((transaction) => (
                  <tr key={transaction.id} className="border-t border-white/10 hover:bg-white/5">
                    {editingId === transaction.id ? (
                      <>
                        <td className="px-4 py-3">
                          <select
                            value={editingData?.type || ''}
                            onChange={(e) => handleEditChange('type', e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 rounded border border-white/20"
                          >
                            <option value="income">수입</option>
                            <option value="expense">지출</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingData?.section || ''}
                            onChange={(e) => handleEditChange('section', e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 rounded border border-white/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingData?.category || ''}
                            onChange={(e) => handleEditChange('category', e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 rounded border border-white/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingData?.subcategory || ''}
                            onChange={(e) => handleEditChange('subcategory', e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 rounded border border-white/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingData?.amount.toLocaleString() || ''}
                            onChange={(e) => handleEditChange('amount', e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 rounded border border-white/20 text-right"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={editingData?.memo || ''}
                            onChange={(e) => handleEditChange('memo', e.target.value)}
                            className="w-full px-2 py-1 bg-white/10 rounded border border-white/20"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={handleEditSave}
                              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleEditCancel}
                              className="px-2 py-1 bg-gray-500/20 hover:bg-gray-500/30 rounded text-sm"
                            >
                              취소
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3">
                          <span className={transaction.type === 'income' ? 'text-blue-400' : 'text-red-400'}>
                            {transaction.type === 'income' ? '수입' : '지출'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{transaction.section}</td>
                        <td className="px-4 py-3">{transaction.category}</td>
                        <td className="px-4 py-3">{transaction.subcategory}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={transaction.type === 'income' ? 'text-blue-400' : 'text-red-400'}>
                            {transaction.amount.toLocaleString()}원
                          </span>
                        </td>
                        <td className="px-4 py-3">{transaction.memo}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center space-x-2">
                            <button
                              onClick={(e) => handleEdit(transaction)}
                              className="px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded text-sm"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => handleDelete(transaction)}
                              className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded text-sm"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="flex justify-center items-center space-x-2 mt-4">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
        >
          처음
        </button>
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
        >
          이전
        </button>
        <span className="px-3 py-1">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
        >
          다음
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
        >
          마지막
        </button>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteModal && selectedTransaction && (
        <DeleteConfirmModal
          transaction={selectedTransaction}
          onConfirm={confirmDelete}
          onCancel={handleDeleteModalClose}
        />
      )}
    </div>
  );
} 