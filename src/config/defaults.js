export const DEFAULT_FRAME_CONFIG = {
  baseWidth: 3840,
  aspectRatio: [12, 5],
  assets: { fontsLoaded: false },
  backgroundColor: '#e60000',
  texture: {
    scanline: { enabled: true, density: 2, opacity: 0.18, color: '#000' },
    grain: { enabled: true, intensity: 0.15, type: 'luminance' },
  },
  textSlots: [],
  footerBlock: {
    enabled: false,
    content: '',
    position: { x: 0.5, y: 0.95 },
    fontSize: 60,
    color: '#ffffff',
    fontFamily: 'sans-serif',
    fontWeight: 400,
    zIndex: 10,
  },
};

export const PRESET_COLORS = [
  { name: '物语红', value: '#e60000' },
  { name: '黑', value: '#000000' },
  { name: '白', value: '#ffffff' },
  { name: '紫', value: '#5b2c8e' },
  { name: '玄青', value: '#1a2a3a' },
  { name: '月白', value: '#e6e8ec' },
  { name: '中国红', value: '#c41e2a' },
  { name: '金', value: '#c9a84c' },
];

export const SCANLINE_PRESETS = {
  density: { min: 1, max: 6, step: 0.5, default: 2 },
  opacity: { min: 0.05, max: 0.4, step: 0.01, default: 0.18 },
};

export const GRAIN_PRESETS = {
  intensity: { min: 0, max: 0.4, step: 0.01, default: 0.15 },
};

export const FONT_FALLBACK_STACK =
  '"MS PMincho", SimSun, PMingLiU, "MS Mincho", "Yu Mincho", "Songti SC", "Songti TC", "Hiragino Mincho ProN", serif';
