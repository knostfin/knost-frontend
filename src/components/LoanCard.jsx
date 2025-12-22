import React from 'react';
import StatusBadge from './StatusBadge';

const firstDefined = (...vals) => vals.find((v) => v !== null && v !== undefined);

export default function LoanCard({ loan, onViewSchedule, onEdit, onClose, onDelete }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Payment-based progress: prefer backend summary, then schedule array, else fallback fields
  const scheduleArray =
    loan.payments ||
    loan.payment_schedule ||
    loan.schedule ||
    loan.emi_schedule ||
    loan.installment_schedule ||
    [];

  const paidFromSchedule = Array.isArray(scheduleArray)
    ? scheduleArray.filter((p) => (p?.status || '').toLowerCase() === 'paid').length
    : 0;
  const totalFromSchedule = Array.isArray(scheduleArray) ? scheduleArray.length : 0;

  const summary = loan.payment_summary || loan.payments_summary || loan.schedule_summary;
  const totalFromSummaryRaw = firstDefined(
    summary?.total_payments,
    summary?.total,
    summary?.count,
    loan.tenure_months,
    0
  );
  const totalFromSummary = Number(totalFromSummaryRaw);

  const paidFromSummaryRaw = firstDefined(
    summary?.paid_count,
    summary?.paid,
    0
  );
  const paidFromSummary = Number(paidFromSummaryRaw);

  const pendingFromSummaryRaw = firstDefined(
    summary?.pending_count,
    summary?.pending
  );
  const pendingFromSummary = Number(pendingFromSummaryRaw);

  // Fallback counts from API fields
  const fallbackTotalRaw = firstDefined(
    loan.total_payments,
    loan.total_installments,
    loan.installments,
    loan.tenure_months,
    loan.emi_count,
    loan.payment_count,
    loan.total_emi_count,
    loan.schedule_count,
    0
  );
  const fallbackTotal = Number(fallbackTotalRaw);

  const fallbackPaidRaw = firstDefined(
    loan.paid_payments,
    loan.paid_installments,
    loan.paid_count,
    loan.emis_paid,
    loan.emi_paid_count,
    loan.completed_payments,
    loan.paid_emi_count,
    0
  );
  const fallbackPaid = Number(fallbackPaidRaw);

  const totalInstallments = totalFromSchedule > 0
    ? totalFromSchedule
    : (Number.isFinite(totalFromSummary) && totalFromSummary > 0
        ? totalFromSummary
        : (Number.isFinite(fallbackTotal) ? fallbackTotal : 0));

  const paidInstallments = totalFromSchedule > 0
    ? paidFromSchedule
    : (Number.isFinite(paidFromSummary)
        ? paidFromSummary
        : (Number.isFinite(fallbackPaid) ? fallbackPaid : 0));

  const pendingInstallments = (() => {
    if (Number.isFinite(pendingFromSummary)) return pendingFromSummary;
    const pendingRaw = firstDefined(loan.pending_payments, loan.pending_installments);
    const pendingNum = Number(pendingRaw);
    if (Number.isFinite(pendingNum)) return pendingNum;
    return Math.max(totalInstallments - paidInstallments, 0);
  })();
  const progress = totalInstallments > 0 ? Math.round((paidInstallments / totalInstallments) * 100) : 0;
  const isActive = loan.status === 'active';

  const overdueCount = Number(summary?.overdue_count || loan.overdue_count || 0);

  return (
    <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-white">{loan.loan_name}</h3>
            <StatusBadge status={loan.status} />
            {overdueCount > 0 && (
              <span className="px-2 py-1 rounded-md bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold">
                {overdueCount} Overdue
              </span>
            )}
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
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Paid: {paidInstallments}</span>
          <span>Pending: {pendingInstallments}</span>
          <span>Total: {totalInstallments}</span>
        </div>
      </div>
    </div>
  );
}
