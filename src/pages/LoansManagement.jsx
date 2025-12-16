import React, { useEffect, useState } from 'react';
import { getLoans, addLoan, updateLoan, deleteLoan, closeLoan, getPaymentSchedule } from '../api/loans';
import LoanCard from '../components/LoanCard';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';
import StatusBadge from '../components/StatusBadge';

export default function LoansManagement() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editLoan, setEditLoan] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [paymentSchedule, setPaymentSchedule] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    loan_name: '',
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    fetchLoans();
  }, [filterStatus]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const res = await getLoans(params);
      setLoans(res.data.loans || []);
    } catch (err) {
      setToast({ message: 'Failed to load loans', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateEMI = () => {
    const { principal_amount, interest_rate, tenure_months } = formData;
    if (!principal_amount || !interest_rate || !tenure_months) return null;

    const P = parseFloat(principal_amount);
    const r = parseFloat(interest_rate) / (12 * 100);
    const n = parseInt(tenure_months);

    if (r === 0) return (P / n).toFixed(2);

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return emi.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editLoan) {
        await updateLoan(editLoan.id, formData);
        setToast({ message: 'Loan updated successfully', type: 'success' });
      } else {
        await addLoan(formData);
        setToast({ message: 'Loan added successfully', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      fetchLoans();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save loan', type: 'error' });
    }
  };

  const handleEdit = (loan) => {
    setEditLoan(loan);
    setFormData({
      loan_name: loan.loan_name,
      principal_amount: loan.principal_amount,
      interest_rate: loan.interest_rate,
      tenure_months: loan.tenure_months,
      start_date: loan.start_date,
      notes: loan.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (loan) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${loan.loan_name}"?`);
    if (!confirmed) return;

    try {
      await deleteLoan(loan.id);
      setToast({ message: 'Loan deleted successfully', type: 'success' });
      fetchLoans();
    } catch (err) {
      setToast({ message: 'Failed to delete loan', type: 'error' });
    }
  };

  const handleClose = async (loan) => {
    const confirmed = window.confirm(`Close/foreclose "${loan.loan_name}"?`);
    if (!confirmed) return;

    try {
      await closeLoan(loan.id);
      setToast({ message: 'Loan closed successfully', type: 'success' });
      fetchLoans();
    } catch (err) {
      setToast({ message: 'Failed to close loan', type: 'error' });
    }
  };

  const handleViewSchedule = async (loan) => {
    try {
      setSelectedLoan(loan);
      const res = await getPaymentSchedule(loan.id);
      setPaymentSchedule(res.data.schedule || []);
      setScheduleModalOpen(true);
    } catch (err) {
      setToast({ message: 'Failed to load payment schedule', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      loan_name: '',
      principal_amount: '',
      interest_rate: '',
      tenure_months: '',
      start_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setEditLoan(null);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const emiPreview = calculateEMI();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Loans Management</h1>
            <p className="text-slate-400">Track and manage your loans with EMI schedules</p>
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
            Add Loan
          </button>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {['all', 'active', 'closed', 'foreclosed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg border transition-all duration-200 capitalize ${
                filterStatus === status
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Loans List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 animate-pulse">
                <div className="h-6 bg-slate-700/50 rounded w-48 mb-4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : loans.length > 0 ? (
          <div className="grid gap-4">
            {loans.map((loan) => (
              <LoanCard
                key={loan.id}
                loan={loan}
                onViewSchedule={handleViewSchedule}
                onEdit={handleEdit}
                onClose={handleClose}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No loans found</h3>
            <p className="text-slate-400 mb-6">Start by adding your first loan</p>
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="px-6 py-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 
                       hover:bg-blue-500/20 transition-all duration-200 font-medium"
            >
              Add Your First Loan
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Loan Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-5 max-w-2xl translate-y-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-white">{editLoan ? 'Edit Loan' : 'Add New Loan'}</h2>
              <button
                onClick={() => {
                  setModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Loan Name *</label>
                <input
                  type="text"
                  required
                  value={formData.loan_name}
                  onChange={(e) => setFormData({ ...formData, loan_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white 
                           focus:outline-none focus:border-blue-500 transition-colors duration-200"
                  placeholder="e.g., Home Loan, Car Loan"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Principal Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.principal_amount}
                    onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white 
                             focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="1000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Interest Rate (% p.a.) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white 
                             focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="8.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tenure (Months) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.tenure_months}
                    onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white 
                             focus:outline-none focus:border-blue-500 transition-colors duration-200"
                    placeholder="240"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
                  <DatePicker
                    value={formData.start_date}
                    onChange={(date) => setFormData({ ...formData, start_date: date })}
                    placeholder="Select start date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white 
                           focus:outline-none focus:border-blue-500 transition-colors duration-200 resize-none"
                  placeholder="Add any additional notes..."
                />
              </div>

              {emiPreview && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Calculated EMI:</span>
                    <span className="text-2xl font-bold text-blue-400">{formatCurrency(emiPreview)}/month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    EMI will be automatically calculated and payment schedule will be generated
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 
                           hover:bg-slate-800 transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 
                           transition-all duration-200 font-medium"
                >
                  {editLoan ? 'Update Loan' : 'Add Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Schedule Modal */}
      {scheduleModalOpen && selectedLoan && (
        <div className="modal-overlay">
          <div className="modal-content p-0 max-w-6xl flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedLoan.loan_name} - Payment Schedule</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {paymentSchedule.length} payments • EMI: {formatCurrency(selectedLoan.emi_amount)}
                </p>
              </div>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-700/50">
                  <tr className="text-left text-sm text-slate-400">
                    <th className="p-4 font-medium">#</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">EMI</th>
                    <th className="p-4 font-medium">Principal</th>
                    <th className="p-4 font-medium">Interest</th>
                    <th className="p-4 font-medium">Balance</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentSchedule.map((payment) => (
                    <tr key={payment.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-4 text-slate-300">{payment.payment_number}</td>
                      <td className="p-4 text-slate-300">{formatDate(payment.payment_date)}</td>
                      <td className="p-4 text-white font-semibold">{formatCurrency(payment.emi_amount)}</td>
                      <td className="p-4 text-slate-300">{formatCurrency(payment.principal_paid)}</td>
                      <td className="p-4 text-slate-300">{formatCurrency(payment.interest_paid)}</td>
                      <td className="p-4 text-slate-300">{formatCurrency(payment.outstanding_balance)}</td>
                      <td className="p-4">
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
