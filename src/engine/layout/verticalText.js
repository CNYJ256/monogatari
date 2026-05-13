import { ratioToPixel, positionToPixel, getGlobalScale } from '../../utils/coordinates.js';

/**
 * Merge consecutive Latin/digit grapheme segments into single tokens.
 *
 * Intl.Segmenter splits individual letters, but for vertical text layout
 * purposes Latin and digit runs should stay grouped so they can later be
 * detected as tate-chu-yoko blocks.
 *
 * @param {string[]} segments
 * @returns {string[]}
 */
function mergeLatinRuns(segments) {
  const result = [];
  let buf = '';

  for (const s of segments) {
    if (/^[\p{Script=Latin}\p{N}]+$/u.test(s)) {
      buf += s;
    } else {
      if (buf) {
        result.push(buf);
        buf = '';
      }
      result.push(s);
    }
  }

  if (buf) result.push(buf);
  return result;
}

/**
 * Split text into grapheme clusters using Intl.Segmenter (granularity: grapheme).
 * Falls back to a regex approach when Intl.Segmenter is unavailable.
 *
 * Consecutive Latin/digit characters are merged into a single token so that
 * they can later be detected as tate-chu-yoko groups.
 *
 * Spec 5.1
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitGraphemes(text) {
  if (!text) return [];

  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    const segmenter = new Intl.Segmenter('ja-JP', { granularity: 'grapheme' });
    const segments = [...segmenter.segment(text)].map((s) => s.segment);
    return mergeLatinRuns(segments);
  }

  // Fallback: regex for CJK, kana, punctuation (each = 1 grapheme);
  // Latin/digit runs stay grouped.
  return (
    text.match(
      /[\p{Script=Hani}\p{Script=Hiragana}\p{Script=Katakana}\p{P}]|[\p{Script=Latin}\p{N}]+|./gu,
    ) ?? []
  );
}

// --- Punctuation classification (Spec 5.3) ---

/** Characters that should be rotated 90 degrees around their center. */
const ROTATE_CHARS = new Set(['「', '」', '『', '』', '（', '）', '{', '}']);

/** Characters that offset toward the upper-right without rotating. */
const OFFSET_CHARS = new Set(['。', '、', '，', '．']);

/** Dash character that should be rotated 90 degrees. */
const DASH_CHAR = '—';

/** Characters that must not appear at the start of a column. */
const KINSOKU_START = new Set(['。', '、', '」', '）', '！', '？']);

/** Characters that must not appear at the end of a column. */
const KINSOKU_END = new Set(['「', '（']);

// --- Internal helpers ---

/**
 * Determine punctuation transform for a single grapheme.
 *
 * @param {string} grapheme
 * @param {number} fontSizePx
 * @returns {{ rotation: number, offsetX: number, offsetY: number }}
 */
function punctuationTransform(grapheme, fontSizePx) {
  if (ROTATE_CHARS.has(grapheme) || grapheme === DASH_CHAR) {
    return { rotation: 90, offsetX: 0, offsetY: 0 };
  }
  if (OFFSET_CHARS.has(grapheme)) {
    return {
      rotation: 0,
      offsetX: 0.4 * fontSizePx,
      offsetY: -0.4 * fontSizePx,
    };
  }
  return { rotation: 0, offsetX: 0, offsetY: 0 };
}

/**
 * Build flat item list from graphemes with tate-chu-yoko grouping (Spec 5.4).
 *
 * Returns items with shape:
 *   { type: 'char', grapheme, rotation, offsetX, offsetY }
 *   { type: 'tcy', grapheme (joined), tcyChars, rotation: 0, offsetX: 0, offsetY: 0 }
 *
 * @param {string[]} graphemes
 * @param {number} fontSizePx
 * @returns {object[]}
 */
function buildItems(graphemes, fontSizePx) {
  const items = [];
  let i = 0;

  function isNonCJK(g) {
    return /^[\p{Script=Latin}\p{N}]+$/u.test(g);
  }

  while (i < graphemes.length) {
    const g = graphemes[i];

    // Already-merged Latin/digit run (from splitGraphemes mergeLatinRuns) —
    // treat as a tate-chu-yoko group regardless of size.
    if (isNonCJK(g) && g.length >= 2) {
      items.push({
        type: 'tcy',
        grapheme: g,
        tcyChars: [...g],
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
      });
      i++;
      continue;
    }

    const pt = punctuationTransform(g, fontSizePx);
    items.push({
      type: 'char',
      grapheme: g,
      rotation: pt.rotation,
      offsetX: pt.offsetX,
      offsetY: pt.offsetY,
    });
    i++;
  }

  return items;
}

