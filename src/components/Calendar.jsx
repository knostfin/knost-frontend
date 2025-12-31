import React, { useState, useEffect, useRef } from 'react';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

/**
 * Unified Calendar Component - Works for both date selection (modals) and month selection (filters)
 * @param {Object} props
 * @param {string} props.value - Selected value (YYYY-MM-DD for dates, YYYY-MM for months)
 * @param {Function} props.onChange - Callback when value changes
 * @param {'date' | 'month'} props.type - 'date' for day selection, 'month' for month-year only
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.className - Additional CSS classes
 */
export default function Calendar({
  value,
  onChange,
  type = 'date', // 'date' or 'month'
  placeholder = type === 'date' ? 'Select date' : 'Select month',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPositioned, setIsPositioned] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    value ? new Date(type === 'month' ? `${value}-01` : value) : new Date()
  );
  const [view, setView] = useState('calendar'); // 'calendar', 'month', 'year'
  const [yearRange, setYearRange] = useState(Math.floor(currentDate.getFullYear() / 12) * 12);

  const { x, y, strategy, refs } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(8),
      flip({ padding: 8, fallbackPlacements: ['bottom-end', 'top-start', 'top-end'] }),
      shift({ padding: 8 }),
    ],
  });

  // Sync currentDate when value changes from outside (e.g., editing existing entry)
  useEffect(() => {
    if (value) {
      const dateToSet = new Date(type === 'month' ? `${value}-01` : value);
      if (!Number.isNaN(dateToSet.getTime())) {
        setCurrentDate(dateToSet);
        setYearRange(Math.floor(dateToSet.getFullYear() / 12) * 12);
      }
    }
  }, [value, type]);

  // Only show portal when positioned is ready and reference is set
  useEffect(() => {
    // Wait for floating-ui to calculate actual position
    // x and y start as undefined, then become numbers when ready
    const hasReference = refs.reference.current !== null;
    const hasCoordinates = typeof x === 'number' && typeof y === 'number';

    if (isOpen && hasReference && hasCoordinates) {
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        setIsPositioned(true);
      });
    } else {
      setIsPositioned(false);
    }
  }, [isOpen, x, y, refs.reference]);

  // Format display text
  const getDisplayText = () => {
    if (!value) return placeholder;
    const date = new Date(value);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (type === 'month') {
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Calendar helpers
  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handlePrevYear = () => {
    setYearRange(yearRange - 12);
  };

  const handleNextYear = () => {
    setYearRange(yearRange + 12);
  };

  // Selection handlers
  const handleDayClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${date}`);
    setIsOpen(false);
    setView('calendar');
  };

  const handleMonthClick = (monthIndex) => {
    if (type === 'month') {
      const year = currentDate.getFullYear();
      const month = String(monthIndex + 1).padStart(2, '0');
      onChange(`${year}-${month}`);
      setIsOpen(false);
      setView('calendar');
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), monthIndex));
      setView('calendar');
    }
  };

  const handleYearClick = (year) => {
    if (type === 'month') {
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      onChange(`${year}-${month}`);
      setView('calendar');
    } else {
      setCurrentDate(new Date(year, currentDate.getMonth()));
      setView('month');
    }
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    if (type === 'month') {
      onChange(`${year}-${month}`);
    } else {
      const date = String(today.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${date}`);
    }
    setCurrentDate(today);
    setIsOpen(false);
    setView('calendar');
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (refs.reference.current && !refs.reference.current.contains(e.target) &&
        refs.floating.current && !refs.floating.current.contains(e.target)) {
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
    if (!isOpen && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
    } else if (isOpen && e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Build calendar days
  const days = [];
  const totalDays = daysInMonth(currentDate);
  const firstDay = firstDayOfMonth(currentDate);
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const isToday = (day) => {
    const today = new Date();
    return day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear();
  };

  const isSelected = (day) => {
    if (!value) return false;
    const selected = new Date(value);
    return day === selected.getDate() &&
      currentDate.getMonth() === selected.getMonth() &&
      currentDate.getFullYear() === selected.getFullYear();
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        ref={refs.setReference}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2.5 rounded-lg bg-emerald-500/5 backdrop-blur-sm border border-emerald-500/20 text-white text-left focus:outline-none focus:border-emerald-500/40 transition-all duration-200 hover:border-emerald-500/30 active:scale-98 flex items-center justify-between"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className={value ? 'text-white font-medium' : 'text-slate-500'}>{getDisplayText()}</span>
        <svg className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {isPositioned && (
        <div
          ref={refs.setFloating}
          style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
          className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/40 rounded-xl shadow-xl shadow-black/30 p-3 w-64 z-[9999]"
          role="dialog"
          aria-label="Date picker"
        >
          {/* Calendar View */}
          {view === 'calendar' && type === 'month' && (
            <div className="space-y-3">
              {/* Month-Year selection directly */}
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setView('year')}
                  className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold bg-slate-700/40 hover:bg-slate-700/60 transition-all duration-200"
                >
                  {currentDate.getFullYear()}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {shortMonths.map((month, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMonthClick(idx)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${value && new Date(value + '-01').getMonth() === idx && currentDate.getFullYear() === new Date(value + '-01').getFullYear()
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                        : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-white active:scale-95'
                      }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar View - Date type */}
          {view === 'calendar' && type === 'date' && (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-slate-700/40 rounded-lg text-slate-400 hover:text-white transition-all duration-200 flex-shrink-0 active:scale-95"
                  aria-label="Previous month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex gap-1 flex-1 justify-center">
                  <button
                    type="button"
                    onClick={() => setView('month')}
                    className="px-3 py-1 rounded-lg text-white text-sm font-semibold bg-slate-700/40 hover:bg-slate-700/60 transition-all duration-200"
                    title="Select month"
                  >
                    {monthNames[currentDate.getMonth()].slice(0, 3)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('year')}
                    className="px-3 py-1 rounded-lg text-white text-sm font-semibold bg-slate-700/40 hover:bg-slate-700/60 transition-all duration-200"
                    title="Select year"
                  >
                    {currentDate.getFullYear()}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-slate-700/40 rounded-lg text-slate-400 hover:text-white transition-all duration-200 flex-shrink-0 active:scale-95"
                  aria-label="Next month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Weekday labels */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-semibold text-slate-500 py-1">{day}</div>
                ))}
              </div>

              {/* Days grid - Hidden for month type */}
              {type === 'date' && (
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => day && handleDayClick(day)}
                      disabled={!day}
                      className={`py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${!day
                          ? 'invisible'
                          : isSelected(day)
                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                            : isToday(day)
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 hover:bg-teal-500/30'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white active:scale-95'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer - Only show for date type */}
              {type === 'date' && (
                <div className="flex gap-2 pt-2 border-t border-slate-700/40">
                  <button
                    type="button"
                    onClick={handleToday}
                    className="flex-1 px-3 py-2 rounded-lg text-white text-sm font-medium bg-slate-700/40 hover:bg-slate-700/60 transition-all duration-200 active:scale-98"
                  >
                    Today
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Month View */}
          {view === 'month' && (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setView('year')}
                  className="px-4 py-1.5 rounded-lg text-white text-sm font-semibold bg-slate-700/40 hover:bg-slate-700/60 transition-all duration-200"
                >
                  {currentDate.getFullYear()}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {shortMonths.map((month, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleMonthClick(idx)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${value && new Date(value).getMonth() === idx && currentDate.getFullYear() === new Date(value).getFullYear()
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                        : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-white active:scale-95'
                      }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Year View */}
          {view === 'year' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handlePrevYear}
                  className="p-1.5 hover:bg-slate-700/40 rounded-lg text-slate-400 hover:text-white transition-all duration-200 flex-shrink-0 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-white text-sm font-semibold flex-1 text-center">{yearRange}-{yearRange + 11}</span>
                <button
                  type="button"
                  onClick={handleNextYear}
                  className="p-1.5 hover:bg-slate-700/40 rounded-lg text-slate-400 hover:text-white transition-all duration-200 flex-shrink-0 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto recent-scrollbar">
                {Array.from({ length: 12 }, (_, i) => yearRange + i).map((year) => (
                  <button
                    type="button"
                    key={year}
                    onClick={() => handleYearClick(year)}
                    className={`py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentDate.getFullYear() === year
                        ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                        : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-white active:scale-95'
                      }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
