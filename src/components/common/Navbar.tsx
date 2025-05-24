'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaWallet, FaChartLine, FaCalendarAlt, FaBook } from 'react-icons/fa';

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    const onStorage = () => setIsLoggedIn(localStorage.getItem('isLoggedIn') === 'true');
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const getLinkClassName = (path: string) => {
    if (!mounted) return '';
    const isActive = pathname === path;
    return `text-lg font-medium relative
      ${isActive ? 'text-orange-500' : 'text-[#41416e]/80'} 
      hover:text-[#41416e] transition-colors duration-200
      after:content-[""] after:absolute after:left-0 after:bottom-[-4px] 
      after:w-full after:h-[2px] after:transition-transform after:duration-200
      ${isActive ? 'after:bg-orange-500 after:scale-x-100' : 'after:bg-orange-500 after:scale-x-0'}
      hover:after:scale-x-100`;
  };

  const handleLogout = () => {
    localStorage.setItem('isLoggedIn', 'false');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <nav className="bg-[#bebec2] shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16 relative">
          {/* Left: Logo */}
          <div className="flex items-center min-w-[180px]">
            <Link href="/transaction/input" className="text-2xl font-extrabold tracking-tight text-[#41416e] hover:text-orange-500 transition-colors duration-200">
              <span className="hidden sm:inline">SMART 가계부</span>
            </Link>
          </div>
          {/* Center: Main Menu + Christian Asset Management */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-10">
            <div className="flex space-x-8">
              <Link href="/transaction/input" className={getLinkClassName('/transaction/input')}>
                <span
                  className="inline md:hidden text-2xl align-middle relative"
                  onMouseEnter={() => setHoveredMenu('input')}
                  onMouseLeave={() => setHoveredMenu(null)}
                  onTouchStart={() => setHoveredMenu('input')}
                  onTouchEnd={() => setHoveredMenu(null)}
                  onFocus={() => setHoveredMenu('input')}
                  onBlur={() => setHoveredMenu(null)}
                  tabIndex={0}
                >
                  <FaWallet />
                  {hoveredMenu === 'input' && (
                    <span className="md:hidden block absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-black/80 text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
              거래입력
                    </span>
                  )}
                </span>
                <span className="hidden md:inline">거래입력</span>
            </Link>
              <Link href="/transaction/statistics" className={getLinkClassName('/transaction/statistics')}>
                <span
                  className="inline md:hidden text-2xl align-middle relative"
                  onMouseEnter={() => setHoveredMenu('statistics')}
                  onMouseLeave={() => setHoveredMenu(null)}
                  onTouchStart={() => setHoveredMenu('statistics')}
                  onTouchEnd={() => setHoveredMenu(null)}
                  onFocus={() => setHoveredMenu('statistics')}
                  onBlur={() => setHoveredMenu(null)}
                  tabIndex={0}
                >
                  <FaChartLine />
                  {hoveredMenu === 'statistics' && (
                    <span className="md:hidden block absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-black/80 text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
              거래통계
                    </span>
                  )}
                </span>
                <span className="hidden md:inline">거래통계</span>
            </Link>
              <Link href="/settings" className={getLinkClassName('/settings')}>
                <span
                  className="inline md:hidden text-2xl align-middle relative"
                  onMouseEnter={() => setHoveredMenu('settings')}
                  onMouseLeave={() => setHoveredMenu(null)}
                  onTouchStart={() => setHoveredMenu('settings')}
                  onTouchEnd={() => setHoveredMenu(null)}
                  onFocus={() => setHoveredMenu('settings')}
                  onBlur={() => setHoveredMenu(null)}
                  tabIndex={0}
                >
                  <FaCalendarAlt />
                  {hoveredMenu === 'settings' && (
                    <span className="md:hidden block absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-black/80 text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
              거래설정
                    </span>
                  )}
                </span>
                <span className="hidden md:inline">거래설정</span>
              </Link>
            </div>
            <Link href="/bible" className={`text-lg font-bold px-4 py-1 rounded transition-colors duration-200 ${pathname === '/bible' ? 'text-orange-500 bg-white/60' : 'text-[#41416e]/90 hover:text-orange-500 hover:bg-white/40'}`}>
              <span
                className="inline md:hidden text-2xl align-middle relative"
                onMouseEnter={() => setHoveredMenu('bible')}
                onMouseLeave={() => setHoveredMenu(null)}
                onTouchStart={() => setHoveredMenu('bible')}
                onTouchEnd={() => setHoveredMenu(null)}
                onFocus={() => setHoveredMenu('bible')}
                onBlur={() => setHoveredMenu(null)}
                tabIndex={0}
              >
                <FaBook />
                {hoveredMenu === 'bible' && (
                  <span className="md:hidden block absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-black/80 text-white text-xs rounded px-2 py-1 z-50 whitespace-nowrap">
                    크리스챤 자산관리
                  </span>
                )}
              </span>
              <span className="hidden md:inline">크리스챤 자산관리</span>
            </Link>
          </div>
          {/* Right: Login/Logout */}
          <div className="flex items-center min-w-[100px] justify-end">
            {isLoggedIn ? (
              <button
                className="text-lg font-medium text-[#41416e]/80 hover:text-[#41416e] transition-colors duration-200"
                onClick={handleLogout}
              >
                로그아웃
          </button>
            ) : (
              <Link 
                href="/" 
                className="text-lg font-medium text-[#41416e]/80 hover:text-[#41416e] transition-colors duration-200"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 