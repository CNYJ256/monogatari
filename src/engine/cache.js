import { drawBackground } from './layers/background';
import { drawScanlines } from './layers/scanlines';
import { drawGrain } from './layers/grain';

/**
 * Create an offscreen cache canvas and its 2D context.
 *
 * @param {number} width - CSS pixel width
 * @param {number} height - CSS pixel height
 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }}
 */
export function createCacheCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

/**
 * Composite the background and texture layers into the cache canvas.
 *
 * Renders in order: background color → scanlines (if enabled) → grain (if enabled).
 * The cache canvas is fully cleared and repainted on each call.
 *
 * @param {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }} cache - Cache object from createCacheCanvas()
 * @param {object} config - Frame configuration (matches store shape)
 * @param {object} internalState - Internal state with optional pre-generated patterns
 * @param {CanvasPattern|null} internalState.noisePattern
 * @param {CanvasPattern|null} internalState.scanlinePattern
 */
export function updateCache(cache, config, internalState) {
  const { width, height } = cache.canvas;
  const { ctx } = cache;

  drawBackground(ctx, width, height, config.backgroundColor);

  if (config.texture?.scanline?.enabled) {
    const { density, opacity, color } = config.texture.scanline;
    drawScanlines(ctx, width, height, density, opacity, color);
  }

  if (config.texture?.grain?.enabled && internalState.noisePattern) {
    const { intensity } = config.texture.grain;
    drawGrain(ctx, width, height, internalState.noisePattern, intensity);
  }
}

/**
 * Draw the cached background+texture composite onto a target canvas.
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {{ canvas: HTMLCanvasElement }} cache - Cache object whose canvas will be drawn
 */
export function drawCache(ctx, cache) {
  ctx.drawImage(cache.canvas, 0, 0);
}
