import { useMemo } from 'react';
import { tapeClipPath, randomRotation } from '../../utils/clipPaths';

/**
 * MaskingTape — Decorative semi-transparent tape strips.
 * Placed at corners of cards, across headers, or to "hold" elements down.
 */
export default function MaskingTape({
  color = 'cyan',
  rotation,
  position = 'top-left',
  width = '90px',
  height = '26px',
  className = '',
  label,
  animated = false,
}) {
  const clipPath = useMemo(() => tapeClipPath(), []);
  const rot = useMemo(
    () => (rotation !== undefined ? rotation : {
      'top-left': randomRotation(-20, -8),
      'top-right': randomRotation(8, 20),
      'center': randomRotation(-5, 5),
      'bottom-left': randomRotation(-20, -8),
      'bottom-right': randomRotation(8, 20),
    }[position]),
    [rotation, position]
  );

  const colorMap = {
    cyan: 'bg-scrap-cyan/70',
    pink: 'bg-scrap-magenta/70',
    yellow: 'bg-amber-300/70',
  };

  const positionMap = {
    'top-left': 'top-[-6px] right-[-10px]',
    'top-right': 'top-[-6px] left-[-10px]',
    'center': 'top-[-6px] left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-[-6px] right-[-10px]',
    'bottom-right': 'bottom-[-6px] left-[-10px]',
  };

  return (
    <div
      className={`
        absolute z-30 ${positionMap[position]}
        ${colorMap[color]}
        tape-texture
        ${animated ? 'animate-tape-rustle' : ''}
        ${className}
      `}
      style={{
        width,
        height,
        clipPath,
        transform: `rotate(${rot}deg)`,
        '--tape-angle': `${rot}deg`,
      }}
    >
      {label && (
        <span className="relative z-10 flex items-center justify-center h-full text-[9px] font-typewriter font-bold text-scrap-ink/80 tracking-widest uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
