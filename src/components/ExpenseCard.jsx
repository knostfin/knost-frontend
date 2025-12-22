import React from 'react';
import StatusBadge from './StatusBadge';

export default function ExpenseCard({ expense, onMarkPaid, onEdit, onDelete }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isPaid = expense.status === 'paid';
  const isDebt = Boolean(
    expense.is_debt_payment ||
      expense.debt_id ||
      (expense.category && expense.category.toLowerCase().includes('debt')) ||
      (expense.description && expense.description.toLowerCase().includes('debt payment'))
  );

  return (
    <div className="p-4 rounded-lg bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-white font-semibold">{expense.category}</h3>
            <StatusBadge status={expense.status} />
            {expense.is_emi && (
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 text-xs border border-teal-500/30 font-semibold">
                EMI
              </span>
            )}
            {isDebt && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-xs border border-amber-500/30 font-semibold">
                Debt
              </span>
            )}
          </div>
          
          {expense.description && (
            <p className="text-sm text-slate-400 mb-2">{expense.description}</p>
          )}
          
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            {expense.due_date && (
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due: {formatDate(expense.due_date)}
              </span>
            )}
            {expense.payment_method && (
              <span className="capitalize">{expense.payment_method.replace(/_/g, ' ')}</span>
            )}
            {expense.is_emi && (
              <span className="flex items-center gap-1.5 text-teal-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {expense.loan_name || 'Loan'}{expense.payment_number ? ` • #${expense.payment_number}` : ''}
              </span>
            )}
            {isDebt && (
              <span className="flex items-center gap-1.5 text-amber-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9l-5 5-5-5" />
                </svg>
                {expense.debt_name || 'Debt Payment'}
              </span>
            )}
            {expense.recurring_expense_id && (
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs border border-purple-500/20">
                Recurring
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <p className="text-xl font-bold text-white">{formatCurrency(expense.amount)}</p>
          
          <div className="flex items-center gap-2">
            {!isPaid && onMarkPaid && (
              <button
                onClick={() => onMarkPaid(expense)}
                className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                         hover:bg-emerald-500/20 transition-all duration-200 text-sm font-medium"
              >
                Mark Paid
              </button>
            )}
            
            {onEdit && (
              <button
                onClick={() => onEdit(expense)}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Edit expense"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(expense)}
                className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Delete expense"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {isPaid && expense.paid_on && (
        <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
          Paid on {formatDate(expense.paid_on)}
        </div>
      )}
    </div>
  );
}
