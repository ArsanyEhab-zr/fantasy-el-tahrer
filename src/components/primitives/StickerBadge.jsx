import { useMemo } from 'react';
import { randomRotation } from '../../utils/clipPaths';

/**
 * StickerBadge — Small irregular badge that looks like a hole-punch reinforcement or sticker.
 * Used for statuses, chips, and small data indicators.
 */
export default function StickerBadge({
  children,
  color = 'cyan',
  size = 'md',
  className = '',
  animated = true,
}) {
  const rot = useMemo(() => randomRotation(-8, 8), []);

  const colorMap = {
    cyan: 'bg-scrap-cyan text-scrap-ink',
    pink: 'bg-scrap-magenta text-white',
    brown: 'bg-scrap-brown text-white',
    yellow: 'bg-amber-300 text-scrap-ink',
    green: 'bg-emerald-400 text-scrap-ink',
    red: 'bg-scrap-error text-white',
    white: 'bg-white text-scrap-ink',
  };

  const sizeMap = {
    sm: 'w-7 h-7 text-[10px]',
    md: 'w-9 h-9 text-xs',
    lg: 'w-12 h-12 text-sm',
  };

  return (
    <div
      className={`
        ${sizeMap[size]} ${colorMap[color]}
        rounded-full flex items-center justify-center
        font-typewriter font-bold shadow-hard-sm
        ${animated ? 'animate-sticker-pop' : ''}
        ${className}
      `}
      style={{
        transform: `rotate(${rot}deg)`,
        '--sticker-angle': `${rot}deg`,
        borderRadius: '50% 48% 52% 49%',
      }}
    >
      {children}
    </div>
  );
}
