import React, { useState, useRef, useEffect } from 'react';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other Income'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Rent', 'Other Expense'],
  debt: ['Personal Loan', 'Credit Card', 'Mortgage', 'Car Loan', 'Student Loan', 'Other Debt'],
};

const PAYMENT_METHODS = [
  { value: 'cash', label: '💵 Cash', color: 'green' },
  { value: 'card', label: '💳 Card', color: 'blue' },
  { value: 'bank_transfer', label: '🏦 Bank Transfer', color: 'purple' },
  { value: 'upi', label: '📱 UPI', color: 'orange' },
  { value: 'other', label: '📌 Other', color: 'gray' },
];

// Custom Date Picker Component
function CustomDatePicker({ value, onChange }) {
  const [showCalendar, setShowCalendar] = useState(false);
  const currentDate = new Date(value);
  const [viewMonth, setViewMonth] = useState(currentDate.getMonth());
  const [viewYear, setViewYear] = useState(currentDate.getFullYear());
  const calendarRef = useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const getDayName = (dayIndex) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(viewMonth, viewYear);
    const firstDay = firstDayOfMonth(viewMonth, viewYear);
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: '', isCurrentMonth: false });
    }
    for (let day = 1; day <= totalDays; day++) {
      days.push({ day, isCurrentMonth: true });
    }
    return days;
  };

  const isSelected = (day) => {
    const selectedDate = new Date(value);
    return selectedDate.getDate() === day && selectedDate.getMonth() === viewMonth && selectedDate.getFullYear() === viewYear;
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
  };

  const handleDateClick = (day) => {
    const selectedDate = new Date(viewYear, viewMonth, day);
    onChange(selectedDate.toISOString().split('T')[0]);
    setShowCalendar(false);
  };

  const getRelativeDate = (dateStr) => {
    const today = new Date();
    const date = new Date(dateStr);
    const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays === -1) return 'Tomorrow';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays} days ago`;
    return formatDate(dateStr);
  };

  return (
    <div className="relative" ref={calendarRef}>
      <button
        type="button"
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-left flex items-center justify-between text-sm"
      >
        <span className="font-medium">{getRelativeDate(value)}</span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${showCalendar ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {showCalendar && (
        <div className="absolute top-full left-0 mb-2 z-[60]">
            <div
            className="bg-gradient-to-br from-slate-800 to-slate-700 border border-white/15 rounded-xl shadow-2xl overflow-hidden w-[280px]"
            >

          {/* Calendar Header */}
          <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
            <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded hover:bg-white/10 text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-bold text-white">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={handleNextMonth} className="p-1.5 rounded hover:bg-white/10 text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* Calendar Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-xs font-bold text-gray-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays().map((dayObj, idx) => {
                if (!dayObj.isCurrentMonth) {
                  return <div key={idx} className="text-center py-1.5"></div>;
                }
                const selected = isSelected(dayObj.day);
                const today = isToday(dayObj.day);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleDateClick(dayObj.day)}
                    className={`text-center py-1.5 text-sm rounded transition-all ${
                      selected
                        ? 'bg-teal-500 text-white font-bold'
                        : today
                        ? 'bg-white/10 text-teal-400 font-semibold'
                        : 'text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    {dayObj.day}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Quick shortcuts */}
          <div className="p-2 bg-white/5 border-t border-white/10 grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                onChange(yesterday.toISOString().split('T')[0]);
                setViewMonth(yesterday.getMonth());
                setViewYear(yesterday.getFullYear());
                setShowCalendar(false);
              }}
              className="py-1.5 text-xs font-semibold text-gray-400 hover:text-teal-300 hover:bg-white/10 rounded transition-all"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                onChange(today.toISOString().split('T')[0]);
                setViewMonth(today.getMonth());
                setViewYear(today.getFullYear());
                setShowCalendar(false);
              }}
              className="py-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 hover:bg-teal-500/20 rounded transition-all"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                onChange(tomorrow.toISOString().split('T')[0]);
                setViewMonth(tomorrow.getMonth());
                setViewYear(tomorrow.getFullYear());
                setShowCalendar(false);
              }}
              className="py-1.5 text-xs font-semibold text-gray-400 hover:text-teal-300 hover:bg-white/10 rounded transition-all"
            >
              Tomorrow
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default function AddTransactionModal({ isOpen, onClose, onSubmit, type = 'expense', mode = 'create', initialData = null }) {
  const [form, setForm] = useState({
    type: type,
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [categoryOpen, setcategoryOpen] = useState(false);
  const [paymentMethodOpen, setPaymentMethodOpen] = useState(false);
  const [addedTransactions, setAddedTransactions] = useState([]);
  const categoryRef = useRef(null);
  const paymentMethodRef = useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setcategoryOpen(false);
      }
      if (paymentMethodRef.current && !paymentMethodRef.current.contains(e.target)) {
        setPaymentMethodOpen(false);
      }
    };
    if (categoryOpen || paymentMethodOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [categoryOpen, paymentMethodOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Keyboard support: ESC to close modal, close dropdowns
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (categoryOpen) {
          setcategoryOpen(false);
        } else if (paymentMethodOpen) {
          setPaymentMethodOpen(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, categoryOpen, paymentMethodOpen, onClose]);

  // Sync incoming data when editing
  React.useEffect(() => {
    if (initialData) {
      setForm({
        type: initialData.type || 'expense',
        category: initialData.category || '',
        amount: initialData.amount?.toString() || '',
        description: initialData.description || '',
        date: initialData.transaction_date ? initialData.transaction_date.split('T')[0] : new Date().toISOString().split('T')[0],
        paymentMethod: initialData.payment_method || 'cash',
      });
    }
  }, [initialData]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setForm({
        type: type,
        category: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        paymentMethod: 'cash',
      });
      setErrors({});
      setAddedTransactions([]);
    }
  }, [isOpen, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'amount') {
      const sanitized = value.replace(/[^0-9.]/g, '');
      const parts = sanitized.split('.');
      if (parts.length > 2) return;
      if (parts[1] && parts[1].length > 2) return;
      setForm({ ...form, [name]: sanitized });
      if (errors.amount) setErrors({ ...errors, amount: '' });
      return;
    }

    if (name === 'description') {
      setForm({ ...form, [name]: value });

      const lowerDesc = value.toLowerCase();
      const categories = CATEGORIES[form.type];
      const matchedCategory = categories.find(cat => 
        lowerDesc.includes(cat.toLowerCase())
      );

      if (matchedCategory && !form.category) {
        setForm((prev) => ({ ...prev, category: matchedCategory }));
      }
      return;
    }

    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.category.trim()) {
      newErrors.category = 'Category is required.';
    }

    const amt = parseFloat(form.amount);
    if (!form.amount || amt <= 0 || isNaN(amt)) {
      newErrors.amount = 'Enter a valid amount.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // For edit mode, just submit directly
      if (mode === 'edit') {
        await onSubmit(form);
        onClose();
      } else {
        // For create mode, add to list instead of submitting immediately
        const newTransaction = {
          ...form,
          id: Date.now(),
        };
        setAddedTransactions([...addedTransactions, newTransaction]);

        // Clear form for next entry but keep the same type
        setForm({
          type: form.type,
          category: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
        });
        setErrors({});
      }
    } catch (error) {
      setErrors({ general: error.message || 'Failed to save transaction.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (addedTransactions.length === 0) return;

    setLoading(true);
    try {
      // Submit all transactions
      for (const transaction of addedTransactions) {
        const { id, ...transactionData } = transaction;
        await onSubmit(transactionData);
      }
      
      setAddedTransactions([]);
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'Failed to save transactions.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categories = CATEGORIES[form.type] || CATEGORIES.expense;

  // Dynamic theme colors based on transaction type
  const themeColors = {
    income: {
      gradient: 'from-emerald-500 to-teal-500',
      border: 'border-emerald-500/30',
      ring: 'focus:ring-emerald-500',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      shadow: 'shadow-emerald-500/20',
      hover: 'hover:bg-emerald-500/20',
    },
    expense: {
      gradient: 'from-rose-500 to-pink-500',
      border: 'border-rose-500/30',
      ring: 'focus:ring-rose-500',
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      shadow: 'shadow-rose-500/20',
      hover: 'hover:bg-rose-500/20',
    },
    debt: {
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-500/30',
      ring: 'focus:ring-blue-500',
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      shadow: 'shadow-blue-500/20',
      hover: 'hover:bg-blue-500/20',
    },
  };

  const theme = themeColors[form.type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-lg overflow-y-auto">
      <style>{`
        .dropdown-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .dropdown-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .dropdown-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #14b8a6, #06b6d4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #14b8a6, #06b6d4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0d9488, #0891b2);
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .transaction-item {
          animation: slideInLeft 0.3s ease-out;
        }
      `}</style>
      
      {/* Modal - NO SCROLLBAR ON MODAL */}
      <div className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-white/15 shadow-2xl flex flex-col my-auto" style={{ 
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        maxHeight: '95vh',
        overflow: 'hidden'
      }}>
        
        <div className="p-4 sm:p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 sm:top-6 right-4 sm:right-6 p-1 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white z-50"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header with Transaction Type Buttons */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient} mb-1 break-words`}>
                  {mode === 'edit' ? 'Update' : 'Add'} {form.type.charAt(0).toUpperCase() + form.type.slice(1)}
                </h2>
                <p className="text-gray-400 text-xs sm:text-sm">
                  {mode === 'edit' 
                    ? 'Update transaction details' 
                    : `Keep adding ${form.type}s - transactions appear below`}
                </p>
              </div>
            </div>
            {/* Transaction Type Buttons - Below heading */}
            <div className="flex gap-2 mt-3 sm:mt-4 flex-wrap">
              {['income', 'expense', 'debt'].map((t) => {
                const typeTheme = themeColors[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, category: '' })}
                    className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg font-bold transition-all duration-300 text-xs flex items-center gap-1 whitespace-nowrap ${
                      form.type === t
                        ? `bg-gradient-to-r ${typeTheme.gradient} text-white shadow-lg ${typeTheme.shadow}`
                        : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <span>{t === 'income' && '↗'}{t === 'expense' && '↙'}{t === 'debt' && '💳'}</span>
                    <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inline errors */}
          {errors.general && (
            <div className="mb-5 p-4 rounded-xl bg-red-500/15 border border-red-500/50 text-red-300 text-sm font-medium">
              {errors.general}
            </div>
          )}

          {/* Main Layout - Form Top, List Bottom */}
          <div className="flex flex-col gap-4">
            {/* Form Section */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Category and Amount - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Category with dynamic theming - COMPACT */}
                <div className="relative" ref={categoryRef}>
                <label className="block text-xs font-bold text-gray-300 mb-2 tracking-wider uppercase">Category</label>
                <button
                  type="button"
                  onClick={() => setcategoryOpen(!categoryOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      setcategoryOpen(true);
                    }
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 hover:bg-white/10 text-sm ${
                    errors.category
                      ? 'bg-red-500/10 border-2 border-red-500/50 text-white focus:ring-red-500/50'
                      : `bg-white/5 border ${theme.border} text-white ${theme.ring} focus:border-transparent`
                  }`}
                >
                  <span className="font-medium">{form.category || 'Select category'}</span>
                  <svg className={`w-4 h-4 ${theme.text} transition-transform duration-300 ${categoryOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                
                {/* Custom Dropdown Menu - STAYS INSIDE MODAL */}
                {categoryOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-slate-800 to-slate-700 border ${theme.border} rounded-lg shadow-2xl overflow-hidden z-[60]`}>
                    <div className="max-h-40 overflow-y-auto dropdown-scrollbar">
                      {CATEGORIES[form.type].map((cat, idx) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, category: cat });
                            setcategoryOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setForm({ ...form, category: cat });
                              setcategoryOpen(false);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setcategoryOpen(false);
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const next = e.target.nextElementSibling;
                              if (next) next.focus();
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prev = e.target.previousElementSibling;
                              if (prev) prev.focus();
                            }
                          }}
                          autoFocus={idx === 0}
                          className={`w-full px-3 py-2 text-left text-xs font-medium transition-all duration-200 border-b border-white/5 last:border-b-0 ${
                            form.category === cat
                              ? `${theme.bg} ${theme.text} ${theme.hover}`
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {errors.category && (
                  <p className="mt-1 text-xs text-red-300 font-medium">{errors.category}</p>
                )}
              </div>

              {/* Amount with dynamic theming - COMPACT */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2 tracking-wider uppercase">Amount (₹)</label>
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.text} font-bold text-base`}>₹</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 text-white placeholder-gray-600 focus:outline-none transition-all hover:bg-white/10 font-semibold text-sm ${
                      errors.amount
                        ? 'border-2 border-red-500/60 focus:ring-2 focus:ring-red-500/50'
                        : `border ${theme.border} focus:ring-2 ${theme.ring} focus:border-transparent`
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-xs text-red-300 font-medium">{errors.amount}</p>
                )}
                </div>
              </div>

              {/* Date and Payment Method - Side by Side */}
              <div className="grid grid-cols-2 gap-3">
                {/* Date with shortcuts - COMPACT */}
                <div>
                <label className="block text-xs font-bold text-gray-300 mb-2 tracking-wider uppercase">Date</label>
                <CustomDatePicker value={form.date} onChange={(date) => setForm({ ...form, date })} />
              </div>

              {/* Payment Method - Custom Dropdown - COMPACT */}
              <div className="relative" ref={paymentMethodRef}>
                <label className="block text-xs font-bold text-gray-300 mb-2 tracking-wider uppercase">Payment Method</label>
                <button
                  type="button"
                  onClick={() => setPaymentMethodOpen(!paymentMethodOpen)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      setPaymentMethodOpen(true);
                    }
                  }}
                  className={`w-full px-3 py-1.5 rounded-lg text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 hover:bg-white/10 bg-white/5 border ${theme.border} text-white ${theme.ring} focus:border-transparent text-sm`}
                >
                  <span className="font-medium text-sm">
                    {PAYMENT_METHODS.find(m => m.value === form.paymentMethod)?.label || 'Payment method'}
                  </span>
                  <svg className={`w-4 h-4 ${theme.text} transition-transform duration-300 ${paymentMethodOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                
                {/* Custom Dropdown Menu - OPENS UPWARD */}
                {paymentMethodOpen && (
                  <div className={`absolute top-full left-0 right-0 mb-2 bg-gradient-to-br from-slate-800 to-slate-700 border ${theme.border} rounded-lg shadow-2xl overflow-hidden z-[60]`}>
                    <div className="max-h-32 overflow-y-auto dropdown-scrollbar">
                      {PAYMENT_METHODS.map((method, idx) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, paymentMethod: method.value });
                            setPaymentMethodOpen(false);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setForm({ ...form, paymentMethod: method.value });
                              setPaymentMethodOpen(false);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              setPaymentMethodOpen(false);
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              const prev = e.target.previousElementSibling;
                              if (prev) prev.focus();
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              const next = e.target.nextElementSibling;
                              if (next) next.focus();
                            }
                          }}
                          autoFocus={idx === 0}
                          className={`w-full px-3 py-2 text-left text-xs font-medium transition-all duration-200 border-b border-white/5 last:border-b-0 ${
                            form.paymentMethod === method.value
                              ? `${theme.bg} ${theme.text} ${theme.hover}`
                              : 'text-gray-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              </div>

              {/* Notes/Description Field - Full Width */}
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2 tracking-wider uppercase">
                  Description <span className="text-gray-500 font-normal text-[0.7rem]"></span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="e.g., Swiggy, Uber, Rent..."
                  rows={1}
                  maxLength={100}
                  className={`w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent resize-none transition-all hover:bg-white/10 text-sm`}
                />
                <p className="text-gray-400 text-xs mt-1">
                  {form.description.length}/100 characters
                </p>
              </div>

              {/* Buttons - COMPACT */}
              <div className="flex gap-2 pt-3 flex-wrap">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2 px-4 rounded-lg bg-white/5 text-gray-300 font-bold hover:bg-white/10 border border-white/10 transition-all duration-300 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-2 px-4 rounded-lg bg-gradient-to-r ${theme.gradient} text-white font-bold hover:shadow-xl ${theme.shadow} hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-sm`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-1">
                      <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                      Saving...
                    </span>
                  ) : (
                    'Save Transaction'
                  )}
                </button>
                {mode !== 'edit' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        type: form.type,
                        category: '',
                        amount: '',
                        description: '',
                        date: new Date().toISOString().split('T')[0],
                        paymentMethod: 'cash',
                      });
                      setErrors({});
                    }}
                    disabled={loading}
                    className="py-2 px-4 rounded-lg bg-white/5 text-gray-300 font-bold hover:bg-white/10 border border-white/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Clear
                  </button>
                )}
                {mode !== 'edit' && addedTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    disabled={loading}
                    className="py-2 px-6 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold 
                             hover:shadow-xl shadow-teal-500/20 hover:scale-105 transition-all duration-300 text-sm 
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    {loading && <span className="btn-loading-spinner"></span>}
                    ✓ Save All ({addedTransactions.length})
                  </button>
                )}
              </div>
            </form>

            {/* Transactions List - Bottom Half - ONLY SCROLLABLE SECTION */}
            {mode !== 'edit' && addedTransactions.length > 0 && (
              <div className="w-full">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4" style={{ 
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  maxHeight: '250px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <h3 className="text-xs font-bold text-gray-300 mb-3 tracking-wider uppercase flex items-center justify-between flex-shrink-0">
                    <span>📋 Added Transactions</span>
                    {addedTransactions.length > 0 && (
                      <span className="text-teal-400 text-xs font-semibold bg-teal-500/20 px-2 py-0.5 rounded-full">
                        {addedTransactions.length}
                      </span>
                    )}
                  </h3>
                  
                  <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                    {addedTransactions.map((trans, idx) => {
                        const typeTheme = themeColors[trans.type];
                        return (
                          <div key={trans.id} className="transaction-item bg-white/5 border border-white/10 rounded-lg p-2.5 hover:bg-white/10 transition-all duration-200 group">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">{trans.category}</p>
                                <p className="text-xs text-gray-600 truncate">{trans.description || '—'}</p>
                              </div>
                              <button
                                onClick={() => setAddedTransactions(addedTransactions.filter((_, i) => i !== idx))}
                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className={`font-bold ${typeTheme.text}`}>{trans.type.charAt(0).toUpperCase() + trans.type.slice(1)}</span>
                              <span className={`font-bold ${typeTheme.text}`}>₹{trans.amount.toLocaleString('en-IN')}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              {new Date(trans.date).toLocaleDateString('en-IN', { 
                                day: 'numeric', 
                                month: 'short',
                                year: '2-digit'
                              })} • {trans.paymentMethod}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
