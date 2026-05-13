/**
 * Convert a ratio value (0–1) to a pixel value.
 *
 * Formula: P_pixel = P_ratio * baseDimension * globalScale
 * where globalScale = canvasActualWidth / baseWidth
 *
 * @param {number} ratioValue - Ratio value (0–1)
 * @param {number} baseDimension - Base dimension (baseWidth or baseHeight)
 * @param {number} globalScale - Global scale factor (canvasActualWidth / baseWidth)
 * @returns {number} Pixel value
 */
export function ratioToPixel(ratioValue, baseDimension, globalScale) {
  return ratioValue * baseDimension * globalScale;
}

/**
 * Convert a pixel value back to a ratio value (0–1).
 *
 * Inverse of ratioToPixel.
 *
 * @param {number} pixelValue - Pixel value
 * @param {number} baseDimension - Base dimension (baseWidth or baseHeight)
 * @param {number} globalScale - Global scale factor (canvasActualWidth / baseWidth)
 * @returns {number} Ratio value (0–1)
 */
export function pixelToRatio(pixelValue, baseDimension, globalScale) {
  return pixelValue / (baseDimension * globalScale);
}

/**
 * Calculate the global scale factor from canvas width and base width.
 *
 * Formula: globalScale = canvasWidth / baseWidth
 *
 * @param {number} canvasWidth - Actual canvas width in pixels
 * @param {number} baseWidth - Design base width
 * @returns {number} Global scale factor
 */
export function getGlobalScale(canvasWidth, baseWidth) {
  return canvasWidth / baseWidth;
}

/**
 * Convert a ratio position { x, y } to a pixel position.
 *
 * Convenience function that internally calls getGlobalScale() and ratioToPixel().
 *
 * @param {{ x: number, y: number }} position - Ratio position (0–1)
 * @param {number} baseWidth - Design base width
 * @param {number} baseHeight - Design base height
 * @param {number} canvasWidth - Actual canvas width in pixels
 * @returns {{ x: number, y: number }} Pixel position
 */
export function positionToPixel(position, baseWidth, baseHeight, canvasWidth) {
  const scale = getGlobalScale(canvasWidth, baseWidth);
  return {
    x: ratioToPixel(position.x, baseWidth, scale),
    y: ratioToPixel(position.y, baseHeight, scale),
  };
}

/**
 * Convert a pixel position back to a ratio position { x, y }.
 *
 * Convenience function that internally calls getGlobalScale() and pixelToRatio().
 *
 * @param {number} pixelX - Pixel x coordinate
 * @param {number} pixelY - Pixel y coordinate
 * @param {number} baseWidth - Design base width
 * @param {number} baseHeight - Design base height
 * @param {number} canvasWidth - Actual canvas width in pixels
 * @returns {{ x: number, y: number }} Ratio position (0–1)
 */
export function pixelToPosition(pixelX, pixelY, baseWidth, baseHeight, canvasWidth) {
  const scale = getGlobalScale(canvasWidth, baseWidth);
  return {
    x: pixelToRatio(pixelX, baseWidth, scale),
    y: pixelToRatio(pixelY, baseHeight, scale),
  };
}
