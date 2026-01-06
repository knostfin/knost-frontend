import React from 'react';

export default function TextArea({
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  error,
  hint,
  rows = 3,
  required = false,
  disabled = false,
  className = '',
  textareaClassName = '',
  maxLength,
}) {
  const stateRing = error
    ? 'border-red-500/50 focus:border-red-400/80'
    : 'border-emerald-500/20 focus:border-emerald-400/70';

  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.defaultPrevented) return;
    const navigationalKeys = ['Backspace','Delete','Home','End','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'];
    const isPrintable = e.key.length === 1;
    if (!e.altKey && !e.ctrlKey && !e.metaKey && (isPrintable || navigationalKeys.includes(e.key))) {
      e.stopPropagation();
    }
  };

  return (
    <label className={`flex flex-col gap-1 ${className}`} htmlFor={id || name}>
      {label && (
        <span className="text-sm font-medium text-slate-200">
          {label}
          {required ? <span className="text-red-400 ml-1">*</span> : null}
        </span>
      )}
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full bg-emerald-500/5 backdrop-blur-sm text-white placeholder:text-slate-400 px-3 py-2.5 rounded-lg border ${stateRing} focus:outline-none transition-all duration-200 resize-none ${textareaClassName}`}
        aria-invalid={!!error}
        aria-describedby={error ? `${id || name}-error` : undefined}
      />
      {error ? (
        <span id={`${id || name}-error`} className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}
