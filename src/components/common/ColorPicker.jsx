import { useState } from 'react';
import { t } from '../../i18n/index.js';
import { useFrameStore } from '../../state/frameStore.js';

const DEFAULT_PRESETS = [
  '#C52912',
  '#1a1a2e',
  '#d9e4f0',
  '#000000',
  '#ffffff',
  '#1a3a2a',
  '#8b7355',
  '#2d1b4e',
];

export default function ColorPicker({ value, onChange, presets = DEFAULT_PRESETS }) {
  // Subscribe to lang so t() returns current-language strings on switch
  useFrameStore((s) => s.lang);
  const [showCustom, setShowCustom] = useState(false);

  function selectPreset(color) {
    setShowCustom(false);
    if (onChange) onChange(color);
  }

  function handleCustomChange(e) {
    if (onChange) onChange(e.target.value);
  }

  return (
    <div className="color-picker">
      <div className="color-picker__presets">
        {presets.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-picker__swatch${value === color ? ' color-picker__swatch--active' : ''}`}
            style={{ backgroundColor: color }}
            onClick={() => selectPreset(color)}
            title={color}
            aria-label={color}
          />
        ))}
        <button
          type="button"
          className={`color-picker__custom-btn${showCustom ? ' color-picker__custom-btn--active' : ''}`}
          onClick={() => setShowCustom(!showCustom)}
          title={t('background.custom')}
        >
          +
        </button>
      </div>
      {showCustom && (
        <div className="color-picker__custom">
          <input
            type="color"
            className="color-picker__input"
            value={value}
            onChange={handleCustomChange}
          />
          <span className="color-picker__hex">{value}</span>
        </div>
      )}
    </div>
  );
}
