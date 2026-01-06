import React from 'react';
import Spinner from './Spinner';

const variants = {
  primary: 'bg-teal-500 text-white hover:bg-teal-400 focus-visible:ring-teal-300/60 border border-teal-500/30',
  secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 focus-visible:ring-slate-500/40 border border-slate-700/80',
  ghost: 'bg-transparent text-slate-200 hover:bg-slate-800/60 border border-slate-700/60 focus-visible:ring-slate-500/40',
  danger: 'bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-300/60 border border-red-500/30',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  as: Component = 'button',
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leadingIcon = null,
  trailingIcon = null,
  children,
  className = '',
  ...rest
}) {
  const isDisabled = disabled || loading;
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_10px_30px_rgba(0,0,0,0.2)] active:scale-[0.99]';
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <Component
      type={Component === 'button' ? type : undefined}
      className={`${base} ${variantClass} ${sizeClass} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={isDisabled}
      aria-busy={loading}
      {...rest}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {leadingIcon && !loading ? leadingIcon : null}
      <span className="truncate">{children}</span>
      {trailingIcon && !loading ? trailingIcon : null}
    </Component>
  );
}
