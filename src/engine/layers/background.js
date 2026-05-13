/**
 * Fill the entire canvas with a solid background color.
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {number} width - CSS pixel width
 * @param {number} height - CSS pixel height
 * @param {string} color - CSS color value (e.g. '#e60000')
 */
export function drawBackground(ctx, width, height, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
