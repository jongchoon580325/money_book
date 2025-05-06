import React from 'react';

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col items-center max-w-xs w-full border-4 border-yellow-200 relative animate-bounceIn">
        <button onClick={onClose} className="absolute top-2 right-3 text-gray-400 hover:text-yellow-400 text-xl">×</button>
        <div className="text-5xl mb-2 select-none animate-bounce">👏👏👏</div>
        <div className="text-lg font-bold text-yellow-600 mb-2 text-center">
          형정순 님의 입장을<br />기꺼이 두 손 들어 환영합니다.
        </div>
        <div className="text-2xl mt-2 animate-pulse">🎉✨🥳</div>
        <button
          className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg shadow"
          onClick={onClose}
        >
          닫기
        </button>
        <style jsx>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes bounceIn { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.05); opacity: 1; } 80% { transform: scale(0.98); } 100% { transform: scale(1); } }
          .animate-fadeIn { animation: fadeIn 0.3s; }
          .animate-bounceIn { animation: bounceIn 0.7s; }
        `}</style>
      </div>
    </div>
  );
} 