/**
 * Inline SVG doodle components
 * Hand-drawn style ink annotations for the scrapbook aesthetic.
 * All paths use wobbly control points for an imperfect, marker-drawn feel.
 */

export const doodlePaths = {
  star: `M12 2 L14.5 8.5 L21 9 L16 13.5 L17.5 20 L12 16.5 L6.5 20 L8 13.5 L3 9 L9.5 8.5 Z`,
  arrow: `M4 12 C6 11 8 11.5 12 12 C16 12.5 18 12 20 11 M16 7 L20 11 L16 15`,
  circle: `M12 3 C18 3 21 7 21 12 C21 17 17 21 12 21 C7 21 3 17 3 12 C3 7 7 3 12 3`,
  underline: `M3 18 C6 16 10 17 14 16 C18 15 20 17 22 16`,
  exclamation: `M12 3 L12 15 M12 19 L12 20`,
  lightning: `M13 2 L8 12 L13 12 L10 22 L18 10 L13 10 L16 2 Z`,
  trophy: `M8 2 L16 2 L15 8 C15 12 13 14 12 14 C11 14 9 12 9 8 Z M6 2 C4 2 3 4 4 6 L7 6 M18 2 C20 2 21 4 20 6 L17 6 M10 14 L10 18 L14 18 L14 14 M8 18 L16 18 L16 20 L8 20 Z`,
  football: `M12 3 C17 3 21 7 21 12 C21 17 17 21 12 21 C7 21 3 17 3 12 C3 7 7 3 12 3 M8 6 L10 10 L8 14 L12 16 L16 14 L14 10 L16 6 L12 4 Z`,
  crosshatch: `M4 4 L8 8 M4 8 L8 4 M4 6 L8 6 M6 4 L6 8`,
  spiralArrow: `M4 16 C4 8 8 4 16 4 M12 1 L16 4 L13 8`,
};

export const DoodleSVG = ({
  type = 'star',
  size = 24,
  className = '',
  style = {},
  strokeWidth = 2.5,
  animated = false,
}) => {
  const path = doodlePaths[type] || doodlePaths.star;
  const pathLength = 200;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-scrap-ink pointer-events-none ${className}`}
      style={{
        ...style,
        ...(animated
          ? {
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
              '--path-length': pathLength,
              animation: 'doodle-draw 0.8s ease-in-out forwards',
            }
          : {}),
      }}
    >
      <path d={path} />
    </svg>
  );
};

export default DoodleSVG;
