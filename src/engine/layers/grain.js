/**
 * Generate a reusable noise/grain CanvasPattern.
 *
 * Creates a square offscreen canvas filled with random grayscale pixels
 * via ImageData for performance, then returns a repeating pattern.
 *
 * @param {number} size - Width and height of the noise texture (default 512)
 * @returns {CanvasPattern} A repeatable noise pattern
 */
export function generateNoisePattern(size = 512) {
  const offscreen = document.createElement('canvas');
  offscreen.width = size;
  offscreen.height = size;
  const ctx = offscreen.getContext('2d');

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const value = Math.floor(Math.random() * 256);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return ctx.createPattern(offscreen, 'repeat');
}

/**
 * Draw grain/noise overlay using a pre-generated pattern.
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {number} width - CSS pixel width
 * @param {number} height - CSS pixel height
 * @param {CanvasPattern} pattern - Noise pattern from generateNoisePattern()
 * @param {number} intensity - Opacity of the grain layer (0–1)
 */
export function drawGrain(ctx, width, height, pattern, intensity) {
  ctx.save();
  ctx.fillStyle = pattern;
  ctx.globalAlpha = intensity;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
