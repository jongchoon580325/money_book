'use client';
import { FaWallet, FaChartLine, FaCalendarAlt, FaBook } from 'react-icons/fa';
import { BsPiggyBank } from 'react-icons/bs';
import { RiShieldKeyholeLine } from 'react-icons/ri';
import Link from 'next/link';
import { useRef, useCallback, useState, useEffect } from 'react';
import useFirework from '@/hooks/useFirework';
import FireworkEffect from '@/components/animations/FireworkEffect';
import WelcomeModal from '@/components/common/WelcomeModal';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { fireworks, createFirework } = useFirework();
  const loginBtnRef = useRef<HTMLButtonElement>(null);
  const [inputPassword, setInputPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();

  // 로그인 상태 복원
  useEffect(() => {
    const saved = localStorage.getItem('isLoggedIn');
    if (saved === 'true') setIsLoggedIn(true);
    setInputPassword(''); // 앱 최초 실행시 입력필드 초기화
  }, []);

  // 버튼 중앙 좌표로 firework 발생
  const handleLoginMouseEnter = useCallback(() => {
    if (loginBtnRef.current) {
      const rect = loginBtnRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      createFirework(x, y);
    }
  }, [createFirework]);

  // 비밀번호 검증 및 로그인
  const handleLogin = () => {
    const savedPw = localStorage.getItem('appPassword') || '0411';
    if (inputPassword === savedPw) {
      setIsLoggedIn(true);
      localStorage.setItem('isLoggedIn', 'true');
      setError('');
      window.dispatchEvent(new Event('storage')); // 메뉴바 동기화
      setShowWelcome(true);
    } else {
      setError('비밀번호가 올바르지 않습니다.');
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.setItem('isLoggedIn', 'false');
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <main className="h-[calc(100vh-8rem)] bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center">
      {/* 불꽃 파티클 렌더링 */}
      {fireworks.map((fw) => (
        <FireworkEffect key={fw.id} x={fw.x} y={fw.y} />
      ))}
      <WelcomeModal open={showWelcome} onClose={() => { setShowWelcome(false); router.push('/transaction/input'); }} />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Section - Hero + Login */}
          <div className="col-span-12 lg:col-span-5 flex flex-col h-full justify-between space-y-6">
              {/* 타이틀/부연설명: 모바일에서는 숨김 */}
              <div className="text-left hidden sm:block">
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                  Smart 가계부
                </h1>
                <p className="text-xl lg:text-2xl text-gray-300 mb-4">
                  Financial Management System
                </p>
                <p className="text-base lg:text-lg text-gray-400">
                  당신의 재정을 스마트하게 관리하고 미래를 계획하세요. 더 효율적인 자산 관리를 통해 재정적 자유를 경험하세요.
                </p>
              </div>
              {/* Security Section: 모바일에서도 항상 보임 */}
            {!isLoggedIn ? (
              <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 mx-auto w-full max-w-md">
                <div className="flex items-center gap-3 mb-4">
                  <RiShieldKeyholeLine className="text-3xl text-blue-500" />
                  <h2 className="text-xl font-semibold">보안 접속</h2>
                </div>
                <div>
                  <div className="bg-gray-900/50 rounded-lg p-4 mb-3 flex items-center relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="비밀번호를 입력하세요"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm pr-10"
                      value={inputPassword}
                      onChange={e => setInputPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 text-xl"
                      tabIndex={-1}
                      onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? '비밀번호 감추기' : '비밀번호 보기'}
                    >
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button
                    ref={loginBtnRef}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 text-sm"
                    onMouseEnter={handleLoginMouseEnter}
                    onClick={handleLogin}
                  >
                    로그인
                  </button>
                  {error && <p className="text-red-400 text-xs text-center mt-2">{error}</p>}
                  <p className="text-gray-500 text-xs text-center mt-3">
                    안전한 접속을 위해 비밀번호를 타인에게 공유하지 마세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <button
                  className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-300 text-sm"
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
            </div>
            )}
          </div>
          {/* Right Section - Features Grid: 모바일에서는 숨김 */}
          <div className="col-span-12 lg:col-span-7 hidden sm:block">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* 지출 관리 */}
              <Link href="/transaction/input" className="group flex">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 w-full flex flex-col justify-between">
                  <div>
                    <div className="text-blue-500 mb-3 text-3xl group-hover:scale-110 transition-transform duration-300">
                      <FaWallet />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">수입.지출 관리</h3>
                  </div>
                  <p className="text-gray-400 text-sm">일별, 월별 지출을 한눈에 관리하세요</p>
                </div>
              </Link>
              {/* 통계 분석 */}
              <Link href="/transaction/statistics" className="group flex">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 w-full flex flex-col justify-between">
                  <div>
                    <div className="text-blue-500 mb-3 text-3xl group-hover:scale-110 transition-transform duration-300">
                      <FaChartLine />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">통계 분석</h3>
                  </div>
                  <p className="text-gray-400 text-sm">소비 패턴을 그래프로 분석하세요</p>
                </div>
              </Link>
              {/* 데이터 관리 */}
              <Link href="/settings" className="group flex">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 w-full flex flex-col justify-between">
                  <div>
                    <div className="text-blue-500 mb-3 text-3xl group-hover:scale-110 transition-transform duration-300">
                      <FaCalendarAlt />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">데이터 관리</h3>
                  </div>
                  <p className="text-gray-400 text-sm">데이터를 체계적으로 관리하세요</p>
                </div>
              </Link>
              {/* 자산 추적 */}
              <Link href="/bible" className="group flex">
                <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 w-full flex flex-col justify-between">
                  <div>
                    <div className="text-blue-500 mb-3 text-3xl group-hover:scale-110 transition-transform duration-300">
                      <FaBook />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">성경적 자산관리</h3>
                  </div>
                  <p className="text-gray-400 text-sm">성경적 자산 관리를 위한 크리스챤 프로젝트 입니다.</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
        </div>
      </main>
  );
}
