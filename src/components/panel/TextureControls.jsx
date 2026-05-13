import { useRef } from 'react';
import SliderInput from '../common/SliderInput.jsx';
import ToggleSwitch from '../common/ToggleSwitch.jsx';
import { useFrameStore } from '../../state/frameStore.js';
import { t } from '../../i18n/index.js';

export default function TextureControls() {
  const config = useFrameStore((s) => s.config);
  const setConfig = useFrameStore((s) => s.setConfig);
  const saveConfig = useFrameStore((s) => s.saveConfig);
  // Subscribe to lang for i18n reactivity
  useFrameStore((s) => s.lang);

  const scanline = config.texture.scanline;
  const grain = config.texture.grain;

  const saveTimer = useRef(null);
  function debouncedSave() {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveConfig(), 500);
  }

  function toggleScanline() {
    setConfig('texture.scanline.enabled', !scanline.enabled);
    debouncedSave();
  }

  function toggleGrain() {
    setConfig('texture.grain.enabled', !grain.enabled);
    debouncedSave();
  }

  function handleScanlineConfig(path, value) {
    setConfig(path, value);
    debouncedSave();
  }

  function handleGrainConfig(path, value) {
    setConfig(path, value);
    debouncedSave();
  }

  return (
    <div className="texture-controls">
      <h3 className="panel-section-title">{t('texture.title')}</h3>

      {/* Scanline subsection */}
      <div className="texture-controls__subsection">
        <div className="texture-controls__header">
          <span className="texture-controls__label">{t('texture.scanline')}</span>
          <ToggleSwitch checked={scanline.enabled} onChange={toggleScanline} />
        </div>

        <SliderInput
          label={t('texture.scanlineDensity')}
          value={scanline.density}
          min={1}
          max={20}
          step={1}
          onChange={(v) => handleScanlineConfig('texture.scanline.density', v)}
          disabled={!scanline.enabled}
        />
        <SliderInput
          label={t('texture.scanlineOpacity')}
          value={scanline.opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleScanlineConfig('texture.scanline.opacity', v)}
          disabled={!scanline.enabled}
        />
      </div>

      {/* Grain subsection */}
      <div className="texture-controls__subsection">
        <div className="texture-controls__header">
          <span className="texture-controls__label">{t('texture.grain')}</span>
          <ToggleSwitch checked={grain.enabled} onChange={toggleGrain} />
        </div>

        <SliderInput
          label={t('texture.grainIntensity')}
          value={grain.intensity}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => handleGrainConfig('texture.grain.intensity', v)}
          disabled={!grain.enabled}
        />
      </div>
    </div>
  );
}
