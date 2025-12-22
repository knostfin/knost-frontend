import React, { useState, useEffect } from 'react';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';

export default function DatePicker({ value, onChange, placeholder = 'Select date', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentDate, setCurrentDate] = useState(value ? new Date(value) : new Date());
  const [view, setView] = useState('calendar'); // 'calendar', 'month', 'year'
  const [yearRange, setYearRange] = useState(Math.floor(currentDate.getFullYear() / 12) * 12);

  // Floating UI for collision-aware positioning within modal boundaries
  const { x, y, strategy, refs } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(8),
      flip({
        boundary: 'viewport',
        rootBoundary: 'document',
        padding: { top: 80, bottom: 16, left: 16, right: 16 },
      }),
      shift({
        boundary: 'viewport',
        padding: { top: 80, bottom: 16, left: 16, right: 16 },
      }),
    ],
  });

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleInputSubmit = () => {
    // Try to parse the input date (format: DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD)
    let parsedDate = null;
    const trimmed = inputValue.trim();

    if (trimmed) {
      // Try YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        parsedDate = new Date(trimmed + 'T00:00:00');
      }
      // Try DD-MM-YYYY format
      else if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        parsedDate = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
      }
      // Try DD/MM/YYYY format
      else if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
        const parts = trimmed.split('/');
        parsedDate = new Date(parts[2], parseInt(parts[1]) - 1, parts[0]);
      }

      if (parsedDate && !isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear();
        const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
        const date = String(parsedDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${date}`;
        onChange(formattedDate);
        setCurrentDate(parsedDate);
        setInputValue('');
        setIsOpen(false);
        return;
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDayClick = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${date}`;
    onChange(formattedDate);
     setInputValue(formatDate(formattedDate));
    setIsOpen(false);
    setView('calendar');
  };

  const handleMonthClick = (month) => {
    setCurrentDate(new Date(currentDate.getFullYear(), month));
    setView('calendar');
  };

  const handleYearClick = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth()));
    setView('month');
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const date = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${date}`;
    onChange(formattedDate);
    setCurrentDate(today);
    setIsOpen(false);
    setView('calendar');
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const refEl = refs.reference.current;
      const floatEl = refs.floating.current;
      if (
        refEl && !refEl.contains(e.target) &&
        floatEl && !floatEl.contains(e.target)
      ) {
        setIsOpen(false);
        setView('calendar');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs]);

  const days = [];
  const totalDays = daysInMonth(currentDate);
  const firstDay = firstDayOfMonth(currentDate);

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const formatDate = (dateString) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Sync external value into input and calendar view
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        setCurrentDate(parsed);
        setInputValue(formatDate(value));
        return;
      }
    }
    // fallback for empty or invalid
    setInputValue('');
  }, [value]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const isToday = (day) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return (
      day === selectedDate.getDate() &&
      currentDate.getMonth() === selectedDate.getMonth() &&
      currentDate.getFullYear() === selectedDate.getFullYear()
    );
  };

  const years = Array.from({ length: 12 }, (_, i) => yearRange + i);

  return (
    <div className="date-picker-container relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          ref={refs.setReference}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && inputValue.trim()) {
              handleInputSubmit();
            }
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                     placeholder-slate-400 focus:outline-none focus:border-teal-500 hover:border-slate-600
                     transition-all duration-200 text-left pr-10"
          title="Type date or select from calendar"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 p-1.5 text-slate-400 hover:text-white transition-all pointer-events-auto"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
            className="date-picker-dropdown z-[40] rounded-xl bg-slate-900 border border-slate-700 shadow-2xl shadow-black/50 w-[250px]"
          >
            <div className="p-2">
              {/* CALENDAR VIEW */}
              {view === 'calendar' && (
                <>
                  {/* Header with navigation to year/month selection */}
                  <div className="flex items-center justify-between mb-3 gap-1">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex-1 text-center min-w-0">
                      <button
                        type="button"
                        onClick={() => setView('month')}
                        className="text-white font-semibold hover:text-teal-400 transition-all text-xs inline"
                      >
                        {monthNames[currentDate.getMonth()]}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setView('year');
                          setYearRange(Math.floor(currentDate.getFullYear() / 12) * 12);
                        }}
                        className="text-white font-semibold hover:text-teal-400 transition-all text-xs inline ml-1"
                      >
                        {currentDate.getFullYear()}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-0.5 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                      <div key={idx} className="text-center text-xs font-semibold text-slate-400 py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {days.map((day, idx) => (
                      <div key={idx} className="min-h-0">
                        {day ? (
                          <button
                            type="button"
                            onClick={() => handleDayClick(day)}
                            className={`w-full h-6 rounded text-xs font-medium transition-all duration-200 flex items-center justify-center overflow-hidden ${
                              isSelected(day)
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30'
                                : isToday(day)
                                ? 'bg-slate-700/80 text-teal-400 border border-teal-500/60 hover:bg-slate-700'
                                : 'text-slate-300 hover:bg-slate-700/60 hover:text-white'
                            }`}
                          >
                            {day}
                          </button>
                        ) : (
                          <div className="w-full h-6" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Footer Buttons */}
                </>
              )}

              {/* MONTH VIEW */}
              {view === 'month' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setView('year');
                        setYearRange(Math.floor(currentDate.getFullYear() / 12) * 12);
                      }}
                      className="text-teal-400 hover:text-teal-300 transition-all text-sm font-medium whitespace-nowrap"
                    >
                      ← Back
                    </button>
                    <h3 className="text-white font-semibold text-center flex-1 text-sm whitespace-nowrap">
                      Select Month {currentDate.getFullYear()}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {monthNames.map((month, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleMonthClick(idx)}
                        className={`py-3 px-2 rounded text-sm font-medium transition-all ${
                          currentDate.getMonth() === idx
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {month.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* YEAR VIEW */}
              {view === 'year' && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setYearRange(yearRange - 12)}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-white font-semibold text-center flex-1">
                      {yearRange} - {yearRange + 11}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setYearRange(yearRange + 12)}
                      className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-1 max-h-60 overflow-y-auto recent-scrollbar">
                    {years.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => handleYearClick(year)}
                        className={`py-2 px-2 rounded text-sm font-medium transition-all ${
                          currentDate.getFullYear() === year
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </FloatingPortal>
      )}
    </div>
  );
}
