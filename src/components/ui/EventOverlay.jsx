import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ArrowLeftRight,
  Flag,
  ShieldAlert,
  AlertTriangle,
  Trophy,
  X,
} from 'lucide-react';
import { MOTION_EASE } from '../../utils/motion';

/**
 * EventOverlay — Real-time Gen Z Stadium Animation Overlay for Live Match Center.
 * Triggers punchy, context-specific motion for:
 *   - goal (هدف)
 *   - yellow (بطاقة صفراء)
 *   - red (بطاقة حمراء / طرد)
 *   - sub (تبديل)
 *   - penalty (خصم نقاط / شغب)
 *   - forfeit (انسحاب فريق)
 *   - fulltime (صافرة النهاية)
 */
const EVENT_CONFIG = {
  goal: {
    label: 'هدف!',
    enTag: 'GOAL',
    bg: 'bg-arena-surface',
    border: 'border-fanta-orange',
    stripe: 'bg-fanta-orange',
    badgeBg: 'bg-fanta-volt text-arena-bg',
    accentText: 'text-fanta-volt',
    shadow: 'shadow-[0_0_0_2px_#E8C87F,0_20px_50px_-10px_rgba(232,200,127,0.65)]',
    Icon: Flame,
  },
  yellow: {
    label: 'بطاقة صفراء',
    enTag: 'YELLOW CARD',
    bg: 'bg-arena-surface',
    border: 'border-fanta-amber',
    stripe: 'bg-fanta-amber',
    badgeBg: 'bg-fanta-amber text-arena-bg',
    accentText: 'text-fanta-amber',
    shadow: 'shadow-[0_0_0_2px_#F1C96E,0_20px_48px_-10px_rgba(255,208,0,0.5)]',
    Icon: null,
    cardColor: 'bg-fanta-amber border-amber-200',
  },
  red: {
    label: 'بطاقة حمراء — طرد!',
    enTag: 'RED CARD',
    bg: 'bg-arena-surface',
    border: 'border-fanta-crimson',
    stripe: 'bg-fanta-crimson',
    badgeBg: 'bg-fanta-crimson text-white',
    accentText: 'text-fanta-crimson',
    shadow: 'shadow-[0_0_0_2px_#FD7181,0_20px_50px_-10px_rgba(255,46,84,0.65)]',
    Icon: null,
    cardColor: 'bg-fanta-crimson border-rose-300',
  },
  sub: {
    label: 'تبديل تكتيكي',
    enTag: 'SUBSTITUTION',
    bg: 'bg-arena-surface',
    border: 'border-fanta-sky',
    stripe: 'bg-fanta-sky',
    badgeBg: 'bg-fanta-sky text-arena-bg',
    accentText: 'text-fanta-sky',
    shadow: 'shadow-[0_0_0_2px_#83BDE8,0_20px_48px_-10px_rgba(0,210,255,0.45)]',
    Icon: ArrowLeftRight,
  },
  penalty: {
    label: 'قرار انضباطي — خصم نقاط',
    enTag: 'DISCIPLINARY',
    bg: 'bg-arena-surface',
    border: 'border-fanta-orange',
    stripe: 'bg-fanta-orange',
    badgeBg: 'bg-fanta-orange text-arena-bg',
    accentText: 'text-fanta-orange',
    shadow: 'shadow-[0_0_0_2px_#E8C87F,0_20px_48px_-10px_rgba(232,200,127,0.55)]',
    Icon: AlertTriangle,
  },
  forfeit: {
    label: 'انسحاب فريق',
    enTag: 'FORFEIT',
    bg: 'bg-arena-surface',
    border: 'border-fanta-crimson',
    stripe: 'bg-fanta-crimson',
    badgeBg: 'bg-fanta-crimson text-white',
    accentText: 'text-fanta-crimson',
    shadow: 'shadow-[0_0_0_2px_#FD7181,0_20px_48px_-10px_rgba(255,46,84,0.55)]',
    Icon: ShieldAlert,
  },
  fulltime: {
    label: 'صافرة النهاية!',
    enTag: 'FULL TIME',
    bg: 'bg-arena-surface',
    border: 'border-fanta-volt',
    stripe: 'bg-fanta-volt',
    badgeBg: 'bg-fanta-volt text-arena-bg',
    accentText: 'text-fanta-volt',
    shadow: 'shadow-[0_0_0_2px_#A4D4B6,0_20px_50px_-10px_rgba(164,212,182,0.45)]',
    Icon: Trophy,
  },
};

