import { useState, useRef, useCallback } from 'react';
import { useFrameStore } from '../../state/frameStore.js';
import { t } from '../../i18n/index.js';
import SliderInput from '../common/SliderInput.jsx';
import ColorPicker from '../common/ColorPicker.jsx';
import ToggleSwitch from '../common/ToggleSwitch.jsx';

const FONT_OPTIONS = [
  { value: 'MS PMincho, serif', labelKey: 'MS PMincho' },
  { value: 'SimSun, serif', labelKey: 'SimSun' },
  { value: 'sans-serif', labelKey: 'Sans-serif' },
];

const WEIGHT_OPTIONS = [
  { value: 400, labelKey: 'Regular (400)' },
  { value: 700, labelKey: 'Bold (700)' },
];

function contentSummary(content) {
  if (!content) return '';
  return content.length > 6 ? content.slice(0, 6) + '…' : content;
}

export default function TextSlotEditor() {
  const config = useFrameStore((s) => s.config);
  const lang = useFrameStore((s) => s.lang);
  const updateSlot = useFrameStore((s) => s.updateSlot);
  const addSlot = useFrameStore((s) => s.addSlot);
  const removeSlot = useFrameStore((s) => s.removeSlot);
  const saveConfig = useFrameStore((s) => s.saveConfig);

  const [expanded, setExpanded] = useState({});
  const saveTimerRef = useRef(null);

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveConfig();
    }, 500);
  }, [saveConfig]);

  function toggleExpanded(slotId) {
    setExpanded((prev) => ({ ...prev, [slotId]: !prev[slotId] }));
  }

  function handleSlotUpdate(slotId, field, value) {
    updateSlot(slotId, field, value);
    debouncedSave();
  }

  function handlePositionUpdate(slotId, axis, newValue) {
    const slot = config.textSlots.find((s) => s.id === slotId);
    if (!slot) return;
    const newPosition = { ...slot.position, [axis]: newValue };
    updateSlot(slotId, 'position', newPosition);
    debouncedSave();
  }

  function handleTextShadowToggle(slotId, slot) {
    if (slot.textShadow && typeof slot.textShadow === 'object') {
      updateSlot(slotId, 'textShadow', undefined);
    } else {
      updateSlot(slotId, 'textShadow', { blur: 0, color: '#ffffff' });
    }
    debouncedSave();
  }

  function handleBorderToggle(slotId, slot) {
    if (slot.border && typeof slot.border === 'object') {
      updateSlot(slotId, 'border', undefined);
    } else {
      updateSlot(slotId, 'border', { width: 1, color: '#ffffff' });
    }
    debouncedSave();
  }

  function handleAddSlot() {
    addSlot();
    debouncedSave();
  }

  function handleRemoveSlot(slotId) {
    removeSlot(slotId);
    // Expand the next available slot
    setExpanded((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    debouncedSave();
  }

  return (
    <div className="text-slot-editor">
      <h3 className="panel-section-title">
        {lang === 'zh-CN' ? '文字位编辑' : lang === 'ja' ? 'テキスト編集' : 'Text Slots'}
      </h3>

      {config.textSlots.map((slot, index) => {
        const isExpanded = !!expanded[slot.id];
        const directionLabel = slot.direction === 'vertical'
          ? t('slot.vertical')
          : t('slot.horizontal');

        const shadowEnabled = slot.textShadow && typeof slot.textShadow === 'object';
        const shadow = shadowEnabled ? slot.textShadow : { blur: 0, color: '#ffffff' };

        const brdEnabled = slot.border && typeof slot.border === 'object';
        const brd = brdEnabled ? slot.border : { width: 1, color: '#ffffff' };

        return (
          <div
            key={slot.id}
            className={`tse-accordion${isExpanded ? ' tse-accordion--expanded' : ''}${!slot.enabled ? ' tse-accordion--disabled' : ''}`}
          >
            {/* Accordion header */}
            <button
              type="button"
              className="tse-accordion__header"
              onClick={() => toggleExpanded(slot.id)}
            >
              <span className="tse-accordion__label">
                {t('slot.title').replace('{index}', index + 1)}
              </span>
              <span className="tse-accordion__summary">
                {contentSummary(slot.content)}
              </span>
              <span className="tse-accordion__direction-badge">
                {directionLabel}
              </span>
              <ToggleSwitch
                checked={slot.enabled}
                onChange={(v) => handleSlotUpdate(slot.id, 'enabled', v)}
                disabled={false}
                roleOnly
              />
              <span className={`tse-accordion__chevron${isExpanded ? ' tse-accordion__chevron--open' : ''}`}>
                &#9660;
              </span>
            </button>

            {/* Accordion body */}
            <div className="tse-accordion__body">
              <div className="tse-accordion__body-inner">
                {/* Text content */}
                <label className="tse-field">
                  <span className="tse-field__label">{t('slot.content')}</span>
                  <textarea
                    className="tse-textarea"
                    value={slot.content}
                    onChange={(e) => handleSlotUpdate(slot.id, 'content', e.target.value)}
                    placeholder={t('slot.placeholder')}
                    rows={2}
                  />
                </label>

                {/* Font size */}
                <SliderInput
                  label={t('slot.fontSize')}
                  value={slot.fontSize}
                  min={0.02}
                  max={0.5}
                  step={0.01}
                  onChange={(v) => handleSlotUpdate(slot.id, 'fontSize', v)}
                />

                {/* Position */}
                <SliderInput
                  label={t('slot.positionX')}
                  value={slot.position.x}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => handlePositionUpdate(slot.id, 'x', v)}
                />
                <SliderInput
                  label={t('slot.positionY')}
                  value={slot.position.y}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(v) => handlePositionUpdate(slot.id, 'y', v)}
                />

                {/* Color */}
                <label className="tse-field">
                  <span className="tse-field__label">{t('slot.color')}</span>
                  <ColorPicker
                    value={slot.color}
                    onChange={(v) => handleSlotUpdate(slot.id, 'color', v)}
                  />
                </label>

                {/* Direction */}
                <label className="tse-field">
                  <span className="tse-field__label">{t('slot.direction')}</span>
                  <div className="tse-btn-group">
                    <button
                      type="button"
                      className={`tse-btn${slot.direction === 'horizontal' ? ' tse-btn--active' : ''}`}
                      onClick={() => handleSlotUpdate(slot.id, 'direction', 'horizontal')}
                    >
                      {t('slot.horizontal')}
                    </button>
                    <button
                      type="button"
                      className={`tse-btn${slot.direction === 'vertical' ? ' tse-btn--active' : ''}`}
                      onClick={() => handleSlotUpdate(slot.id, 'direction', 'vertical')}
                    >
                      {t('slot.vertical')}
                    </button>
                  </div>
                </label>

                {/* Font family */}
                <label className="tse-field">
                  <span className="tse-field__label">{t('slot.fontFamily')}</span>
                  <select
                    className="tse-select"
                    value={slot.fontFamily}
                    onChange={(e) => handleSlotUpdate(slot.id, 'fontFamily', e.target.value)}
                  >
                    {FONT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.labelKey}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Font weight */}
                <label className="tse-field">
                  <span className="tse-field__label">{t('slot.fontWeight')}</span>
                  <select
                    className="tse-select"
                    value={slot.fontWeight}
                    onChange={(e) => handleSlotUpdate(slot.id, 'fontWeight', Number(e.target.value))}
                  >
                    {WEIGHT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.labelKey}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Letter spacing */}
                <SliderInput
                  label={t('slot.letterSpacing')}
                  value={slot.letterSpacing}
                  min={0}
                  max={0.3}
                  step={0.01}
                  onChange={(v) => handleSlotUpdate(slot.id, 'letterSpacing', v)}
                />

                {/* Line height */}
                <SliderInput
                  label={t('slot.lineHeight')}
                  value={slot.lineHeight}
                  min={0.8}
                  max={3}
                  step={0.1}
                  onChange={(v) => handleSlotUpdate(slot.id, 'lineHeight', v)}
                />

                {/* Text align (horizontal only) */}
                {slot.direction === 'horizontal' && (
                  <label className="tse-field">
                    <span className="tse-field__label">{t('slot.textAlign')}</span>
                    <div className="tse-btn-group tse-btn-group--three">
                      <button
                        type="button"
                        className={`tse-btn${slot.textAlign === 'left' ? ' tse-btn--active' : ''}`}
                        onClick={() => handleSlotUpdate(slot.id, 'textAlign', 'left')}
                      >
                        {t('slot.alignLeft')}
                      </button>
                      <button
                        type="button"
                        className={`tse-btn${slot.textAlign === 'center' ? ' tse-btn--active' : ''}`}
                        onClick={() => handleSlotUpdate(slot.id, 'textAlign', 'center')}
                      >
                        {t('slot.alignCenter')}
                      </button>
                      <button
                        type="button"
                        className={`tse-btn${slot.textAlign === 'right' ? ' tse-btn--active' : ''}`}
                        onClick={() => handleSlotUpdate(slot.id, 'textAlign', 'right')}
                      >
                        {t('slot.alignRight')}
                      </button>
                    </div>
                  </label>
                )}

                {/* Text shadow */}
                <div className="tse-field-group">
                  <div className="tse-sub-header">
                    <span className="tse-field__label">{t('slot.textShadow')}</span>
                    <ToggleSwitch
                      checked={shadowEnabled}
                      onChange={() => handleTextShadowToggle(slot.id, slot)}
                    />
                  </div>

                  {shadowEnabled && (
                    <div className="tse-nested-controls">
                      <SliderInput
                        label={t('slot.shadowBlur')}
                        value={shadow.blur}
                        min={0}
                        max={30}
                        step={1}
                        onChange={(v) =>
                          handleSlotUpdate(slot.id, 'textShadow', { ...shadow, blur: v })
                        }
                      />
                      <label className="tse-field">
                        <span className="tse-field__label">{t('slot.shadowColor')}</span>
                        <ColorPicker
                          value={shadow.color}
                          onChange={(v) =>
                            handleSlotUpdate(slot.id, 'textShadow', { ...shadow, color: v })
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Border */}
                <div className="tse-field-group">
                  <div className="tse-sub-header">
                    <span className="tse-field__label">{t('slot.border')}</span>
                    <ToggleSwitch
                      checked={brdEnabled}
                      onChange={() => handleBorderToggle(slot.id, slot)}
                    />
                  </div>

                  {brdEnabled && (
                    <div className="tse-nested-controls">
                      <SliderInput
                        label={t('slot.borderWidth')}
                        value={brd.width}
                        min={0}
                        max={5}
                        step={1}
                        onChange={(v) =>
                          handleSlotUpdate(slot.id, 'border', { ...brd, width: v })
                        }
                      />
                      <label className="tse-field">
                        <span className="tse-field__label">{t('slot.borderColor')}</span>
                        <ColorPicker
                          value={brd.color}
                          onChange={(v) =>
                            handleSlotUpdate(slot.id, 'border', { ...brd, color: v })
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Stagger slider (vertical only) */}
                {slot.direction === 'vertical' && (
                  <SliderInput
                    label={t('slot.stagger')}
                    value={slot.stagger || 0}
                    min={0}
                    max={0.1}
                    step={0.005}
                    onChange={(v) => handleSlotUpdate(slot.id, 'stagger', v)}
                  />
                )}

                {/* Remove slot button */}
                {config.textSlots.length > 1 && (
                  <button
                    type="button"
                    className="tse-remove-btn"
                    onClick={() => handleRemoveSlot(slot.id)}
                  >
                    &#10005; {t('slot.remove')}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Add slot button */}
      <button
        type="button"
        className="tse-add-btn"
        onClick={handleAddSlot}
      >
        + {t('slot.add')}
      </button>
    </div>
  );
}
