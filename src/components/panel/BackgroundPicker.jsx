import { useRef } from 'react';
import ColorPicker from '../common/ColorPicker.jsx';
import { useFrameStore } from '../../state/frameStore.js';
import { t } from '../../i18n/index.js';

export default function BackgroundPicker() {
  const backgroundColor = useFrameStore((s) => s.config.backgroundColor);
  const setConfig = useFrameStore((s) => s.setConfig);
  const saveConfig = useFrameStore((s) => s.saveConfig);
  // Subscribe to lang for i18n reactivity
  useFrameStore((s) => s.lang);

  const saveTimer = useRef(null);
  function debouncedSave() {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveConfig(), 500);
  }

  function handleChange(color) {
    setConfig('backgroundColor', color);
    debouncedSave();
  }

  return (
    <div className="background-picker">
      <h3 className="panel-section-title">{t('background.title')}</h3>
      <label className="bp-label">{t('background.color')}</label>
      <ColorPicker value={backgroundColor} onChange={handleChange} />
    </div>
  );
}