export default function EventOverlay({ event, onDismiss }) {
  useEffect(() => {
    if (!event) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') onDismiss?.();
    };
    window.addEventListener('keydown', handleKey);
    const timer = setTimeout(() => onDismiss?.(), 5500);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(timer);
    };
  }, [event, onDismiss]);

  const config = event ? EVENT_CONFIG[event.type] || EVENT_CONFIG.goal : null;

  return (
    <AnimatePresence>
      {event && config && (
        <div
          className="fixed inset-x-0 top-20 z-[100] px-4 flex justify-center pointer-events-none"
          role="status"
          aria-live="assertive"
          aria-atomic="true"
        >
          <motion.div
            key={event.id || `${event.type}-${event.minute}`}
            initial={{ opacity: 0, y: -36, scale: 0.86 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.92 }}
            transition={MOTION_EASE.punch}
            className={`glass-card pointer-events-auto relative w-full max-w-md rounded-2xl border-2 overflow-hidden ${config.bg} ${config.border} ${config.shadow}`}
          >
            {/* Top Energy Bar */}
            <div className={`h-1.5 w-full ${config.stripe}`} />

            <div className="p-4 flex items-center gap-4">
              {/* Visual Emblem */}
              <motion.div
                initial={
                  event.type === 'yellow' || event.type === 'red'
                    ? { rotate: -28, scale: 0.4, y: 18 }
                    : { scale: 0.4, rotate: -15 }
                }
                animate={
                  event.type === 'yellow' || event.type === 'red'
                    ? { rotate: -8, scale: 1, y: 0 }
                    : { scale: 1, rotate: 0 }
                }
                transition={MOTION_EASE.spring}
                className="shrink-0"
                aria-hidden="true"
              >
                {config.cardColor ? (
                  <div
                    className={`w-11 h-14 rounded-lg border-2 ${config.cardColor} shadow-lg`}
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${config.badgeBg}`}
                  >
                    {config.Icon ? (
                      <config.Icon size={30} strokeWidth={2.5} />
                    ) : (
                      <Flag size={28} strokeWidth={2.5} />
                    )}
                  </div>
                )}
              </motion.div>

              {/* Copy & Minute Stamp */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-display font-extrabold tracking-wider ${config.badgeBg}`}
                  >
                    {config.enTag}
                  </span>
                  {(event.displayMinute || event.minute != null) && (
                    <span className="num-tabular text-xs font-bold px-2 py-0.5 rounded-md bg-arena-elevated text-arena-ink border border-arena-border">
                      {event.displayMinute || `${event.minute}'`}
                    </span>
                  )}
                </div>

                <h3 className={`font-display font-extrabold text-2xl leading-tight ${config.accentText}`}>
                  {config.label}
                </h3>

                <p className="text-base font-bold text-arena-ink truncate mt-0.5">
                  {event.playerName || event.teamName || event.title}
                </p>

                {event.detail && (
                  <p className="text-xs font-medium text-arena-muted mt-0.5 line-clamp-2">
                    {event.detail}
                  </p>
                )}
              </div>

              {/* Close Button (44px tap target) */}
              <button
                type="button"
                onClick={onDismiss}
                aria-label="إغلاق الإشعار"
                className="w-11 h-11 rounded-xl flex items-center justify-center text-arena-muted hover:text-arena-ink hover:bg-arena-elevated transition-colors cursor-pointer shrink-0"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
