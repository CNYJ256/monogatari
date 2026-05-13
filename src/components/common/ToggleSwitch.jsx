export default function ToggleSwitch({ checked, onChange, disabled, roleOnly = false }) {
  const Tag = roleOnly ? 'div' : 'button';

  function handleClick(e) {
    if (roleOnly) e.stopPropagation();
    onChange(!checked);
  }

  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      onChange(!checked);
    }
  }

  return (
    <Tag
      type={roleOnly ? undefined : 'button'}
      role="switch"
      aria-checked={checked}
      className={`toggle-switch${checked ? ' toggle-switch--on' : ''}`}
      onClick={handleClick}
      disabled={roleOnly ? undefined : disabled}
      tabIndex={roleOnly ? 0 : undefined}
      onKeyDown={roleOnly ? handleKeyDown : undefined}
    >
      <span className="toggle-switch__knob" />
    </Tag>
  );
}
