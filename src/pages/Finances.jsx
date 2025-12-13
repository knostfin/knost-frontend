import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddTransactionModal from '../components/AddTransactionModal';
import Toast from '../components/Toast';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction } from '../api/finance';

export default function Finances() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState('month');
  const [filterType, setFilterType] = useState('all');
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [modalType, setModalType] = useState('income');
  const [editItem, setEditItem] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterPeriod, filterType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = { period: filterPeriod };
      if (filterType !== 'all') params.type = filterType;
      const res = await getTransactions(params);
      setTransactions(res.data.transactions || []);
    } catch (err) {
      setToast({ message: 'Failed to load transactions', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (type = 'income') => {
    setModalType(type);
    setModalMode('create');
    setEditItem(null);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (modalMode === 'edit' && editItem) {
      await updateTransaction(editItem.id, payload);
      setToast({ message: 'Transaction updated', type: 'success' });
    } else {
      await addTransaction(payload);
      setToast({ message: 'Transaction added', type: 'success' });
    }
    await fetchData();
  };

  const handleEdit = (item) => {
    setEditItem(item);
    setModalType(item.type);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleDelete = (item) => {
    setConfirmItem(item);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!confirmItem) return;
    try {
      await deleteTransaction(confirmItem.id);
      setToast({ message: 'Transaction deleted', type: 'success' });
      await fetchData();
    } catch (err) {
      setToast({ message: 'Failed to delete transaction', type: 'error' });
    } finally {
      setConfirmOpen(false);
      setConfirmItem(null);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <AddTransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        type={modalType}
        mode={modalMode}
        initialData={editItem}
      />

      {/* Delete Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} aria-hidden="true" />
          <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl shadow-teal-500/10 p-6">
            <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
            <p className="text-sm text-gray-300 mt-2">
              Are you sure you want to delete
              <span className="font-semibold text-white"> {confirmItem?.category}</span>
              {' '}for
              <span className="font-semibold text-teal-300"> {confirmItem?.amount}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setConfirmOpen(false); setConfirmItem(null); }}
                className="px-4 py-2 rounded-lg bg-white/10 text-gray-200 border border-white/15 hover:bg-white/15 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/40"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-400 mb-2">Manage everything</p>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400">
              Finance Control Center
            </h1>
            <p className="text-gray-400 mt-2">Add, edit, delete incomes, expenses, debts, EMIs, loans from one place.</p>
          </div>
          <div className="flex gap-3 flex-wrap justify-end">
            <button
              onClick={() => handleAdd('income')}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:scale-105 transition"
            >
              Add Transactions
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-5 py-3 rounded-xl bg-white/10 text-gray-200 border border-white/15 hover:bg-white/15 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-white/10 p-6 backdrop-blur-xl">
          <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
            <div className="flex gap-2 flex-wrap">
              {['all', 'income', 'expense', 'debt'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filterType === t
                      ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/40'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              {['week', 'month', 'year', 'all'].map((period) => (
                <button
                  key={period}
                  onClick={() => setFilterPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    filterPeriod === period
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent hover:border-white/10'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-gray-400">No entries yet. Add your first one.</div>
          ) : (
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal-500/30 scrollbar-track-transparent recent-scrollbar">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {tx.type === 'income' ? '💰' : tx.type === 'expense' ? '💸' : '💳'}
                      </span>
                      <div>
                        <p className="text-white font-semibold">{tx.category}</p>
                        <p className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                          <span className="capitalize">{tx.type}</span>
                          <span>•</span>
                          <span>{formatDate(tx.transaction_date)}</span>
                          <span>•</span>
                          <span className="capitalize">{tx.payment_method?.replace('_', ' ')}</span>
                        </p>
                        {tx.description && <p className="text-xs text-gray-600 mt-1">{tx.description}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${tx.type === 'income' ? 'text-green-300' : tx.type === 'expense' ? 'text-red-300' : 'text-orange-300'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <div className="flex gap-2 justify-end mt-3">
                      <button
                        onClick={() => handleEdit(tx)}
                        className="px-3 py-2 text-sm rounded-lg bg-white/10 text-gray-200 hover:bg-white/15 border border-white/15"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tx)}
                        className="px-3 py-2 text-sm rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/40"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
