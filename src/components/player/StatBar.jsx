/**
 * StatBar — Marker-stroke progress bar for player stats.
 * Fills from right to left (RTL) with a raw, bleeding edge effect.
 */
export default function StatBar({ label, value, maxValue = 100, color = 'cyan', className = '' }) {
  const percentage = Math.min((value / maxValue) * 100, 100);

  const colorMap = {
    cyan: 'bg-scrap-cyan',
    pink: 'bg-scrap-magenta',
    brown: 'bg-scrap-brown',
    yellow: 'bg-amber-400',
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-marker font-semibold text-xs text-scrap-ink">{label}</span>
        <span className="text-typewriter text-[10px] text-scrap-ink/70">{value}</span>
      </div>

      {/* Bar track */}
      <div className="h-4 bg-scrap-surface-container rounded-sm overflow-hidden relative">
        {/* Fill — marker stroke effect */}
        <div
          className={`h-full ${colorMap[color]} relative animate-marker-fill`}
          style={{
            '--fill-width': `${percentage}%`,
            width: 0,
            borderRadius: '1px',
          }}
        >
          {/* Bleeding edge texture */}
          <div
            className="absolute top-0 left-[-2px] w-[6px] h-full opacity-40"
            style={{
              background: `linear-gradient(to left, transparent, currentColor)`,
            }}
          />
        </div>

        {/* Hash marks */}
        {[25, 50, 75].map((mark) => (
          <div
            key={mark}
            className="absolute top-0 bottom-0 w-px bg-scrap-ink/10"
            style={{ right: `${mark}%` }}
          />
        ))}
      </div>
    </div>
  );
}
