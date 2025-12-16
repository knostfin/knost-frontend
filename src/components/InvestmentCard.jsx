import React from 'react';
import StatusBadge from './StatusBadge';

export default function InvestmentCard({ investment, onEdit, onDelete }) {
  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const calculateReturns = () => {
    if (investment.current_value && investment.amount) {
      const returns = investment.current_value - investment.amount;
      const percentage = ((returns / investment.amount) * 100).toFixed(2);
      return { amount: returns, percentage };
    }
    return null;
  };

  const returns = calculateReturns();
  const isProfit = returns && returns.amount > 0;

  const getInvestmentIcon = () => {
    switch (investment.investment_type) {
      case 'mutual_fund':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'stocks':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'savings':
      case 'fd':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'gold':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  return (
    <div className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-800/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              {getInvestmentIcon()}
            </div>
            <div>
              <h3 className="text-white font-semibold">{investment.name}</h3>
              <p className="text-sm text-slate-400 capitalize">
                {investment.investment_type.replace(/_/g, ' ')}
              </p>
            </div>
            <StatusBadge status={investment.status} />
          </div>
          
          {investment.notes && (
            <p className="text-sm text-slate-400 mb-3">{investment.notes}</p>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Invested Amount</span>
              <p className="text-white font-semibold">{formatCurrency(investment.amount)}</p>
            </div>
            {investment.current_value && (
              <div>
                <span className="text-slate-500">Current Value</span>
                <p className="text-white font-semibold">{formatCurrency(investment.current_value)}</p>
              </div>
            )}
            <div>
              <span className="text-slate-500">Invested On</span>
              <p className="text-white font-semibold">{formatDate(investment.invested_on)}</p>
            </div>
            {investment.maturity_date && (
              <div>
                <span className="text-slate-500">Maturity Date</span>
                <p className="text-white font-semibold">{formatDate(investment.maturity_date)}</p>
              </div>
            )}
          </div>

          {returns && (
            <div className="mt-4 p-3 rounded-lg bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Returns</span>
                <div className="text-right">
                  <p className={`text-lg font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{formatCurrency(returns.amount)}
                  </p>
                  <p className={`text-xs ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isProfit ? '+' : ''}{returns.percentage}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={() => onEdit(investment)}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700 
                       transition-all duration-200"
              aria-label="Edit investment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          
          {onDelete && (
            <button
              onClick={() => onDelete(investment)}
              className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-red-400 hover:bg-slate-700 
                       transition-all duration-200"
              aria-label="Delete investment"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
