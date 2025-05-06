'use client';

import { useState, useEffect } from 'react';
import { NewTransaction } from '@/types/transaction';
import { getCategoriesByType, organizeCategories, OrganizedCategories } from '@/utils/categoryUtils';

interface TransactionFormProps {
  type: 'income' | 'expense';
  onSave: (transactions: NewTransaction[]) => void;
}

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function TransactionForm({ type, onSave }: TransactionFormProps) {
  const [date, setDate] = useState(getTodayString());
  const [rows, setRows] = useState([
    { amount: '', section: '', category: '', subcategory: '', memo: '' }
  ]);

  const [categories, setCategories] = useState<OrganizedCategories>({});

  useEffect(() => {
    const loadCategories = async () => {
      const categoryList = await getCategoriesByType(type);
      const organized = organizeCategories(categoryList);
      setCategories(organized);
    };
    loadCategories();
  }, [type]);

  useEffect(() => {
    setDate(getTodayString());
  }, []);

  const handleRowChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setRows(prev => prev.map((row, i) => {
      if (i !== idx) return row;
    if (name === 'amount') {
      const numericValue = value.replace(/[^0-9]/g, '');
      const formattedValue = numericValue ? Number(numericValue).toLocaleString() : '';
        return { ...row, [name]: formattedValue };
    } else {
        let newRow = { ...row, [name]: value };
        if (name === 'section') {
          newRow.category = '';
          newRow.subcategory = '';
        }
        if (name === 'category') {
          newRow.subcategory = '';
        }
        return newRow;
      }
    }));
  };

  const handleAddRow = () => {
    setRows(prev => [...prev, { amount: '', section: '', category: '', subcategory: '', memo: '' }]);
  };

  const handleRemoveRow = (idx: number) => {
    setRows(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = rows.filter(row => {
      const amount = Number(row.amount.replace(/,/g, ''));
      return amount && row.section && row.category && row.subcategory;
    });
    if (validRows.length === 0) {
      alert('필수 필드를 모두 입력해주세요.');
      return;
    }
    onSave(validRows.map(row => ({
      amount: Number(row.amount.replace(/,/g, '')),
      type,
      date,
      section: row.section,
      category: row.category,
      subcategory: row.subcategory,
      memo: row.memo
    })));
    setRows([{ amount: '', section: '', category: '', subcategory: '', memo: '' }]);
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-6">
      <div className="mb-2">
          <label className="block text-sm font-medium mb-1">날짜</label>
          <input
            type="date"
            name="date"
          value={date}
          onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 rounded border border-white/20 focus:outline-none focus:border-white/40"
            required
          />
        </div>
      {rows.map((row, idx) => {
        const availableCategories = row.section && categories[row.section] ? Object.keys(categories[row.section]) : [];
        const availableSubcategories = row.section && row.category && categories[row.section]?.[row.category] ? categories[row.section][row.category] : [];
        return (
          <div key={idx} className="grid grid-cols-6 gap-2 items-end mb-2">
        <div>
              <label className="block text-xs font-medium mb-1">관</label>
          <select
            name="section"
                value={row.section}
                onChange={e => handleRowChange(idx, e)}
                className="w-full px-2 py-1 bg-[#232882]/40 rounded border border-white/20 focus:outline-none focus:border-white/40 text-white"
            required
          >
            <option value="" className="bg-[#232882]">관 선택</option>
            {Object.keys(categories).map(section => (
              <option key={section} value={section} className="bg-[#232882]">{section}</option>
            ))}
          </select>
        </div>
        <div>
              <label className="block text-xs font-medium mb-1">항</label>
          <select
            name="category"
                value={row.category}
                onChange={e => handleRowChange(idx, e)}
                className="w-full px-2 py-1 bg-[#232882]/40 rounded border border-white/20 focus:outline-none focus:border-white/40 text-white"
            required
                disabled={!row.section}
          >
            <option value="" className="bg-[#232882]">항 선택</option>
                {availableCategories.map(category => (
                <option key={category} value={category} className="bg-[#232882]">{category}</option>
                ))}
          </select>
        </div>
        <div>
              <label className="block text-xs font-medium mb-1">목</label>
          <select
            name="subcategory"
                value={row.subcategory}
                onChange={e => handleRowChange(idx, e)}
                className="w-full px-2 py-1 bg-[#232882]/40 rounded border border-white/20 focus:outline-none focus:border-white/40 text-white"
            required
                disabled={!row.category}
          >
            <option value="" className="bg-[#232882]">목 선택</option>
                {availableSubcategories.map(subcategory => (
                <option key={subcategory} value={subcategory} className="bg-[#232882]">{subcategory}</option>
                ))}
          </select>
        </div>
        <div>
              <label className="block text-xs font-medium mb-1">금액</label>
              <input
                type="text"
                name="amount"
                value={row.amount}
                onChange={e => handleRowChange(idx, e)}
                className="w-full px-2 py-1 bg-white/10 rounded border border-white/20 focus:outline-none focus:border-white/40"
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">메모</label>
          <input
            type="text"
            name="memo"
                value={row.memo}
                onChange={e => handleRowChange(idx, e)}
                className="w-full px-2 py-1 bg-white/10 rounded border border-white/20 focus:outline-none focus:border-white/40"
                placeholder="메모"
          />
        </div>
            <div className="flex flex-col items-center justify-end h-full pb-1">
              <button type="button" onClick={() => handleRemoveRow(idx)} className="text-red-400 hover:text-red-300 text-xl font-bold px-2 py-0.5 rounded">-</button>
              {idx === rows.length - 1 && (
                <button type="button" onClick={handleAddRow} className="text-green-400 hover:text-green-300 text-xl font-bold px-2 py-0.5 rounded mt-1">+</button>
              )}
            </div>
          </div>
        );
      })}
      <div className="flex justify-end">
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow">모두 저장</button>
      </div>
    </form>
  );
} 