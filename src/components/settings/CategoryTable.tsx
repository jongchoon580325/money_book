'use client';

import { useState, useEffect } from 'react';
import { Category, CategoryType } from '@/types/category';
import { categoryDB } from '@/utils/indexedDB';
import { parseCSV, validateCategoryData } from '@/utils/csvHandler';
import ConfirmModal from '../common/ConfirmModal';
import { Toast } from '../common/Toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryTableProps {
  type: CategoryType;
  categories: Category[];
  onUpdate: () => void;
}

interface SortableRowProps {
  id: string;
  category: Category;
  index: number;
  startIndex: number;
  editingCell: { id: string; field: string } | null;
  inlineEditValue: string;
  handleCellClick: (id: string, field: string, value: string) => void;
  handleInlineEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleInlineEditBlur: (category: Category) => void;
  handleInlineEditKeyDown: (e: React.KeyboardEvent, category: Category) => void;
  moveCategory: (index: number, direction: 'up' | 'down') => void;
  totalLength: number;
  inputClassName: string;
  onDelete: (id: string) => void;
}

function SortableRow({
  id,
  category,
  index,
  startIndex,
  editingCell,
  inlineEditValue,
  handleCellClick,
  handleInlineEditChange,
  handleInlineEditBlur,
  handleInlineEditKeyDown,
  moveCategory,
  totalLength,
  inputClassName,
  onDelete,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`hover:bg-gray-700/50 transition-colors ${
        isDragging ? 'bg-gray-600' : ''
      }`}
    >
      <td
        className="px-6 py-4 whitespace-nowrap text-lg text-gray-300 cursor-move"
        {...attributes}
        {...listeners}
      >
        <div className="flex items-center justify-center">
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => moveCategory(index, 'up')}
              disabled={startIndex + index === 0}
              className={`text-gray-400 hover:text-gray-200 ${
                startIndex + index === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              ▲
            </button>
            <button
              onClick={() => moveCategory(index, 'down')}
              disabled={startIndex + index === totalLength - 1}
              className={`text-gray-400 hover:text-gray-200 ${
                startIndex + index === totalLength - 1
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
            >
              ▼
            </button>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-300">
        {category.type === 'income' ? '수입' : '지출'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-300">
        {editingCell && editingCell.id === category.id && editingCell.field === 'section' ? (
          <input
            type="text"
            className={inputClassName}
            value={inlineEditValue}
            onChange={handleInlineEditChange}
            onBlur={() => handleInlineEditBlur(category)}
            onKeyDown={(e) => handleInlineEditKeyDown(e, category)}
            autoFocus
          />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span onClick={() => handleCellClick(category.id, 'section', category.section)} style={{ cursor: 'pointer' }}>{category.section}</span>
            <button
              type="button"
              onClick={() => handleCellClick(category.id, 'section', category.section)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
              aria-label="수정"
              style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
            >
              ✏️
            </button>
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-300">
        {editingCell && editingCell.id === category.id && editingCell.field === 'category' ? (
          <input
            type="text"
            className={inputClassName}
            value={inlineEditValue}
            onChange={handleInlineEditChange}
            onBlur={() => handleInlineEditBlur(category)}
            onKeyDown={(e) => handleInlineEditKeyDown(e, category)}
            autoFocus
          />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span onClick={() => handleCellClick(category.id, 'category', category.category)} style={{ cursor: 'pointer' }}>{category.category}</span>
            <button
              type="button"
              onClick={() => handleCellClick(category.id, 'category', category.category)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
              aria-label="수정"
              style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
            >
              ✏️
            </button>
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-lg text-gray-300">
        {editingCell && editingCell.id === category.id && editingCell.field === 'subcategory' ? (
          <input
            type="text"
            className={inputClassName}
            value={inlineEditValue}
            onChange={handleInlineEditChange}
            onBlur={() => handleInlineEditBlur(category)}
            onKeyDown={(e) => handleInlineEditKeyDown(e, category)}
            autoFocus
          />
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span onClick={() => handleCellClick(category.id, 'subcategory', category.subcategory)} style={{ cursor: 'pointer' }}>{category.subcategory}</span>
            <button
              type="button"
              onClick={() => handleCellClick(category.id, 'subcategory', category.subcategory)}
              className="text-indigo-400 hover:text-indigo-300 font-medium"
              aria-label="수정"
              style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer' }}
            >
              ✏️
            </button>
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-medium space-x-4">
            <button
              onClick={() => onDelete(category.id)}
          className="text-red-400 hover:text-red-300 font-medium"
          aria-label="삭제"
          style={{ background: 'none', border: 'none', padding: 0, margin: 0, cursor: 'pointer', fontSize: '1.3em' }}
          title="삭제"
            >
          🗑️
            </button>
      </td>
    </tr>
  );
}

export default function CategoryTable({ type, categories, onUpdate }: CategoryTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    section: '',
    category: '',
    subcategory: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [localCategories, setLocalCategories] = useState<Category[]>(categories);
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const pageOptions = [10, 20, 30];
  const totalPages = Math.ceil(localCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCategories = localCategories.slice(startIndex, endIndex);

  const showToast = (message: string, type: 'success' | 'error') => {
    if (toast) {
      setToast(null);
      setTimeout(() => setToast({ message, type }), 100);
    } else {
      setToast({ message, type });
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (toast) {
      timeoutId = setTimeout(() => setToast(null), 3000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [toast]);

  const validateForm = () => {
    if (!formData.section.trim()) {
      setError('관을 입력해주세요.');
      return false;
    }
    if (!formData.category.trim()) {
      setError('항을 입력해주세요.');
      return false;
    }
    if (!formData.subcategory.trim()) {
      setError('목을 입력해주세요.');
      return false;
    }
    return true;
  };

  const isDuplicate = (newCategory: Omit<Category, 'id'>) => {
    return localCategories.some(
      (cat) =>
        cat.type === newCategory.type &&
        cat.section.trim() === newCategory.section.trim() &&
        cat.category.trim() === newCategory.category.trim() &&
        cat.subcategory.trim() === newCategory.subcategory.trim()
    );
  };

  const handleAdd = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      const newCategory = {
        type,
        section: formData.section.trim(),
        category: formData.category.trim(),
        subcategory: formData.subcategory.trim(),
      };

      if (isDuplicate(newCategory)) {
        setError('이미 존재하는 카테고리입니다.');
        setIsSubmitting(false);
        return;
      }

      const categoryToAdd: Category = {
        ...newCategory,
        id: crypto.randomUUID(),
      };

      await categoryDB.addCategory(categoryToAdd);
      setFormData({ section: '', category: '', subcategory: '' });
      showToast('카테고리가 추가되었습니다.', 'success');
      await onUpdate();
    } catch (error) {
      console.error('카테고리 추가 실패:', error);
      showToast('카테고리 추가에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      section: category.section,
      category: category.category,
      subcategory: category.subcategory,
    });
  };

  const handleInlineChange = (id: string, field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInlineBlur = async (id: string) => {
    await categoryDB.updateCategory({
      id,
      type,
      ...formData,
    });
    const updatedCategories = await categoryDB.getAllCategories();
    setLocalCategories(updatedCategories.filter(cat => cat.type === type));
    setEditingId(null);
    onUpdate();
  };

  const handleDeleteClick = (id: string) => {
    setPendingDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteId) {
      await categoryDB.deleteCategory(pendingDeleteId);
      const updatedCategories = await categoryDB.getAllCategories();
      setLocalCategories(updatedCategories.filter(cat => cat.type === type));
      setPendingDeleteId(null);
      setShowDeleteModal(false);
      onUpdate();
    }
  };

  const handleDeleteCancel = () => {
    setPendingDeleteId(null);
    setShowDeleteModal(false);
  };

  const inputClassName = "bg-gray-700 border-gray-600 text-gray-200 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
  const buttonClassName = {
    edit: "text-indigo-400 hover:text-indigo-300 font-medium",
    save: "text-green-400 hover:text-green-300 font-medium",
    delete: "text-red-400 hover:text-red-300 font-medium",
    cancel: "text-gray-400 hover:text-gray-300 font-medium",
    add: "text-emerald-400 hover:text-emerald-300 font-medium"
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // 페이지 크기가 변경되면 첫 페이지로 이동
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localCategories.findIndex((item) => item.id === active.id);
    const newIndex = localCategories.findIndex((item) => item.id === over.id);
    
    const newItems = arrayMove(localCategories, oldIndex, newIndex);
    setLocalCategories(newItems);

    try {
      await Promise.all(
        newItems.map((item, index) =>
          categoryDB.updateCategory({ ...item, order: index })
        )
      );
      showToast('카테고리 순서가 변경되었습니다.', 'success');
      await onUpdate();
    } catch (error) {
      console.error('순서 변경 실패:', error);
      showToast('순서 변경에 실패했습니다.', 'error');
      setLocalCategories(categories);
    }
  };

  const moveCategory = async (index: number, direction: 'up' | 'down') => {
    const currentIndex = startIndex + index;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // 범위 체크
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === localCategories.length - 1)
    ) {
      return;
    }

    try {
      // 현재 카테고리와 대상 카테고리
      const currentCategory = localCategories[currentIndex];
      const targetCategory = localCategories[targetIndex];

      if (!currentCategory || !targetCategory) {
        console.error('카테고리를 찾을 수 없습니다.');
        return;
      }

      // 순서 업데이트를 위한 새 배열 생성
      const updatedCategories = [...localCategories];
      [updatedCategories[currentIndex], updatedCategories[targetIndex]] = 
        [updatedCategories[targetIndex], updatedCategories[currentIndex]];

      // 상태 업데이트
      setLocalCategories(updatedCategories);

      // DB 업데이트
      const currentOrder = currentCategory.order ?? currentIndex;
      const targetOrder = targetCategory.order ?? targetIndex;

      await Promise.all([
        categoryDB.updateCategory({
          ...currentCategory,
          order: targetOrder
        }),
        categoryDB.updateCategory({
          ...targetCategory,
          order: currentOrder
        })
      ]);

      // 성공 메시지 표시
      showToast('카테고리 순서가 변경되었습니다.', 'success');

      // 부모 컴포넌트에 업데이트 알림
      await onUpdate();
    } catch (error) {
      console.error('순서 변경 실패:', error);
      showToast('순서 변경에 실패했습니다.', 'error');
      
      // 실패 시 원래 상태로 복구
      setLocalCategories(categories);
    }
  };

  const handleImportCategories = async (file: File) => {
    try {
      const data = await parseCSV(file);
      if (!validateCategoryData(data)) {
        showToast('CSV 파일 형식이 올바르지 않습니다.', 'error');
        return;
      }

      // 카테고리 데이터 변환
      const importedCategories = data.map(item => ({
        id: crypto.randomUUID(),
        type: item.type === '수입' ? 'income' : 'expense' as CategoryType,
        section: item.section,
        category: item.category,
        subcategory: item.subcategory || '',
        order: 0
      }));

      // 현재 타입에 맞는 카테고리만 필터링
      const filteredCategories = importedCategories.filter(
        cat => cat.type === type
      );

      // 로컬 상태 업데이트
      setLocalCategories(prevCategories => {
        const existingCategories = prevCategories.filter(
          cat => cat.type !== type
        );
        return [...existingCategories, ...filteredCategories];
      });

      // IndexedDB 업데이트
      await categoryDB.replaceAllCategories([
        ...categories.filter(cat => cat.type !== type),
        ...filteredCategories
      ]);

      showToast('카테고리를 성공적으로 가져왔습니다.', 'success');
      onUpdate();
    } catch (error) {
      console.error('카테고리 가져오기 실패:', error);
      showToast('카테고리 가져오기에 실패했습니다.', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportCategories(file);
    }
  };

  const handleCellClick = (id: string, field: string, value: string) => {
    setEditingCell({ id, field });
    setInlineEditValue(value);
  };

  const handleInlineEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInlineEditValue(e.target.value);
  };

  const handleInlineEditSave = async (category: Category) => {
    if (!editingCell) return;
    const updated = { ...category, [editingCell.field]: inlineEditValue };
    await categoryDB.updateCategory(updated);
    const updatedCategories = await categoryDB.getAllCategories();
    setLocalCategories(updatedCategories.filter(cat => cat.type === type));
    setEditingCell(null);
    setInlineEditValue('');
    onUpdate();
  };

  const handleInlineEditBlur = (category: Category) => {
    handleInlineEditSave(category);
  };

  const handleInlineEditKeyDown = (e: React.KeyboardEvent, category: Category) => {
    if (e.key === 'Enter') {
      handleInlineEditSave(category);
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-4 bg-gray-700/30 rounded-lg p-4">
        <form onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
          <div className="grid grid-cols-4 gap-4 items-center">
            <div className="text-lg text-gray-300">
              {type === 'income' ? '수입' : '지출'}
            </div>
            <div>
              <input
                type="text"
                className={`${inputClassName} ${error && !formData.section.trim() ? 'border-red-500' : ''}`}
                value={formData.section}
                onChange={(e) => {
                  setError(null);
                  setFormData({ ...formData, section: e.target.value });
                }}
                onKeyDown={handleKeyPress}
                placeholder="관 입력"
              />
            </div>
            <div>
              <input
                type="text"
                className={`${inputClassName} ${error && !formData.category.trim() ? 'border-red-500' : ''}`}
                value={formData.category}
                onChange={(e) => {
                  setError(null);
                  setFormData({ ...formData, category: e.target.value });
                }}
                onKeyDown={handleKeyPress}
                placeholder="항 입력"
              />
            </div>
            <div className="flex items-center gap-4">
              <input
                type="text"
                className={`${inputClassName} ${error && !formData.subcategory.trim() ? 'border-red-500' : ''}`}
                value={formData.subcategory}
                onChange={(e) => {
                  setError(null);
                  setFormData({ ...formData, subcategory: e.target.value });
                }}
                onKeyDown={handleKeyPress}
                placeholder="목 입력"
                disabled={isSubmitting}
              />
              <button
                type="submit"
                className={`${buttonClassName.add} whitespace-nowrap ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? '추가 중...' : '추가'}
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-red-400 text-sm">
              {error}
            </div>
          )}
        </form>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-lg font-medium text-gray-200 uppercase tracking-wider">순서</th>
                <th className="px-6 py-4 text-left text-lg font-medium text-gray-200 uppercase tracking-wider">유형</th>
                <th className="px-6 py-4 text-left text-lg font-medium text-gray-200 uppercase tracking-wider">관</th>
                <th className="px-6 py-4 text-left text-lg font-medium text-gray-200 uppercase tracking-wider">항</th>
                <th className="px-6 py-4 text-left text-lg font-medium text-gray-200 uppercase tracking-wider">목</th>
                <th className="px-6 py-4 text-left text-lg font-medium text-gray-200 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              <SortableContext
                items={currentCategories.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {currentCategories.map((category, index) => (
                  <SortableRow
                    key={category.id}
                    id={category.id}
                    category={category}
                    index={index}
                    startIndex={startIndex}
                    editingCell={editingCell}
                    inlineEditValue={inlineEditValue}
                    handleCellClick={handleCellClick}
                    handleInlineEditChange={handleInlineEditChange}
                    handleInlineEditBlur={handleInlineEditBlur}
                    handleInlineEditKeyDown={handleInlineEditKeyDown}
                    moveCategory={moveCategory}
                    totalLength={localCategories.length}
                    inputClassName={inputClassName}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>
      </DndContext>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between bg-gray-700/30 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-300">페이지당 항목:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
            className="bg-gray-700 text-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {pageOptions.map((option) => (
              <option key={option} value={option}>
                {option}개
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {'<<'}
          </button>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {'<'}
          </button>

          <span className="text-gray-200">
            {currentPage} / {totalPages || 1}
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages || totalPages === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {'>'}
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages || totalPages === 0
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {'>>'}
          </button>
        </div>

        <div className="text-gray-300">
          총 {localCategories.length}개 항목
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-xs w-full border-4 border-pink-200">
            <div className="text-4xl mb-2">🐻💦</div>
            <div className="text-lg font-bold text-pink-600 mb-2">정말 삭제할까요?</div>
            <div className="text-sm text-gray-600 mb-4 text-center">삭제하면 다시 복구할 수 없어요!<br/>조심해 주세요!</div>
            <div className="flex gap-4 w-full justify-center">
              <button
                onClick={handleDeleteConfirm}
                className="bg-pink-400 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-lg shadow"
              >
                네, 삭제할래요
              </button>
              <button
                onClick={handleDeleteCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow"
              >
                취소할래요
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
        id="category-import-input"
      />
    </div>
  );
} 