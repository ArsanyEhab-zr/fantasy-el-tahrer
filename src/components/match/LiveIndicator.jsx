/**
 * LiveIndicator — Pulsing magenta dot with "مباشر" label for live matches.
 */
export default function LiveIndicator({ minute, className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="w-3 h-3 bg-scrap-magenta rounded-full" />
        <div className="absolute inset-0 w-3 h-3 bg-scrap-magenta rounded-full animate-pulse-live" />
      </div>
      <span className="text-typewriter text-scrap-magenta text-[11px] tracking-wider">
        مباشر
      </span>
      {minute && (
        <span className="text-typewriter text-scrap-ink text-[11px]">
          {minute}'
        </span>
      )}
    </div>
  );
}
