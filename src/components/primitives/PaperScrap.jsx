import { useMemo } from 'react';
import { randomRotation } from '../../utils/clipPaths';

/**
 * PaperScrap — A small colored paper fragment used for tags, labels, and event nodes.
 */
export default function PaperScrap({
  color = 'paper',
  children,
  rotation,
  className = '',
  size = 'md',
}) {
  const rot = useMemo(
    () => (rotation !== undefined ? rotation : randomRotation(-4, 4)),
    [rotation]
  );

  const colorMap = {
    paper: 'bg-white',
    cyan: 'bg-scrap-cyan',
    pink: 'bg-scrap-magenta',
    brown: 'bg-scrap-brown-light',
    yellow: 'bg-amber-200',
  };

  const sizeMap = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <div
      className={`
        inline-block ${colorMap[color]} ${sizeMap[size]}
        shadow-hard-sm font-marker font-semibold
        ${className}
      `}
      style={{
        transform: `rotate(${rot}deg)`,
        clipPath: `polygon(
          2% 0%, 98% 2%, 100% 98%, 1% 100%
        )`,
      }}
    >
      {children}
    </div>
  );
}
