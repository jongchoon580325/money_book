'use client';

import { useState, useEffect, useRef } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { transactionDB } from '@/utils/indexedDB';
import { Transaction } from '@/types/transaction';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { FaWallet } from 'react-icons/fa';
import useFirework from '@/hooks/useFirework';
import FireworkEffect from '@/components/animations/FireworkEffect';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import React from 'react';

function FinancialStatus() {
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const { fireworks, createFirework } = useFirework();
  const [hovered, setHovered] = useState<string | null>(null);
  const cardRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useEffect(() => {
    async function fetchData() {
      const txs: Transaction[] = await transactionDB.getAllTransactions();
      let income = 0, expense = 0;
      txs.forEach(tx => {
        const amt = typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')) : tx.amount;
        if (tx.type === 'income') income += amt;
        else if (tx.type === 'expense') expense += amt;
      });
      setTotalIncome(income);
      setTotalExpense(expense);
      setBalance(income - expense);
    }
    fetchData();
    // 실시간 반영
    const handler = () => fetchData();
    window.addEventListener('transactionUpdate', handler);
    return () => window.removeEventListener('transactionUpdate', handler);
  }, []);

  // 카드 hover 핸들러
  const handleMouseEnter = (idx: number) => {
    setHovered(`card${idx}`);
    const ref = cardRefs[idx].current;
    if (ref) {
      const rect = ref.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      createFirework(x, y);
    }
  };
  const handleMouseLeave = () => setHovered(null);

  return (
    <section className="mb-10 relative">
      {/* 불꽃 파티클 렌더링 */}
      {fireworks.map(fw => (
        <FireworkEffect key={fw.id} x={fw.x} y={fw.y} />
      ))}
      {/* Bounce keyframes (scoped) */}
      <style jsx>{`
        @keyframes card-bounce {
          0%   { transform: scale(1) translateY(0) rotate(0deg); }
          30%  { transform: scale(1.05, 0.97) translateY(-10px) rotate(var(--card-rotate)); }
          50%  { transform: scale(0.98, 1.03) translateY(-6px) rotate(var(--card-rotate)); }
          70%  { transform: scale(1.03, 0.98) translateY(-8px) rotate(var(--card-rotate)); }
          100% { transform: scale(1.01) translateY(-4px) rotate(var(--card-rotate)); }
        }
      `}</style>
      <h2 className="text-xl font-semibold mb-4 text-white">재무 현황</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 총 수입 */}
        <div
          ref={cardRefs[0]}
          className={`bg-[#f5faf7] rounded-xl p-8 flex flex-col items-center shadow cursor-pointer will-change-transform ${hovered === 'card0' ? 'animate-card-bounce' : ''}`}
          style={hovered === 'card0' ? { animation: 'card-bounce 0.7s cubic-bezier(.68,-0.55,.27,1.55)', '--card-rotate': '-2deg' } as any : {}}
          onMouseEnter={() => handleMouseEnter(0)}
          onMouseLeave={handleMouseLeave}
        >
          <FiTrendingUp className="text-4xl text-green-500 mb-2" />
          <div className="text-[#222] text-lg mb-2 font-semibold">총 수입</div>
          <div className="text-3xl font-bold text-green-500">₩{totalIncome.toLocaleString()}</div>
        </div>
        {/* 총 지출 */}
        <div
          ref={cardRefs[1]}
          className={`bg-[#f9f5fa] rounded-xl p-8 flex flex-col items-center shadow cursor-pointer will-change-transform ${hovered === 'card1' ? 'animate-card-bounce' : ''}`}
          style={hovered === 'card1' ? { animation: 'card-bounce 0.7s cubic-bezier(.68,-0.55,.27,1.55)', '--card-rotate': '0deg' } as any : {}}
          onMouseEnter={() => handleMouseEnter(1)}
          onMouseLeave={handleMouseLeave}
        >
          <FiTrendingDown className="text-4xl text-red-500 mb-2" />
          <div className="text-[#222] text-lg mb-2 font-semibold">총 지출</div>
          <div className="text-3xl font-bold text-red-500">₩{totalExpense.toLocaleString()}</div>
        </div>
        {/* 현재 잔액 */}
        <div
          ref={cardRefs[2]}
          className={`bg-[#f5f7fa] rounded-xl p-8 flex flex-col items-center shadow cursor-pointer will-change-transform ${hovered === 'card2' ? 'animate-card-bounce' : ''}`}
          style={hovered === 'card2' ? { animation: 'card-bounce 0.7s cubic-bezier(.68,-0.55,.27,1.55)', '--card-rotate': '2deg' } as any : {}}
          onMouseEnter={() => handleMouseEnter(2)}
          onMouseLeave={handleMouseLeave}
        >
          <FaWallet className="text-4xl text-blue-500 mb-2" />
          <div className="text-[#222] text-lg mb-2 font-semibold">현재 잔액</div>
          <div className="text-3xl font-bold text-blue-500">{balance < 0 ? '-' : ''}₩{Math.abs(balance).toLocaleString()}</div>
        </div>
      </div>
    </section>
  );
}

