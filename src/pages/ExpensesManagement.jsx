import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import {
  getMonthlyExpenses,
  addMonthlyExpense,
  updateMonthlyExpense,
  deleteMonthlyExpense,
  markExpensePaid,
} from '../api/expenses';
import MonthSelector from '../components/MonthSelector';
import DatePicker from '../components/DatePicker';
import ExpenseCard from '../components/ExpenseCard';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';

export default function ExpensesManagement() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useFinance();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    due_date: '',
    category: '',
    status: 'pending',
  });

  useEffect(() => {
    fetchExpenses();
  }, [currentMonth, refreshTrigger]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await getMonthlyExpenses({ month_year: currentMonth });
      setExpenses(res.data.expenses || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setToast({ message: 'Failed to load expenses', type: 'error' });
    } finally {
      setLoading(false);
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
      });
    } else {
      setEditingExpense(null);
      setFormData({
        description: '',
        amount: '',
        due_date: '',
        category: '',
        status: 'pending',
      });
    }
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
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || !formData.due_date) {
      setToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    try {
      if (editingExpense) {
        await updateMonthlyExpense(editingExpense.id, formData);
        setToast({ message: 'Expense updated successfully', type: 'success' });
      } else {
        await addMonthlyExpense({
          ...formData,
          month_year: currentMonth,
        });
        setToast({ message: 'Expense added successfully', type: 'success' });
      }
      handleCloseModal();
      triggerRefresh();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to save expense',
        type: 'error',
      });
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this expense?');
    if (!confirmed) return;

    try {
      await deleteMonthlyExpense(id);
      setToast({ message: 'Expense deleted successfully', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: 'Failed to delete expense', type: 'error' });
    }
  };

  const handleMarkPaid = async (expense) => {
    try {
      await markExpensePaid(expense.id);
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

  // Filter expenses
  const filteredExpenses = expenses.filter((exp) => {
    if (filterStatus === 'all') return true;
    return exp.status === filterStatus;
  });

  const pendingExpenses = expenses.filter((e) => e.status === 'pending');
  const paidExpenses = expenses.filter((e) => e.status === 'paid');
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPending = pendingExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

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
                            <span>•</span>
                            <span>Due: {formatDate(expense.due_date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-red-400">{formatCurrency(expense.amount)}</p>
                        <StatusBadge status={expense.status} />
                      </div>

                      <div className="flex items-center gap-2">
                        {expense.status === 'pending' && (
                          <button
                            onClick={() => handleMarkPaid(expense)}
                            className="px-3 py-1 rounded text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                                     hover:bg-emerald-500/20 transition-all"
                            title="Mark as paid"
                          >
                            Mark Paid
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
                          onClick={() => handleDelete(expense.id)}
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
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-lg">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Grocery shopping, Electricity bill"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                           placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                           placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                           focus:outline-none focus:border-teal-500 transition-colors"
                >
                  <option value="">Select a category</option>
                  <option value="Food">Food</option>
                  <option value="Transport">Transport</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Education">Education</option>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Due Date *
                </label>
                <DatePicker
                  value={formData.due_date}
                  onChange={(date) => setFormData({ ...formData, due_date: date })}
                  placeholder="Select due date"
                />
              </div>

              {/* Status (only on edit) */}
              {editingExpense && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                             focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 
                           transition-all font-medium border border-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 
                           transition-all font-medium"
                >
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
