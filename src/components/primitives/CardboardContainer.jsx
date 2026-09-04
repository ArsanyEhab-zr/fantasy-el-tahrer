import { useMemo } from 'react';
import { cardClipPath, randomRotation } from '../../utils/clipPaths';
import MaskingTape from './MaskingTape';
import { DoodleSVG } from '../../utils/doodleSVGs';

const doodleTypes = ['star', 'arrow', 'circle', 'lightning', 'football', 'trophy'];
const tapeColors = ['cyan', 'pink', 'yellow'];
const tapePositions = ['top-left', 'top-right'];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * CardboardContainer — The primary structural container for the scrapbook.
 * Variants:
 *   'board'  → Heavy cardboard (brown, scores, main sections)
 *   'card'   → Light paper scrap (content cards)
 *   'note'   → Warm note-paper (stats, annotations)
 */
export default function CardboardContainer({
  variant = 'card',
  rotation,
  children,
  withTape = true,
  withDoodle = true,
  className = '',
  clipEdges = true,
  onClick,
  shadow = true,
  id,
}) {
  const clipPath = useMemo(() => (clipEdges ? cardClipPath(14) : 'none'), [clipEdges]);
  const rot = useMemo(
    () => (rotation !== undefined ? rotation : randomRotation(-1.5, 1.5)),
    [rotation]
  );
  const doodleType = useMemo(() => pickRandom(doodleTypes), []);
  const tapeColor = useMemo(() => pickRandom(tapeColors), []);
  const tapePosition = useMemo(() => pickRandom(tapePositions), []);

  const bgClasses = {
    board: 'bg-cardboard',
    card: 'bg-recycled-paper',
    note: 'bg-cardboard-light',
  }[variant];

  const shadowClass = shadow
    ? variant === 'board'
      ? 'shadow-hard-lg'
      : 'shadow-hard-md'
    : '';

  return (
    <div
      id={id}
      className={`
        relative p-5 ${bgClasses} ${shadowClass}
        ${onClick ? 'cursor-pointer card-hover' : ''}
        ${className}
      `}
      style={{
        clipPath,
        transform: `rotate(${rot}deg)`,
        '--card-angle': `${rot}deg`,
      }}
      onClick={onClick}
    >
      {/* Auto tape */}
      {withTape && (
        <MaskingTape color={tapeColor} position={tapePosition} />
      )}

      {/* Auto doodle */}
      {withDoodle && (
        <DoodleSVG
          type={doodleType}
          size={28}
          className="absolute opacity-20"
          style={{
            bottom: '8px',
            left: '8px',
            transform: `rotate(${randomRotation(-15, 15)}deg)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
