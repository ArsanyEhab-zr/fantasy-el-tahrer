import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  ArrowLeftRight,
  AlertTriangle,
  ShieldAlert,
  Trophy,
  Undo2,
} from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import { MOTION_EASE } from '../../utils/motion';

const TYPE_META = {
  goal: {
    badge: '⚽ هدف',
    border: 'border-fanta-orange/80',
    pill: 'bg-fanta-orange text-arena-bg',
    Icon: Flame,
  },
  yellow: {
    badge: '🟨 كارت أصفر',
    border: 'border-fanta-amber/80',
    pill: 'bg-fanta-amber text-arena-bg',
    cardSwatch: 'bg-fanta-amber',
  },
  red: {
    badge: '🟥 كارت أحمر',
    border: 'border-fanta-crimson/85',
    pill: 'bg-fanta-crimson text-white',
    cardSwatch: 'bg-fanta-crimson',
  },
  sub: {
    badge: '🔄 تبديل',
    border: 'border-fanta-sky/80',
    pill: 'bg-fanta-sky text-arena-bg',
    Icon: ArrowLeftRight,
  },
  penalty: {
    badge: '⚠️ قرار انضباطي',
    border: 'border-fanta-orange/80',
    pill: 'bg-fanta-orange text-arena-bg',
    Icon: AlertTriangle,
  },
  forfeit: {
    badge: '🚨 انسحاب',
    border: 'border-fanta-crimson/85',
    pill: 'bg-fanta-crimson text-white',
    Icon: ShieldAlert,
  },
  fulltime: {
    badge: '🏁 نهاية المباراة',
    border: 'border-fanta-volt/80',
    pill: 'bg-fanta-volt text-arena-bg',
    Icon: Trophy,
  },
  undo: {
    badge: '↩️ تراجع في قرار',
    border: 'border-fanta-amber/85',
    pill: 'bg-fanta-amber text-arena-bg',
    Icon: Undo2,
  },
};

const UNDONE_LABELS = {
  goal: 'الهدف',
  yellow: 'الكارت الأصفر',
  red: 'الكارت الأحمر',
  sub: 'التبديل',
  penalty: 'القرار الانضباطي',
};

function formatTickerText(event, { getTeam, getPlayer }) {
  if (!event) return { title: '', detail: '' };
  const team = event.teamId ? getTeam(event.teamId) : null;
  const teamSuffix = team?.nameAr ? ` (${team.nameAr})` : '';
  const player = event.playerId ? getPlayer(event.playerId) : null;
  const playerName = player?.nameAr || event.playerName || '';

  if (event.type === 'undo') {
    const label = UNDONE_LABELS[event.undoneType] || 'القرار الأخير';
    const who = playerName ? ` — ${playerName}${teamSuffix}` : teamSuffix;
    const score =
      event.undoneType === 'goal'
        ? ` • النتيجة ${event.homeScore} - ${event.awayScore}`
        : '';
    return {
      title: `تم إلغاء ${label}${who}`,
      detail: score.trim(),
    };
  }

  if (event.type === 'sub') {
    const playerIn = (event.playerInId ? getPlayer(event.playerInId)?.nameAr : '') || event.playerInName || playerName || 'بديل';
    const playerOut = (event.playerOutId ? getPlayer(event.playerOutId)?.nameAr : '') || event.playerOutName || '';
    return {
      title: `دخول ${playerIn}${playerOut ? ` • خروج ${playerOut}` : ''}`,
      detail: team?.nameAr || '',
    };
  }

  if (event.type === 'penalty' || event.type === 'forfeit' || event.type === 'fulltime') {
    return {
      title: event.detail || `${team?.nameAr || 'قرار تحكيمي'}`,
      detail: team?.nameAr && event.detail && !event.detail.includes(team.nameAr) ? team.nameAr : '',
    };
  }

  return {
    title: `${playerName || team?.nameAr || 'حدث مباراة'}${playerName ? teamSuffix : ''}`,
    detail: event.secondYellowId ? 'طرد بعد الإنذار الثاني' : '',
  };
}

/**
 * BroadcastEventTicker — Sleek lower-third event strip anchored at the bottom edge of the 16:9 stage.
 * Displays dramatic breaking alerts for 9 seconds on new events/undos, then gently cycles recent events.
 */
export default function BroadcastEventTicker({ breakingEvent = null, recentEvents = [] }) {
  const { getTeam, getPlayer } = useTournament();
  const [cycleIndex, setCycleIndex] = useState(0);

  useEffect(() => {
    if (breakingEvent || recentEvents.length <= 1) return undefined;
    const id = setInterval(() => {
      setCycleIndex(prev => (prev + 1) % recentEvents.length);
    }, 6000);
    return () => clearInterval(id);
  }, [breakingEvent, recentEvents.length]);

  const activeEvent = breakingEvent || recentEvents[cycleIndex % Math.max(1, recentEvents.length)] || null;
  if (!activeEvent) return null;

  const isBreaking = Boolean(breakingEvent);
  const meta = TYPE_META[activeEvent.type] || TYPE_META.goal;
  const copy = formatTickerText(activeEvent, { getTeam, getPlayer });
  const minuteText = activeEvent.displayMinute || (activeEvent.minute != null ? `${activeEvent.minute}'` : '');

  return (
    <div dir="rtl" className="min-w-0 max-w-[70%] sm:max-w-[66%]">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${isBreaking ? 'brk' : 'rec'}-${activeEvent.id || activeEvent.type}`}
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={isBreaking ? MOTION_EASE.punch : { duration: 0.28, ease: MOTION_EASE.out }}
          className={`inline-flex items-center gap-1.5 sm:gap-2.5 max-w-full rounded-xl sm:rounded-2xl border backdrop-blur-md shadow-[0_10px_28px_-8px_rgba(0,0,0,0.88)] ${
            isBreaking
              ? `bg-[#071528]/94 ${meta.border} px-2.5 py-1.5 sm:px-3.5 sm:py-2`
              : 'bg-[#071528]/78 border-white/15 px-2 py-1 sm:px-3 sm:py-1.5'
          }`}
        >
          {/* Event Pill Badge */}
          <span
            className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-md font-display font-extrabold whitespace-nowrap shrink-0 ${meta.pill} ${
              isBreaking ? 'text-[10px] sm:text-xs' : 'text-[9px] sm:text-[11px]'
            }`}
          >
            {meta.cardSwatch ? (
              <span className={`inline-block w-2 h-2.5 rounded-[2px] border border-black/20 ${meta.cardSwatch}`} aria-hidden="true" />
            ) : meta.Icon ? (
              <meta.Icon size={12} strokeWidth={2.5} aria-hidden="true" />
            ) : null}
            <span>{meta.badge}</span>
          </span>

          {/* Minute Stamp */}
          {minuteText && (
            <span className="num-tabular text-[10px] sm:text-xs font-extrabold text-fanta-orange shrink-0">
              {minuteText}
            </span>
          )}

          {/* Event Copy */}
          <div className="min-w-0 flex items-center gap-1.5">
            <span
              className={`font-display font-bold text-arena-ink truncate ${
                isBreaking ? 'text-[11px] sm:text-sm' : 'text-[10px] sm:text-xs'
              }`}
            >
              {copy.title}
            </span>
            {copy.detail && (
              <span className="hidden md:inline text-[11px] font-semibold text-arena-muted truncate">
                • {copy.detail}
              </span>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
