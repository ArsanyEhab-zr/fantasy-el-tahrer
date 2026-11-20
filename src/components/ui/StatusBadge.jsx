import { Radio, Clock, CheckCircle2, PauseCircle, ShieldAlert } from 'lucide-react';

/**
 * StatusBadge — Crisp status pill with vector icon + accessible text (never color alone).
 */
export default function StatusBadge({ status, timerStatus, minuteText, size = 'sm' }) {
  const isLive = status === 'مباشر' || status === 'live';
  const isPaused = isLive && timerStatus === 'paused';
  const isFinished = status === 'منتهية' || status === 'انتهت' || status === 'finished';
  const isForfeit = status === 'انسحاب' || status === 'forfeit';

  const pad = size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-[11px]';

  if (isPaused) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold ${pad} bg-fanta-amber/20 text-fanta-amber border border-fanta-amber/50 whitespace-nowrap`}
      >
        <PauseCircle size={13} strokeWidth={2.5} aria-hidden="true" />
        <span>استراحة {minuteText ? `• ${minuteText}` : ''}</span>
      </span>
    );
  }

  if (isLive) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-display font-extrabold ${pad} bg-fanta-crimson text-white whitespace-nowrap shadow-[0_0_16px_rgba(255,46,84,0.45)]`}
      >
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        <span>مباشر</span>
        {minuteText && <span className="num-tabular font-black">{minuteText}</span>}
      </span>
    );
  }

  if (isForfeit) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold ${pad} bg-fanta-crimson/15 text-fanta-crimson border border-fanta-crimson/40 whitespace-nowrap`}
      >
        <ShieldAlert size={13} strokeWidth={2.5} aria-hidden="true" />
        <span>انسحاب</span>
      </span>
    );
  }

  if (isFinished) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold ${pad} bg-arena-elevated text-arena-muted border border-arena-border whitespace-nowrap`}
      >
        <CheckCircle2 size={13} strokeWidth={2.3} aria-hidden="true" />
        <span>انتهت</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-display font-bold ${pad} bg-fanta-orange/15 text-fanta-orange border border-fanta-orange/40 whitespace-nowrap`}
    >
      <Clock size={13} strokeWidth={2.3} aria-hidden="true" />
      <span>{status || 'مجدولة'}</span>
    </span>
  );
}

export function LivePulsePill({ label = 'مباراة مباشرة الآن', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 min-h-[38px] rounded-full bg-fanta-crimson text-white font-display font-bold text-xs tracking-wide hover:brightness-110 transition-all cursor-pointer shadow-[0_6px_18px_-4px_rgba(255,46,84,0.6)]"
    >
      <Radio size={14} strokeWidth={2.6} aria-hidden="true" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}
