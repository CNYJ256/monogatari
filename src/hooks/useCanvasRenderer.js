import { useEffect, useRef } from 'react';
import { render } from '../engine/renderer.js';
import { createInternalState } from '../engine/internalState.js';
import { createCacheCanvas } from '../engine/cache.js';
import { useFrameStore } from '../state/frameStore.js';

/**
 * Shallow comparison — returns true if a and b have the same top-level keys
 * with Object.is-equality on each value.
 */
function shallow(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
    return false;
  }
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

/**
 * Subscribe to the Zustand store and drive the canvas render pipeline.
 *
 * Batches rapid store updates via requestAnimationFrame so multiple
 * synchronous setState calls result in a single render call.
 *
 * On unmount the subscription and any pending RAF are cleaned up.
 *
 * @param {{ current: HTMLCanvasElement | null }} canvasRef - React ref to the preview <canvas>
 */
export default function useCanvasRenderer(canvasRef) {
  const internalStateRef = useRef(createInternalState());
  const cacheRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId = null;
    let pending = false;

    const doRender = () => {
      pending = false;

      const dpr = window.devicePixelRatio || 1;
      const cssWidth = canvas.clientWidth || canvas.width / dpr;
      const cssHeight = canvas.clientHeight || canvas.height / dpr;

      if (cssWidth < 1 || cssHeight < 1) return;

      // Reset canvas transform so renderer starts from identity
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Lazy-init cache (renderer resizes it when needed)
      if (!cacheRef.current) {
        cacheRef.current = createCacheCanvas(cssWidth, cssHeight);
      }

      const state = useFrameStore.getState();
      render(
        state.config,
        canvas,
        state.dirtyFlags,
        internalStateRef.current,
        cacheRef.current,
      );

      // Reset dirty flag so BG/texture cache is not rebuilt on every frame
      if (state.dirtyFlags.backgroundOrTexture) {
        useFrameStore.getState().setDirty('backgroundOrTexture', false);
      }
    };

    const scheduleRender = () => {
      if (!pending) {
        pending = true;
        rafId = requestAnimationFrame(doRender);
      }
    };

    // Observe canvas size changes so we re-render after ResizeObserver fires
    const resizeObserver = new ResizeObserver(() => {
      scheduleRender();
    });
    resizeObserver.observe(canvas);

    // Subscribe to config and dirtyFlags changes
    const unsub = useFrameStore.subscribe(
      (state) => ({ config: state.config, dirtyFlags: state.dirtyFlags }),
      () => {
        scheduleRender();
      },
      { equalityFn: shallow },
    );

    // Initial render
    scheduleRender();

    return () => {
      unsub();
      resizeObserver.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [canvasRef]);
}