/**
 * Greedy column placement: assign column numbers and calculate positions
 * for each item. Wraps to a new column when vertical space is exhausted.
 *
 * Columns progress right-to-left (x decreases).
 *
 * @param {object[]} items
 * @param {number} startX
 * @param {number} startY
 * @param {number} charHeight
 * @param {number} columnWidth
 * @param {number} canvasHeight
 * @param {number} margin
 * @returns {{ characters: object[], totalColumns: number }}
 */
function greedyPlace(items, startX, startY, charHeight, columnWidth, canvasHeight, margin) {
  let currentX = startX;
  let currentY = startY;
  let currentColumn = 0;
  const characters = [];

  for (const item of items) {
    const stepHeight = charHeight;

    // Wrap to next column if this item would overflow bottom
    if (currentY + stepHeight > canvasHeight - margin) {
      currentX -= columnWidth;
      currentY = startY;
      currentColumn++;
    }

    characters.push(itemToCharacter(item, currentX, currentY, currentColumn));

    currentY += stepHeight;
  }

  return { characters, totalColumns: currentColumn + 1 };
}

/**
 * Convert an item to a character layout entry.
 */
function itemToCharacter(item, x, y, column) {
  return {
    grapheme: item.grapheme,
    x: Math.round(x),
    y: Math.round(y),
    rotation: item.rotation || 0,
    offsetX: item.offsetX || 0,
    offsetY: item.offsetY || 0,
    isTateChuYoko: item.type === 'tcy',
    tcyChars: item.type === 'tcy' ? item.tcyChars : undefined,
    column,
  };
}

/**
 * Recalculate x/y positions for every character based on its current column.
 *
 * Characters are stacked top-to-bottom within each column.
 * Columns progress right-to-left.
 *
 * @param {object[]} characters - Will be mutated in place.
 * @param {number} startX
 * @param {number} startY
 * @param {number} charHeight
 * @param {number} columnWidth
 */
function recalcPositions(characters, startX, startY, charHeight, columnWidth) {
  // Group by column
  const byCol = new Map();
  for (const ch of characters) {
    const list = byCol.get(ch.column) || [];
    list.push(ch);
    byCol.set(ch.column, list);
  }

  const colNums = [...byCol.keys()].sort((a, b) => a - b);

  for (const colNum of colNums) {
    const colChars = byCol.get(colNum);
    let y = startY;
    const x = startX - colNum * columnWidth;

    for (const ch of colChars) {
      ch.x = Math.round(x);
      ch.y = Math.round(y);
      y += charHeight;
    }
  }
}

/**
 * Apply kinsoku (avoid start/end) processing (Spec 5.5).
 *
 * Two-phase algorithm:
 *  1. Greedy line-breaking (already done)
 *  2. Post-process: check each column's first/last character and
 *     move between adjacent columns. Max 2 backtrack passes.
 *
 * Characters are only moved between adjacent columns.
 * After moving, positions are recalculated.
 *
 * @param {object[]} characters - Mutated in place.
 * @param {number} startX
 * @param {number} startY
 * @param {number} charHeight
 * @param {number} columnWidth
 * @returns {number} Total columns after kinsoku
 */
