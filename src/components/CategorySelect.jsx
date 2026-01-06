import React, { useState, useEffect, useRef } from 'react';
import { useFloating, offset, shift, size, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { getCategories, saveCategory } from '../api/categories';

export default function CategorySelect({
  label,
  id,
  name,
  value,
  onChange,
  type = 'expense', // 'income', 'expense', 'debt'
  placeholder = 'Select or add category',
  error,
  hint,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [saving, setSaving] = useState(false);
  const [maxHeight, setMaxHeight] = useState(null);
  const inputRef = useRef(null);

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
        apply({ availableHeight }) {
          setMaxHeight(Math.max(150, availableHeight - 8));
        },
      }),
    ],
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await getCategories(type);
        setCategories(response.data.categories || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [type]);

  // Focus input when switching to add mode
  useEffect(() => {
    if (isAddingNew && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingNew]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        refs.reference.current && !refs.reference.current.contains(e.target) &&
        refs.floating.current && !refs.floating.current.contains(e.target)
      ) {
        setIsOpen(false);
        setIsAddingNew(false);
        setNewCategoryName('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, refs.reference, refs.floating]);

  const handleSelect = (categoryName) => {
    onChange({ target: { name: name || id, value: categoryName } });
    setIsOpen(false);
    setIsAddingNew(false);
    setNewCategoryName('');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    setSaving(true);
    try {
      const response = await saveCategory({
        name: newCategoryName.trim(),
        type,
      });
      const newCategory = response.data.category;
      setCategories(prev => [...prev, newCategory]);
      handleSelect(newCategory.name);
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSaving(false);
    }
  };

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
      setIsAddingNew(false);
      setNewCategoryName('');
    }
  };

  const handleAddInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsAddingNew(false);
      setNewCategoryName('');
    }
  };

  const stateRing = error
    ? 'border-red-500/50 focus-within:border-red-400/80'
    : 'border-emerald-500/20 focus-within:border-emerald-400/70';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-200 mb-2" htmlFor={id || name}>
          {label}
        </label>
      )}

      <div ref={refs.setReference} className={`relative rounded-lg bg-emerald-500/5 backdrop-blur-sm border ${stateRing} transition-all duration-200`}>
        <button
          id={id || name}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className="w-full flex items-center justify-between px-3 py-2.5 text-white text-left focus:outline-none transition-colors hover:bg-slate-700/50"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className={value ? 'text-white' : 'text-slate-500'}>{value || placeholder}</span>
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
              minWidth: '220px',
              maxHeight: maxHeight ? `${maxHeight}px` : undefined,
            }}
            className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/20 rounded-lg shadow-2xl shadow-black/60 z-[9999] overflow-hidden flex flex-col"
          >
            {/* Add new category option or input */}
            <div className="border-b border-emerald-500/20">
              {isAddingNew ? (
                <div className="p-2">
                  <div className="flex gap-1.5">
                    <input
                      ref={inputRef}
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={handleAddInputKeyDown}
                      placeholder="Category name"
                      maxLength={50}
                      className="flex-1 min-w-0 px-2 py-1.5 rounded bg-slate-800/50 border border-slate-600/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      disabled={saving || !newCategoryName.trim()}
                      className="px-2.5 py-1.5 rounded bg-teal-500 text-white text-xs font-medium hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                    >
                      {saving ? '...' : 'Add'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="w-full text-left px-3 py-2.5 text-sm text-teal-400 hover:bg-slate-700/70 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add new category
                </button>
              )}
            </div>

            {/* Categories list */}
            <div className="overflow-y-auto divide-y divide-white/5" style={{ maxHeight: maxHeight ? `${maxHeight - 60}px` : '200px' }}>
              {loading ? (
                <div className="px-3 py-2.5 text-slate-400 text-sm">Loading...</div>
              ) : categories.length === 0 ? (
                <div className="px-3 py-2.5 text-slate-400 text-sm">No categories yet</div>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleSelect(category.name)}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      value === category.name
                        ? 'bg-teal-500/20 text-teal-200 border-l-2 border-teal-500'
                        : 'text-slate-200 hover:bg-slate-700/70'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {category.icon && <span>{category.icon}</span>}
                      {category.name}
                    </span>
                    {value === category.name && (
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
