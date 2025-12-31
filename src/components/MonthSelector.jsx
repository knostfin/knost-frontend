import React, { useState, useRef, useEffect } from 'react';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { useFinance } from '../context/FinanceContext';

/**
 * Dedicated Month-Year Picker Component
 * Handles year and month selection with proper state management
 */
function MonthYearPicker({ value, onChange }) {
  const currentValue = value ? new Date(value + '-01') : new Date();
  const [selectedYear, setSelectedYear] = useState(currentValue.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(null); // Start with no month selected
  const [yearRange, setYearRange] = useState(Math.floor(currentValue.getFullYear() / 12) * 12);

  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleYearClick = (year) => {
    setSelectedYear(year);
    setSelectedMonth(null); // Reset month selection when year changes
  };

  const handleMonthClick = (monthIndex) => {
    setSelectedMonth(monthIndex);
    const month = String(monthIndex + 1).padStart(2, '0');
    onChange(`${selectedYear}-${month}`);
  };

  const handlePrevYearRange = () => {
    setYearRange(yearRange - 12);
  };

  const handleNextYearRange = () => {
    setYearRange(yearRange + 12);
  };

  const isCurrentMonth = (monthIndex) => {
    if (!value) return false;
    const valueDate = new Date(value + '-01');
    return monthIndex === valueDate.getMonth() && selectedYear === valueDate.getFullYear();
  };

  return (
    <div className="space-y-4">
      {/* Year Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handlePrevYearRange}
            className="p-1.5 hover:bg-slate-700/40 rounded-lg text-slate-400 hover:text-white transition-all duration-200 active:scale-95"
            aria-label="Previous year range"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white text-sm font-semibold flex-1 text-center">
            {yearRange} - {yearRange + 11}
          </span>
          <button
            onClick={handleNextYearRange}
            className="p-1.5 hover:bg-slate-700/40 rounded-lg text-slate-400 hover:text-white transition-all duration-200 active:scale-95"
            aria-label="Next year range"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto recent-scrollbar">
          {Array.from({ length: 12 }, (_, i) => yearRange + i).map((year) => (
            <button
              key={year}
              onClick={() => handleYearClick(year)}
              className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedYear === year
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-white active:scale-95'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Month Selection */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Select Month for {selectedYear}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {shortMonths.map((month, idx) => (
            <button
              key={idx}
              onClick={() => handleMonthClick(idx)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isCurrentMonth(idx)
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 ring-2 ring-teal-400/30'
                  : selectedMonth === idx
                  ? 'bg-teal-500/80 text-white'
                  : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-white active:scale-95'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lightweight Month Switcher for Dashboard
 * Product-driven, effortless month navigation
 */
export default function MonthSelector({ className = '' }) {
  const { currentMonth, navigateMonth, setMonth } = useFinance();
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Floating UI for month picker modal (anchored to entire navigation)
  const { x, y, strategy, refs } = useFloating({
    open: showMonthPicker,
    onOpenChange: setShowMonthPicker,
    whileElementsMounted: autoUpdate,
    placement: 'bottom',
    middleware: [
      offset(12),
      flip({ padding: 16 }),
      shift({ padding: 16 }),
    ],
  });

  // Format current month for display
  const getMonthDisplay = (monthStr) => {
    const date = new Date(monthStr + '-01');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Close month picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refs.reference.current && 
          !refs.reference.current.contains(e.target) && 
          refs.floating.current && 
          !refs.floating.current.contains(e.target)) {
        setShowMonthPicker(false);
      }
    };

    if (showMonthPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMonthPicker, refs]);

  // Close month picker on ESC key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showMonthPicker) {
        setShowMonthPicker(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showMonthPicker]);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Month Navigation - Simple & Clean */}
      <div 
        ref={refs.setReference}
        className="flex items-center gap-1 px-1 py-1 rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-slate-700/50 backdrop-blur-sm shadow-lg"
      >
        {/* Previous Month Arrow */}
        <button
          onClick={() => navigateMonth('prev')}
          className="group p-2 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-white transition-all duration-200 active:scale-95"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Current Month Display - Clickable to open calendar */}
        <button
          onClick={() => setShowMonthPicker(!showMonthPicker)}
          className="relative group px-4 py-1.5 rounded-lg bg-slate-900/40 hover:bg-slate-900/60 border border-slate-700/30 hover:border-slate-600/50 text-white font-semibold text-sm transition-all duration-200 min-w-[110px] text-center"
          aria-expanded={showMonthPicker}
          aria-haspopup="dialog"
          title="Click to select any month"
        >
          <span className="relative z-10">{getMonthDisplay(currentMonth)}</span>
          {/* Subtle indicator */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 rounded-lg transition-opacity duration-300"></div>
        </button>

        {/* Next Month Arrow */}
        <button
          onClick={() => navigateMonth('next')}
          className="group p-2 rounded-lg hover:bg-slate-700/70 text-slate-400 hover:text-white transition-all duration-200 active:scale-95"
          aria-label="Next month"
        >
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Month-Year Picker - Anchored to navigation container */}
      {showMonthPicker && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{
              position: strategy,
              top: y ?? 0,
              left: x ?? 0,
              width: 'max-content',
              opacity: x == null ? 0 : 1,
              transition: 'opacity 0.15s ease-out',
            }}
            className="z-[100] bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl shadow-black/30 p-4"
              role="dialog"
              aria-label="Select month and year"
            >
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-700/30">
              <h3 className="text-sm font-semibold text-white">Select Month & Year</h3>
              <button
                onClick={() => setShowMonthPicker(false)}
                className="p-1.5 hover:bg-slate-800/60 rounded-lg text-slate-400 hover:text-white transition-all duration-200 active:scale-95"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <MonthYearPicker
              value={currentMonth}
              onChange={(value) => {
                setMonth(value);
                setShowMonthPicker(false);
              }}
            />
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
