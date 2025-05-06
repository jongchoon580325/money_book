'use client';

import { useState, useCallback } from 'react';

interface FireworkPosition {
  id: number;
  x: number;
  y: number;
}

export default function useFirework() {
  const [fireworks, setFireworks] = useState<FireworkPosition[]>([]);

  const createFirework = useCallback((x: number, y: number) => {
    const id = Date.now();
    setFireworks(prev => [...prev, { id, x, y }]);

    // 1초 후에 폭죽 제거
    setTimeout(() => {
      setFireworks(prev => prev.filter(fw => fw.id !== id));
    }, 1000);
  }, []);

  return { fireworks, createFirework };
} 