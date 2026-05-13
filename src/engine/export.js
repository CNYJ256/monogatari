import { render } from './renderer.js';
import { createInternalState } from './internalState.js';

/**
 * Export the current frame as a high-resolution PNG.
 *
 * Creates an offscreen canvas at the design resolution (baseWidth by
 * baseWidth / aspectRatio), performs a full re-render, and returns the
 * resulting PNG blob together with a timestamped filename.
 *
 * The renderer's built-in DPR logic handles the backing-store density,
 * so the output always matches the design dimensions in physical pixels.
 *
 * @param {object} config - Complete FrameConfig from the store
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export function exportPNG(config) {
  const baseHeight =
    config.baseWidth / (config.aspectRatio[0] / config.aspectRatio[1]);

  const canvas = document.createElement('canvas');
  canvas.width = config.baseWidth;
  canvas.height = baseHeight;

  const internalState = createInternalState();
  const dirtyFlags = { backgroundOrTexture: true };

  render(config, canvas, dirtyFlags, internalState, null);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('canvas.toBlob returned null'));
        return;
      }
      const filename = `monogatari-${Date.now()}.png`;
      resolve({ blob, filename });
    }, 'image/png');
  });
}
