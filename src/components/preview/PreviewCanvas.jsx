import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import useWindowResize from '../../hooks/useWindowResize.js';
import useFontStatus from '../../hooks/useFontStatus.js';
import useCanvasRenderer from '../../hooks/useCanvasRenderer.js';
import { useFrameStore } from '../../state/frameStore.js';
import { t } from '../../i18n/index.js';
import { positionToPixel, ratioToPixel, pixelToRatio, getGlobalScale } from '../../utils/coordinates.js';
import { computeVerticalLayout } from '../../engine/layout/verticalText.js';

// ---------------------------------------------------------------------------
// Hit-test helpers (outside component — no reactive deps needed)
// ---------------------------------------------------------------------------

/**
 * Check whether a CSS-pixel coordinate hits a horizontal text slot.
 *
 * Uses ctx.measureText() for accurate width (handles CJK/latin mix).
 * Uses actualBoundingBoxAscent for accurate vertical bounds when available.
 * The bounding box is offset according to slot.textAlign.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context (font already configured)
 */
function hitHorizontalSlot(cssX, cssY, slot, baseWidth, baseHeight, canvasCssWidth, ctx) {
  const scale = getGlobalScale(canvasCssWidth, baseWidth);
  const fontSizePx = ratioToPixel(slot.fontSize, baseHeight, scale);
  const pixelPos = positionToPixel(slot.position, baseWidth, baseHeight, canvasCssWidth);

  // Set font to match what the renderer uses
  const family = slot.fontFamily.trim();
  const needsQuoting = /\s/.test(family) && !family.startsWith('"') && !family.startsWith("'");
  const quotedFamily = needsQuoting ? `"${family}"` : family;
  ctx.font = `${slot.fontWeight} ${fontSizePx}px ${quotedFamily}`;

  const metrics = ctx.measureText(slot.content);
  const measuredWidth = metrics.width;

  let ascent = metrics.actualBoundingBoxAscent !== undefined
    ? metrics.actualBoundingBoxAscent
    : fontSizePx;
  let descent = metrics.actualBoundingBoxDescent !== undefined
    ? metrics.actualBoundingBoxDescent
    : 0;

  let left;
  if (slot.textAlign === 'center') {
    left = pixelPos.x - measuredWidth / 2;
  } else if (slot.textAlign === 'right') {
    left = pixelPos.x - measuredWidth;
  } else {
    left = pixelPos.x;
  }
  // Position.y is the alphabetic baseline (default in canvas 2D)
  const top = pixelPos.y - ascent;

  return cssX >= left && cssX <= left + measuredWidth && cssY >= top && cssY <= top + ascent + descent;
}

// Module-level cache to avoid recomputing vertical layout on every pointer-move
let _verticalLayoutCache = null;
let _verticalCacheKey = '';

/**
 * Check whether a CSS-pixel coordinate hits any character in a vertical text slot.
 *
 * Uses a module-level cache keyed on slot fields + canvas dimensions so the
 * expensive computeVerticalLayout call is only made when the slot or canvas
 * size actually changes.
 */
