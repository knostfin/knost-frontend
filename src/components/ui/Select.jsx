import React, { useState, useRef, useEffect } from 'react';
import { useFloating, offset, shift, size, autoUpdate, FloatingPortal } from '@floating-ui/react';

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
  const [maxHeight, setMaxHeight] = useState(null);
  const containerRef = useRef(null);

  const { x, y, strategy, refs } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(8),
      shift({ padding: 8 }),
      size({
        padding: 8,
        apply({ availableHeight, rects }) {
          setMaxHeight(Math.max(150, availableHeight - 8));
        },
      }),
    ],
  });

  const selectedOption = options.find(opt => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        refs.reference.current && !refs.reference.current.contains(e.target) &&
        refs.floating.current && !refs.floating.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, refs.reference, refs.floating]);

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
    refs.reference.current?.focus();
  };

  const stateRing = error
    ? 'border-red-500/50 focus-within:border-red-400/80'
    : 'border-emerald-500/20 focus-within:border-emerald-400/70';

  return (
    <div className={className} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-200 mb-2" htmlFor={id || name}>
          {label}
          {required ? <span className="text-red-400 ml-1">*</span> : null}
        </label>
      )}

      <div ref={refs.setReference} className={`relative rounded-lg bg-emerald-500/5 backdrop-blur-sm border ${stateRing} transition-all duration-200 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        {leadingIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 flex items-center">{leadingIcon}</span>
        )}

        <button
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Dropdown menu - rendered in portal */}
      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: refs.reference.current?.offsetWidth,
              maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
            className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/20 rounded-lg shadow-2xl shadow-black/60 z-[9999] overflow-y-auto"
            role="listbox"
            aria-labelledby={id}
          >
            <div className="divide-y divide-white/5">
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
        </FloatingPortal>
      )}

      {error ? (
        <span className="text-xs text-red-400">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </div>
  );
}
