import { useState, useEffect, useCallback } from 'react';

export default function useWindowResize(containerRef) {
  const [size, setSize] = useState({ width: 800, height: 333, dpr: 1 });

  const measure = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    setSize({
      width: Math.floor(rect.width),
      height: Math.floor(rect.height),
      dpr,
    });
  }, [containerRef]);

  useEffect(() => {
    let rafId = null;
    let observer = null;

    if (containerRef.current) {
      observer = new ResizeObserver(() => {
        if (rafId !== null) return;
        rafId = requestAnimationFrame(() => {
          rafId = null;
          measure();
        });
      });
      observer.observe(containerRef.current);
      measure();
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
    };
  }, [containerRef, measure]);

  return size;
}
