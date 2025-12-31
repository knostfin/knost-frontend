import React, { forwardRef } from 'react';
import Spinner from './Spinner';

const Input = forwardRef(({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  loading = false,
  leadingIcon = null,
  trailingIcon = null,
  className = '',
  inputClassName = '',
  autoComplete,
  min,
  max,
  step,
  maxLength,
  inputMode,
  pattern,
  allowNegative = false,
  integerOnly = false,
}, ref) => {
  const stateRing = error
    ? 'border-red-500/50 focus-within:border-red-400/80'
    : 'border-emerald-500/20 focus-within:border-emerald-400/70';

  // Better mobile keyboard defaults
  const computedInputMode =
    inputMode ??
    (type === 'number'
      ? integerOnly || step === '1'
        ? 'numeric'
        : 'decimal'
      : undefined);

  const handleKeyDown = (e) => {
    // Allow consumer handler first
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;

    // Number-specific restrictions
    if (type === 'number') {
      const disallowed = ['e', 'E', '+'];
      if (!allowNegative) disallowed.push('-');
      if (integerOnly || step === '1') disallowed.push('.');
      if (disallowed.includes(e.key)) {
        e.preventDefault();
        return;
      }
    }

    // Prevent printable & navigation keys from bubbling (avoid modal reacting)
    const navigationalKeys = [
      'Backspace',
      'Delete',
      'Home',
      'End',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
    ];
    const isPrintable = e.key.length === 1;

    if (
      !e.altKey &&
      !e.ctrlKey &&
      !e.metaKey &&
      (isPrintable || navigationalKeys.includes(e.key))
    ) {
      e.stopPropagation();
    }
  };

  const baseInputClass =
    'w-full px-1 py-2.5 bg-transparent border-0 text-white placeholder:text-slate-400 focus:outline-none transition-all duration-200';
  const mergedInputClass = [
    baseInputClass,
    disabled ? 'opacity-60 cursor-not-allowed' : '',
    inputClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-slate-200 mb-1"
        >
          {label}
          {required ? <span className="text-red-400 ml-0.5">*</span> : null}
        </label>
      )}

      <div
        className={`flex items-center gap-2 rounded-lg border bg-emerald-500/5 backdrop-blur-sm px-3 py-0.5 ${stateRing}`}
      >
        {leadingIcon && (
          <span className="text-slate-400 flex items-center justify-center">
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          name={name || id}
          type={type === 'number' ? 'text' : type}
          value={value ?? ''}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || loading}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          inputMode={computedInputMode}
          pattern={pattern}
          className={mergedInputClass}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        {loading && (
          <span className="pr-2">
            <Spinner size="sm" />
          </span>
        )}

        {!loading && trailingIcon && (
          <span className="text-slate-400 flex items-center justify-center pr-2">
            {trailingIcon}
          </span>
        )}
      </div>

      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
