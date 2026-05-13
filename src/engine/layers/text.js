import { positionToPixel, ratioToPixel, getGlobalScale } from '../../utils/coordinates.js';
import { computeVerticalLayout } from '../layout/verticalText.js';

/**
 * Format a CSS font shorthand value.
 * Handles quoting for font families that contain whitespace.
 *
 * @param {number} fontWeight
 * @param {number} fontSizePx
 * @param {string} fontFamily
 * @returns {string} e.g. "400 80px sans-serif" or '400 80px "MS PMincho"'
 */
function formatFont(fontWeight, fontSizePx, fontFamily) {
  const family = fontFamily.trim();
  const needsQuoting =
    /\s/.test(family) && !family.startsWith('"') && !family.startsWith("'");
  const quoted = needsQuoting ? `"${family}"` : family;
  return `${fontWeight} ${fontSizePx}px ${quoted}`;
}

/**
 * Measure the width of a single character using the current font.
 *
 * Some glyphs (e.g. CJK punctuation) may have zero or full-width advance.
 * We clamp the minimum to fontSizePx * 0.5 so narrow characters don't collapse.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} char
 * @param {number} fontSizePx
 * @returns {number}
 */
function measureCharWidth(ctx, char, fontSizePx) {
  const metrics = ctx.measureText(char);
  // CJK fullwidth fallback: if metrics is near zero, treat as fullwidth
  const fallback = fontSizePx * 0.5;
  return Math.max(metrics.width, fallback);
}

/**
 * Calculate the total width of a text string, accounting for letter-spacing.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} text
 * @param {number} letterSpacingPx - Letter spacing in CSS pixels (0 means none)
 * @param {number} fontSizePx
 * @returns {number} Total width in CSS pixels
 */
function calcTextWidth(ctx, text, letterSpacingPx, fontSizePx) {
  if (!text) return 0;
  if (letterSpacingPx === 0) {
    return ctx.measureText(text).width;
  }
  let total = 0;
  for (const char of text) {
    total += measureCharWidth(ctx, char, fontSizePx) + letterSpacingPx;
  }
  // Remove the trailing spacing after the last character
  return total - letterSpacingPx;
}

/**
 * Draw a single line of horizontal text onto the canvas.
 *
 * Supports textAlign, textShadow, border/stroke, and letterSpacing.
 * Canvas 2D does not support letter-spacing natively, so when letterSpacing > 0
 * each character is drawn individually.
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {object} slot - TextSlot configuration object
 * @param {number} baseWidth - Design base width
 * @param {number} baseHeight - Design base height
 * @param {number} canvasWidth - Actual canvas CSS pixel width
 */
export function drawHorizontalText(ctx, slot, baseWidth, baseHeight, canvasWidth) {
  const scale = getGlobalScale(canvasWidth, baseWidth);
  const pixelPos = positionToPixel(slot.position, baseWidth, baseHeight, canvasWidth);
  const fontSizePx = ratioToPixel(slot.fontSize, baseHeight, scale);
  const letterSpacingPx = ratioToPixel(slot.letterSpacing, baseHeight, scale);

  ctx.save();

  ctx.font = formatFont(slot.fontWeight, fontSizePx, slot.fontFamily);
  ctx.fillStyle = slot.color;

  // Shadow
  if (slot.textShadow && slot.textShadow.blur > 0) {
    ctx.shadowBlur = slot.textShadow.blur * scale;
    ctx.shadowColor = slot.textShadow.color;
  }

  // Border (stroke)
  const hasBorder = slot.border && slot.border.width > 0;

  if (letterSpacingPx === 0) {
    // Fast path: native textAlign and single fillText call
    ctx.textAlign = slot.textAlign;
    const x = pixelPos.x;
    const y = pixelPos.y;

    ctx.fillText(slot.content, x, y);
    if (hasBorder) {
      ctx.strokeStyle = slot.border.color;
      ctx.lineWidth = slot.border.width * scale;
      ctx.strokeText(slot.content, x, y);
    }
  } else {
    // Letter-spacing path: manual alignment and per-character drawing
    const totalWidth = calcTextWidth(ctx, slot.content, letterSpacingPx, fontSizePx);

    let startX = pixelPos.x;
    if (slot.textAlign === 'center') {
      startX -= totalWidth / 2;
    } else if (slot.textAlign === 'right') {
      startX -= totalWidth;
    }
    // 'left' (or any other value): no offset

    const y = pixelPos.y;

    if (hasBorder) {
      ctx.strokeStyle = slot.border.color;
      ctx.lineWidth = slot.border.width * scale;
    }

    let cursorX = startX;
    for (const char of slot.content) {
      const charWidth = measureCharWidth(ctx, char, fontSizePx);
      ctx.fillText(char, cursorX, y);
      if (hasBorder) {
        ctx.strokeText(char, cursorX, y);
      }
      cursorX += charWidth + letterSpacingPx;
    }
  }

  ctx.restore();
}

