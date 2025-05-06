import React, { useState } from 'react';

interface PasswordModalProps {
  open: boolean;
  mode: 'change' | 'reset';
  onClose: () => void;
  onSuccess: (newPassword?: string) => void;
}

export default function PasswordModal({ open, mode, onClose, onSuccess }: PasswordModalProps) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNew2, setShowNew2] = useState(false);

  if (!open) return null;

  const handleChange = () => {
    setError('');
    setSuccess('');
    setLoading(true);
    setTimeout(() => {
      const savedPw = localStorage.getItem('appPassword') || '0411';
      if (currentPw !== savedPw) {
        setError('현재 비밀번호가 올바르지 않습니다.');
        setLoading(false);
        return;
      }
      if (!newPw || newPw.length < 3) {
        setError('새 비밀번호는 3자 이상이어야 합니다.');
        setLoading(false);
        return;
      }
      if (newPw !== newPw2) {
        setError('새 비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      localStorage.setItem('appPassword', newPw);
      setSuccess('비밀번호가 성공적으로 변경되었습니다!');
      setLoading(false);
      setTimeout(() => { onSuccess(newPw); }, 1000);
    }, 700);
  };

  const handleReset = () => {
    setError('');
    setSuccess('');
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('appPassword', '0411');
      setSuccess('비밀번호가 0411로 초기화되었습니다!');
      setLoading(false);
      setTimeout(() => { onSuccess('0411'); }, 1000);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-xs w-full border-4 border-blue-200 relative">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-blue-400 text-xl">×</button>
        <div className="text-4xl mb-2 select-none">🔒✨</div>
        {mode === 'change' ? (
          <>
            <div className="text-lg font-bold text-blue-600 mb-2">비밀번호 변경</div>
            <div className="w-full flex flex-col gap-2 mb-2">
              <div className="relative flex items-center">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="현재 비밀번호"
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-black w-full pr-10"
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 text-lg"
                  tabIndex={-1}
                  onClick={() => setShowCurrent(v => !v)}
                  aria-label={showCurrent ? '비밀번호 감추기' : '비밀번호 보기'}
                >
                  {showCurrent ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="새 비밀번호 (3자 이상)"
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-black w-full pr-10"
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 text-lg"
                  tabIndex={-1}
                  onClick={() => setShowNew(v => !v)}
                  aria-label={showNew ? '비밀번호 감추기' : '비밀번호 보기'}
                >
                  {showNew ? '🙈' : '👁️'}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showNew2 ? 'text' : 'password'}
                  placeholder="새 비밀번호 확인"
                  className="border rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-400 text-black w-full pr-10"
                  value={newPw2}
                  onChange={e => setNewPw2(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 text-lg"
                  tabIndex={-1}
                  onClick={() => setShowNew2(v => !v)}
                  aria-label={showNew2 ? '비밀번호 감추기' : '비밀번호 보기'}
                >
                  {showNew2 ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
            {success && <div className="text-green-500 text-xs mb-2">{success}</div>}
            <button
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow w-full mt-2"
              onClick={handleChange}
              disabled={loading}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </>
        ) : (
          <>
            <div className="text-lg font-bold text-blue-600 mb-2">비밀번호 초기화</div>
            <div className="text-gray-600 text-sm mb-4 text-center">정말 비밀번호를 <b>0411</b>로 초기화할까요?<br/>이 작업은 되돌릴 수 없어요!</div>
            {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
            {success && <div className="text-green-500 text-xs mb-2">{success}</div>}
            <button
              className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg shadow w-full mb-2"
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? '초기화 중...' : '네, 초기화할래요!'}
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow w-full"
              onClick={onClose}
              disabled={loading}
            >
              취소할래요
            </button>
          </>
        )}
      </div>
    </div>
  );
} 