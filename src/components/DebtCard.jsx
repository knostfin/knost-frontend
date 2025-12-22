import React from 'react';
import StatusBadge from './StatusBadge';

export default function DebtCard({ debt, onPay, onEdit, onDelete }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const remainingAmount = debt.total_amount - (debt.amount_paid || 0);
  const paidPercentage = ((debt.amount_paid || 0) / debt.total_amount) * 100;
  const isPending = debt.status === 'pending';
  const isPartiallyPaid = debt.status === 'partially_paid';

  return (
    <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="text-lg font-bold text-white">{debt.debt_name}</h3>
            <StatusBadge status={debt.status} />
            {debt.last_payment_date && (
              <span className="px-2 py-1 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                Last paid: {formatDate(debt.last_payment_date).replace(/, \d{4}$/, '')}
              </span>
            )}
            {debt.payment_count > 0 && (
              <span className="px-2 py-1 rounded-md bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold">
                {debt.payment_count} payment{debt.payment_count > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {debt.creditor && (
            <p className="text-sm text-slate-400 mb-1">Creditor: {debt.creditor}</p>
          )}
          
          {debt.notes && (
            <p className="text-sm text-slate-400 mb-3">{debt.notes}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Total Amount</span>
              <p className="text-white font-semibold">{formatCurrency(debt.total_amount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Remaining</span>
              <p className="text-red-400 font-semibold">{formatCurrency(remainingAmount)}</p>
            </div>
            {debt.amount_paid > 0 && (
              <div>
                <span className="text-slate-500">Paid</span>
                <p className="text-emerald-400 font-semibold">{formatCurrency(debt.amount_paid)}</p>
              </div>
            )}
            {debt.due_date && (
              <div>
                <span className="text-slate-500">Due Date</span>
                <p className="text-white font-semibold">{formatDate(debt.due_date)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {(isPending || isPartiallyPaid) && onPay && (
            <button
              onClick={() => onPay(debt)}
              className="px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 
                       hover:bg-emerald-500/20 transition-all duration-200 text-sm font-medium whitespace-nowrap"
            >
              Pay Debt
            </button>
          )}
          
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(debt)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Edit debt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(debt)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Delete debt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {debt.amount_paid > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Payment Progress</span>
            <span className="text-slate-300 font-medium">{Math.round(paidPercentage)}%</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
              style={{ width: `${paidPercentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
