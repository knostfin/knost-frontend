import React, { useState, useRef, useEffect } from 'react';

export default function Select({
  label,
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option',
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
  leadingIcon = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
      return;
    }

    if (isOpen && e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      return;
    }
  };

  const handleSelect = (optionValue) => {
    onChange({ target: { name: name || id, value: optionValue } });
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const stateRing = error
    ? 'border-red-500/50 focus-within:border-red-400/80'
    : 'border-emerald-500/20 focus-within:border-emerald-400/70';

  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-slate-200" htmlFor={id || name}>
          {label}
          {required ? <span className="text-red-400 ml-1">*</span> : null}
        </label>
      )}

      <div className={`relative rounded-lg bg-emerald-500/5 backdrop-blur-sm border ${stateRing} transition-all duration-200 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">{leadingIcon}</span>
        )}

        <button
          ref={buttonRef}
          id={id || name}
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={`w-full flex items-center justify-between px-3 py-2.5 text-white text-left focus:outline-none transition-colors ${
            leadingIcon ? 'pl-10' : ''
          } ${disabled ? 'cursor-not-allowed' : 'hover:bg-slate-700/50'}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={id}
          aria-invalid={!!error}
        >
          <span className={selectedOption ? 'text-white' : 'text-slate-500'}>{displayText}</span>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/20 rounded-lg shadow-2xl shadow-black/60 z-[1000] animate-in fade-in zoom-in-95 duration-200"
            role="listbox"
            aria-labelledby={id}
          >
            <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
              {options.length === 0 ? (
                <div className="px-3 py-2.5 text-slate-400 text-sm">No options available</div>
              ) : (
                options.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(option.value);
                      }
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      value === option.value
                        ? 'bg-teal-500/20 text-teal-200 border-l-2 border-teal-500'
                        : 'text-slate-200 hover:bg-slate-700/70'
                    }`}
                    role="option"
                    aria-selected={value === option.value}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <svg className="w-4 h-4 text-teal-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </div>
  );
}