function usePaginatedData<T>(data: T[], defaultPerPage = 10) {
  const [itemsPerPage, setItemsPerPage] = useState(defaultPerPage);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  const paginated = data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => { setCurrentPage(1); }, [itemsPerPage, data.length]);
  return {
    itemsPerPage,
    setItemsPerPage,
    currentPage,
    setCurrentPage,
    totalPages,
    paginated,
  };
}

function TransactionTabs() {
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | null>('income');
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    async function fetchData() {
      const txs: Transaction[] = await transactionDB.getAllTransactions();
      setTransactions(txs);
    }
    fetchData();
    const handler = () => fetchData();
    window.addEventListener('transactionUpdate', handler);
    return () => window.removeEventListener('transactionUpdate', handler);
  }, []);

  const incomeTxs = [...transactions.filter(tx => tx.type === 'income')].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const expenseTxs = [...transactions.filter(tx => tx.type === 'expense')].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalIncome = incomeTxs.reduce((sum, tx) => sum + (typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')) : tx.amount), 0);
  const totalExpense = expenseTxs.reduce((sum, tx) => sum + (typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')) : tx.amount), 0);

  const incomePage = usePaginatedData(incomeTxs);
  const expensePage = usePaginatedData(expenseTxs);

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-white">수입 및 지출 상세 현황</h2>
      <div className="flex gap-2 mb-2">
        <button
          className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'income' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}
          onClick={() => setActiveTab(activeTab === 'income' ? null : 'income')}
        >
          수입
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-bold transition-colors ${activeTab === 'expense' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'}`}
          onClick={() => setActiveTab(activeTab === 'expense' ? null : 'expense')}
        >
          지출
        </button>
      </div>
      <div className="border-t-2 border-dotted border-white/20" />
      {activeTab === 'income' && (
        <div className="bg-white/80 rounded-b-xl p-6 mt-0">
          <div className="text-green-700 font-bold text-lg mb-2">총 수입: ₩{totalIncome.toLocaleString()}</div>
          <div className="flex justify-end mb-2">
            <label className="text-xs mr-2 text-[#2a2b2a]">페이지당 항목</label>
            <select
              value={incomePage.itemsPerPage}
              onChange={e => incomePage.setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 border rounded text-xs text-[#2a2b2a]"
            >
              <option value={10} className="text-[#2a2b2a]">10개</option>
              <option value={20} className="text-[#2a2b2a]">20개</option>
              <option value={30} className="text-[#2a2b2a]">30개</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-1 text-left">날짜</th>
                  <th className="px-2 py-1 text-left">관</th>
                  <th className="px-2 py-1 text-left">항</th>
                  <th className="px-2 py-1 text-left">목</th>
                  <th className="px-2 py-1 text-left">메모</th>
                  <th className="px-2 py-1 text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {incomePage.paginated.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-green-50">
                    <td className="px-2 py-1 whitespace-nowrap">{tx.date}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.section}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.category}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.subcategory}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.memo}</td>
                    <td className="px-2 py-1 text-right font-bold text-green-600">₩{typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')).toLocaleString() : tx.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => incomePage.setCurrentPage(1)}
              disabled={incomePage.currentPage === 1}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >처음</button>
            <button
              onClick={() => incomePage.setCurrentPage(incomePage.currentPage - 1)}
              disabled={incomePage.currentPage === 1}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >이전</button>
            <span className="text-xs text-[#2a2b2a]">{incomePage.currentPage} / {incomePage.totalPages}</span>
            <button
              onClick={() => incomePage.setCurrentPage(incomePage.currentPage + 1)}
              disabled={incomePage.currentPage === incomePage.totalPages}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >다음</button>
            <button
              onClick={() => incomePage.setCurrentPage(incomePage.totalPages)}
              disabled={incomePage.currentPage === incomePage.totalPages}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >마지막</button>
          </div>
        </div>
      )}
      {activeTab === 'expense' && (
        <div className="bg-white/80 rounded-b-xl p-6 mt-0">
          <div className="text-red-700 font-bold text-lg mb-2">총 지출: ₩{totalExpense.toLocaleString()}</div>
          <div className="flex justify-end mb-2">
            <label className="text-xs mr-2 text-[#2a2b2a]">페이지당 항목</label>
            <select
              value={expensePage.itemsPerPage}
              onChange={e => expensePage.setItemsPerPage(Number(e.target.value))}
              className="px-2 py-1 border rounded text-xs text-[#2a2b2a]"
            >
              <option value={10} className="text-[#2a2b2a]">10개</option>
              <option value={20} className="text-[#2a2b2a]">20개</option>
              <option value={30} className="text-[#2a2b2a]">30개</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-2 py-1 text-left">날짜</th>
                  <th className="px-2 py-1 text-left">관</th>
                  <th className="px-2 py-1 text-left">항</th>
                  <th className="px-2 py-1 text-left">목</th>
                  <th className="px-2 py-1 text-left">메모</th>
                  <th className="px-2 py-1 text-right">금액</th>
                </tr>
              </thead>
              <tbody>
                {expensePage.paginated.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-100 hover:bg-red-50">
                    <td className="px-2 py-1 whitespace-nowrap">{tx.date}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.section}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.category}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.subcategory}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{tx.memo}</td>
                    <td className="px-2 py-1 text-right font-bold text-red-600">₩{typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')).toLocaleString() : tx.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => expensePage.setCurrentPage(1)}
              disabled={expensePage.currentPage === 1}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >처음</button>
            <button
              onClick={() => expensePage.setCurrentPage(expensePage.currentPage - 1)}
              disabled={expensePage.currentPage === 1}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >이전</button>
            <span className="text-xs text-[#2a2b2a]">{expensePage.currentPage} / {expensePage.totalPages}</span>
            <button
              onClick={() => expensePage.setCurrentPage(expensePage.currentPage + 1)}
              disabled={expensePage.currentPage === expensePage.totalPages}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >다음</button>
            <button
              onClick={() => expensePage.setCurrentPage(expensePage.totalPages)}
              disabled={expensePage.currentPage === expensePage.totalPages}
              className="px-2 py-1 rounded bg-gray-200 text-xs text-[#2a2b2a] disabled:opacity-50"
            >마지막</button>
          </div>
        </div>
      )}
    </section>
  );
}

