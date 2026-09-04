import { useMemo } from 'react';
import { buttonClipPath, randomRotation } from '../../utils/clipPaths';

/**
 * TornPaperButton — A strip of "torn paper" that serves as a button.
 * Primary: Hot Pink (#fe00fe) paper with black bold text.
 * Secondary: Cyan (#00ccff) paper with slight texture overlay.
 */
export default function TornPaperButton({
  variant = 'primary',
  children,
  rotation,
  onClick,
  className = '',
  fullWidth = false,
  size = 'md',
  icon,
  disabled = false,
}) {
  const clipPath = useMemo(() => buttonClipPath(18), []);
  const rot = useMemo(() => (rotation !== undefined ? rotation : randomRotation(-2, 2)), [rotation]);

  const baseClasses = `
    relative font-stamp font-black tracking-wide
    text-scrap-ink cursor-pointer select-none
    press-effect transition-all duration-150
    hover:scale-[1.03] hover:shadow-hard-lg
    ${fullWidth ? 'w-full' : 'inline-block'}
    ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}
  `;

  const sizeClasses = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-8 py-3.5 text-base',
    lg: 'px-10 py-4 text-lg',
  }[size];

  const variantClasses = {
    primary: 'bg-scrap-magenta shadow-hard-md',
    secondary: 'bg-scrap-cyan shadow-hard-md',
    danger: 'bg-scrap-error text-white shadow-hard-md',
    ghost: 'bg-scrap-paper shadow-hard-sm',
  }[variant];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      style={{
        clipPath,
        transform: `rotate(${rot}deg)`,
      }}
      disabled={disabled}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        {children}
      </span>
      {/* Tape texture overlay for secondary */}
      {variant === 'secondary' && (
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.15) 1px, rgba(255,255,255,0.15) 2px)',
          }}
        />
      )}
    </button>
  );
}
