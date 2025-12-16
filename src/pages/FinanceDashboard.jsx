import React, { useEffect, useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { getMonthlyOverview } from '../api/dashboard';
import { markExpensePaid } from '../api/expenses';
import { markEMIPaid } from '../api/loans';
import { payDebt } from '../api/debts';
import { getIncome } from '../api/income';
import { getMonthlyExpenses } from '../api/expenses';
import { getDebts } from '../api/debts';
import MonthSelector from '../components/MonthSelector';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import ExpenseCard from '../components/ExpenseCard';
import Toast from '../components/Toast';
import { generateMonthlyExpenses } from '../api/expenses';

export default function FinanceDashboard() {
  const { currentMonth, refreshTrigger, triggerRefresh } = useFinance();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchMonthlyOverview();
  }, [currentMonth, refreshTrigger]);

  const fetchMonthlyOverview = async () => {
    try {
      setLoading(true);
      
      // Fetch data from all three sources
      const [incomeRes, expensesRes, debtsRes] = await Promise.all([
        getIncome({ month_year: currentMonth }),
        getMonthlyExpenses({ month_year: currentMonth }),
        getDebts({ month_year: currentMonth })
      ]);

      const incomeData = incomeRes.data.income || [];
      const expensesData = expensesRes.data.expenses || [];
      const debtsData = debtsRes.data.debts || [];

      // Calculate totals - ensure all values are numbers
      const totalIncome = incomeData.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const totalExpenses = expensesData.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);
      const totalDebts = debtsData.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

      // Count pending items - ensure parsing
      const pendingExpensesCount = expensesData.filter(e => e.status === 'pending').length;
      const pendingDebtsCount = debtsData.filter(d => d.status !== 'paid').length;
      const totalPending = pendingExpensesCount + pendingDebtsCount;
      const pendingAmount = 
        expensesData.filter(e => e.status === 'pending').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) +
        debtsData.filter(d => d.status !== 'paid').reduce((sum, d) => sum + (parseFloat(d.total_amount) - (parseFloat(d.amount_paid) || 0)), 0);

      // Build overview object
      const overview = {
        summary: {
          total_income: totalIncome,
          total_expenses: totalExpenses,
          balance: totalIncome - totalExpenses - totalDebts,
          pending_count: totalPending,
          pending_amount: pendingAmount,
        },
        expenses: expensesData,
        debts: debtsData,
        emis: [], // EMIs come from loans API, not debts
        status: totalPending === 0 ? 'cleared' : 'pending'
      };

      setOverview(overview);
    } catch (err) {
      console.error('Failed to load monthly overview:', err);
      setToast({ message: 'Failed to load monthly data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExpenses = async () => {
    try {
      setGenerating(true);
      await generateMonthlyExpenses(currentMonth);
      setToast({ message: 'Monthly expenses generated successfully', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to generate expenses', type: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleMarkExpensePaid = async (expense) => {
    try {
      await markExpensePaid(expense.id);
      setToast({ message: 'Expense marked as paid', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: 'Failed to mark expense as paid', type: 'error' });
    }
  };

  const handleMarkEMIPaid = async (emi) => {
    try {
      await markEMIPaid(emi.loan_id, emi.id);
      setToast({ message: 'EMI marked as paid', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: 'Failed to mark EMI as paid', type: 'error' });
    }
  };

  const handleMarkDebtPaid = async (debt) => {
    const confirmed = window.confirm(`Mark "${debt.debt_name}" as fully paid?`);
    if (!confirmed) return;

    try {
      await payDebt(debt.id, {});
      setToast({ message: 'Debt marked as paid', type: 'success' });
      triggerRefresh();
    } catch (err) {
      setToast({ message: 'Failed to mark debt as paid', type: 'error' });
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0';
    // Convert string to number if needed
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
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

  const pendingExpenses = overview?.expenses?.filter((e) => e.status === 'pending') || [];
  const paidExpenses = overview?.expenses?.filter((e) => e.status === 'paid') || [];
  const pendingEMIs = overview?.emis?.filter((e) => e.status === 'pending') || [];
  const paidEMIs = overview?.emis?.filter((e) => e.status === 'paid') || [];
  const pendingDebts = overview?.debts?.filter((d) => d.status !== 'paid') || [];

  const displayExpenses = showPendingOnly ? pendingExpenses : overview?.expenses || [];
  const displayEMIs = showPendingOnly ? pendingEMIs : overview?.emis || [];
  const displayDebts = showPendingOnly ? pendingDebts : overview?.debts || [];

  const allCleared = overview?.status === 'cleared';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-3 sm:p-4 md:p-8">
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Finance Dashboard</h1>
            <p className="text-slate-400">Track your monthly finances</p>
          </div>
          <MonthSelector />
        </div>

        {/* Summary Cards */}
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
            title="Balance"
            amount={overview?.summary?.balance || 0}
            type="balance"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            }
          />
          <SummaryCard
            title="Pending Items"
            amount={overview?.summary?.pending_count || 0}
            type="pending"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-amber-400 font-semibold">{overview?.summary?.pending_count} pending payment(s)</p>
                <p className="text-amber-400/70 text-sm">Amount pending: {formatCurrency(overview?.summary?.pending_amount || 0)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleGenerateExpenses}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 
                     hover:bg-blue-500/20 transition-all duration-200 font-medium disabled:opacity-50 
                     disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <svg className="inline w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="inline w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate Monthly Expenses
              </>
            )}
          </button>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPendingOnly}
              onChange={(e) => setShowPendingOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 
                       focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-0"
            />
            <span className="text-sm text-slate-300">Show pending only</span>
          </label>
        </div>

        {/* Income Section */}
        {overview?.income && overview.income.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Income ({overview.income.length})
            </h2>
            <div className="grid gap-3">
              {overview.income.map((inc) => (
                <div key={inc.id} className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{inc.source}</h3>
                      {inc.description && <p className="text-sm text-slate-400">{inc.description}</p>}
                      <p className="text-xs text-slate-500 mt-1">Received: {formatDate(inc.received_on)}</p>
                    </div>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(inc.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Expenses Section */}
        {displayExpenses.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Monthly Expenses ({pendingExpenses.length} pending / {paidExpenses.length} paid)
            </h2>
            <div className="grid gap-3">
              {displayExpenses.map((expense) => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onMarkPaid={handleMarkExpensePaid}
                />
              ))}
            </div>
          </div>
        )}

        {/* EMIs Section */}
        {displayEMIs.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              EMI Payments ({pendingEMIs.length} pending / {paidEMIs.length} paid)
            </h2>
            <div className="grid gap-3">
              {displayEMIs.map((emi) => (
                <div key={emi.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">{emi.loan_name}</h3>
                        <StatusBadge status={emi.status} />
                      </div>
                      <div className="flex gap-4 text-sm text-slate-400">
                        <span>Payment #{emi.payment_number}</span>
                        <span>Due: {formatDate(emi.payment_date)}</span>
                        <span>Principal: {formatCurrency(emi.principal_paid)}</span>
                        <span>Interest: {formatCurrency(emi.interest_paid)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold text-white">{formatCurrency(emi.emi_amount)}</p>
                      {emi.status === 'pending' && (
                        <button
                          onClick={() => handleMarkEMIPaid(emi)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border 
                                   border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200 
                                   text-sm font-medium"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debts Section */}
        {displayDebts.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Debts Due ({pendingDebts.length})
            </h2>
            <div className="grid gap-3">
              {displayDebts.map((debt) => (
                <div key={debt.id} className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-white font-semibold">{debt.debt_name}</h3>
                        <StatusBadge status={debt.status} />
                      </div>
                      <div className="flex gap-4 text-sm text-slate-400">
                        {debt.creditor && <span>To: {debt.creditor}</span>}
                        {debt.due_date && <span>Due: {formatDate(debt.due_date)}</span>}
                        {debt.amount_paid > 0 && (
                          <span>Paid: {formatCurrency(debt.amount_paid)} / {formatCurrency(debt.total_amount)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold text-white">
                        {formatCurrency(debt.total_amount - (debt.amount_paid || 0))}
                      </p>
                      {debt.status !== 'paid' && (
                        <button
                          onClick={() => handleMarkDebtPaid(debt)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border 
                                   border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-200 
                                   text-sm font-medium"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investments Section */}
        {overview?.investments && overview.investments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Investments ({overview.investments.length})
            </h2>
            <div className="grid gap-3">
              {overview.investments.map((inv) => (
                <div key={inv.id} className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-semibold">{inv.name}</h3>
                      <p className="text-sm text-slate-400 capitalize">{inv.investment_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-500 mt-1">Date: {formatDate(inv.invested_on)}</p>
                    </div>
                    <p className="text-xl font-bold text-purple-400">{formatCurrency(inv.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !overview?.expenses?.length && !overview?.emis?.length && !overview?.debts?.length && !overview?.income?.length && !overview?.investments?.length && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No financial data for this month</h3>
            <p className="text-slate-400 mb-6">Start by generating monthly expenses or adding income</p>
            <button
              onClick={handleGenerateExpenses}
              disabled={generating}
              className="px-6 py-3 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 
                       hover:bg-blue-500/20 transition-all duration-200 font-medium disabled:opacity-50"
            >
              Generate Monthly Expenses
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