function applyKinsoku(characters, startX, startY, charHeight, columnWidth) {
  const maxPasses = 2;
  let passes = 0;
  let changed = true;

  while (changed && passes < maxPasses) {
    changed = false;
    passes++;

    // Build column groups
    const byCol = new Map();
    for (const ch of characters) {
      const list = byCol.get(ch.column) || [];
      list.push(ch);
      byCol.set(ch.column, list);
    }

    const colNums = [...byCol.keys()].sort((a, b) => a - b);

    for (let ci = 0; ci < colNums.length; ci++) {
      const colNum = colNums[ci];
      const colChars = byCol.get(colNum);
      if (!colChars || colChars.length === 0) continue;

      // 1. Column start: characters that can't start a column
      // Move the first character to the end of the previous column.
      if (KINSOKU_START.has(colChars[0].grapheme) && ci > 0) {
        const prevColChars = byCol.get(colNums[ci - 1]);
        const moved = colChars.shift();
        moved.column = colNums[ci - 1];
        prevColChars.push(moved);
        changed = true;
        // Re-check this column index since its contents changed
        ci--;
        continue;
      }

      // 2. Column end: characters that can't end a column
      // Move the first character of the next column to the end of this column.
      const lastIdx = colChars.length - 1;
      if (
        KINSOKU_END.has(colChars[lastIdx].grapheme) &&
        ci < colNums.length - 1
      ) {
        const nextColChars = byCol.get(colNums[ci + 1]);
        if (nextColChars && nextColChars.length > 0) {
          const moved = nextColChars.shift();
          moved.column = colNum;
          colChars.push(moved);
          changed = true;
          continue;
        }
      }
    }
  }

  if (passes >= maxPasses && changed) {
    console.warn('Kinsoku processing exceeded backtrack limit of 2 — layout may have violations.');
  }

  // Recalculate positions after all column reassignments
  recalcPositions(characters, startX, startY, charHeight, columnWidth);

  // Compute new total columns
  const maxCol = characters.reduce((max, ch) => Math.max(max, ch.column), 0);
  return maxCol + 1;
}

/**
 * Compute the full vertical text layout for a given slot.
 *
 * Spec 5.2-5.5.
 *
 * @param {string} text - The text content to lay out.
 * @param {object} slot - Text slot configuration.
 * @param {number} slot.position.x
 * @param {number} slot.position.y
 * @param {number} slot.fontSize
 * @param {number} [slot.lineHeight=1.5]
 * @param {number} canvasWidth - Actual canvas CSS pixel width.
 * @param {number} canvasHeight - Actual canvas CSS pixel height.
 * @param {number} baseWidth - Design base width.
 * @param {number} baseHeight - Design base height.
 * @returns {{
 *   characters: object[],
 *   totalColumns: number,
 *   columnWidth: number,
 *   charHeight: number,
 *   startX: number,
 *   startY: number,
 *   fontSizePx: number,
 * }}
 */
export function computeVerticalLayout(
  text,
  slot,
  canvasWidth,
  canvasHeight,
  baseWidth,
  baseHeight,
) {
  // --- Step 1: Coordinate conversion ---
  const scale = getGlobalScale(canvasWidth, baseWidth);
  const pixelPos = positionToPixel(slot.position, baseWidth, baseHeight, canvasWidth);
  const fontSizePx = ratioToPixel(slot.fontSize, baseHeight, scale);
  const lineHeight = Math.max(slot.lineHeight ?? 1.5, 0.5);
  const columnWidth = fontSizePx * lineHeight;
  const charHeight = fontSizePx * lineHeight;
  const margin = fontSizePx;

  const startX = pixelPos.x;
  const startY = pixelPos.y;

  // --- Step 2: Grapheme splitting ---
  const graphemes = splitGraphemes(text);

  // --- Step 3 & 4: Build items with punctuation and tate-chu-yoko ---
  const items = buildItems(graphemes, fontSizePx);

  // --- Step 5: Greedy column placement ---
  let { characters, totalColumns } = greedyPlace(
    items,
    startX,
    startY,
    charHeight,
    columnWidth,
    canvasHeight,
    margin,
  );

  // --- Step 6: Horizontal overflow detection ---
  const maxColumns = Math.floor((canvasWidth - margin) / columnWidth);
  if (maxColumns < 1) {
    // Canvas too small for even one column — return empty
    return {
      characters: [],
      totalColumns: 0,
      columnWidth,
      charHeight,
      startX,
      startY,
      fontSizePx,
    };
  }

  if (totalColumns > maxColumns) {
    characters = characters.filter((ch) => ch.column < maxColumns);
  }

  // --- Step 7: Kinsoku processing ---
  totalColumns = applyKinsoku(
    characters,
    startX,
    startY,
    charHeight,
    columnWidth,
  );

  // Re-apply horizontal overflow after kinsoku (column reassignment may push
  // some characters beyond the limit)
  if (totalColumns > maxColumns) {
    characters = characters.filter((ch) => ch.column < maxColumns);
    totalColumns = maxColumns;
  }

  return {
    characters,
    totalColumns,
    columnWidth,
    charHeight,
    startX,
    startY,
    fontSizePx,
  };
}
