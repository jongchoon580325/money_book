// 관별 아코디언 그룹(관-항-목 2,3단계) 컴포넌트 + Lucide 아이콘 CRUD/편집/순서변경 UI + 관/항 CRUD + 삭제 모달 + 관/항 추가
'use client';

import { useState } from 'react';
import { Category, CategoryType } from '@/types/category';
import { Pencil, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import { categoryDB } from '@/utils/indexedDB';

interface AccordionCategoryGroupProps {
  gwan: string;
  categories: Category[];
  onUpdate: () => void;
  type: CategoryType;
}

export default function AccordionCategoryGroup({ gwan, categories, onUpdate, type }: AccordionCategoryGroupProps) {
  const [open, setOpen] = useState(false);
  const [openHang, setOpenHang] = useState<string | null>(null);
  const [editingMok, setEditingMok] = useState<string | null>(null);
  const [mokEditValue, setMokEditValue] = useState('');
  const [addMokHang, setAddMokHang] = useState<string | null>(null);
  const [newMokValue, setNewMokValue] = useState('');
  // 관/항 추가 상태
  const [addGwanMode, setAddGwanMode] = useState(false);
  const [newGwanValue, setNewGwanValue] = useState('');
  const [addHangGwan, setAddHangGwan] = useState<string | null>(null);
  const [newHangValue, setNewHangValue] = useState('');
  // 관/항 편집 상태
  const [editingGwan, setEditingGwan] = useState(false);
  const [gwanEditValue, setGwanEditValue] = useState(gwan);
  const [editingHang, setEditingHang] = useState<string | null>(null);
  const [hangEditValue, setHangEditValue] = useState('');
  // 삭제 모달 상태
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'gwan' | 'hang' | 'mok'; value: string; parent?: string } | null>(null);

  // 항 목록 추출(관 내 중복 제거)
  const hangList = Array.from(new Set(categories.map(c => c.category))).filter(Boolean);
  // 특정 항에 속한 목 목록 반환
  const getMokList = (hang: string) =>
    categories.filter(c => c.category === hang).map(c => c.subcategory).filter(Boolean);

  // 관 CRUD
  const handleEditGwan = () => { setEditingGwan(true); setGwanEditValue(gwan); };
  const handleSaveGwan = async () => {
    if (!gwanEditValue.trim()) return;
    // 관 이름만 변경 (id는 동일)
    const target = categories.find(c => c.section === gwan && c.category === '' && c.subcategory === '');
    if (target) {
      await categoryDB.updateCategory({ ...target, section: gwanEditValue.trim() });
      setEditingGwan(false);
      onUpdate();
    }
  };
  const handleDeleteGwan = () => { setDeleteTarget({ type: 'gwan', value: gwan }); };
  // 관 추가
  const handleAddGwan = () => { setAddGwanMode(true); setNewGwanValue(''); };
  const handleSaveNewGwan = async () => {
    if (!newGwanValue.trim()) return;
    // 관(Section)만 추가, category/subcategory는 빈 문자열
    await categoryDB.addCategory({
      id: crypto.randomUUID(),
      type,
      section: newGwanValue.trim(),
      category: '',
      subcategory: '',
    });
    setAddGwanMode(false);
    setNewGwanValue('');
    // 관 추가 후 바로 해당 관에 항 추가 입력창 열기
    setOpen(true);
    setAddHangGwan(newGwanValue.trim());
    setNewHangValue('');
    onUpdate();
  };
  // 항 CRUD
  const handleEditHang = (hang: string) => { setEditingHang(hang); setHangEditValue(hang); };
  const handleSaveHang = async (hang: string) => {
    if (!hangEditValue.trim()) return;
    const target = categories.find(c => c.category === hang && c.section === gwan && c.subcategory === '');
    if (target) {
      await categoryDB.updateCategory({ ...target, category: hangEditValue.trim() });
      setEditingHang(null);
      onUpdate();
    }
  };
  const handleDeleteHang = (hang: string) => { setDeleteTarget({ type: 'hang', value: hang, parent: gwan }); };
  // 항 추가
  const handleAddHang = (gwan: string) => { setAddHangGwan(gwan); setNewHangValue(''); };
  const handleSaveNewHang = async (gwan: string) => {
    if (!newHangValue.trim()) return;
    await categoryDB.addCategory({
      id: crypto.randomUUID(),
      type,
      section: gwan,
      category: newHangValue.trim(),
      subcategory: '',
    });
    // 항 추가 후 바로 해당 항에 목 추가 입력창 열기
    setAddHangGwan(null);
    setNewHangValue('');
    setOpenHang(newHangValue.trim());
    setAddMokHang(newHangValue.trim());
    setNewMokValue('');
    onUpdate();
  };
  // 목 CRUD
  const handleEditMok = (mok: string) => { setEditingMok(mok); setMokEditValue(mok); };
  const handleSaveMok = async (mok: string) => {
    if (!mokEditValue.trim()) return;
    const target = categories.find(c => c.subcategory === mok && c.section === gwan && c.category === openHang);
    if (target) {
      await categoryDB.updateCategory({ ...target, subcategory: mokEditValue.trim() });
      setEditingMok(null);
      setMokEditValue('');
      onUpdate();
    }
  };
  const handleDeleteMok = (mok: string, hang: string) => { setDeleteTarget({ type: 'mok', value: mok, parent: hang }); };
  // 목 추가
  const handleAddMok = (hang: string) => { setAddMokHang(hang); setNewMokValue(''); };
  const handleSaveNewMok = async (hang: string) => {
    if (!newMokValue.trim()) return;
    await categoryDB.addCategory({
      id: crypto.randomUUID(),
      type,
      section: gwan,
      category: hang,
      subcategory: newMokValue.trim(),
    });
    setAddMokHang(null);
    setNewMokValue('');
    onUpdate();
  };
  // 목 순서변경(임시)
  const handleMoveMok = (mok: string, dir: 'up' | 'down') => { /* TODO: DB 순서변경 */ };
  // 관/항/목 삭제 확정
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'gwan') {
      // 관 전체 삭제
      const toDelete = categories.filter(c => c.section === deleteTarget.value);
      await Promise.all(toDelete.map(c => categoryDB.deleteCategory(c.id)));
    } else if (deleteTarget.type === 'hang') {
      // 관+항 전체 삭제
      const toDelete = categories.filter(c => c.section === gwan && c.category === deleteTarget.value);
      await Promise.all(toDelete.map(c => categoryDB.deleteCategory(c.id)));
    } else if (deleteTarget.type === 'mok') {
      // 관+항+목만 삭제
      const toDelete = categories.find(c => c.section === gwan && c.category === deleteTarget.parent && c.subcategory === deleteTarget.value);
      if (toDelete) await categoryDB.deleteCategory(toDelete.id);
    }
    setDeleteTarget(null);
    onUpdate();
  };

  return (
    <div className="border rounded-lg bg-gray-700/40">
      {/* 관 헤더 */}
      <div className="w-full flex items-center justify-between px-6 py-4 text-xl font-bold text-white hover:bg-gray-700 transition rounded-t-lg">
        <div className="flex items-center gap-2">
          <Plus size={20} className="opacity-60" />
          {editingGwan ? (
            <>
              <input value={gwanEditValue} onChange={e => setGwanEditValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-32" />
              <button onClick={handleSaveGwan}><Pencil size={18} className="text-green-400" /></button>
            </>
          ) : (
            <>
              <span>{gwan}</span>
              <button onClick={handleEditGwan}><Pencil size={18} /></button>
              <button onClick={handleDeleteGwan}><Trash2 size={18} className="text-red-400" /></button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {addGwanMode ? (
            <>
              <input value={newGwanValue} onChange={e => setNewGwanValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-28" placeholder="새 관 입력" />
              <button onClick={handleSaveNewGwan} className="text-blue-400 hover:text-blue-600"><Plus size={16} /> 추가</button>
              <button onClick={() => setAddGwanMode(false)} className="text-gray-400 hover:text-gray-600">취소</button>
            </>
          ) : (
            <button onClick={handleAddGwan} className="flex items-center text-blue-400 hover:text-blue-600"><Plus size={16} /> <span>관 추가</span></button>
          )}
          <button onClick={() => setOpen(v => !v)} aria-expanded={open}>{open ? '▲' : '▼'}</button>
        </div>
      </div>
      {open && (
        <div className="bg-gray-800 border-t divide-y divide-gray-700">
          {/* 항이 없을 때: 안내 메시지 대신 항 추가 버튼 노출 */}
          {hangList.length === 0 && (
            <div className="flex items-center justify-center py-4">
              {addHangGwan === gwan ? (
                <>
                  <input value={newHangValue} onChange={e => setNewHangValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-20" placeholder="새 항 입력" />
                  <button onClick={() => handleSaveNewHang(gwan)} className="text-blue-400 hover:text-blue-600 ml-2"><Plus size={16} /> 추가</button>
                  <button onClick={() => setAddHangGwan(null)} className="text-gray-400 hover:text-gray-600 ml-2">취소</button>
                </>
              ) : (
                <button onClick={() => handleAddHang(gwan)} className="flex items-center text-blue-400 hover:text-blue-600"><Plus size={16} /> <span>항 추가</span></button>
              )}
            </div>
          )}
          {hangList.map(hang => (
            <div key={hang}>
              {/* 항 헤더 */}
              <div className="w-full flex items-center justify-between px-8 py-3 text-lg font-semibold text-blue-200 hover:bg-gray-700 transition">
                <div className="flex items-center gap-2">
                  <Plus size={18} className="opacity-60" />
                  {editingHang === hang ? (
                    <>
                      <input value={hangEditValue} onChange={e => setHangEditValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-24" />
                      <button onClick={() => handleSaveHang(hang)}><Pencil size={16} className="text-green-400" /></button>
                    </>
                  ) : (
                    <>
                      <span>{hang}</span>
                      <button onClick={() => handleEditHang(hang)}><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteHang(hang)}><Trash2 size={16} className="text-red-400" /></button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {addHangGwan === hang ? (
                    <>
                      <input value={newHangValue} onChange={e => setNewHangValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-20" placeholder="새 항 입력" />
                      <button onClick={() => handleSaveNewHang(hang)} className="text-blue-400 hover:text-blue-600"><Plus size={16} /> 추가</button>
                      <button onClick={() => setAddHangGwan(null)} className="text-gray-400 hover:text-gray-600">취소</button>
                    </>
                  ) : (
                    <button onClick={() => handleAddHang(hang)} className="flex items-center text-blue-400 hover:text-blue-600"><Plus size={16} /> <span>항 추가</span></button>
                  )}
                  <button onClick={() => setOpenHang(openHang === hang ? null : hang)} aria-expanded={openHang === hang}>{openHang === hang ? '▲' : '▼'}</button>
                </div>
              </div>
              {/* 목 리스트 */}
              {openHang === hang && (
                <ul className="bg-gray-900 px-12 py-2 space-y-1">
                  {/* 목이 없을 때: 안내 메시지 대신 목 추가 버튼 노출 */}
                  {getMokList(hang).length === 0 ? (
                    <li className="flex items-center gap-2 mt-1">
                      {addMokHang === hang ? (
                        <>
                          <input value={newMokValue} onChange={e => setNewMokValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-28" placeholder="새 목 입력" />
                          <button onClick={() => handleSaveNewMok(hang)} className="text-blue-400 hover:text-blue-600"><Plus size={16} /> 추가</button>
                          <button onClick={() => setAddMokHang(null)} className="text-gray-400 hover:text-gray-600">취소</button>
                        </>
                      ) : (
                        <button onClick={() => handleAddMok(hang)} className="flex items-center text-blue-400 hover:text-blue-600"><Plus size={16} /> <span>목 추가</span></button>
                      )}
                    </li>
                  ) : (
                    getMokList(hang).map((mok, idx, arr) => (
                      <li key={mok + idx} className="flex items-center gap-2 text-gray-100 text-base py-1 pl-2 border-l-4 border-blue-400">
                        {/* 순서변경 */}
                        <button onClick={() => handleMoveMok(mok, 'up')} disabled={idx === 0}><ArrowUp size={16} className={idx === 0 ? 'opacity-30' : ''} /></button>
                        <button onClick={() => handleMoveMok(mok, 'down')} disabled={idx === arr.length - 1}><ArrowDown size={16} className={idx === arr.length - 1 ? 'opacity-30' : ''} /></button>
                        {/* 인라인 편집 */}
                        {editingMok === mok ? (
                          <>
                            <input value={mokEditValue} onChange={e => setMokEditValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-32" />
                            <button onClick={() => handleSaveMok(mok)}><Pencil size={16} className="text-green-400" /></button>
                          </>
                        ) : (
                          <>
                            <span>{mok}</span>
                            <button onClick={() => handleEditMok(mok)}><Pencil size={16} /></button>
                          </>
                        )}
                        {/* 삭제 */}
                        <button onClick={() => handleDeleteMok(mok, hang)}><Trash2 size={16} className="text-red-400" /></button>
                      </li>
                    ))
                  )}
                  {/* 목 추가 입력창: 기존 목이 있을 때만 노출 */}
                  {getMokList(hang).length > 0 && (
                    addMokHang === hang ? (
                      <li className="flex items-center gap-2 mt-1">
                        <input value={newMokValue} onChange={e => setNewMokValue(e.target.value)} className="bg-gray-800 border-b border-blue-400 text-white px-1 w-28" placeholder="새 목 입력" />
                        <button onClick={() => handleSaveNewMok(hang)} className="text-blue-400 hover:text-blue-600"><Plus size={16} /> 추가</button>
                        <button onClick={() => setAddMokHang(null)} className="text-gray-400 hover:text-gray-600">취소</button>
                      </li>
                    ) : (
                      <li className="flex items-center gap-2 mt-1">
                        <button onClick={() => handleAddMok(hang)} className="flex items-center text-blue-400 hover:text-blue-600"><Plus size={16} /> <span>목 추가</span></button>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <ConfirmModal
          isOpen={!!deleteTarget}
          title="삭제 확인"
          message={`정말 ${deleteTarget.type === 'gwan' ? '관' : deleteTarget.type === 'hang' ? '항' : '목'} [${deleteTarget.value}]을(를) 삭제할까요?`}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
} 