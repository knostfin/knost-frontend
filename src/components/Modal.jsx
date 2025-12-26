import React, { useEffect } from 'react';

export default function Modal({
  open,
  children,
  overlayClassName = '',
  contentClassName = '',
  maxHeightClass = 'max-h-[calc(100vh-96px)]'
}) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className={`modal-overlay ${overlayClassName}`}>
      <div className={`modal-content relative overflow-y-auto ${maxHeightClass} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
