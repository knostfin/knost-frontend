import React from 'react';
import { getLogoUrl, getCloudinarySrcSet } from '../utils/cloudinary';

// Reusable logo mark that hides white backgrounds by masking/filling the PNG shape.
export default function LogoMark({ size = 48, className = '', rounded = true, fillGradient }) {
  const tileClasses = [
    'relative flex items-center justify-center bg-gradient-to-br shadow-lg shadow-[var(--primary)]/30 ring-1 ring-white/10 overflow-hidden',
    rounded ? 'rounded-2xl' : 'rounded-lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const gradient = fillGradient || 'linear-gradient(135deg, #ffffff, #d7f9f3)';
  
  // Generate optimized logo URLs
  const logoUrl = getLogoUrl(Math.ceil(size * 0.7));
  const logoSrcSet = getCloudinarySrcSet('logo.png', [
    Math.ceil(size * 0.7),
    Math.ceil(size * 1.4),
    Math.ceil(size * 2.1),
  ]);

  return (
    <div
      className={tileClasses}
      style={{
        width: size,
        height: size,
        backgroundImage: 'linear-gradient(140deg, var(--primary), #5ddfcd, #0f172a)',
      }}
    >
      {/* Masked fill to knock out any white background from the PNG */}
      <div
        aria-hidden="true"
        className="h-[70%] w-[70%] drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)]"
        style={{
          WebkitMaskImage: `url('${logoUrl}')`,
          maskImage: `url('${logoUrl}')`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          backgroundImage: gradient,
        }}
      />
      {/* Fallback <img> so the logo still renders if mask is unsupported */}
      <img
        src={logoUrl}
        srcSet={logoSrcSet}
        sizes={`${size}px`}
        alt="Knost logo"
        loading="eager"
        decoding="async"
        className="absolute inset-0 h-full w-full object-contain mix-blend-multiply opacity-90"
      />
    </div>
  );
}
