import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getDebts, addDebt, updateDebt, deleteDebt, payDebt } from '../api/debts';
import DebtCard from '../components/DebtCard';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';

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

  const [formData, setFormData] = useState({
    debt_name: '',
    total_amount: '',
    creditor: '',
    due_date: '',
    notes: '',
  });

  useEffect(() => {
    fetchDebts();
  }, [filterStatus, refreshTrigger]);

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
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const amount = parseFloat(paymentAmount);
      if (amount <= 0) {
        setToast({ message: 'Please enter a valid amount', type: 'error' });
        return;
      }

      await payDebt(selectedDebt.id, { amount_paid: amount });
      setToast({ message: 'Payment recorded successfully', type: 'success' });
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
    setModalOpen(true);
  };

  const handleDelete = async (debt) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${debt.debt_name}"?`);
    if (!confirmed) return;

    try {
      await deleteDebt(debt.id);
      setToast({ message: 'Debt deleted successfully', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: 'Failed to delete debt', type: 'error' });
    }
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

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-5 max-w-lg translate-y-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-white">{editDebt ? 'Edit Debt' : 'Add New Debt'}</h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Debt Name *</label>
                <input type="text" required value={formData.debt_name} onChange={(e) => setFormData({ ...formData, debt_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g., Credit Card Debt, Personal Loan" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Total Amount (₹) *</label>
                  <input type="number" required min="1" step="0.01" value={formData.total_amount} onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="50000" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Due Date</label>
                  <DatePicker
                    value={formData.due_date}
                    onChange={(date) => setFormData({ ...formData, due_date: date })}
                    placeholder="Select due date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Creditor</label>
                <input type="text" value={formData.creditor} onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Name or institution" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  placeholder="Additional details..." />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700 font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 font-medium transition-all">
                  {editDebt ? 'Update Debt' : 'Add Debt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {payModalOpen && selectedDebt && (
        <div className="modal-overlay">
          <div className="modal-content p-6 max-w-md">
            <div className="pb-4 border-b border-slate-700/50 mb-4">
              <h2 className="text-xl font-bold text-white">Pay Debt: {selectedDebt.debt_name}</h2>
              <p className="text-sm text-slate-400 mt-2">
                Remaining: {formatCurrency(selectedDebt.total_amount - (selectedDebt.amount_paid || 0))}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Payment Amount (₹) *</label>
                <input type="number" required min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="Enter amount to pay" />
                <p className="text-xs text-slate-500 mt-1">
                  Enter partial amount for partial payment, or full remaining amount to mark as paid
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                <button type="button" onClick={() => { setPayModalOpen(false); setPaymentAmount(''); setSelectedDebt(null); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700 font-medium transition-all">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 font-medium transition-all">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
