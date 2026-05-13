/**
 * Draw horizontal scanline texture over the canvas.
 *
 * Creates a small offscreen pattern: top half is colored with the given
 * opacity, bottom half is transparent. The pattern repeats vertically to
 * simulate CRT-style scanlines.
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {number} width - CSS pixel width
 * @param {number} height - CSS pixel height
 * @param {number} density - Scanline density in CSS pixels
 * @param {number} opacity - Opacity of the colored lines (0–1)
 * @param {string} color - CSS color for the scanlines
 */
export function drawScanlines(ctx, width, height, density, opacity, color) {
  ctx.save();

  const pw = 1;
  const ph = density * 2;

  const offscreen = document.createElement('canvas');
  offscreen.width = pw;
  offscreen.height = ph;
  const octx = offscreen.getContext('2d');

  octx.globalAlpha = opacity;
  octx.fillStyle = color;
  octx.fillRect(0, 0, pw, density);

  ctx.fillStyle = ctx.createPattern(offscreen, 'repeat');
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}
