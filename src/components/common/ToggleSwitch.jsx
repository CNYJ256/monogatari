export default function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle-switch${checked ? ' toggle-switch--on' : ''}`}
      onClick={() => onChange(!checked)}
      disabled={disabled}
    >
      <span className="toggle-switch__knob" />
    </button>
  );
}
