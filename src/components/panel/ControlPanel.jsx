import { useState } from 'react';
import TemplateSelector from './TemplateSelector.jsx';
import BackgroundPicker from './BackgroundPicker.jsx';
import TextureControls from './TextureControls.jsx';
import TextSlotEditor from './TextSlotEditor.jsx';
import FooterBlockEditor from './FooterBlockEditor.jsx';
import { t } from '../../i18n/index.js';
import { useFrameStore } from '../../state/frameStore.js';

export default function ControlPanel() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Subscribe to lang for i18n reactivity
  useFrameStore((s) => s.lang);

  return (
    <div className="control-panel">
      {/* Mobile toggle button (hidden on desktop) */}
      <button
        type="button"
        className="cp-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-expanded={mobileOpen}
        aria-label="Toggle control panel"
      >
        <span className="cp-mobile-toggle__label">
          {mobileOpen ? t('panel.hideControls') : t('panel.showControls')}
        </span>
        <span className={`cp-mobile-toggle__icon${mobileOpen ? ' cp-mobile-toggle__icon--open' : ''}`}>
          &#9650;
        </span>
      </button>

      {/* Panel content */}
      <div className={`cp-content${mobileOpen ? ' cp-content--open' : ''}`}>
        {[TemplateSelector, BackgroundPicker, TextureControls, TextSlotEditor, FooterBlockEditor].map(
          (Component, i) => (
            <div key={i} className="cp-section">
              <Component />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
