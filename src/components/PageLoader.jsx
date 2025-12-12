import React from 'react';

// Full-screen loader overlay for route transitions with fade to reduce flashing.
export default function PageLoader({ active }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#050608]/80 backdrop-blur-sm transition-opacity duration-200 ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex items-center gap-3 text-white">
        <span className="inline-block h-10 w-10 rounded-full border-2 border-white/10 border-t-[var(--primary)] animate-spin" />
        <div className="flex flex-col">
          <span className="text-sm tracking-[0.16em] uppercase text-white/70">Loading</span>
          <span className="text-base font-semibold text-white">Please wait...</span>
        </div>
      </div>
    </div>
  );
}
