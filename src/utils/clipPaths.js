/**
 * Torn edge clip-path generators
 * Creates randomized jagged polygon paths for the scrapbook aesthetic.
 * Each call produces a unique set of vertices so no two tears look alike.
 */

/** Generate a single torn edge (top or bottom) */
function tornEdgePoints(side, steps = 14, maxJag = 5) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const jag = Math.random() * maxJag + 0.5;
    if (side === 'top') pts.push(`${x.toFixed(1)}% ${jag.toFixed(1)}%`);
    else pts.push(`${x.toFixed(1)}% ${(100 - jag).toFixed(1)}%`);
  }
  return pts;
}

/** Button: torn on both horizontal edges */
export function buttonClipPath(steps = 16) {
  const top = tornEdgePoints('top', steps, 6);
  const bottom = tornEdgePoints('bottom', steps, 6);
  return `polygon(${top.join(', ')}, ${bottom.reverse().join(', ')})`;
}

/** Card: slightly irregular quadrilateral with deckle edges */
export function cardClipPath(steps = 12) {
  const top = tornEdgePoints('top', steps, 3);
  const bottom = tornEdgePoints('bottom', steps, 3);
  return `polygon(${top.join(', ')}, ${bottom.reverse().join(', ')})`;
}

/** Tape: torn only on the short ends (left/right) */
export function tapeClipPath() {
  const jL1 = Math.random() * 8 + 2;
  const jL2 = Math.random() * 8 + 2;
  const jR1 = 100 - Math.random() * 8 - 2;
  const jR2 = 100 - Math.random() * 8 - 2;
  return `polygon(${jL1}% 0%, ${jR1}% 0%, ${jR2}% 100%, ${jL2}% 100%)`;
}

/** Random rotation between min and max degrees */
export function randomRotation(min = -3, max = 3) {
  return Math.random() * (max - min) + min;
}

/** Memoized clip paths (generate once per component mount) */
const clipCache = new Map();
export function getCachedClipPath(id, generator) {
  if (!clipCache.has(id)) {
    clipCache.set(id, generator());
  }
  return clipCache.get(id);
}
