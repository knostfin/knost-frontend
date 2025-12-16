import React, { useEffect, useState } from 'react';
import { getInvestments, addInvestment, updateInvestment, deleteInvestment } from '../api/investments';
import InvestmentCard from '../components/InvestmentCard';
import DatePicker from '../components/DatePicker';
import Toast from '../components/Toast';

export default function InvestmentsManagement() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editInvestment, setEditInvestment] = useState(null);
  const [filterType, setFilterType] = useState('all');

  const [formData, setFormData] = useState({
    investment_type: 'mutual_fund',
    name: '',
    amount: '',
    invested_on: new Date().toISOString().split('T')[0],
    maturity_date: '',
    current_value: '',
    notes: '',
  });

  useEffect(() => {
    fetchInvestments();
  }, [filterType]);

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const params = filterType !== 'all' ? { type: filterType } : {};
      const res = await getInvestments(params);
      setInvestments(res.data.investments || []);
    } catch (err) {
      setToast({ message: 'Failed to load investments', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.maturity_date) delete payload.maturity_date;
      if (!payload.current_value) delete payload.current_value;

      if (editInvestment) {
        await updateInvestment(editInvestment.id, payload);
        setToast({ message: 'Investment updated successfully', type: 'success' });
      } else {
        await addInvestment(payload);
        setToast({ message: 'Investment added successfully', type: 'success' });
      }
      setModalOpen(false);
      resetForm();
      fetchInvestments();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save investment', type: 'error' });
    }
  };

  const handleEdit = (investment) => {
    setEditInvestment(investment);
    setFormData({
      investment_type: investment.investment_type,
      name: investment.name,
      amount: investment.amount,
      invested_on: investment.invested_on,
      maturity_date: investment.maturity_date || '',
      current_value: investment.current_value || '',
      notes: investment.notes || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (investment) => {
    const confirmed = window.confirm(`Delete "${investment.name}"?`);
    if (!confirmed) return;

    try {
      await deleteInvestment(investment.id);
      setToast({ message: 'Investment deleted successfully', type: 'success' });
      fetchInvestments();
    } catch (err) {
      setToast({ message: 'Failed to delete investment', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      investment_type: 'mutual_fund',
      name: '',
      amount: '',
      invested_on: new Date().toISOString().split('T')[0],
      maturity_date: '',
      current_value: '',
      notes: '',
    });
    setEditInvestment(null);
  };

  const totalInvested = investments.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + parseFloat(inv.current_value || inv.amount || 0), 0);
  const totalReturns = totalCurrentValue - totalInvested;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Investments Portfolio</h1>
            <p className="text-slate-400">Track your investments and returns</p>
          </div>
          <button
            onClick={() => { resetForm(); setModalOpen(true); }}
            className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 
                     hover:bg-purple-500/20 transition-all duration-200 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Investment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-sm text-blue-400/70 mb-2">Total Invested</p>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="p-5 rounded-xl bg-purple-500/5 border border-purple-500/20">
            <p className="text-sm text-purple-400/70 mb-2">Current Value</p>
            <p className="text-2xl font-bold text-purple-400">{formatCurrency(totalCurrentValue)}</p>
          </div>
          <div className={`p-5 rounded-xl ${totalReturns >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <p className={`text-sm ${totalReturns >= 0 ? 'text-emerald-400/70' : 'text-red-400/70'} mb-2`}>Returns</p>
            <p className={`text-2xl font-bold ${totalReturns >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalReturns >= 0 ? '+' : ''}{formatCurrency(totalReturns)}
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'mutual_fund', 'stocks', 'savings', 'fd', 'ppf', 'gold', 'real_estate', 'crypto', 'other'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 capitalize ${
                filterType === type
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>

        {/* Investments List */}
        {loading ? (
          <div className="grid gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 animate-pulse">
                <div className="h-6 bg-slate-700/50 rounded w-48 mb-4"></div>
                <div className="h-4 bg-slate-700/50 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : investments.length > 0 ? (
          <div className="grid gap-4">
            {investments.map((investment) => (
              <InvestmentCard key={investment.id} investment={investment} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No investments found</h3>
            <p className="text-slate-400">Start tracking your investment portfolio</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-5 max-w-2xl translate-y-10">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <h2 className="text-xl font-bold text-white">{editInvestment ? 'Edit Investment' : 'Add New Investment'}</h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Investment Type *</label>
                <select value={formData.investment_type} onChange={(e) => setFormData({ ...formData, investment_type: e.target.value })} required
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                  <option value="mutual_fund">Mutual Fund</option>
                  <option value="stocks">Stocks</option>
                  <option value="savings">Savings</option>
                  <option value="fd">Fixed Deposit</option>
                  <option value="ppf">PPF</option>
                  <option value="gold">Gold</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="crypto">Cryptocurrency</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Investment Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="e.g., SBI Bluechip Fund, HDFC FD" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invested Amount (₹) *</label>
                  <input type="number" required min="0.01" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Current Value (₹)</label>
                  <input type="number" min="0.01" step="0.01" value={formData.current_value} onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Invested On *</label>
                  <DatePicker
                    value={formData.invested_on}
                    onChange={(date) => setFormData({ ...formData, invested_on: date })}
                    placeholder="Select invested date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Maturity Date</label>
                  <DatePicker
                    value={formData.maturity_date}
                    onChange={(date) => setFormData({ ...formData, maturity_date: date })}
                    placeholder="Select maturity date"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50" />
              </div>

              <div className="flex gap-3 pt-4 mt-6 border-t border-slate-700/50">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 
                           hover:bg-slate-800 transition-all duration-200 font-medium">
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-purple-500 text-white 
                         hover:bg-purple-600 transition-all duration-200 font-medium">
                  {editInvestment ? 'Update Investment' : 'Add Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
