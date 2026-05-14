import { useState, useRef, useCallback } from 'react';
import { useFrameStore } from '../../state/frameStore.js';
import { t } from '../../i18n/index.js';
import SliderInput from '../common/SliderInput.jsx';
import ColorPicker from '../common/ColorPicker.jsx';
import ToggleSwitch from '../common/ToggleSwitch.jsx';

const FONT_OPTIONS = [
  { value: 'MS PMincho, serif', label: 'MS PMincho' },
  { value: 'DFS Song, serif', label: 'DFS Song' },
  { value: 'HG Mincho B, serif', label: 'HG Mincho B' },
  { value: 'sans-serif', label: 'Sans-serif' },
];

const WEIGHT_OPTIONS = [
  { value: 400, label: 'Regular (400)' },
  { value: 700, label: 'Bold (700)' },
];

export default function FooterBlockEditor() {
  // Subscribe to lang for i18n reactivity
  useFrameStore((s) => s.lang);
  const footerBlock = useFrameStore((s) => s.config.footerBlock);
  const setConfig = useFrameStore((s) => s.setConfig);
  const saveConfig = useFrameStore((s) => s.saveConfig);

  const [expanded, setExpanded] = useState(false);
  const saveTimerRef = useRef(null);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConfig();
    }, 500);
  }, [saveConfig]);

  function handleSetConfig(path, value) {
    setConfig(path, value);
    debouncedSave();
  }

  function handlePositionUpdate(axis, value) {
    const newPosition = { ...footerBlock.position, [axis]: value };
    setConfig('footerBlock.position', newPosition);
    debouncedSave();
  }

  return (
    <div className={`footer-block-editor${expanded ? ' fbe--expanded' : ''}`}>
      {/* Header */}
      <button
        type="button"
        className="fbe-header"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="fbe-header__label">{t('footer.title')}</span>
        <span className={`fbe-header__chevron${expanded ? ' fbe-header__chevron--open' : ''}`}>
          &#9660;
        </span>
      </button>

      {/* Body */}
      <div className="fbe-body">
        <div className="fbe-body__inner">
          {/* Enable toggle */}
          <div className="fbe-row">
            <span className="fbe-label">{t('footer.enabled')}</span>
            <ToggleSwitch
              checked={footerBlock.enabled}
              onChange={(v) => handleSetConfig('footerBlock.enabled', v)}
            />
          </div>

          {/* Controls visible only when enabled */}
          {footerBlock.enabled && (
            <>
              <label className="fbe-field">
                <span className="fbe-field__label">{t('footer.content')}</span>
                <input
                  type="text"
                  className="fbe-input"
                  value={footerBlock.content || ''}
                  onChange={(e) => handleSetConfig('footerBlock.content', e.target.value)}
                />
              </label>

              <SliderInput
                label={t('footer.fontSize')}
                value={footerBlock.fontSize}
                min={0.005}
                max={0.05}
                step={0.001}
                onChange={(v) => handleSetConfig('footerBlock.fontSize', v)}
              />

              <SliderInput
                label={t('footer.positionX')}
                value={footerBlock.position.x}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => handlePositionUpdate('x', v)}
              />

              <SliderInput
                label={t('footer.positionY')}
                value={footerBlock.position.y}
                min={0}
                max={1}
                step={0.01}
                onChange={(v) => handlePositionUpdate('y', v)}
              />

              <label className="fbe-field">
                <span className="fbe-field__label">{t('footer.color')}</span>
                <ColorPicker
                  value={footerBlock.color}
                  onChange={(v) => handleSetConfig('footerBlock.color', v)}
                />
              </label>

              <label className="fbe-field">
                <span className="fbe-field__label">{t('footer.fontFamily')}</span>
                <select
                  className="fbe-select"
                  value={footerBlock.fontFamily}
                  onChange={(e) => handleSetConfig('footerBlock.fontFamily', e.target.value)}
                >
                  {FONT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="fbe-field">
                <span className="fbe-field__label">{t('footer.fontWeight')}</span>
                <select
                  className="fbe-select"
                  value={footerBlock.fontWeight}
                  onChange={(e) => handleSetConfig('footerBlock.fontWeight', Number(e.target.value))}
                >
                  {WEIGHT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
