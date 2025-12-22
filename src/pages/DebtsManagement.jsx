import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { useFinance } from '../context/FinanceContext';
import { getDebts, addDebt, updateDebt, deleteDebt, payDebt } from '../api/debts';
import { addMonthlyExpense } from '../api/expenses';
import DebtCard from '../components/DebtCard';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

export default function DebtsManagement() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useFinance();
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [editDebt, setEditDebt] = useState(null);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [payErrors, setPayErrors] = useState({});
  const [payTouched, setPayTouched] = useState({});
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false, variant: 'danger' });

  const [formData, setFormData] = useState({
    debt_name: '',
    total_amount: '',
    creditor: '',
    due_date: '',
    notes: '',
  });

  const validateField = (field, value) => {
    switch (field) {
      case 'debt_name':
        return value.trim() ? '' : 'Debt name is required';
      case 'total_amount': {
        const amt = parseFloat(value);
        if (!value) return 'Total amount is required';
        if (Number.isNaN(amt) || amt <= 0) return 'Enter a valid amount';
        return '';
      }
      default:
        return '';
    }
  };

  const validatePaymentAmount = (value) => {
    const amt = parseFloat(value);
    if (!value) return 'Payment amount is required';
    if (Number.isNaN(amt) || amt <= 0) return 'Enter a valid amount';
    return '';
  };

  const touchAllFormFields = () => {
    setTouched((prev) => ({ ...prev, debt_name: true, total_amount: true }));
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

  useEffect(() => {
    fetchDebts();
  }, [filterStatus, refreshTrigger]);

    useEffect(() => {
      const lock = modalOpen || payModalOpen;
      document.body.style.overflow = lock ? 'hidden' : '';
      return () => {
        document.body.style.overflow = '';
      };
    }, [modalOpen, payModalOpen]);

  const fetchDebts = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const res = await getDebts(params);
      setDebts(res.data.debts || []);
    } catch (err) {
      setToast({ message: 'Failed to load debts', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    touchAllFormFields();

    const newErrors = {
      debt_name: validateField('debt_name', formData.debt_name),
      total_amount: validateField('total_amount', formData.total_amount),
    };
    const hasErrors = Object.values(newErrors).some(Boolean);
    setErrors(newErrors);
    if (hasErrors) return;

    try {
      if (editDebt) {
        await updateDebt(editDebt.id, formData);
        setToast({ message: 'Debt updated successfully', type: 'success' });
      } else {
        await addDebt({
          ...formData,
          month_year: currentMonth,
        });
        setToast({ message: 'Debt added successfully', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      triggerRefresh();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save debt', type: 'error' });
    }
  };

  const handlePayDebt = (debt) => {
    setSelectedDebt(debt);
    const remaining = debt.total_amount - (debt.amount_paid || 0);
    setPaymentAmount(remaining.toString());
    setPayModalOpen(true);
    setPayErrors({});
    setPayTouched({});
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPayTouched((prev) => ({ ...prev, payment: true }));
    const validationMessage = validatePaymentAmount(paymentAmount);
    setPayErrors({ payment: validationMessage });
    if (validationMessage) return;

    try {
      const amount = parseFloat(paymentAmount);
      await payDebt(selectedDebt.id, { amount_paid: amount });
      
      // Create expense entry for this debt payment
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const monthYear = today.substring(0, 7); // YYYY-MM
      
      await addMonthlyExpense({
        description: `Debt Payment: ${selectedDebt.debt_name}`,
        amount: amount,
        due_date: today,
        month_year: monthYear,
        category: 'Debt Payment',
        status: 'paid',
        is_debt_payment: true,
        debt_id: selectedDebt.id
      });
      
      setToast({ message: 'Payment recorded and added to expenses', type: 'success' });
      setPayModalOpen(false);
      setPaymentAmount('');
      setSelectedDebt(null);
      triggerRefresh();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to record payment', type: 'error' });
    }
  };

  const handleEdit = (debt) => {
    setEditDebt(debt);
    setFormData({
      debt_name: debt.debt_name,
      total_amount: debt.total_amount,
      creditor: debt.creditor || '',
      due_date: debt.due_date || '',
      notes: debt.notes || '',
    });
    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  const handleDelete = (debt) => {
    setConfirm({
      open: true,
      title: 'Delete Debt',
      message: `Are you sure you want to delete "${debt.debt_name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await deleteDebt(debt.id);
          setConfirm({ open: false });
          setToast({ message: 'Debt deleted successfully', type: 'success' });
          triggerRefresh();
        } catch (err) {
          setConfirm({ open: false });
          setToast({ message: 'Failed to delete debt', type: 'error' });
        }
      },
    });
  };

  const resetForm = () => {
    setFormData({
      debt_name: '',
      total_amount: '',
      creditor: '',
      due_date: '',
      notes: '',
    });
    setEditDebt(null);
    setErrors({});
    setTouched({});
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Debts Management</h1>
            <p className="text-slate-400">Track debts and record payments</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 
                     hover:bg-blue-500/20 transition-all duration-200 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Debt
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'pending', 'partially_paid', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg border transition-all duration-200 capitalize ${
                filterStatus === status
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Debts List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 animate-pulse">
                <div className="h-6 bg-slate-700/50 rounded w-48 mb-4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : debts.length > 0 ? (
          <div className="grid gap-4">
            {debts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onPay={handlePayDebt}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No debts found</h3>
            <p className="text-slate-400">You have no debts to track</p>
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
      <Modal open={modalOpen} contentClassName="p-6 max-w-2xl top-[11%]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">{editDebt ? 'Edit Debt' : 'Add New Debt'}</h2>
              <button
                onClick={() => { setModalOpen(false); resetForm(); }}
                className="p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Debt Name *</label>
                <input
                  type="text"
                  value={formData.debt_name}
                  onChange={(e) => handleFieldChange('debt_name', e.target.value)}
                  onBlur={() => handleBlur('debt_name')}
                  className={getInputClasses('debt_name')}
                  placeholder="e.g., Credit Card Debt, Personal Loan"
                />
                {errors.debt_name && <p className="mt-1 text-xs text-red-400">{errors.debt_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Total Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => handleFieldChange('total_amount', e.target.value)}
                  onBlur={() => handleBlur('total_amount')}
                  className={getInputClasses('total_amount')}
                  placeholder="50000"
                />
                {errors.total_amount && <p className="mt-1 text-xs text-red-400">{errors.total_amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                <DatePicker
                  value={formData.due_date}
                  onChange={(date) => setFormData({ ...formData, due_date: date })}
                  placeholder="Select due date"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Creditor</label>
                <input
                  type="text"
                  value={formData.creditor}
                  onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                           placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors duration-200"
                  placeholder="Name or institution"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                           placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors duration-200"
                  placeholder="Additional details..."
                />
              </div>

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 mt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); resetForm(); }}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 
                           transition-all font-medium border border-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-500 text-white hover:bg-teal-600 
                           transition-all font-medium"
                >
                  {editDebt ? 'Update' : 'Add'} Debt
                </button>
              </div>
            </form>
          </Modal>

      {/* Pay Debt Modal */}
      {payModalOpen && selectedDebt && (
        <Modal open={payModalOpen} contentClassName="p-6 max-w-md top-[20%]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Pay Debt</h2>
                <p className="text-sm text-slate-400 mt-1">{selectedDebt.debt_name}</p>
              </div>
              <button
                onClick={() => {
                  setPayModalOpen(false);
                  setPaymentAmount('');
                  setSelectedDebt(null);
                  setPayErrors({});
                  setPayTouched({});
                }}
                className="p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">Remaining Amount:</span>
                <span className="text-xl font-bold text-blue-400">
                  {formatCurrency(selectedDebt.total_amount - (selectedDebt.amount_paid || 0))}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Amount (₹) *</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPaymentAmount(value);
                    if (payTouched.payment) {
                      setPayErrors({ payment: validatePaymentAmount(value) });
                    }
                  }}
                  onBlur={() => {
                    setPayTouched((prev) => ({ ...prev, payment: true }));
                    setPayErrors({ payment: validatePaymentAmount(paymentAmount) });
                  }}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-800 border text-white placeholder-slate-500 
                           focus:outline-none transition-colors duration-200 ${
                    payErrors.payment
                      ? 'border-red-500/70 focus:border-red-500 focus:ring-1 focus:ring-red-500/60'
                      : 'border-slate-700 focus:border-emerald-500'
                  }`}
                  placeholder="Enter amount to pay"
                />
                {payErrors.payment && <p className="mt-1 text-xs text-red-400">{payErrors.payment}</p>}
                <p className="text-xs text-slate-500 mt-2">
                  Enter partial amount for partial payment, or full remaining amount to mark as paid
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setPayModalOpen(false);
                    setPaymentAmount('');
                    setSelectedDebt(null);
                    setPayErrors({});
                    setPayTouched({});
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 
                           transition-all font-medium border border-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 
                           transition-all font-medium"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </Modal>
      )}
    </div>
  );
}
