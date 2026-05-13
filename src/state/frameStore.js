import { create } from 'zustand';

const defaultTextSlot = () => ({
  id: crypto.randomUUID(),
  content: '',
  position: { x: 0.5, y: 0.5 },
  fontSize: 0.05,
  color: '#ffffff',
  direction: 'horizontal',
  fontFamily: 'sans-serif',
  fontWeight: 400,
  letterSpacing: 0,
  lineHeight: 1.2,
  zIndex: 10,
  enabled: true,
  textAlign: 'center',
});

const initialConfig = {
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

export const useFrameStore = create((set) => ({
  config: initialConfig,
  dirtyFlags: { backgroundOrTexture: true },
  activeSlotId: null,
  lang: 'zh-CN',
  currentTemplateId: null,

  setConfig: (path, value) => {
    set((state) => {
      const keys = path.split('.');
      const newConfig = structuredClone(state.config);
      let current = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (current[keys[i]] == null || typeof current[keys[i]] !== 'object') {
          console.warn(`setConfig: path "${path}" does not exist`);
          return state;
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return {
        config: newConfig,
        dirtyFlags: { ...state.dirtyFlags, backgroundOrTexture: true },
      };
    });
  },

  updateSlot: (slotId, field, value) => {
    set((state) => {
      const idx = state.config.textSlots.findIndex((s) => s.id === slotId);
      if (idx === -1) return state;
      const newSlots = [...state.config.textSlots];
      newSlots[idx] = { ...newSlots[idx], [field]: value };
      return { config: { ...state.config, textSlots: newSlots } };
    });
  },

  addSlot: (slot) => {
    set((state) => ({
      config: {
        ...state.config,
        textSlots: [...state.config.textSlots, { ...defaultTextSlot(), ...slot }],
      },
    }));
  },

  removeSlot: (slotId) => {
    set((state) => ({
      config: {
        ...state.config,
        textSlots: state.config.textSlots.filter((s) => s.id !== slotId),
      },
    }));
  },

  setDirty: (flag, value) => {
    set((state) => ({
      dirtyFlags: { ...state.dirtyFlags, [flag]: value },
    }));
  },

  setActiveSlot: (slotId) => set({ activeSlotId: slotId }),

  setLang: (lang) => set({ lang }),
}));
