import { useEffect, useState } from 'react';

const CAIRO_HMS_FMT = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Africa/Cairo',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

/**
 * BroadcastVintageStamp — Subtle retro camcorder REC badge (`● REC ARSANY 20:14:09`).
 * Positioned in the safe bottom-left flex slot so it never overlaps the bottom event ticker.
 */
export default function BroadcastVintageStamp({ name = 'ARSANY' }) {
  const [timeStr, setTimeStr] = useState(() => CAIRO_HMS_FMT.format(new Date()));

  useEffect(() => {
    const id = setInterval(() => {
      setTimeStr(CAIRO_HMS_FMT.format(new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const label = (name || 'ARSANY').trim().toUpperCase();

  return (
    <div
      dir="ltr"
      aria-hidden="true"
      className="inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-black/40 backdrop-blur-[4px] border border-white/10 font-mono text-[9px] sm:text-[11px] font-bold tracking-[0.14em] text-white/90 shrink-0"
      style={{
        textShadow: '0 0 8px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.95)',
      }}
    >
      <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
        <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-80" />
        <span className="relative inline-flex rounded-full h-full w-full bg-red-500 shadow-[0_0_6px_#ef4444]" />
      </span>
      <span className="text-red-400">REC</span>
      <span className="text-fanta-orange">{label}</span>
      <span className="hidden xs:inline sm:inline text-white/75 num-tabular">{timeStr}</span>
    </div>
  );
}