// 카테고리별 금액 차트 컴포넌트
function CategoryAmountChart({ transactions, type }: { transactions: Transaction[]; type: 'income' | 'expense' }) {
  // 카테고리별 집계
  const data = React.useMemo(() => {
    const summary: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.type !== type) return;
      if (!summary[tx.category]) summary[tx.category] = 0;
      summary[tx.category] += typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')) : tx.amount;
    });
    // 내림차순 정렬 후 상위 10개만
    return Object.entries(summary)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  }, [transactions, type]);

  const barColor = type === 'income' ? '#22c55e' : '#ef4444';

  if (data.length === 0) {
    return <div className="text-gray-400 text-center py-12">해당 데이터가 없습니다.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
        <XAxis type="number" hide tick={{ fill: '#222' }} />
        <YAxis dataKey="category" type="category" tick={{ fill: '#222', fontWeight: 600 }} width={90} />
        <Tooltip formatter={v => `₩${Number(v).toLocaleString()}`} cursor={{ fill: '#e5e7eb', opacity: 0.2 }} />
        <Legend formatter={() => '금액'} />
        <Bar dataKey="amount" fill={barColor} radius={[8, 8, 8, 8]} name="금액">
          {data.map((entry, idx) => (
            <Cell key={`cell-${idx}`} fill={barColor} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 기간별 필터 컴포넌트
function PeriodFilter({ transactions }: { transactions: Transaction[] }) {
  const [period, setPeriod] = useState<'all' | 'year' | 'month' | 'week' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [filtered, setFiltered] = useState<Transaction[]>(transactions);

  useEffect(() => {
    const now = new Date();
    let result = transactions;
    if (period === 'year') {
      const year = now.getFullYear();
      result = transactions.filter(tx => new Date(tx.date).getFullYear() === year);
    } else if (period === 'month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      result = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d.getFullYear() === year && d.getMonth() === month;
      });
    } else if (period === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0,0,0,0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23,59,59,999);
      result = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d >= startOfWeek && d <= endOfWeek;
      });
    } else if (period === 'custom' && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      end.setHours(23,59,59,999);
      result = transactions.filter(tx => {
        const d = new Date(tx.date);
        return d >= start && d <= end;
      });
    }
    setFiltered(result);
  }, [period, customRange, transactions]);

  const totalIncome = filtered.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + (typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')) : tx.amount), 0);
  const totalExpense = filtered.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + (typeof tx.amount === 'string' ? parseInt(tx.amount.toString().replace(/,/g, '')) : tx.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="bg-[#d7dcda] rounded-xl p-6 flex flex-col">
      <div className="text-lg font-bold text-[#2a2b2a] mb-4">기간별 필터</div>
      <div className="flex gap-2 mb-4">
        <button className={`px-4 py-2 rounded-l font-bold border border-[#444] ${period === 'all' ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={() => setPeriod('all')}>전체</button>
        <button className={`px-4 py-2 font-bold border border-[#444] ${period === 'year' ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={() => setPeriod('year')}>연간</button>
        <button className={`px-4 py-2 font-bold border border-[#444] ${period === 'month' ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={() => setPeriod('month')}>월간</button>
        <button className={`px-4 py-2 font-bold border border-[#444] ${period === 'week' ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={() => setPeriod('week')}>주간</button>
        <button className={`px-4 py-2 rounded-r font-bold border border-[#444] ${period === 'custom' ? 'bg-black text-white' : 'bg-white text-black'}`} onClick={() => setPeriod('custom')}>직접 설정</button>
      </div>
      {period === 'custom' && (
        <div className="flex gap-2 mb-4 items-center">
          <input type="date" value={customRange.start} onChange={e => setCustomRange(r => ({ ...r, start: e.target.value }))} className="border rounded px-2 py-1 text-black" />
          <span className="mx-1">~</span>
          <input type="date" value={customRange.end} onChange={e => setCustomRange(r => ({ ...r, end: e.target.value }))} className="border rounded px-2 py-1 text-black" />
        </div>
      )}
      <div className="text-gray-700 mb-2 font-semibold">선택 기간 거래 통계</div>
      <div className="bg-[#f3f4f6] rounded-2xl p-6 text-base text-[#222] shadow flex flex-col gap-1" style={{ minWidth: 320 }}>
        <div><span className="text-gray-500">총 거래 건수:</span> <span className="font-bold text-green-600">{filtered.length.toLocaleString()}건</span></div>
        <div><span className="text-gray-500">총 수입:</span> <span className="font-bold text-green-600">₩{totalIncome.toLocaleString()}</span></div>
        <div><span className="text-gray-500">총 지출:</span> <span className="font-bold text-red-600">₩{totalExpense.toLocaleString()}</span></div>
        <hr className="my-2 border-gray-300" />
        <div><span className="text-gray-500">수지 차액:</span> <span className="font-bold text-blue-600">{balance < 0 ? '-' : ''}₩{Math.abs(balance).toLocaleString()}</span></div>
      </div>
    </div>
  );
}

export default function TransactionStatistics() {
  const [isClient, setIsClient] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  // 카테고리별 금액 차트/탭 상태
  const [categoryTab, setCategoryTab] = useState<'income' | 'expense'>('income');
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    transactionDB.getAllTransactions().then(setAllTransactions);
    const handler = () => transactionDB.getAllTransactions().then(setAllTransactions);
    window.addEventListener('transactionUpdate', handler);
    return () => window.removeEventListener('transactionUpdate', handler);
  }, []);

  // 위로가기 버튼 핸들러
  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isClient) {
    return (
      <main className="min-h-[calc(100vh-8rem)] bg-[#365749] text-white p-6">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-2/4 mb-8"></div>
          </div>
        </div>
      </main>
    );
  }

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
      <div className="container mx-auto space-y-8">
        <PageHeader 
          title="성경적 자산 관리" 
          description="성경적 자산 관리를 위한 크리스챤 프로젝트 입니다."
        />
        <FinancialStatus />
        <TransactionTabs />
      </div>
    </main>
  );
} 