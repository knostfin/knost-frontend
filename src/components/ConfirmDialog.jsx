import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
  children,
}) {
  const theme = variant === 'danger'
    ? {
        iconColor: 'text-red-400',
        badgeBg: 'bg-red-500/10',
        badgeBorder: 'border-red-500/30',
        confirmBtn: 'bg-red-500 hover:bg-red-600',
      }
    : {
        iconColor: 'text-teal-400',
        badgeBg: 'bg-teal-500/10',
        badgeBorder: 'border-teal-500/30',
        confirmBtn: 'bg-teal-500 hover:bg-teal-600',
      };

  return (
    <Modal open={open} contentClassName="p-6 w-full max-w-md top-[40%]" overlayClassName="z-[70]">
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${theme.badgeBg} border ${theme.badgeBorder} flex items-center justify-center`}>
          <svg className={`w-6 h-6 ${theme.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-slate-300 mt-1 text-sm">{message}</p>
          {children && (
            <div className="mt-4">{children}</div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 rounded-lg bg-slate-800/50 text-slate-300 hover:bg-slate-700 transition-all font-medium border border-slate-700/50"
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 px-4 py-2 rounded-lg text-white transition-all font-medium ${theme.confirmBtn}`}
          disabled={loading}
        >
          {loading ? 'Please wait…' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
