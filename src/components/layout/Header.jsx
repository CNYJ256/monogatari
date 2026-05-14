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

        <a
          className="github-link"
          href="https://github.com/CNYJ256/monogatari"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub"
          aria-label="GitHub repository"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>

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
