import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { getLoans, addLoan, updateLoan, deleteLoan, closeLoan, getPaymentSchedule, getLoanPayments, markEMIPaid } from '../api/loans';
import { calculateEMI as calculateEMIFromBackend, getLoanSummary } from '../api/dashboard';
import LoanCard from '../components/LoanCard';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
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
  const [scheduleStatus, setScheduleStatus] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null, loading: false });
  const [submitting, setSubmitting] = useState(false);
  const [loadingStates, setLoadingStates] = useState({});
  const [emiPreview, setEmiPreview] = useState(null);

  const [formData, setFormData] = useState({
    loan_name: '',
    principal_amount: '',
    interest_rate: '',
    tenure_months: '',
    start_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const validateField = (field, value) => {
    switch (field) {
      case 'loan_name':
        return value.trim() ? '' : 'Loan name is required';
      case 'principal_amount': {
        const amt = parseFloat(value);
        if (!value) return 'Principal amount is required';
        if (Number.isNaN(amt) || amt <= 0) return 'Enter a valid principal';
        return '';
      }
      case 'interest_rate': {
        if (value === '' || value === null || value === undefined) return 'Interest rate is required';
        const rate = parseFloat(value);
        if (Number.isNaN(rate) || rate < 0) return 'Enter a valid rate';
        return '';
      }
      case 'tenure_months': {
        const tenure = parseInt(value, 10);
        if (!value) return 'Tenure is required';
        if (Number.isNaN(tenure) || tenure <= 0) return 'Enter a valid tenure';
        return '';
      }
      case 'start_date':
        return value ? '' : 'Start date is required';
      default:
        return '';
    }
  };

  const touchAll = () => {
    setTouched({
      loan_name: true,
      principal_amount: true,
      interest_rate: true,
      tenure_months: true,
      start_date: true,
    });
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
    fetchLoans();
  }, [filterStatus]);

  useEffect(() => {
    const lock = modalOpen || scheduleModalOpen;
    document.body.style.overflow = lock ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen, scheduleModalOpen]);

  // Calculate EMI preview when form data changes
  useEffect(() => {
    const updateEmiPreview = async () => {
      const emi = await calculateEMI();
      setEmiPreview(emi);
    };
    updateEmiPreview();
  }, [formData.principal_amount, formData.interest_rate, formData.tenure_months]);

  useEffect(() => {
    if (scheduleModalOpen && selectedLoan) {
      const params = scheduleStatus !== 'all' ? { status: scheduleStatus } : {};
      getLoanPayments(selectedLoan.id, params)
        .then((res) => {
          const schedule = res.data?.schedule || res.data?.payments || res.data || [];
          setPaymentSchedule(Array.isArray(schedule) ? schedule : []);
        })
        .catch((err) => {
          console.error('Schedule filter fetch error:', err);
          setToast({ message: 'Failed to filter schedule', type: 'error' });
        });
    }
  }, [scheduleStatus, scheduleModalOpen, selectedLoan]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? { status: filterStatus } : {};
      const res = await getLoans(params);
      const baseLoans = res.data.loans || [];

      // Enrich with loan summaries from backend
      const enriched = await Promise.all(
        baseLoans.map(async (loan) => {
          try {
            // Use backend loan summary API
            const summaryRes = await getLoanSummary(loan.id);
            const summary = summaryRes.data.summary;
            
            return {
              ...loan,
              total_payments: summary.total_payments,
              paid_payments: summary.paid_payments,
              pending_payments: summary.pending_payments
            };
          } catch (err) {
            console.error(`Failed to get summary for loan ${loan.id}:`, err);
            // Fallback to loan data if summary fails
            return {
              ...loan,
              total_payments: loan.tenure_months || 0,
              paid_payments: 0,
              pending_payments: loan.tenure_months || 0
            };
          }
        })
      );

      setLoans(enriched);
    } catch (err) {
      setToast({ message: 'Failed to load loans', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateEMI = async () => {
    const { principal_amount, interest_rate, tenure_months } = formData;
    if (!principal_amount || interest_rate === '' || !tenure_months) return null;

    try {
      // Use backend API for EMI calculation
      const response = await calculateEMIFromBackend({
        principal_amount: parseFloat(principal_amount),
        annual_interest_rate: parseFloat(interest_rate),
        tenure_months: parseInt(tenure_months)
      });
      
      return response.data.calculation.monthly_emi.toFixed(2);
    } catch (err) {
      console.error('EMI calculation error:', err);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    touchAll();

    const newErrors = {
      loan_name: validateField('loan_name', formData.loan_name),
      principal_amount: validateField('principal_amount', formData.principal_amount),
      interest_rate: validateField('interest_rate', formData.interest_rate),
      tenure_months: validateField('tenure_months', formData.tenure_months),
      start_date: validateField('start_date', formData.start_date),
    };
    const hasErrors = Object.values(newErrors).some(Boolean);
    setErrors(newErrors);
    if (hasErrors) { setSubmitting(false); return; }

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
      setErrors({});
      setTouched({});
      fetchLoans();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save loan', type: 'error' });
    } finally {
      setSubmitting(false);
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
    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  const handleDelete = (loan) => {
    setConfirm({
      open: true,
      title: 'Delete Loan',
      message: `Are you sure you want to delete "${loan.loan_name}"?`,
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await deleteLoan(loan.id);
          setConfirm({ open: false });
          setToast({ message: 'Loan deleted successfully', type: 'success' });
          fetchLoans();
        } catch (err) {
          setConfirm({ open: false });
          setToast({ message: 'Failed to delete loan', type: 'error' });
        }
      },
    });
  };

  const handleClose = (loan) => {
    setConfirm({
      open: true,
      title: 'Close Loan',
      message: `Close/foreclose "${loan.loan_name}"?`,
      onConfirm: async () => {
        try {
          setConfirm((c) => ({ ...c, loading: true }));
          await closeLoan(loan.id);
          setConfirm({ open: false });
          setToast({ message: 'Loan closed successfully', type: 'success' });
          fetchLoans();
        } catch (err) {
          setConfirm({ open: false });
          setToast({ message: 'Failed to close loan', type: 'error' });
        }
      },
    });
  };

  const handleViewSchedule = async (loan) => {
    try {
      setSelectedLoan(loan);
      const params = scheduleStatus !== 'all' ? { status: scheduleStatus } : {};
      const res = await getLoanPayments(loan.id, params);
      const schedule = res.data?.schedule || res.data?.payments || res.data || [];
      setPaymentSchedule(Array.isArray(schedule) ? schedule : []);
      setScheduleModalOpen(true);
    } catch (err) {
      console.error('Schedule fetch error:', err);
      setToast({ message: 'Failed to load payment schedule', type: 'error' });
    }
  };

  const handleMarkPaymentPaid = async (payment) => {
    if (!selectedLoan) return;
    const key = `markPaid_${payment.id || payment.payment_id || payment.payment_number}`;
    try {
      setLoadingStates(prev => ({ ...prev, [key]: true }));
      await markEMIPaid(selectedLoan.id, payment.id || payment.payment_id || payment.payment_number);
      const params = scheduleStatus !== 'all' ? { status: scheduleStatus } : {};
      const res = await getLoanPayments(selectedLoan.id, params);
      const schedule = res.data?.schedule || res.data?.payments || res.data || [];
      setPaymentSchedule(Array.isArray(schedule) ? schedule : []);
      // Refresh loans list to update progress counts
      await fetchLoans();
      setSelectedLoan((prev) => {
        const updated = (loans || []).find((l) => l.id === (prev?.id || selectedLoan.id));
        return updated || prev;
      });
      setToast({ message: 'EMI marked as paid', type: 'success' });
    } catch (err) {
      console.error('Mark paid failed:', err);
      setToast({ message: 'Failed to mark EMI as paid', type: 'error' });
    } finally {
      setLoadingStates(prev => ({ ...prev, [key]: false }));
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
    setErrors({});
    setTouched({});
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

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

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmText="Confirm"
        cancelText="Cancel"
        variant="primary"
        loading={confirm.loading}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* Add/Edit Loan Modal */}
      {modalOpen && (
        <Modal open={modalOpen} contentClassName="p-6 max-w-2xl top-[11%]">
            <div className="flex items-center justify-between mb-4">
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

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Loan Name *</label>
                <input
                  type="text"
                  value={formData.loan_name}
                  onChange={(e) => handleFieldChange('loan_name', e.target.value)}
                  onBlur={() => handleBlur('loan_name')}
                  className={getInputClasses('loan_name')}
                  placeholder="e.g., Home Loan, Car Loan"
                />
                {errors.loan_name && <p className="mt-1 text-xs text-red-400">{errors.loan_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Principal Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.principal_amount}
                  onChange={(e) => handleFieldChange('principal_amount', e.target.value)}
                  onBlur={() => handleBlur('principal_amount')}
                  className={getInputClasses('principal_amount')}
                  placeholder="1000000"
                />
                {errors.principal_amount && <p className="mt-1 text-xs text-red-400">{errors.principal_amount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Interest Rate (% p.a.) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.interest_rate}
                  onChange={(e) => handleFieldChange('interest_rate', e.target.value)}
                  onBlur={() => handleBlur('interest_rate')}
                  className={getInputClasses('interest_rate')}
                  placeholder="8.5"
                />
                {errors.interest_rate && <p className="mt-1 text-xs text-red-400">{errors.interest_rate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Tenure (Months) *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.tenure_months}
                  onChange={(e) => handleFieldChange('tenure_months', e.target.value)}
                  onBlur={() => handleBlur('tenure_months')}
                  className={getInputClasses('tenure_months')}
                  placeholder="240"
                />
                {errors.tenure_months && <p className="mt-1 text-xs text-red-400">{errors.tenure_months}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Start Date *</label>
                <DatePicker
                  value={formData.start_date}
                  onChange={(date) => {
                    handleFieldChange('start_date', date);
                    setTouched((prev) => ({ ...prev, start_date: true }));
                    setErrors((prev) => ({ ...prev, start_date: validateField('start_date', date) }));
                  }}
                  placeholder="Select start date"
                />
                {errors.start_date && <p className="mt-1 text-xs text-red-400">{errors.start_date}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes (Optional)</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white 
                           focus:outline-none focus:border-teal-500 transition-colors duration-200"
                  placeholder="Add any additional notes..."
                />
              </div>

              {emiPreview && (
                <div className="md:col-span-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium">Calculated EMI:</span>
                    <span className="text-2xl font-bold text-blue-400">{formatCurrency(emiPreview)}/month</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    EMI will be automatically calculated and payment schedule will be generated
                  </p>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end gap-3 pt-4 mt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    resetForm();
                  }}
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
                  {submitting ? (editLoan ? 'Updating...' : 'Adding...') : `${editLoan ? 'Update' : 'Add'} Loan`}
                </button>
              </div>
            </form>
          </Modal>
      )}

      {/* Payment Schedule Modal */}
      {scheduleModalOpen && selectedLoan && (
        <Modal open={scheduleModalOpen} contentClassName="p-0 max-w-6xl flex flex-col top-[11%]">
            <div className="p-6 border-b border-slate-700/50 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{selectedLoan.loan_name} - Payment Schedule</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {paymentSchedule.length} payments • EMI: {formatCurrency(selectedLoan.emi_amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {['all', 'pending', 'paid'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setScheduleStatus(status)}
                    className={`px-3 py-1.5 rounded-lg border transition-all duration-200 capitalize text-sm ${
                      scheduleStatus === status
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                        : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-400"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div 
              className="overflow-y-auto flex-1 min-h-96"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#475569 #1e293b'
              }}
            >
              <style>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: #1e293b;
                }
                div::-webkit-scrollbar-thumb {
                  background: #475569;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #64748b;
                }
              `}</style>
              {paymentSchedule && paymentSchedule.length > 0 ? (
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
                      <th className="p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentSchedule.map((payment) => (
                      <tr key={payment.id || payment.payment_number} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="p-4 text-slate-300">{payment.payment_number}</td>
                        <td className="p-4 text-slate-300">{formatDate(payment.payment_date)}</td>
                        <td className="p-4 text-white font-semibold">{formatCurrency(payment.emi_amount)}</td>
                        <td className="p-4 text-slate-300">{formatCurrency(payment.principal_paid)}</td>
                        <td className="p-4 text-slate-300">{formatCurrency(payment.interest_paid)}</td>
                        <td className="p-4 text-slate-300">{formatCurrency(payment.outstanding_balance)}</td>
                        <td className="p-4">
                          <StatusBadge status={payment.status} />
                        </td>
                        <td className="p-4">
                          {payment.status === 'pending' ? (
                            <button
                              onClick={() => handleMarkPaymentPaid(payment)}
                              disabled={loadingStates[`markPaid_${payment.id || payment.payment_id || payment.payment_number}`]}
                              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                                       hover:bg-emerald-500/20 transition-all text-sm font-medium disabled:opacity-50 
                                       disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {loadingStates[`markPaid_${payment.id || payment.payment_id || payment.payment_number}`] && 
                                <span className="btn-loading-spinner"></span>
                              }
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-slate-500 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-96 text-slate-400">
                  <p>No payment schedule data available</p>
                </div>
              )}
            </div>
          </Modal>
      )}
    </div>
  );
}
