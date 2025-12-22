import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { getIncome, addIncome, updateIncome, deleteIncome } from '../api/income';
import IncomeCard from '../components/IncomeCard';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import MonthSelector from '../components/MonthSelector';

export default function IncomeTracking() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useFinance();
  const [incomeList, setIncomeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editIncome, setEditIncome] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });

  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    description: '',
    received_on: new Date().toISOString().split('T')[0],
  });

  const validateField = (field, value) => {
    switch (field) {
      case 'source':
        return value.trim() ? '' : 'Income source is required';
      case 'amount': {
        const amountValue = parseFloat(value);
        if (!value) return 'Amount is required';
        if (Number.isNaN(amountValue) || amountValue <= 0) return 'Enter a valid amount';
        return '';
      }
      case 'received_on':
        return value ? '' : 'Received date is required';
      default:
        return '';
    }
  };

  const touchAll = () => {
    setTouched({ source: true, amount: true, received_on: true });
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
    `w-full px-3 py-2 bg-slate-800 border rounded-lg text-white placeholder-slate-500 focus:outline-none transition-colors duration-200 ${
      errors[field]
        ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/60'
        : 'border-slate-700 focus:border-emerald-500'
    }`;

  useEffect(() => {
    fetchIncome();
  }, [currentMonth, refreshTrigger]);

  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const fetchIncome = async () => {
    try {
      setLoading(true);
      const res = await getIncome({ month_year: currentMonth });
      setIncomeList(res.data.income || []);
    } catch (err) {
      setToast({ message: 'Failed to load income', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    touchAll();

    const newErrors = {
      source: validateField('source', formData.source),
      amount: validateField('amount', formData.amount),
      received_on: validateField('received_on', formData.received_on),
    };
    const hasErrors = Object.values(newErrors).some(Boolean);
    setErrors(newErrors);
    if (hasErrors) return;

    try {
      const payload = { ...formData, month_year: currentMonth };
      
      if (editIncome) {
        await updateIncome(editIncome.id, payload);
        setToast({ message: 'Income updated successfully', type: 'success' });
      } else {
        await addIncome(payload);
        setToast({ message: 'Income added successfully', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      setErrors({});
      setTouched({});
      triggerRefresh();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save income', type: 'error' });
    }
  };

  const handleEdit = (income) => {
    setEditIncome(income);
    setFormData({
      source: income.source,
      amount: income.amount,
      description: income.description || '',
      received_on: income.received_on,
    });
    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  const handleDelete = (income) => {
    setConfirm({
      open: true,
      title: 'Delete Income',
      message: `Delete income from "${income.source}"?`,
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await deleteIncome(income.id);
          setConfirm({ open: false });
          setToast({ message: 'Income deleted successfully', type: 'success' });
          triggerRefresh();
        } catch (err) {
          setConfirm({ open: false });
          setToast({ message: 'Failed to delete income', type: 'error' });
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      description: '',
      received_on: new Date().toISOString().split('T')[0],
    });
    setEditIncome(null);
    setErrors({});
    setTouched({});
  };

  const totalIncome = incomeList.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Income Tracking</h1>
            <p className="text-slate-400">Track your income sources</p>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector />
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                       hover:bg-emerald-500/20 transition-all duration-200 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Income
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-emerald-400/70 font-medium mb-1">Total Income for {currentMonth}</p>
              <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10">
              <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-sm text-emerald-400/60 mt-3">{incomeList.length} income source(s)</p>
        </div>

        {/* Income List */}
        {loading ? (
          <div className="grid gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 animate-pulse">
                <div className="h-5 bg-slate-700/50 rounded w-32 mb-2"></div>
                <div className="h-4 bg-slate-700/50 rounded w-48"></div>
              </div>
            ))}
          </div>
        ) : incomeList.length > 0 ? (
          <div className="grid gap-3">
            {incomeList.map((income) => (
              <IncomeCard key={income.id} income={income} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No income for this month</h3>
            <p className="text-slate-400 mb-6">Start by adding your income sources</p>
            <button
              onClick={() => { resetForm(); setModalOpen(true); }}
              className="px-6 py-3 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-medium"
            >
              Add Your First Income
            </button>
          </div>
        )}
      </div>

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
      />

      {/* Add/Edit Modal */}
      {modalOpen && (
        <Modal open={modalOpen} contentClassName="p-6 max-w-2xl top-[22%]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-white">{editIncome ? 'Edit Income' : 'Add New Income'}</h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Income Source *</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => handleFieldChange('source', e.target.value)}
                  onBlur={() => handleBlur('source')}
                  className={getInputClasses('source')}
                  placeholder="e.g., Salary, Freelance, Business"
                />
                {errors.source && <p className="mt-1 text-xs text-red-400">{errors.source}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Amount (₹) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleFieldChange('amount', e.target.value)}
                    onBlur={() => handleBlur('amount')}
                    className={getInputClasses('amount')}
                    placeholder="50000"
                  />
                  {errors.amount && <p className="mt-1 text-xs text-red-400">{errors.amount}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Received On *</label>
                  <DatePicker
                    value={formData.received_on}
                    onChange={(date) => {
                      handleFieldChange('received_on', date);
                      setTouched((prev) => ({ ...prev, received_on: true }));
                      setErrors((prev) => ({ ...prev, received_on: validateField('received_on', date) }));
                    }}
                    placeholder="Select date received"
                  />
                  {errors.received_on && <p className="mt-1 text-xs text-red-400">{errors.received_on}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Additional details..." />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700 font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 font-medium transition-all">
                  {editIncome ? 'Update Income' : 'Add Income'}
                </button>
              </div>
            </form>
          </Modal>
      )}
    </div>
  );
}
