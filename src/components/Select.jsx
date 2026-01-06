import React, { useEffect, useRef, useState } from 'react';

export default function Select({
  value,
  options = [],
  placeholder = 'Select',
  onChange,
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  const close = () => {
    setOpen(false);
    setHighlight(-1);
  };

  useEffect(() => {
    const onClick = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        listRef.current && !listRef.current.contains(e.target)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (open && selectedOption) {
      const idx = options.findIndex((o) => o.value === selectedOption.value);
      setHighlight(idx);
    }
  }, [open, selectedOption, options]);

  const handleSelect = (opt) => {
    onChange?.(opt.value, opt);
    close();
    triggerRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setHighlight((prev) => (prev >= 0 ? prev : 0));
      } else {
        setHighlight((prev) => Math.min(options.length - 1, (prev >= 0 ? prev : -1) + 1));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (open) setHighlight((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
      } else if (highlight >= 0 && options[highlight]) {
        handleSelect(options[highlight]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        close();
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        ref={triggerRef}
        onClick={() => !disabled && setOpen((p) => !p)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Select ${placeholder}`}
        className={`relative w-full pl-3 pr-10 py-2 rounded-lg text-left text-white
          bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20
          hover:border-emerald-500/40 shadow-lg shadow-black/30
          focus:outline-none focus:border-emerald-500/40
          transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span className="text-sm truncate">{selectedOption?.label || placeholder}</span>
        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-2 w-full rounded-lg bg-slate-900/95 backdrop-blur-xl border border-emerald-500/20 shadow-2xl shadow-black/50 overflow-hidden"
          role="listbox"
        >
          <div className="max-h-56 overflow-y-auto divide-y divide-white/5">
            {options.map((opt, idx) => {
              const active = highlight === idx;
              const selected = value === opt.value;
              return (
                <button
                  key={opt.value ?? idx}
                  role="option"
                  aria-selected={selected}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlight(idx)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors duration-150
                    ${selected ? 'bg-teal-500/15 text-teal-200' : active ? 'bg-slate-800 text-white' : 'text-slate-200 hover:bg-slate-800 hover:text-white'}`}
                >
                  {opt.label}
                </button>
              );
            })}
            {options.length === 0 && (
              <div className="px-3 py-2 text-sm text-slate-400">No options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
