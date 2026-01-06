import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './ui/Button';
import Input from './ui/Input';

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
  // Separate loading state for secondary button
  secondaryLoading = false,
  children,
  // Secondary action support (for recurring delete scenarios)
  secondaryText,
  onSecondary,
  // Input support for payment dialogs
  showInput = false,
  inputLabel,
  inputType = 'text',
  inputPlaceholder = '',
}) {
  const [inputValue, setInputValue] = useState('');

  // Reset input value when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (showInput) {
      onConfirm?.(inputValue);
    } else {
      onConfirm?.();
    }
  };

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
    <Modal open={open} onClose={onCancel} size="small" ariaLabelledBy={labelledId} ariaDescribedBy={describedId}>
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg ${theme.badgeBg} border ${theme.badgeBorder} flex items-center justify-center flex-shrink-0`}>
            <svg className={`w-6 h-6 ${theme.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14 7 7 0 000-14z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 id={labelledId} className="text-lg font-semibold text-white">{title}</h3>
            {message && (
              <p id={describedId} className="text-slate-300 mt-1 text-sm">{message}</p>
            )}
            {showInput && (
              <div className="mt-4">
                <Input
                  label={inputLabel}
                  type={inputType}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder}
                  min={inputType === 'number' ? '0' : undefined}
                  step={inputType === 'number' ? '1' : undefined}
                  autoFocus
                />
              </div>
            )}
            {children && (
              <div className="mt-4">{children}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          {/* Primary and secondary actions in a row if secondary exists */}
          {secondaryText && onSecondary ? (
            <>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleConfirm}
                  loading={loading}
                  disabled={secondaryLoading}
                >
                  {confirmText}
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={onSecondary}
                  loading={secondaryLoading}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {secondaryText}
                </Button>
              </div>
              <Button
                variant="secondary"
                fullWidth
                onClick={onCancel}
                disabled={loading || secondaryLoading}
              >
                {cancelText}
              </Button>
            </>
          ) : (
            <div className="flex gap-3">
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
                onClick={handleConfirm}
                loading={loading}
              >
                {confirmText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
