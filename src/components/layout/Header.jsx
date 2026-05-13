import { useState } from 'react';
import { t } from '../../i18n/index.js';
import { useFrameStore } from '../../state/frameStore.js';
import { exportPNG } from '../../engine/export.js';

const LANG_OPTIONS = [
  { value: 'zh-CN', label: '简' },
  { value: 'ja', label: '日' },
  { value: 'en', label: 'EN' },
];

export default function Header() {
  const lang = useFrameStore((s) => s.lang);
  const setLang = useFrameStore((s) => s.setLang);
  const currentTemplateId = useFrameStore((s) => s.currentTemplateId);
  const [exporting, setExporting] = useState(false);

  const templateName = currentTemplateId
    ? t(`template.${currentTemplateId}`)
    : null;

  function handleExport() {
    const { config } = useFrameStore.getState();

    // Don't export until fonts are loaded — text would be invisible
    if (!config.assets.fontsLoaded) return;

    setExporting(true);
    exportPNG(config)
      .then(({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error('Export failed:', err);
      })
      .finally(() => {
        setExporting(false);
      });
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{t('app.title')}</h1>
      </div>

      <div className="header-center">
        {templateName && (
          <span className="header-template-name">{templateName}</span>
        )}
      </div>

      <div className="header-right">
        <div className="lang-switcher">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`lang-btn${lang === opt.value ? ' lang-btn--active' : ''}`}
              onClick={() => setLang(opt.value)}
              title={t(`lang.${opt.value}`)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          className="export-btn"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? t('header.exporting') : t('header.export')}
        </button>
      </div>
    </header>
  );
}
