import React from 'react';
import StatusBadge from './StatusBadge';

export default function LoanCard({ loan, onViewSchedule, onEdit, onClose, onDelete }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateProgress = () => {
    const start = new Date(loan.start_date);
    const end = new Date(loan.end_date);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.max((elapsed / total) * 100, 0), 100);
    return Math.round(progress);
  };

  const progress = calculateProgress();
  const isActive = loan.status === 'active';

  return (
    <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-white">{loan.loan_name}</h3>
            <StatusBadge status={loan.status} />
          </div>
          
          {loan.notes && (
            <p className="text-sm text-slate-400 mb-3">{loan.notes}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Principal</span>
              <p className="text-white font-semibold">{formatCurrency(loan.principal_amount)}</p>
            </div>
            <div>
              <span className="text-slate-500">EMI Amount</span>
              <p className="text-white font-semibold">{formatCurrency(loan.emi_amount)}</p>
            </div>
            <div>
              <span className="text-slate-500">Interest Rate</span>
              <p className="text-white font-semibold">{loan.interest_rate}% p.a.</p>
            </div>
            <div>
              <span className="text-slate-500">Tenure</span>
              <p className="text-white font-semibold">{loan.tenure_months} months</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {onViewSchedule && (
            <button
              onClick={() => onViewSchedule(loan)}
              className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 
                       hover:bg-blue-500/20 transition-all duration-200 text-sm font-medium whitespace-nowrap"
            >
              View Schedule
            </button>
          )}
          
          <div className="flex gap-2">
            {isActive && onEdit && (
              <button
                onClick={() => onEdit(loan)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Edit loan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
            
            {isActive && onClose && (
              <button
                onClick={() => onClose(loan)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-amber-400 hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Close loan"
                title="Close/Foreclose loan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(loan)}
                className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-700 
                         transition-all duration-200"
                aria-label="Delete loan"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Loan Progress</span>
          <span className="text-slate-300 font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{formatDate(loan.start_date)}</span>
          <span>{formatDate(loan.end_date)}</span>
        </div>
      </div>
    </div>
  );
}
