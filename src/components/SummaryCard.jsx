import React from 'react';

export default function SummaryCard({ title, amount, icon, trend, type = 'default', loading = false }) {
  const getCardStyles = () => {
    const baseStyles = 'p-5 rounded-xl border backdrop-blur-sm transition-all duration-200';
    
    switch (type) {
      case 'income':
        return `${baseStyles} bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10`;
      case 'expense':
        return `${baseStyles} bg-red-500/5 border-red-500/20 hover:bg-red-500/10`;
      case 'balance':
        return `${baseStyles} bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10`;
      case 'pending':
        return `${baseStyles} bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10`;
      default:
        return `${baseStyles} bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/50`;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'income':
        return 'text-emerald-400';
      case 'expense':
        return 'text-red-400';
      case 'balance':
        return 'text-blue-400';
      case 'pending':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
    // Convert string to number if needed
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  if (loading) {
    return (
      <div className={getCardStyles()}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700/50 rounded w-24 mb-3"></div>
          <div className="h-8 bg-slate-700/50 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={getCardStyles()}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 font-medium mb-2">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">
            {type === 'pending' ? amount : formatCurrency(amount)}
          </p>
          {trend && (
            <div className="flex items-center gap-1.5 text-xs">
              {trend.direction === 'up' ? (
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                </svg>
              )}
              <span className={trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}>
                {trend.value}
              </span>
              <span className="text-slate-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg bg-slate-800/50 ${getIconColor()}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