/**
 * Draw vertical text onto the canvas by computing a full layout and then
 * rendering each character individually.
 *
 * Handles: character rotation (punctuation), offset (punctuation), and
 * tate-chu-yoko groups (multiple Latin chars drawn horizontally as a block).
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {object} slot - TextSlot configuration object (direction === 'vertical')
 * @param {number} baseWidth - Design base width
 * @param {number} baseHeight - Design base height
 * @param {number} canvasWidth - Actual canvas CSS pixel width
 * @param {number} canvasHeight - Actual canvas CSS pixel height
 */
export function drawVerticalText(ctx, slot, baseWidth, baseHeight, canvasWidth, canvasHeight) {
  const layout = computeVerticalLayout(
    slot.content,
    slot,
    canvasWidth,
    canvasHeight,
    baseWidth,
    baseHeight,
  );

  const { characters, fontSizePx } = layout;
  const scale = getGlobalScale(canvasWidth, baseWidth);
  const hasBorder = slot.border && slot.border.width > 0;

  // Set common text properties once (same for all characters)
  ctx.font = formatFont(slot.fontWeight, fontSizePx, slot.fontFamily);
  ctx.fillStyle = slot.color;

  // Shadow
  if (slot.textShadow && slot.textShadow.blur > 0) {
    ctx.shadowBlur = slot.textShadow.blur * scale;
    ctx.shadowColor = slot.textShadow.color;
  }

  // Border (stroke)
  if (hasBorder) {
    ctx.strokeStyle = slot.border.color;
    ctx.lineWidth = slot.border.width * scale;
  }

  for (const ch of characters) {
    ctx.save();

    // Move to character position
    ctx.translate(ch.x, ch.y);

    // Apply rotation (for punctuation like 「」— etc.)
    if (ch.rotation !== 0) {
      ctx.rotate((ch.rotation * Math.PI) / 180);
    }

    // Apply offset (for 。、，． etc.)
    if (ch.offsetX !== 0 || ch.offsetY !== 0) {
      ctx.translate(ch.offsetX, ch.offsetY);
    }

    if (ch.isTateChuYoko && ch.tcyChars && ch.tcyChars.length > 1) {
      // Tate-chu-yoko: draw multiple characters horizontally as a group.
      // Each character takes an equal share of the column width, centered.
      const totalWidth = fontSizePx * ch.tcyChars.length * 0.55;
      const startX = -totalWidth / 2;

      for (let i = 0; i < ch.tcyChars.length; i++) {
        const charX = startX + i * fontSizePx * 0.55;
        ctx.fillText(ch.tcyChars[i], charX, 0);
        if (hasBorder) {
          ctx.strokeText(ch.tcyChars[i], charX, 0);
        }
      }
    } else {
      // Normal single character
      ctx.fillText(ch.grapheme, 0, 0);
      if (hasBorder) {
        ctx.strokeText(ch.grapheme, 0, 0);
      }
    }

    ctx.restore();
  }
}

/**
 * Draw all enabled text slots onto the canvas, respecting z-order.
 *
 * Slots are filtered (enabled === true, non-empty content), sorted by zIndex,
 * and then rendered. Both horizontal and vertical slots are supported.
 *
 * @param {CanvasRenderingContext2D} ctx - Target canvas context
 * @param {object[]} slots - Array of TextSlot configs
 * @param {number} baseWidth - Design base width
 * @param {number} baseHeight - Design base height
 * @param {number} canvasWidth - Actual canvas CSS pixel width
 * @param {number} canvasHeight - Actual canvas CSS pixel height
 * @param {boolean} fontsReady - Whether web fonts have loaded
 */
export function drawTextSlots(ctx, slots, baseWidth, baseHeight, canvasWidth, canvasHeight, fontsReady) {
  if (!fontsReady) return;

  const visible = slots.filter((s) => s.enabled && s.content);
  const sorted = [...visible].sort((a, b) => a.zIndex - b.zIndex);

  for (const slot of sorted) {
    if (slot.direction === 'vertical') {
      drawVerticalText(ctx, slot, baseWidth, baseHeight, canvasWidth, canvasHeight);
      continue;
    }
    drawHorizontalText(ctx, slot, baseWidth, baseHeight, canvasWidth);
  }
}

/**
 * Measure the total rendered width of a text string given font and spacing.
 *
 * Useful for UI previews that need to estimate layout size.
 *
 * @param {CanvasRenderingContext2D} ctx - A canvas 2D context (can be offscreen)
 * @param {string} text - The text to measure
 * @param {string} fontFamily - Font family (handled same as drawHorizontalText)
 * @param {number} fontWeight
 * @param {number} fontSizePx - Font size in CSS pixels
 * @param {number} [letterSpacing=0] - Letter spacing in CSS pixels
 * @returns {number} Total width in CSS pixels
 */
export function measureTextWidth(ctx, text, fontFamily, fontWeight, fontSizePx, letterSpacing = 0) {
  if (!text) return 0;
  ctx.save();
  ctx.font = formatFont(fontWeight, fontSizePx, fontFamily);
  const width = calcTextWidth(ctx, text, letterSpacing, fontSizePx);
  ctx.restore();
  return width;
}
