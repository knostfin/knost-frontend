import React from 'react';

export default function Modal({
  open,
  children,
  overlayClassName = '',
  contentClassName = '',
  maxHeightClass = 'max-h-[calc(100vh-96px)]'
}) {
  if (!open) return null;

  return (
    <div className={`modal-overlay ${overlayClassName}`}>
      <div className={`modal-content relative overflow-y-auto ${maxHeightClass} ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
}
