import React from 'react';

// Full-screen loader overlay for route transitions with fade to reduce flashing.
export default function PageLoader({ active }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur-sm transition-opacity duration-200 ${
        active ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Outer rotating ring */}
          <div className="w-16 h-16 rounded-full border-4 border-slate-700/30 border-t-transparent animate-spin"></div>
          {/* Inner pulsing ring */}
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-teal-400 animate-spin" style={{ animationDuration: '0.8s' }}></div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-16 h-16 rounded-full bg-teal-400/10 blur-xl animate-pulse"></div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-slate-200 font-semibold text-lg">Loading</p>
          <p className="text-slate-400 text-sm">Please wait...</p>
        </div>
      </div>
    </div>
  );
}
