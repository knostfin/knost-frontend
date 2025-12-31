import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// Accessible modal with focus trapping, ESC/overlay close, and scroll lock
export default function Modal({
  open,
  children,
  overlayClassName = '',
  contentClassName = '',
  maxHeightClass = 'max-h-[calc(100vh-96px)]',
  onClose,
  ariaLabelledBy,
  ariaDescribedBy,
}) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previousActiveRef = useRef(null);
  // Track number of open modals to handle scroll lock safely across multiple modals
  // Module-scoped counter
  if (typeof window !== 'undefined' && !window.__knostModalOpenCount) {
    window.__knostModalOpenCount = 0;
  }

  // Lock body scroll and remember previous active element
  useEffect(() => {
    if (open) {
      previousActiveRef.current = document.activeElement;
      window.__knostModalOpenCount = (window.__knostModalOpenCount || 0) + 1;
      document.body.style.overflow = 'hidden';
    }
    return () => {
      if (open) {
        window.__knostModalOpenCount = Math.max((window.__knostModalOpenCount || 1) - 1, 0);
        if (window.__knostModalOpenCount === 0) {
          document.body.style.overflow = '';
        }
      }
      const prev = previousActiveRef.current;
      if (prev instanceof HTMLElement && document.contains(prev)) {
        prev.focus({ preventScroll: true });
      }
    };
  }, [open]);

  // Trap focus and handle ESC/overlay within modal only
  useEffect(() => {
    if (!open) return undefined;

    const focusableSelectors = [
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'button:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const trapFocus = (e) => {
      if (e.key !== 'Tab' || !contentRef.current) return;
      const focusable = Array.from(contentRef.current.querySelectorAll(focusableSelectors)).filter(
        (el) => el.offsetParent !== null
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const handleKey = (e) => {
      if (e.key === 'Escape' && onClose) {
        e.stopPropagation();
        onClose();
      }
    };

    const handleClick = (e) => {
      if (onClose && e.target === overlayRef.current) {
        onClose();
      }
    };

    const overlayEl = overlayRef.current;
    contentRef.current?.addEventListener('keydown', trapFocus);
    contentRef.current?.addEventListener('keydown', handleKey);
    overlayEl?.addEventListener('mousedown', handleClick);

    return () => {
      contentRef.current?.removeEventListener('keydown', trapFocus);
      contentRef.current?.removeEventListener('keydown', handleKey);
      overlayEl?.removeEventListener('mousedown', handleClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-[1200] flex items-center justify-center p-4 ${overlayClassName}`}
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      role="presentation"
    >
      <div
        ref={contentRef}
        className={`modal-scrollbar relative overflow-hidden outline-none w-full max-w-4xl rounded-[28px] border-2 border-emerald-500/30 shadow-2xl shadow-emerald-500/20 ${maxHeightClass} ${contentClassName}`}
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(15, 23, 42, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        <div className="overflow-y-auto max-h-[calc(100vh-96px)] modal-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
