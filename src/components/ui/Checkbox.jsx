import React from 'react';

export default function Checkbox({ id, name, checked, onChange, label, description, disabled = false }) {
  return (
    <label className={`flex items-start gap-3 cursor-pointer ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`} htmlFor={id || name}>
      <input
        id={id || name}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-emerald-500/30 text-emerald-500 bg-emerald-500/5 backdrop-blur-sm"
      />
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
    </label>
  );
}
