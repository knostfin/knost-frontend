import React from 'react';

export default function SummaryCard({ title, amount, icon, trend, type = 'default', loading = false }) {
  const getCardConfig = () => {
    switch (type) {
      case 'income':
        return {
          gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
          border: 'border-emerald-500/30',
          hoverBorder: 'hover:border-emerald-400/60',
          shadow: 'hover:shadow-emerald-500/20',
          glow: 'hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
          iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10',
          iconColor: 'text-emerald-400',
          accentColor: 'text-emerald-400',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case 'expense':
        return {
          gradient: 'from-red-500/10 via-orange-500/5 to-transparent',
          border: 'border-red-500/30',
          hoverBorder: 'hover:border-red-400/60',
          shadow: 'hover:shadow-red-500/20',
          glow: 'hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]',
          iconBg: 'bg-gradient-to-br from-red-500/20 to-orange-500/10',
          iconColor: 'text-red-400',
          accentColor: 'text-red-400',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          ),
        };
      case 'balance':
        return {
          gradient: 'from-blue-500/10 via-cyan-500/5 to-transparent',
          border: 'border-blue-500/30',
          hoverBorder: 'hover:border-blue-400/60',
          shadow: 'hover:shadow-blue-500/20',
          glow: 'hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
          iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
          iconColor: 'text-blue-400',
          accentColor: 'text-blue-400',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          ),
        };
      case 'pending':
        return {
          gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
          border: 'border-amber-500/30',
          hoverBorder: 'hover:border-amber-400/60',
          shadow: 'hover:shadow-amber-500/20',
          glow: 'hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]',
          iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10',
          iconColor: 'text-amber-400',
          accentColor: 'text-amber-400',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      default:
        return {
          gradient: 'from-slate-500/10 via-slate-500/5 to-transparent',
          border: 'border-slate-700/50',
          hoverBorder: 'hover:border-slate-600/60',
          shadow: 'hover:shadow-slate-500/20',
          glow: '',
          iconBg: 'bg-slate-800/50',
          iconColor: 'text-slate-400',
          accentColor: 'text-slate-400',
          icon: null,
        };
    }
  };

  const config = getCardConfig();

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '₹0';
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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/40 via-slate-800/20 to-transparent border border-slate-700/40 backdrop-blur-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-3 flex-1">
              <div className="h-3 bg-slate-700/50 rounded w-28"></div>
              <div className="h-9 bg-slate-700/50 rounded w-36"></div>
            </div>
            <div className="w-12 h-12 bg-slate-700/30 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden group">
      {/* Glassmorphic background with gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-80 group-hover:opacity-100 transition-opacity duration-300`}></div>
      
      {/* Subtle animated background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} opacity-0 group-hover:opacity-50 transition-opacity duration-500`}></div>
      
      {/* Main card content */}
      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          {/* Title section */}
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1">{title}</p>
          </div>
          
          {/* Icon with gradient background */}
          <div className={`p-2.5 rounded-xl ${config.iconBg} ${config.iconColor} backdrop-blur-sm border border-white/5 group-hover:scale-110 transition-transform duration-300`}>
            {config.icon}
          </div>
        </div>

        {/* Amount - Primary focus */}
        <div className="mb-2">
          <p className={`text-3xl font-black bg-gradient-to-br from-white to-slate-300 bg-clip-text text-transparent tracking-tight leading-none`}>
            {type === 'pending' ? amount : formatCurrency(amount)}
          </p>
        </div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center gap-1.5 text-xs mt-auto">
            {trend.direction === 'up' ? (
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
              </svg>
            )}
            <span className={`font-semibold ${trend.direction === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.value}
            </span>
            <span className="text-slate-500">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
