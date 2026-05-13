import { templates } from '../../templates/index.js';
import { useFrameStore } from '../../state/frameStore.js';
import { t } from '../../i18n/index.js';

function getTemplateName(template, lang) {
  if (lang === 'ja') return template.nameJa || template.name;
  if (lang === 'en') return template.nameEn || template.name;
  return template.name;
}

export default function TemplateSelector() {
  const currentTemplateId = useFrameStore((s) => s.currentTemplateId);
  const lang = useFrameStore((s) => s.lang);
  const loadTemplate = useFrameStore((s) => s.loadTemplate);
  const saveConfig = useFrameStore((s) => s.saveConfig);

  function handleSelect(templateId) {
    loadTemplate(templateId);
    saveConfig();
  }

  return (
    <div className="template-selector">
      <h3 className="panel-section-title">{t('template.title')}</h3>
      <div className="template-selector__grid">
        {templates.map((template) => {
          const isSelected = currentTemplateId === template.id;
          return (
            <button
              key={template.id}
              type="button"
              className={`template-selector__card${isSelected ? ' template-selector__card--selected' : ''}`}
              onClick={() => handleSelect(template.id)}
            >
              <span className="template-selector__name">
                {getTemplateName(template, lang)}
              </span>
              <span className="template-selector__category">
                {template.category}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
