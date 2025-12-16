import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';

const scrollbarStyles = `
  .year-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .year-scroll::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.7);
    border-radius: 9999px;
  }
  .year-scroll::-webkit-scrollbar-thumb {
    background: rgba(51, 65, 85, 0.9);
    border-radius: 9999px;
    border: 2px solid rgba(15, 23, 42, 0.8);
  }
  .year-scroll::-webkit-scrollbar-thumb:hover {
    background: rgba(94, 234, 212, 0.6);
  }
`;

export default function MonthSelector({ className = '' }) {
  const { currentMonth, navigateMonth, setMonth } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const [year, month] = currentMonth.split('-');
  const monthIndex = parseInt(month) - 1;
  const displayText = `${monthNames[monthIndex]} ${year}`;

  const handleMonthSelect = (newMonth) => {
    setMonth(`${year}-${String(newMonth + 1).padStart(2, '0')}`);
    setIsOpen(false);
  };

  const handleYearChange = (newYear) => {
    setMonth(`${newYear}-${month}`);
  };

  const handleToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    setMonth(`${y}-${m}`);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative flex items-center gap-2 sm:gap-3 ${className}`} ref={dropdownRef}>
      <style>{scrollbarStyles}</style>
      <button
        onClick={() => navigateMonth('prev')}
        className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 
                   text-slate-300 hover:text-white transition-all duration-200 flex-shrink-0"
        aria-label="Previous month"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 sm:px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg 
                   text-white font-medium cursor-pointer hover:bg-slate-700/50
                   focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all duration-200
                   text-sm sm:text-base whitespace-nowrap"
      >
        {displayText}
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-slate-800 border border-slate-700 
                        rounded-lg shadow-2xl shadow-black/50 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
          {/* Year selector */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-400 uppercase mb-2 block">Year</label>
            <div className="rounded-lg border border-slate-700 bg-slate-800/60 overflow-hidden">
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-700/80 year-scroll">
                {Array.from({ length: 10 }, (_, i) => parseInt(year) - 5 + i).map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => handleYearChange(y)}
                    className={`w-full text-left px-3 py-2 text-sm font-semibold transition-colors duration-150 ${
                      String(y) === String(year)
                        ? 'bg-teal-500/15 text-teal-300'
                        : 'text-slate-200 hover:bg-slate-700/60 hover:text-white'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Month grid */}
          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-400 uppercase mb-3 block">Month</label>
            <div className="grid grid-cols-3 gap-2">
              {monthNames.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => handleMonthSelect(idx)}
                  className={`py-2 px-2 rounded text-sm font-medium transition-all duration-200 ${
                    idx === monthIndex
                      ? 'bg-teal-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {m.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-3 border-t border-slate-700">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-sm rounded bg-slate-700/50 text-slate-300 hover:bg-slate-700 
                         hover:text-white transition-all duration-200"
            >
              Close
            </button>
            <button
              onClick={handleToday}
              className="flex-1 px-3 py-2 text-sm rounded bg-teal-500/20 text-teal-400 border border-teal-500/30
                         hover:bg-teal-500/30 transition-all duration-200 font-medium"
            >
              Today
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => navigateMonth('next')}
        className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 
                   text-slate-300 hover:text-white transition-all duration-200 flex-shrink-0"
        aria-label="Next month"
      >
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
