import React, { useEffect, useMemo, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getMonthlyOverview, getAllTransactions } from '../api/dashboard';
import { getMonthlyExpenses, generateMonthlyExpenses } from '../api/expenses';
import MonthSelector from '../components/MonthSelector';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import Toast from '../components/Toast';
import { createPortal } from 'react-dom';
import { createApiClient } from '../api/apiClient';

export default function FinanceDashboard() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useFinance();
  const [overview, setOverview] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const dashboardApi = useMemo(() => createApiClient('/api/dashboard'), []);

  useEffect(() => {
    fetchMonthlyOverview();
  }, [currentMonth, refreshTrigger]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const fetchMonthlyOverview = async () => {
    try {
      setLoading(true);

      // Ensure monthly expenses are generated for this month (idempotent)
      try {
        const existingRes = await getMonthlyExpenses({ month_year: currentMonth });
        const existing = existingRes.data?.expenses || existingRes.data || [];
        if (!Array.isArray(existing) || existing.length === 0) {
          try {
            await generateMonthlyExpenses(currentMonth);
          } catch (genErr) {
            // Generation may fail if already exists or suppressed; log and continue
            console.warn('Generate monthly expenses skipped:', genErr?.response?.data || genErr?.message);
          }
        }
      } catch (precheckErr) {
        console.warn('Pre-check monthly expenses failed:', precheckErr?.response?.data || precheckErr?.message);
      }

      // Fetch complete monthly overview from backend (all calculations done on backend)
      const response = await getMonthlyOverview(currentMonth);
      const { overview } = response.data;

      // Fetch detailed transactions for the month (includes all items)
      let allTransactions = {};
      try {
        const transactionsResponse = await getAllTransactions(currentMonth);
        
        // Extract flat transactions array from response
        const flatTransactions = transactionsResponse.data?.transactions || [];
        
        // Normalize transactions: map backend fields to UI field names based on type
        const normalizedTransactions = flatTransactions.map((t) => {
          let normalized = {
            ...t,
            // All transactions have these base fields
            amount: parseFloat(t.amount) || 0,
            status: t.status || 'pending', // Use actual status from API
          };
          
          // Map field names based on transaction type
          if (t.type === 'income') {
            normalized.source = t.name;
            normalized.received_on = t.date;
          } else if (t.type === 'expense') {
            normalized.category = t.name;
            normalized.due_date = t.date;
          } else if (t.type === 'emi') {
            normalized.loan_name = t.name;
            normalized.payment_date = t.date;
            normalized.emi_amount = parseFloat(t.amount) || 0;
          } else if (t.type === 'debt') {
            normalized.debt_name = t.name;
            normalized.due_date = t.date;
            normalized.amount_paid = parseFloat(t.amount) || 0;
          } else if (t.type === 'investment') {
            normalized.investment_name = t.name;
            normalized.invested_on = t.date;
          }
          
          return normalized;
        });
        
        // Group normalized transactions by type
        allTransactions = {
          income: normalizedTransactions.filter((t) => t.type === 'income'),
          expenses: normalizedTransactions.filter((t) => t.type === 'expense'),
          emis: normalizedTransactions.filter((t) => t.type === 'emi'),
          debts: normalizedTransactions.filter((t) => t.type === 'debt'),
          investments: normalizedTransactions.filter((t) => t.type === 'investment'),
        };
      } catch (transErr) {
        console.warn('Failed to fetch detailed transactions:', transErr);
        // Continue without detailed transactions
      }

      // Map backend response to UI-friendly shape
      const pendingCount = (overview?.expenses?.pending_count || 0) + (overview?.emis?.pending_count || 0);
      const overviewData = {
        summary: {
          // Use per-section totals for cards
          total_income: parseFloat(overview?.income?.total) || 0,
          total_expenses: parseFloat(overview?.expenses?.total) || 0,
          total_debts: parseFloat(overview?.debts?.total) || 0,
          total_loans: parseFloat(overview?.emis?.total) || 0,
          balance: parseFloat(overview?.summary?.balance) || 0,
          pending_count: pendingCount,
          pending_amount: parseFloat(overview?.summary?.total_pending) || 0,
          is_cleared: !!overview?.summary?.is_cleared,
        },
        // Keep section objects for counts and paid/pending stats
        income: {
          total: parseFloat(overview?.income?.total) || 0,
          count: overview?.income?.count || 0,
        },
        expenses: {
          total: parseFloat(overview?.expenses?.total) || 0,
          paid: parseFloat(overview?.expenses?.paid) || 0,
          pending: parseFloat(overview?.expenses?.pending) || 0,
          paid_count: overview?.expenses?.paid_count || 0,
          pending_count: overview?.expenses?.pending_count || 0,
        },
        debts: {
          total: parseFloat(overview?.debts?.total) || 0,
          count: overview?.debts?.count || 0,
        },
        emis: {
          total: parseFloat(overview?.emis?.total) || 0,
          paid: parseFloat(overview?.emis?.paid) || 0,
          pending: parseFloat(overview?.emis?.pending) || 0,
          paid_count: overview?.emis?.paid_count || 0,
          pending_count: overview?.emis?.pending_count || 0,
        },
        status: overview?.summary?.is_cleared ? 'cleared' : 'pending',
      };

      setOverview(overviewData);
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Failed to load monthly overview:', err);
      setToast({ message: 'Failed to load monthly data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // All interactions are read-only; no mark-paid or generate actions here.

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    // Convert string to number if needed
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      const response = await dashboardApi.get(`/report/download/${currentMonth}`, {
        responseType: 'blob',
      });

      const blob = response?.data;
      if (!blob || blob.size === 0) {
        throw new Error('Empty report received');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Monthly_Report_${currentMonth}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({ message: 'Report downloaded successfully!', type: 'success' });
    } catch (err) {
      console.error('Download failed:', err);
      setToast({ message: 'Failed to download report. Please try again.', type: 'error' });
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 bg-slate-700/50 rounded w-48 animate-pulse"></div>
            <div className="h-10 bg-slate-700/50 rounded w-64 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <SummaryCard key={i} loading />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Dashboard view shows summaries only; detailed lists are not provided by this endpoint
  // Use backend-calculated totals (no frontend calculations)
  const allCleared = !!overview?.summary?.is_cleared;
  const incomesTotal = overview?.income?.total || 0;
  const expensesTotal = overview?.expenses?.total || 0;
  const expensesPaidTotal = overview?.expenses?.paid || 0;
  const debtsPaidTotal = overview?.debts?.total || 0;
  const loansEmiPaidTotal = overview?.emis?.paid || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Finance Dashboard</h1>
              <p className="text-slate-400">Track your monthly finances</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <MonthSelector />
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 
                       hover:bg-blue-500/20 transition-all duration-200 font-medium"
            >
              <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Generate Monthly Expenses
            </button>
          </div>
        </div>

        {/* Summary Cards (only Incomes, Expenses, Debts, Loans) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Income"
            amount={overview?.summary?.total_income || 0}
            type="income"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            title="Total Expenses"
            amount={overview?.summary?.total_expenses || 0}
            type="expense"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
          <SummaryCard
            title="Total Debts"
            amount={overview?.summary?.total_debts || 0}
            type="debt"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <SummaryCard
            title="Total Loans (EMI)"
            amount={overview?.summary?.total_loans || 0}
            type="loan"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            }
          />
        </div>

        {/* Month Status Banner */}
        {allCleared ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-emerald-400 font-semibold">All payments cleared!</p>
              <p className="text-emerald-400/70 text-sm">You've completed all payments for this month</p>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-amber-400 font-semibold">{overview?.summary?.pending_count || 0} pending payment(s)</p>
                  <p className="text-amber-400/70 text-sm">Amount pending: {formatCurrency(overview?.summary?.pending_amount || 0)}</p>
                </div>
              </div>
            </div>

            {/* Pending Items List */}
            {transactions && Object.keys(transactions).length > 0 && (
              <div className="space-y-3">
                {/* Pending Expenses */}
                {Array.isArray(transactions.expenses) && transactions.expenses.length > 0 ? (
                  transactions.expenses
                    .filter((e) => e.status === 'pending')
                    .map((expense) => (
                      <div
                        key={`expense-${expense.id}`}
                        className="p-4 rounded-lg bg-red-500/5 border border-red-500/20 flex items-center justify-between hover:bg-red-500/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <div>
                            <p className="text-red-400 font-medium">{expense.category || 'Expense'}</p>
                            <p className="text-red-400/60 text-xs">
                              Pending • {formatDate(expense.due_date)}
                            </p>
                          </div>
                        </div>
                        <p className="text-red-400 font-bold">{formatCurrency(expense.amount)}</p>
                      </div>
                    ))
                ) : null}

                {/* Pending EMIs */}
                {Array.isArray(transactions.emis) && transactions.emis.length > 0 ? (
                  transactions.emis
                    .filter((emi) => emi.status === 'pending')
                    .map((emi) => (
                      <div
                        key={`emi-${emi.id}`}
                        className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 flex items-center justify-between hover:bg-blue-500/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                            />
                          </svg>
                          <div>
                            <p className="text-blue-400 font-medium">
                              {emi.loan_name} #{emi.payment_number}
                            </p>
                            <p className="text-blue-400/60 text-xs">
                              EMI Pending • {formatDate(emi.payment_date)}
                            </p>
                          </div>
                        </div>
                        <p className="text-blue-400 font-bold">{formatCurrency(emi.emi_amount)}</p>
                      </div>
                    ))
                ) : null}

                {/* Show message if no pending items */}
                {(!Array.isArray(transactions.expenses) || transactions.expenses.filter((e) => e.status === 'pending').length === 0) &&
                  (!Array.isArray(transactions.emis) || transactions.emis.filter((emi) => emi.status === 'pending').length === 0) && (
                    <div className="text-center py-4 text-slate-400">
                      <p className="text-sm">No pending payments found</p>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* Actions Bar removed per requirements; button moved next to heading, pending-only removed */}

        {/* Modal: Monthly Details (read-only, full page) */}
        {modalOpen &&
          createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
              {/* Overlay */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setModalOpen(false)}
              />

              {/* Modal wrapper */}
              <div className="relative bg-slate-900/98 border border-slate-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-800 bg-slate-900/50">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">
                      Monthly Details • {currentMonth}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Read-only snapshot — all sections visible
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadReport}
                      disabled={isDownloading}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                        isDownloading
                          ? 'bg-gray-500/20 text-gray-400 border-gray-500/20 cursor-not-allowed'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      }`}
                      aria-label="Download report"
                    >
                      {isDownloading ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Downloading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-sm font-medium">Download</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setModalOpen(false)}
                      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all flex-shrink-0"
                      aria-label="Close modal"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8">

                  {/* ========== INCOMES ========== */}
                  <div>
                    <h3 className="text-base font-bold text-emerald-400 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Incomes ({overview?.income?.count || 0})
                    </h3>
                    {transactions?.income && transactions.income.length > 0 ? (
                      <div className="border border-slate-800 rounded bg-slate-900/80 w-full">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-slate-900">
                            <tr className="text-slate-300 border-b border-slate-800">
                              <th className="px-3 py-2.5 text-left">Source</th>
                              <th className="px-3 py-2.5 text-center whitespace-nowrap">Date</th>
                              <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.income.map((inc) => (
                              <tr key={inc.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="px-3 py-2.5 text-white max-w-[240px] truncate" title={inc.source}>{inc.source}</td>
                                <td className="px-3 py-2.5 text-slate-400 text-center whitespace-nowrap">
                                  {formatDate(inc.received_on)}
                                </td>
                                <td className="px-3 py-2.5 text-right text-white whitespace-nowrap">
                                  {formatCurrency(inc.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-800/50">
                            <tr>
                              <td className="px-3 py-2.5 font-semibold text-slate-200">
                                Total
                              </td>
                              <td />
                              <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                                {formatCurrency(incomesTotal)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">No incomes recorded</p>
                      </div>
                    )}
                  </div>

                  {/* ========== EXPENSES ========== */}
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Expenses ({overview?.expenses?.paid_count + overview?.expenses?.pending_count || 0})
                    </h3>
                    {transactions?.expenses && transactions.expenses.length > 0 ? (
                      <div className="border border-slate-800 rounded-lg bg-slate-900/80 overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead className="bg-slate-900 sticky top-0 z-10">
                            <tr className="text-slate-300 border-b border-slate-800">
                              <th className="px-3 py-3 text-left text-sm font-semibold">Description</th>
                              <th className="px-3 py-2.5 text-left whitespace-nowrap">Category</th>
                              <th className="px-3 py-2.5 text-center whitespace-nowrap">Date</th>
                              <th className="px-3 py-2.5 text-center whitespace-nowrap">Status</th>
                              <th className="px-3 py-2.5 text-right whitespace-nowrap">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.expenses.map((e) => (
                              <tr key={e.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="px-3 py-2.5 text-slate-400 max-w-[280px] truncate" title={e.description}>{e.description || '-'}</td>
                                <td className="px-3 py-2.5 text-white whitespace-nowrap" title={e.category}>{e.category}</td>
                                <td className="px-3 py-2.5 text-slate-400 text-center whitespace-nowrap">
                                  {formatDate(e.due_date)}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-2xl text-xs font-semibold ${
                                      e.status === 'paid'
                                        ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-amber-500/20 text-amber-400'
                                    }`}
                                  >
                                    {e.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right text-white whitespace-nowrap">
                                  {formatCurrency(e.amount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-800/50 sticky bottom-0">
                            <tr>
                              <td />
                              <td className="px-3 py-2.5 font-semibold text-slate-200">
                                Total
                              </td>
                              <td />
                              <td />
                              <td className="px-3 py-2.5 text-right font-bold text-red-400">
                                {formatCurrency(expensesTotal)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <p className="text-sm">No expenses recorded</p>
                      </div>
                    )}
                  </div>



                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
