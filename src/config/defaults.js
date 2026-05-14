export const DEFAULT_FRAME_CONFIG = {
  baseWidth: 3840,
  aspectRatio: [12, 5],
  assets: { fontsLoaded: false, canvasSupported: true },
  backgroundColor: '#C52912',
  texture: {
    scanline: { enabled: true, density: 8, opacity: 0.05, color: '#000' },
    grain: { enabled: true, intensity: 0.15, type: 'luminance' },
  },
  textSlots: [],
  footerBlock: {
    enabled: false,
    content: '',
    position: { x: 0.5, y: 0.95 },
    fontSize: 0.015,
    color: '#ffffff',
    fontFamily: 'MS PMincho, serif',
    fontWeight: 400,
    zIndex: 10,
  },
};

export const PRESET_COLORS = [
  { name: '物语红', value: '#C52912' },
  { name: '黑', value: '#000000' },
  { name: '白', value: '#ffffff' },
  { name: '紫', value: '#5b2c8e' },
  { name: '玄青', value: '#1a2a3a' },
  { name: '月白', value: '#e6e8ec' },
  { name: '中国红', value: '#c41e2a' },
  { name: '金', value: '#c9a84c' },
];

export const SCANLINE_PRESETS = {
  density: { min: 1, max: 20, step: 1, default: 8 },
  opacity: { min: 0.01, max: 0.4, step: 0.01, default: 0.05 },
};

export const GRAIN_PRESETS = {
  intensity: { min: 0, max: 0.4, step: 0.01, default: 0.15 },
};

export const FONT_FALLBACK_STACK =
  '"MS PMincho", SimSun, PMingLiU, "MS Mincho", "Yu Mincho", "Songti SC", "Songti TC", "Hiragino Mincho ProN", serif';