function hitVerticalSlot(cssX, cssY, slot, baseWidth, baseHeight, canvasCssWidth, canvasCssHeight) {
  const cacheKey = `${slot.id}|${slot.content}|${slot.position.x}|${slot.position.y}|${slot.fontSize}|${slot.fontFamily}|${slot.fontWeight}|${slot.letterSpacing}|${slot.lineHeight}|${slot.stagger}|${canvasCssWidth}|${canvasCssHeight}`;

  let layout;
  if (_verticalCacheKey === cacheKey) {
    layout = _verticalLayoutCache;
  } else {
    layout = computeVerticalLayout(
      slot.content,
      slot,
      canvasCssWidth,
      canvasCssHeight,
      baseWidth,
      baseHeight,
    );
    _verticalLayoutCache = layout;
    _verticalCacheKey = cacheKey;
  }

  const charSize = layout.fontSizePx || ratioToPixel(slot.fontSize, baseHeight, getGlobalScale(canvasCssWidth, baseWidth));

  for (const ch of layout.characters) {
    if (
      cssX >= ch.x - charSize / 2 &&
      cssX <= ch.x + charSize / 2 &&
      cssY >= ch.y - charSize &&
      cssY <= ch.y
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Find the topmost (highest zIndex) enabled, non-empty text slot that
 * contains the given CSS-pixel coordinate.  Returns slot.id or null.
 *
 * @param {CanvasRenderingContext2D} ctx - Canvas context for accurate text measurement
 */
function hitTest(cssX, cssY, config, canvasCssWidth, canvasCssHeight, ctx) {
  const baseHeight = config.baseWidth / (config.aspectRatio[0] / config.aspectRatio[1]);

  // Enabled, non-empty slots sorted by descending zIndex so topmost wins
  const candidates = config.textSlots
    .filter((s) => s.enabled && s.content)
    .sort((a, b) => b.zIndex - a.zIndex);

  for (const slot of candidates) {
    const hit =
      slot.direction === 'vertical'
        ? hitVerticalSlot(cssX, cssY, slot, config.baseWidth, baseHeight, canvasCssWidth, canvasCssHeight)
        : hitHorizontalSlot(cssX, cssY, slot, config.baseWidth, baseHeight, canvasCssWidth, ctx);

    if (hit) return slot.id;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PreviewCanvas() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const { width, height, dpr } = useWindowResize(wrapperRef);

  // Loads font and sets config.assets.fontsLoaded in the store (side-effect)
  useFontStatus();
  const fontsLoadedStore = useFrameStore((s) => s.config.assets.fontsLoaded);

  // Drive the render pipeline
  useCanvasRenderer(canvasRef);

  // --- Interaction state ---
  const [cursor, setCursor] = useState('crosshair');
  const [dragState, setDragState] = useState(null);

  // Subscribe to lang for i18n reactivity (t() calls in this component)
  useFrameStore((s) => s.lang);

  // ---- CSS sizing only (renderer handles DPR backing-store sizing) ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    // Store ref for export feature
    useFrameStore.getState().setCanvasRef(canvasRef);
  }, [width, height, dpr, canvasRef]);

  // ---- Pointer event handlers ----
  const getCssCoords = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { cssX: e.clientX - rect.left, cssY: e.clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const config = useFrameStore.getState().config;

      // Don't hit-test when fonts aren't loaded — positions won't be accurate
      if (!config.assets.fontsLoaded) return;

      const { cssX, cssY } = getCssCoords(e);
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      const slotId = hitTest(cssX, cssY, config, rect.width, rect.height, ctx);

      if (slotId) {
        useFrameStore.getState().setActiveSlot(slotId);

        const slot = config.textSlots.find((s) => s.id === slotId);
        if (slot) {
          const baseHeight = config.baseWidth / (config.aspectRatio[0] / config.aspectRatio[1]);
          const scale = getGlobalScale(rect.width, config.baseWidth);

          setDragState({
            slotId,
            pointerId: e.pointerId,
            startPointerX: cssX,
            startPointerY: cssY,
            startSlotX: slot.position.x,
            startSlotY: slot.position.y,
            baseWidth: config.baseWidth,
            baseHeight,
            scale,
          });
          setCursor('grabbing');
          canvas.setPointerCapture(e.pointerId);
        }
      } else {
        useFrameStore.getState().setActiveSlot(null);
      }
    },
    [getCssCoords],
  );

  const handlePointerMove = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const config = useFrameStore.getState().config;

      if (dragState) {
        // Dragging — update slot position
        const { cssX, cssY } = getCssCoords(e);

        const deltaRatioX = pixelToRatio(
          cssX - dragState.startPointerX,
          dragState.baseWidth,
          dragState.scale,
        );
        const deltaRatioY = pixelToRatio(
          cssY - dragState.startPointerY,
          dragState.baseHeight,
          dragState.scale,
        );

        useFrameStore
          .getState()
          .updateSlot(dragState.slotId, 'position', {
            x: dragState.startSlotX + deltaRatioX,
            y: dragState.startSlotY + deltaRatioY,
          });
        return;
      }

      // Hover — determine cursor
      if (!config.assets.fontsLoaded) {
        setCursor('crosshair');
        return;
      }

      const { cssX, cssY } = getCssCoords(e);
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      const slotId = hitTest(cssX, cssY, config, rect.width, rect.height, ctx);
      setCursor(slotId ? 'grab' : 'crosshair');
    },
    [dragState, getCssCoords],
  );

  const handlePointerUp = useCallback(() => {
    if (dragState) {
      useFrameStore.getState().saveConfig();
      setDragState(null);
      setCursor('crosshair');
    }
    const canvas = canvasRef.current;
    if (canvas && dragState) {
      canvas.releasePointerCapture(dragState.pointerId);
    }
  }, [dragState]);

  // ---- Memoize touch-action to prevent browser gestures while dragging ----
  const touchAction = useMemo(
    () => (dragState ? 'none' : 'auto'),
    [dragState],
  );

  return (
    <div className="canvas-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="preview-canvas"
        style={{ cursor, touchAction }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {!fontsLoadedStore && (
        <div className="canvas-overlay">
          <span className="canvas-loading-text">{t('status.fontLoading')}</span>
        </div>
      )}
    </div>
  );
}
