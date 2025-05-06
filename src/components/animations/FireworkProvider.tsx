'use client';

import { useEffect } from 'react';
import useFirework from '@/hooks/useFirework';
import FireworkEffect from './FireworkEffect';

export default function FireworkProvider() {
  const { fireworks, createFirework } = useFirework();

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // 메뉴 링크나 CRUD 버튼에만 적용
      if (
        target.matches('a[href^="/"], button[class*="crud"]') || 
        target.closest('a[href^="/"], button[class*="crud"]')
      ) {
        const rect = target.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        createFirework(x, y);
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('mouseover', handleMouseOver);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [createFirework]);

  return (
    <>
      {fireworks.map((firework) => (
        <FireworkEffect
          key={firework.id}
          x={firework.x}
          y={firework.y}
        />
      ))}
    </>
  );
} 