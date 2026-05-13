import { useEffect } from 'react';
import { useFrameStore } from '../state/frameStore.js';

/**
 * Detect basic canvas 2D support and store the result in config.assets.
 *
 * Runs once on mount. If canvas.getContext('2d') fails or throws,
 * sets config.assets.canvasSupported to false so the UI can show a
 * downgrade message.
 */
export default function useCapabilities() {
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        useFrameStore.getState().setConfig('assets.canvasSupported', false);
      }
    } catch {
      useFrameStore.getState().setConfig('assets.canvasSupported', false);
    }
  }, []);
}
