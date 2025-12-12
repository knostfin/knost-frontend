import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === 'success'
      ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
      : 'bg-red-500/10 border-red-500/30 text-red-300';

  return (
    <div
      className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl border ${bgColor} shadow-2xl z-[120] max-w-sm animate-slideDown backdrop-blur-md bg-black/60 flex items-center gap-3`}
    >
      <span className="text-sm leading-snug">{message}</span>
    </div>
  );
}
