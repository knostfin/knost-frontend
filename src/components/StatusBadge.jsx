import React from 'react';

export default function StatusBadge({ status, type = 'default' }) {
  const getStatusStyles = () => {
    const baseStyles = 'px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5';
    
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'active':
      case 'cleared':
        return `${baseStyles} bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`;
      case 'pending':
        return `${baseStyles} bg-amber-500/10 text-amber-400 border border-amber-500/20`;
      case 'overdue':
        return `${baseStyles} bg-red-500/10 text-red-400 border border-red-500/20`;
      case 'partially_paid':
        return `${baseStyles} bg-blue-500/10 text-blue-400 border border-blue-500/20`;
      case 'closed':
      case 'matured':
      case 'sold':
        return `${baseStyles} bg-slate-500/10 text-slate-400 border border-slate-500/20`;
      default:
        return `${baseStyles} bg-slate-500/10 text-slate-300 border border-slate-500/20`;
    }
  };

  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'cleared':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'overdue':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'active':
        return (
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <span className={getStatusStyles()}>
      {getStatusIcon()}
      {formatStatus(status)}
    </span>
  );
}
