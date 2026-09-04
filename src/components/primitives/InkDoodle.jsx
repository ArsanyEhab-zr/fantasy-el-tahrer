import { DoodleSVG } from '../../utils/doodleSVGs';
import { randomRotation } from '../../utils/clipPaths';
import { useMemo } from 'react';

/**
 * InkDoodle — Wrapper around DoodleSVG for positioned doodle decorations.
 * Always absolutely positioned within parent.
 */
export default function InkDoodle({
  type = 'star',
  size = 24,
  className = '',
  animated = true,
  style = {},
}) {
  const rot = useMemo(() => randomRotation(-20, 20), []);

  return (
    <div
      className={`absolute pointer-events-none ${className}`}
      style={{
        transform: `rotate(${rot}deg)`,
        ...style,
      }}
    >
      <DoodleSVG type={type} size={size} animated={animated} />
    </div>
  );
}
