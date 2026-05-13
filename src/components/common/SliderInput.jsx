import { useRef, useEffect, useCallback } from 'react';

function formatValue(value, step) {
  if (step < 1) return Number(value).toFixed(2);
  return Math.round(value);
}

export default function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onAfterChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const onAfterChangeRef = useRef(onAfterChange);

  useEffect(() => {
    onAfterChangeRef.current = onAfterChange;
  }, [onAfterChange]);

  const handleAfter = useCallback(() => {
    if (onAfterChangeRef.current && inputRef.current) {
      onAfterChangeRef.current(Number(inputRef.current.value));
    }
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (!el || !onAfterChange) return;
    el.addEventListener('mouseup', handleAfter);
    el.addEventListener('touchend', handleAfter);
    return () => {
      el.removeEventListener('mouseup', handleAfter);
      el.removeEventListener('touchend', handleAfter);
    };
  }, [onAfterChange, handleAfter]);

  function handleChange(e) {
    if (onChange) onChange(Number(e.target.value));
  }

  return (
    <label className={`slider-input${disabled ? ' slider-input--disabled' : ''}`}>
      <span className="slider-input__header">
        <span className="slider-input__label">{label}</span>
        <span className="slider-input__value">
          {formatValue(value, step)}
        </span>
      </span>
      <input
        ref={inputRef}
        type="range"
        className="slider-input__range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
