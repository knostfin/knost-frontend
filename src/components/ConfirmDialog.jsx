import React from 'react';
import Modal from './Modal';
import Button from './ui/Button';

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

  const labelledId = 'confirm-dialog-title';
  const describedId = message ? 'confirm-dialog-message' : undefined;
  return (
    <Modal open={open} onClose={onCancel} contentClassName="p-6 w-full max-w-md" ariaLabelledBy={labelledId} ariaDescribedBy={describedId}>
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-lg ${theme.badgeBg} border ${theme.badgeBorder} flex items-center justify-center`}>
          <svg className={`w-6 h-6 ${theme.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 id={labelledId} className="text-lg font-semibold text-white">{title}</h3>
          {message && (
            <p id={describedId} className="text-slate-300 mt-1 text-sm">{message}</p>
          )}
          {children && (
            <div className="mt-4">{children}</div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <Button
          variant="secondary"
          fullWidth
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          fullWidth
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
