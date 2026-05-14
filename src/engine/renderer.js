import { updateCache, drawCache, createCacheCanvas } from './cache.js';
import { generateNoisePattern } from './layers/grain.js';
import { formatFont, drawTextSlots } from './layers/text.js';
import { positionToPixel, ratioToPixel, getGlobalScale } from '../utils/coordinates.js';

// Re-exports for convenient single-entry imports
export { createCacheCanvas, updateCache, drawCache } from './cache.js';
export { generateNoisePattern } from './layers/grain.js';
export { drawTextSlots } from './layers/text.js';
export { createInternalState } from './internalState.js';

/**
 * Render the complete monogatari frame to a target canvas.
 *
 * Orchestrates the full rendering pipeline:
 *   1. DPR-aware canvas setup
 *   2. Lazy initialization of internal state
 *   3. Background + texture caching (with dirty-checking)
 *   4. Text slot rendering (sorted by z-order)
 *   5. Footer block rendering
 *
 * This function is pure — it does not modify config, dirtyFlags, or any store state.
 * Callers should reset dirtyFlags themselves after calling render.
 *
 * @param {object} config - Frame configuration (matches store shape)
 * @param {HTMLCanvasElement} canvas - Target display canvas
 * @param {object} dirtyFlags - { backgroundOrTexture: boolean }
 * @param {object} internalState - Resource pool from createInternalState()
 * @param {object|null} cache - Offscreen cache from createCacheCanvas() (auto-created if null)
 */
export function render(config, canvas, dirtyFlags, internalState, cache, dprOverride) {
  // --- DPR-aware canvas setup ---
  const dpr = dprOverride ?? (window.devicePixelRatio || 1);
  const cssWidth = canvas.clientWidth || canvas.width / dpr;
  const cssHeight = canvas.clientHeight || canvas.height / dpr;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  if (canvas.width < 1 || canvas.height < 1) {
    console.warn('render: canvas has zero dimensions — skipping render');
    return;
  }

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // --- Clear canvas ---
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // --- Compute derived layout values ---
  const baseHeight = config.baseWidth / (config.aspectRatio[0] / config.aspectRatio[1]);

  // --- Lazy-init internal state ---
  if (!internalState.noisePattern) {
    internalState.noisePattern = generateNoisePattern();
  }

  // --- Lazy-init cache ---
  // Cache is always at design resolution so textures match export 1:1.
  // drawCache scales it down to CSS dimensions for preview.
  if (!cache) {
    cache = createCacheCanvas(config.baseWidth, baseHeight);
  }

  // --- Background + texture layer (cached) ---
  if (dirtyFlags.backgroundOrTexture) {
    // Recreate cache if design resolution changed (e.g., baseWidth or aspect ratio).
    if (cache.canvas.width !== config.baseWidth || cache.canvas.height !== baseHeight) {
      cache.canvas.width = config.baseWidth;
      cache.canvas.height = baseHeight;
    }
    updateCache(cache, config, internalState);
  }
  drawCache(ctx, cache, cssWidth, cssHeight);

  // --- Text layer ---
  drawTextSlots(
    ctx,
    config.textSlots,
    config.baseWidth,
    baseHeight,
    cssWidth,
    cssHeight,
    config.assets.fontsLoaded,
  );

  // --- Footer block ---
  if (config.footerBlock.enabled && config.footerBlock.content) {
    drawFooterBlock(ctx, config.footerBlock, config.baseWidth, baseHeight, cssWidth);
  }
}

/**
 * Draw the footer block (episode/chapter indicator) on the canvas.
 *
 * The footer is typically rendered as small centered text near the bottom.
 * Supports both ratio-based fontSize (< 1) and absolute pixel fontSize (>= 1).
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {object} footerBlock - Footer block config
 * @param {number} baseWidth - Design base width
 * @param {number} baseHeight - Design base height
 * @param {number} canvasWidth - Actual canvas CSS pixel width
 */
export function drawFooterBlock(ctx, footerBlock, baseWidth, baseHeight, canvasWidth) {
  const scale = getGlobalScale(canvasWidth, baseWidth);
  const pixelPos = positionToPixel(footerBlock.position, baseWidth, baseHeight, canvasWidth);

  const fontSizePx =
    footerBlock.fontSize < 1
      ? ratioToPixel(footerBlock.fontSize, baseHeight, scale)
      : footerBlock.fontSize * scale;

  ctx.save();
  ctx.font = formatFont(footerBlock.fontWeight, fontSizePx, footerBlock.fontFamily);
  ctx.fillStyle = footerBlock.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(footerBlock.content, pixelPos.x, pixelPos.y);
  ctx.restore();
}
