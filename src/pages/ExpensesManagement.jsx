import React, { useEffect, useRef, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  getMonthlyExpenses,
  addMonthlyExpense,
  updateMonthlyExpense,
  deleteMonthlyExpense,
  markExpensePaid,
  getCategories,
  addRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  generateMonthlyExpenses,
  addCategory,
} from '../api/expenses';
import { markEMIPaid } from '../api/loans';
import MonthSelector from '../components/MonthSelector';
import DatePicker from '../components/DatePicker';
import Modal from '../components/Modal';
import ExpenseCard from '../components/ExpenseCard';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import Select from '../components/Select';

export default function ExpensesManagement() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useFinance();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showEmiOnly, setShowEmiOnly] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const categoryRef = useRef(null);
  const prevMonthRef = useRef(currentMonth);

  // Local suppression: track months where user deleted a recurring-generated entry
  const getSuppressedMonths = () => {
    try {
      const raw = localStorage.getItem('recurringSuppressedMonths');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };
  const setSuppressedMonths = (obj) => {
    try {
      localStorage.setItem('recurringSuppressedMonths', JSON.stringify(obj));
    } catch {}
  };
  const addMonthSuppression = (monthYear) => {
    const map = getSuppressedMonths();
    map[monthYear] = true;
    setSuppressedMonths(map);
  };
  const isMonthSuppressed = (monthYear) => {
    const map = getSuppressedMonths();
    return !!map[monthYear];
  };

  // Confirm dialog state
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });
  const [deleteRecurringAlsoDeleteMonth, setDeleteRecurringAlsoDeleteMonth] = useState(false);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: '',
    status: 'pending',
    payment_method: 'cash',
    is_recurring: false,
    recurring_end_date: '',
    recurring_due_day: '1',
  });

  const validateField = (field, value) => {
    switch (field) {
      case 'description':
        if (!value || !value.trim()) return 'Description is required';
        if (value.length > 500) return 'Description must be 500 characters or less';
        return '';
      case 'category':
        if (formData.is_recurring && (!value || !value.trim())) return 'Category is required for recurring expenses';
        if (value && value.length > 100) return 'Category must be 100 characters or less';
        return '';
      case 'amount': {
        const amt = parseFloat(value);
        if (!value) return 'Amount is required';
        if (Number.isNaN(amt) || amt <= 0) return 'Amount must be greater than 0';
        return '';
      }
      case 'due_date':
        return value ? '' : 'Due date is required';
      case 'recurring_due_day': {
        if (formData.is_recurring) {
          const day = parseInt(value);
          if (!value || Number.isNaN(day)) return 'Due day is required';
          if (day < 1 || day > 31) return 'Due day must be between 1 and 31';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const touchAllRequired = () => {
    const fields = { description: true, amount: true, due_date: true };
    if (formData.is_recurring) {
      fields.category = true;
      fields.recurring_due_day = true;
    }
    setTouched((prev) => ({ ...prev, ...fields }));
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field]) }));
  };

  const getInputClasses = (field) =>
    `w-full px-3 py-2 rounded-lg bg-slate-800 border text-white placeholder-slate-500 focus:outline-none transition-colors duration-200 ${
      errors[field]
        ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/60'
        : 'border-slate-700 focus:border-teal-500'
    }`;

  // Single effect: decides whether month changed or it's just a refresh
  useEffect(() => {
    const isMonthChange = prevMonthRef.current !== currentMonth;
    prevMonthRef.current = currentMonth;

    if (isMonthChange) {
      fetchCategories();
    }
    fetchExpenses(isMonthChange);
  }, [currentMonth, refreshTrigger]);

  useEffect(() => {
    document.body.style.overflow = showModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  const fetchCategories = async () => {
    try {
      const res = await getCategories({ type: 'expense' });
      const expenseCategories = res.data?.categories || res.data || [];
      setCategories(expenseCategories);
    } catch (err) {
      console.error('Failed to load categories:', err);
      // Fallback to empty array, categories are optional
    }
  };

  const fetchExpenses = async (shouldGenerate) => {
    try {
      setLoading(true);
      // First fetch existing monthly expenses for the selected month
      const initialRes = await getMonthlyExpenses({ month_year: currentMonth });
      const existing = initialRes.data?.expenses || initialRes.data || [];

      if (!shouldGenerate || isMonthSuppressed(currentMonth) || (Array.isArray(existing) && existing.length > 0)) {
        setExpenses(existing);
      } else {
        // Only generate if none exist for this month
        try {
          await generateMonthlyExpenses(currentMonth);
          const generatedRes = await getMonthlyExpenses({ month_year: currentMonth });
          setExpenses(generatedRes.data?.expenses || generatedRes.data || []);
        } catch (genErr) {
          // If generation fails, keep existing (empty) but surface toast once
          console.warn('Monthly generation failed or already exists:', genErr?.response?.data || genErr?.message);
          setExpenses(existing);
        }
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setToast({ message: 'Failed to load expenses', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setToast({ message: 'Enter a category name', type: 'error' });
      return;
    }

    const exists = categories.some(
      (c) => (c?.name || '').toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      setToast({ message: 'Category already exists', type: 'error' });
      return;
    }

    try {
      const res = await addCategory({ name, type: 'expense' });
      const created = res?.data?.category || res?.data || { id: Date.now(), name, type: 'expense' };
      setCategories((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, category: created.name }));
      setNewCategoryName('');
      setAddingCategory(false);
      setToast({ message: 'Category added', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to add category', type: 'error' });
    }
  };

  const handleOpenModal = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount,
        due_date: expense.due_date,
        category: expense.category || '',
        status: expense.status,
        payment_method: expense.payment_method || 'cash',
        is_recurring: !!expense.recurring_expense_id,
        recurring_end_date: '',
        recurring_due_day: expense.due_date ? new Date(expense.due_date).getDate().toString() : '1',
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        due_date: '',
        category: '',
        status: 'pending',
        payment_method: 'cash',
        is_recurring: false,
        recurring_end_date: '',
        recurring_due_day: '1',
      });
    }
    setErrors({});
    setTouched({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: '',
      due_date: '',
      category: '',
      status: 'pending',
      payment_method: 'cash',
      is_recurring: false,
      recurring_end_date: '',
      recurring_due_day: '1',
    });
    setErrors({});
    setTouched({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    touchAllRequired();

    const newErrors = {
      description: validateField('description', formData.description),
      amount: validateField('amount', formData.amount),
      due_date: validateField('due_date', formData.due_date),
    };
    
    // Add recurring-specific validations
    if (formData.is_recurring) {
      newErrors.category = validateField('category', formData.category);
      newErrors.recurring_due_day = validateField('recurring_due_day', formData.recurring_due_day);
    }
    
    const hasErrors = Object.values(newErrors).some(Boolean);
    setErrors(newErrors);
    if (hasErrors) return;

    setSubmitting(true);
    try {
      // Extract month_year from due_date
      const month_year = formData.due_date.substring(0, 7); // YYYY-MM format
      
      // Clean payload - only include fields the API expects
      const payload = {
        description: formData.description,
        amount: formData.amount,
        due_date: formData.due_date,
        category: formData.category,
        status: formData.status,
        month_year,
      };

      const shouldMarkPaid = editingExpense && formData.status === 'paid' && editingExpense.status !== 'paid';

      if (editingExpense) {
        // If marking as recurring, create/update template
        if (formData.is_recurring) {
          // Validate category is present for recurring expenses
          if (!formData.category || !formData.category.trim()) {
            setToast({ message: 'Category is required for recurring expenses', type: 'error' });
            setSubmitting(false);
            return;
          }
          
          // Extract month/year and send as ISO string without timezone offset
          // This prevents backend from misinterpreting the date
          const [year, month] = formData.due_date.split('-');
          const startMonth = `${year}-${month}-01`;
          const recurringPayload = {
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            payment_method: formData.payment_method,
            due_day: parseInt(formData.recurring_due_day),
            start_month: startMonth,
          };
          // Add optional end_month if provided
          if (formData.recurring_end_date) {
            const [endYear, endMonth] = formData.recurring_end_date.split('-');
            const endMonth_value = `${endYear}-${endMonth}-01`;
            recurringPayload.end_month = endMonth_value;
          }
          if (editingExpense.recurring_expense_id) {
            await updateRecurringExpense(editingExpense.recurring_expense_id, recurringPayload);
          } else {
            await addRecurringExpense(recurringPayload);
          }
        } else if (editingExpense.recurring_expense_id) {
          // If unchecking recurring, delete the template
          await deleteRecurringExpense(editingExpense.recurring_expense_id);
        }
        
        await updateMonthlyExpense(editingExpense.id, payload);
        if (shouldMarkPaid) {
          await markExpensePaid(editingExpense.id);
        }
        setToast({ message: 'Expense updated successfully', type: 'success' });
      } else {
        // If marking as recurring, create template first then generate monthly expense
        if (formData.is_recurring) {
          // Validate category is present for recurring expenses
          if (!formData.category || !formData.category.trim()) {
            setToast({ message: 'Category is required for recurring expenses', type: 'error' });
            setSubmitting(false);
            return;
          }
          
          // Extract month/year and send as ISO string without timezone offset
          // This prevents backend from misinterpreting the date
          const [year, month] = formData.due_date.split('-');
          const startMonth = `${year}-${month}-01`;
          const recurringPayload = {
            category: formData.category,
            amount: parseFloat(formData.amount),
            description: formData.description || null,
            payment_method: formData.payment_method,
            due_day: parseInt(formData.recurring_due_day),
            start_month: startMonth,
          };
          // Add optional end_month if provided
          if (formData.recurring_end_date) {
            const [endYear, endMonth] = formData.recurring_end_date.split('-');
            const endMonth_value = `${endYear}-${endMonth}-01`;
            recurringPayload.end_month = endMonth_value;
          }
          await addRecurringExpense(recurringPayload);
          // Generate monthly expense from the recurring template
          await generateMonthlyExpenses(month_year);
        } else {
          // Non-recurring: add monthly expense directly
          await addMonthlyExpense(payload);
        }
        
        setToast({ message: 'Expense added successfully', type: 'success' });
      }
      handleCloseModal();
      setErrors({});
      setTouched({});
      triggerRefresh();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save expense',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id, recurringExpenseId) => {
    setConfirm({
      open: true,
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense? This action cannot be undone.',
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await deleteMonthlyExpense(id);
          // If this was a recurring-generated month and user deleted it, suppress generation for this month
          if (recurringExpenseId) {
            addMonthSuppression(currentMonth);
          }
          setConfirm({ open: false });
          setToast({ message: 'Expense deleted successfully', type: 'success' });
          triggerRefresh();
        } catch (err) {
          setConfirm({ open: false });
          setToast({ message: 'Failed to delete expense', type: 'error' });
        }
      },
    });
  };

  const handleDeleteRecurring = (recurringExpenseId) => {
    if (!recurringExpenseId) return;
    setDeleteRecurringAlsoDeleteMonth(false);
    setConfirm({
      open: true,
      title: 'Delete Recurring Template',
      message: 'This will stop future generations. Existing monthly entries remain. Continue?',
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await deleteRecurringExpense(recurringExpenseId);
          // Optionally delete current month's generated entry(s)
          if (deleteRecurringAlsoDeleteMonth) {
            const toDelete = expenses.filter(
              (e) => e.recurring_expense_id === recurringExpenseId && e.month_year === currentMonth
            );
            for (const e of toDelete) {
              try { await deleteMonthlyExpense(e.id); } catch {}
            }
            addMonthSuppression(currentMonth);
          }
          setConfirm({ open: false });
          setToast({ message: 'Recurring template deleted', type: 'success' });
          triggerRefresh();
        } catch (err) {
          setConfirm({ open: false });
          setToast({ message: 'Failed to delete recurring template', type: 'error' });
        }
      },
    });
  };

  const handleMarkPaid = async (expense) => {
    try {
      if (expense.is_emi && expense.loan_id && expense.loan_payment_id) {
        await markEMIPaid(expense.loan_id, expense.loan_payment_id);
      } else {
        await markExpensePaid(expense.id);
      }
      setToast({ message: 'Expense marked as paid', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: 'Failed to mark expense as paid', type: 'error' });
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  // Filter expenses by month_year field (not due_date which may have timezone issues)
  const monthExpenses = expenses.filter((e) => {
    return e?.month_year === currentMonth;
  });

  // Filter expenses (by status) within the selected month
  const filteredExpenses = monthExpenses.filter((exp) => {
    if (showEmiOnly && !exp.is_emi) return false;
    if (filterStatus === 'all') return true;
    return exp.status === filterStatus;
  });

  const pendingExpenses = monthExpenses.filter((e) => e.status === 'pending');
  const paidExpenses = monthExpenses.filter((e) => e.status === 'paid');
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalPending = pendingExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-slate-700/50 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-slate-700/50 rounded w-64 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-700/50 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Expenses Management</h1>
            <p className="text-slate-400">Add and track your monthly expenses and bills</p>
          </div>
          <MonthSelector />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Expenses */}
          <div className="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold text-red-400 mt-2">{formatCurrency(totalExpenses)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Pending Amount</p>
                <p className="text-2xl font-bold text-amber-400 mt-2">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Status Count */}
          <div className="p-6 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Status</p>
                <p className="text-xl font-bold text-teal-400 mt-2">
                  {paidExpenses.length} Paid / {pendingExpenses.length} Pending
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 
                     hover:bg-teal-500/20 hover:border-teal-500/40 transition-all duration-200 font-medium 
                     flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            {['all', 'pending', 'paid'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  filterStatus === status
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/10 hover:border-white/20'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showEmiOnly}
              onChange={(e) => setShowEmiOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-2 focus:ring-teal-500/50 focus:ring-offset-0"
            />
            Show EMIs only
          </label>
        </div>

        {/* Expenses List */}
        <div className="space-y-3">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-slate-400 mb-6">No expenses found for {filterStatus !== 'all' ? filterStatus : 'this month'}</p>
              <button
                onClick={() => handleOpenModal()}
                className="px-6 py-3 rounded-lg bg-teal-500 text-white font-medium hover:bg-teal-600 transition-all"
              >
                Add Your First Expense
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold">{expense.description}</h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-400">
                            {expense.category && <span>Category: {expense.category}</span>}
                            {expense.due_date && <span>Due: {formatDate(expense.due_date)}</span>}
                          </div>
                          {(() => {
                            const isDebt = Boolean(
                              expense.is_debt_payment ||
                              expense.debt_id ||
                              (expense.category && expense.category.toLowerCase().includes('debt')) ||
                              (expense.description && expense.description.toLowerCase().includes('debt payment'))
                            );
                            return isDebt ? (
                              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-amber-200">
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 font-semibold">Debt</span>
                                {expense.debt_name && <span className="text-amber-100">{expense.debt_name}</span>}
                              </div>
                            ) : null;
                          })()}
                          {expense.is_emi && (
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-teal-200">
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30 font-semibold">EMI</span>
                              {expense.loan_name && <span className="text-teal-100">{expense.loan_name}</span>}
                              {expense.payment_number && <span className="text-teal-100">Payment #{expense.payment_number}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-400">{formatCurrency(expense.amount)}</p>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <StatusBadge status={expense.status} />
                          {expense.is_emi && (
                            <span className="px-2 py-1 rounded text-xs bg-teal-500/15 text-teal-200 border border-teal-500/30 font-medium">
                              EMI
                            </span>
                          )}
                          {(() => {
                            const isDebt = Boolean(
                              expense.is_debt_payment ||
                              expense.debt_id ||
                              (expense.category && expense.category.toLowerCase().includes('debt')) ||
                              (expense.description && expense.description.toLowerCase().includes('debt payment'))
                            );
                            return isDebt ? (
                              <span className="px-2 py-1 rounded text-xs bg-amber-500/15 text-amber-200 border border-amber-500/30 font-medium">
                                Debt
                              </span>
                            ) : null;
                          })()}
                          {expense.recurring_expense_id && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                              ♻️ Recurring
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(expense)}
                            className="px-3 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                                     hover:bg-emerald-500/20 transition-all"
                            title="Mark as paid"
                          >
                            {expense.is_emi ? 'Mark EMI Paid' : 'Mark Paid'}
                          </button>
                        )}

                        {expense.recurring_expense_id && (
                          <button
                            onClick={() => handleDeleteRecurring(expense.recurring_expense_id)}
                            className="px-3 py-1 rounded text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 
                                     hover:bg-purple-500/20 transition-all"
                            title="Delete recurring template"
                          >
                            Delete Recurring
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenModal(expense)}
                          className="px-3 py-1 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 
                                   hover:bg-blue-500/20 transition-all"
                          title="Edit"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(expense.id, expense.recurring_expense_id)}
                          className="px-3 py-1 rounded text-xs bg-red-500/10 text-red-400 border border-red-500/20 
                                   hover:bg-red-500/20 transition-all"
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal} contentClassName="p-6 max-w-2xl top-[15%]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white hover:bg-slate-800 transition-all p-2 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="e.g., Grocery shopping, Electricity bill"
                  className={getInputClasses('description')}
                />
                {errors.description && <p className="mt-1 text-xs text-red-400">{errors.description}</p>}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleFieldChange('amount', e.target.value)}
                  onBlur={() => handleBlur('amount')}
                  placeholder="0.00"
                  step="0.01"
                  className={getInputClasses('amount')}
                />
                {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount}</p>}
              </div>

              {/* Category */}
              <div ref={categoryRef} className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Category
                </label>

                <Select
                  value={formData.category || ''}
                  onChange={(val) => setFormData((prev) => ({ ...prev, category: val || '' }))}
                  options={[{ value: '', label: 'Select a category' }, ...categories.map((c) => ({ value: c.name, label: c.name }))]}
                  placeholder="Select a category"
                />

                {/* Add New Category Toggle */}
                {!addingCategory ? (
                  <button
                    type="button"
                    onClick={() => setAddingCategory(true)}
                    className="mt-2 text-xs text-teal-400 hover:text-teal-300"
                  >
                    + Add new category
                  </button>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g., Rent"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                               placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      className="px-3 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 transition-all"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddingCategory(false); setNewCategoryName(''); }}
                      className="px-3 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-all border border-slate-700/50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Due Date *
                </label>
                <DatePicker
                  value={formData.due_date}
                  onChange={(date) => {
                    handleFieldChange('due_date', date);
                    setTouched((prev) => ({ ...prev, due_date: true }));
                    setErrors((prev) => ({ ...prev, due_date: validateField('due_date', date) }));
                  }}
                  placeholder="Select due date"
                />
                {errors.due_date && <p className="mt-1 text-xs text-red-400">{errors.due_date}</p>}
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Payment Method
                </label>
                <Select
                  value={formData.payment_method}
                  onChange={(val) => setFormData({ ...formData, payment_method: val })}
                  options={[
                    { value: 'cash', label: '💵 Cash' },
                    { value: 'card', label: '💳 Card' },
                    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
                    { value: 'upi', label: '📱 UPI' },
                    { value: 'other', label: '📌 Other' },
                  ]}
                  placeholder="Select payment method"
                />
              </div>

              {/* Recurring Checkbox */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Recurring
                </label>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800 border border-slate-700 focus-within:border-teal-500 transition-colors">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={formData.is_recurring}
                    onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                    className="w-3 h-3 rounded accent-teal-500 cursor-pointer"
                  />
                  <label htmlFor="is_recurring" className="text-sm font-medium text-slate-300 cursor-pointer">
                    Mark as Recurring Expense
                  </label>
                </div>
              </div>

              {/* Recurring Fields (conditional) */}
              {formData.is_recurring && (
                <>
                  {/* Due Day */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Due Day of Month *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurring_due_day}
                      onChange={(e) => handleFieldChange('recurring_due_day', e.target.value)}
                      onBlur={() => handleBlur('recurring_due_day')}
                      placeholder="1-31"
                      className={getInputClasses('recurring_due_day')}
                    />
                    {errors.recurring_due_day && <p className="mt-1 text-xs text-red-400">{errors.recurring_due_day}</p>}
                    <p className="text-xs text-slate-400 mt-1">
                      Day of the month when this expense is due (e.g., 1 for 1st, 15 for 15th)
                    </p>
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Recurrance End Date (Optional)
                    </label>
                    <DatePicker
                      value={formData.recurring_end_date}
                      onChange={(date) => {
                        handleFieldChange('recurring_end_date', date);
                        setTouched((prev) => ({ ...prev, recurring_end_date: true }));
                        setErrors((prev) => ({
                          ...prev,
                          recurring_end_date: validateField('recurring_end_date', date),
                        }));
                      }}
                      placeholder="Select end date"
                    />
                    {errors.recurring_end_date && (
                      <p className="mt-1 text-xs text-red-400">
                        {errors.recurring_end_date}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      When this recurring expense should stop. Leave empty to continue indefinitely.
                    </p>
                  </div>
                </>
              )}

              {/* Status (only on edit) */}
              {editingExpense && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <Select
                    value={formData.status}
                    onChange={(val) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'paid', label: 'Paid' },
                    ]}
                    placeholder="Select status"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="col-span-full flex justify-end gap-3 pt-4 mt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 
                           transition-all font-medium border border-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-white transition-all font-medium ${
                    submitting
                      ? 'bg-teal-500/60 cursor-not-allowed'
                      : 'bg-teal-500 hover:bg-teal-600'
                  }`}
                >
                  {submitting ? (editingExpense ? 'Updating...' : 'Adding...') : `${editingExpense ? 'Update' : 'Add'} Expense`}
                </button>
              </div>
            </form>
          </Modal>
      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        loading={confirm.loading}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      >
        {confirm.title === 'Delete Recurring Template' && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={deleteRecurringAlsoDeleteMonth}
              onChange={(e) => setDeleteRecurringAlsoDeleteMonth(e.target.checked)}
              className="w-4 h-4 rounded accent-teal-500"
            />
            Also delete this month's generated entry
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
}
