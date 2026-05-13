import { create } from 'zustand';
import { DEFAULT_FRAME_CONFIG } from '../config/defaults.js';
import { getTemplate } from '../templates/index.js';
import { getLang, setLang as setI18nLang } from '../i18n/index.js';

const STORAGE_PREFIX = 'monogatari:template:';

// ---------------------------------------------------------------------------
// localStorage helpers — errors are caught silently
// ---------------------------------------------------------------------------

function readPersisted(templateId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${templateId}:config`);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writePersisted(templateId, data) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${templateId}:config`,
      JSON.stringify(data),
    );
  } catch {
    /* quota exceeded or localStorage unavailable — ignore */
  }
}

function removePersisted(templateId) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${templateId}:config`);
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Deep merge — override wins when both sides are not plain objects
// ---------------------------------------------------------------------------

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (override === null) return base;
  if (override === undefined) return base;
  if (base === undefined || base === null || !isPlainObject(base)) return override;
  if (!isPlainObject(override)) return override;

  const result = { ...base };
  for (const key of Object.keys(override)) {
    result[key] = deepMerge(base[key], override[key]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Locked-field helpers
// ---------------------------------------------------------------------------

function getNested(obj, path) {
  const keys = path.split('.');
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[k];
  }
  return cur;
}

function setNested(obj, path, value) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (cur[keys[i]] == null || typeof cur[keys[i]] !== 'object') {
      cur[keys[i]] = {};
    }
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function applyLockedFields(config, templateBaseConfig, lockedFields) {
  const result = { ...config };
  for (const lockedPath of lockedFields) {
    const lockedValue = getNested(templateBaseConfig, lockedPath);
    setNested(result, lockedPath, lockedValue);
  }
  return result;
}

function isFieldLocked(lockedFields, fieldPath) {
  return lockedFields.some(
    (f) => f === fieldPath || fieldPath.startsWith(f + '.'),
  );
}

// ---------------------------------------------------------------------------
// Template slot conversion: TemplateTextSlot[] → TextSlot[]
// ---------------------------------------------------------------------------

function convertTemplateSlots(templateSlots, userSlotOverrides) {
  return templateSlots.map((slot) => {
    const slotBase = { ...slot };
    delete slotBase.label;
    delete slotBase.placeholder;
    const userOverride = userSlotOverrides?.find((o) => o.id === slot.id);

    const merged = userOverride
      ? deepMerge(slotBase, userOverride)
      : { ...slotBase };

    if (merged.content === undefined) merged.content = '';
    if (merged.enabled === undefined) merged.enabled = true;

    return merged;
  });
}

// ---------------------------------------------------------------------------
// Override extraction for saveConfig
// ---------------------------------------------------------------------------

const SAVED_SLOT_FIELDS = [
  'id',
  'content',
  'position',
  'fontSize',
  'color',
  'direction',
  'fontFamily',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'textAlign',
  'textShadow',
  'border',
  'stagger',
  'enabled',
  'zIndex',
];

const SAVED_FOOTER_FIELDS = [
  'enabled',
  'content',
  'position',
  'fontSize',
  'color',
  'fontFamily',
  'fontWeight',
  'zIndex',
];

function pick(obj, keys) {
  const result = {};
  for (const k of keys) {
    if (obj[k] !== undefined) {
      result[k] = obj[k];
    }
  }
  return result;
}

function extractOverrides(config, lockedFields) {
  const overrides = {};

  if (!isFieldLocked(lockedFields, 'backgroundColor')) {
    overrides.backgroundColor = config.backgroundColor;
  }

  if (!isFieldLocked(lockedFields, 'texture')) {
    overrides.texture = config.texture;
  }

  overrides.textSlots = config.textSlots.map((s) => pick(s, SAVED_SLOT_FIELDS));

  if (!isFieldLocked(lockedFields, 'footerBlock')) {
    overrides.footerBlock = pick(config.footerBlock, SAVED_FOOTER_FIELDS);
  }

  return overrides;
}

// ---------------------------------------------------------------------------
// Default slot factory (used by addSlot)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useFrameStore = create((set, get) => ({
  config: { ...DEFAULT_FRAME_CONFIG },
  dirtyFlags: { backgroundOrTexture: true },
  activeSlotId: null,
  lang: getLang(),
  currentTemplateId: null,
  canvasRef: null,

  // ---- template actions ---------------------------------------------------

  loadTemplate: (templateId) => {
    const template = getTemplate(templateId);
    if (!template) return;

    // Read persisted user overrides (if any)
    let overrides = null;
    const persisted = readPersisted(templateId);
    if (persisted && persisted.version === 1 && persisted.overrides) {
      overrides = persisted.overrides;
    }

    // Deep-merge defaults → template baseConfig → user overrides
    let mergedConfig = deepMerge(
      structuredClone(DEFAULT_FRAME_CONFIG),
      structuredClone(template.baseConfig),
    );
    mergedConfig = deepMerge(mergedConfig, structuredClone(overrides || {}));

    // Convert template TextSlots → canonical TextSlots
    mergedConfig.textSlots = convertTemplateSlots(
      template.baseConfig.textSlots,
      overrides?.textSlots,
    );

    // Locked fields always use template values (apply after conversion
    // so locked text-slot fields are not overwritten by convertTemplateSlots)
    mergedConfig = applyLockedFields(
      mergedConfig,
      template.baseConfig,
      template.lockedFields,
    );

    // Preserve runtime assets (font load state, canvas support) across template switches
    mergedConfig.assets = get().config.assets;

    set({
      config: mergedConfig,
      currentTemplateId: templateId,
      dirtyFlags: { backgroundOrTexture: true },
    });
  },

  saveConfig: () => {
    const { currentTemplateId, config } = get();
    if (!currentTemplateId) return;

    const template = getTemplate(currentTemplateId);
    if (!template) return;

    const overrides = extractOverrides(config, template.lockedFields);
    writePersisted(currentTemplateId, { version: 1, overrides });
  },

  resetToTemplate: () => {
    const { currentTemplateId } = get();
    if (!currentTemplateId) return;

    removePersisted(currentTemplateId);
    get().loadTemplate(currentTemplateId);
  },

  // ---- existing config actions --------------------------------------------

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
      const isBgOrTex =
        path.startsWith('backgroundColor') || path.startsWith('texture');
      return {
        config: newConfig,
        dirtyFlags: isBgOrTex
          ? { ...state.dirtyFlags, backgroundOrTexture: true }
          : state.dirtyFlags,
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

  setLang: (lang) => {
    setI18nLang(lang);
    set({ lang });
  },

  setCanvasRef: (ref) => set({ canvasRef: ref }),
}));
