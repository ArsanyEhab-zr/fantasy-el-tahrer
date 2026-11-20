import { motion } from 'framer-motion';
import {
  Flame,
  ArrowLeftRight,
  AlertTriangle,
  ShieldAlert,
  Trophy,
  Clock,
} from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import { MOTION_EASE } from '../../utils/motion';

/**
 * MatchTimeline — Real-time RTL event timeline stamped with exact minutes (e.g., 14', 20+2').
 * Strictly excludes Assists — displays Goals, Yellow Cards, Red Cards, Substitutions, Penalties, Forfeits, Full Time.
 */

const EVENT_STYLES = {
  goal: {
    label: 'هدف',
    ring: 'border-fanta-orange bg-fanta-orange/15 text-fanta-orange',
    pill: 'bg-fanta-orange text-arena-bg',
    Icon: Flame,
  },
  yellow: {
    label: 'بطاقة صفراء',
    ring: 'border-fanta-amber bg-fanta-amber/15 text-fanta-amber',
    pill: 'bg-fanta-amber text-arena-bg',
    cardSwatch: 'bg-fanta-amber',
  },
  red: {
    label: 'بطاقة حمراء — طرد',
    ring: 'border-fanta-crimson bg-fanta-crimson/15 text-fanta-crimson',
    pill: 'bg-fanta-crimson text-white',
    cardSwatch: 'bg-fanta-crimson',
  },
  sub: {
    label: 'تبديل',
    ring: 'border-fanta-sky bg-fanta-sky/15 text-fanta-sky',
    pill: 'bg-fanta-sky text-arena-bg',
    Icon: ArrowLeftRight,
  },
  penalty: {
    label: 'خصم نقاط',
    ring: 'border-fanta-orange bg-fanta-orange/15 text-fanta-orange',
    pill: 'bg-fanta-orange text-arena-bg',
    Icon: AlertTriangle,
  },
  forfeit: {
    label: 'انسحاب فريق',
    ring: 'border-fanta-crimson bg-fanta-crimson/15 text-fanta-crimson',
    pill: 'bg-fanta-crimson text-white',
    Icon: ShieldAlert,
  },
  fulltime: {
    label: 'نهاية المباراة',
    ring: 'border-fanta-volt bg-fanta-volt/15 text-fanta-volt',
    pill: 'bg-fanta-volt text-arena-bg',
    Icon: Trophy,
  },
};

export default function MatchTimeline({ events = [], className = '' }) {
  const { getTeam, getPlayer } = useTournament();

  // Strictly remove any legacy 'assist' events from display
  const cleanEvents = (events || []).filter((e) => e && e.type !== 'assist');

  if (cleanEvents.length === 0) {
    return (
      <div
        className={`glass-card rounded-2xl border-2 border-dashed border-arena-border bg-arena-surface/60 p-8 text-center ${className}`}
      >
        <Clock size={28} className="mx-auto text-arena-muted mb-2" aria-hidden="true" />
        <p className="font-display font-bold text-base text-arena-ink">
          لا توجد أحداث مسجلة حتى الآن
        </p>
        <p className="text-xs text-arena-muted mt-1">
          ستظهر الأهداف والبطاقات والتبديلات هنا فور تسجيلها من الحكم.
        </p>
      </div>
    );
  }

  return (
    <ol className={`relative space-y-3 ${className}`} aria-label="الخط الزمني لأحداث المباراة">
      {/* Vertical Spine Line (RTL right side) */}
      <div
        className="absolute top-3 bottom-3 right-[21px] w-0.5 bg-arena-border"
        aria-hidden="true"
      />

      {cleanEvents.map((event, idx) => {
        const style = EVENT_STYLES[event.type] || EVENT_STYLES.goal;
        const player = event.playerId ? getPlayer(event.playerId) : null;
        const playerIn = event.playerInId ? getPlayer(event.playerInId) : null;
        const playerOut = event.playerOutId ? getPlayer(event.playerOutId) : null;
        const team = event.teamId ? getTeam(event.teamId) : null;

        const displayMinute =
          event.displayMinute || (event.minute != null ? `${event.minute}'` : "0'");
        const primaryName =
          event.type === 'sub'
            ? playerIn?.nameAr || event.playerInName || event.playerName || player?.nameAr || 'لاعب بديل'
            : player?.nameAr || event.playerName || team?.nameAr || 'قرار تحكيمي';

        const subDetail =
          event.type === 'sub' && (playerOut?.nameAr || event.playerOutName)
            ? `خروج: ${playerOut?.nameAr || event.playerOutName}`
            : event.detail;

        return (
          <motion.li
            key={event.id || `${event.type}-${idx}`}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: Math.min(idx * 0.04, 0.3), ease: MOTION_EASE.out }}
            className="relative flex items-start gap-3.5 pr-0.5"
          >
            {/* Minute Node Badge */}
            <div
              className={`relative z-10 w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 font-display font-extrabold text-xs num-tabular ${style.ring}`}
            >
              {displayMinute}
            </div>

            {/* Event Card */}
            <div className="glass-card flex-1 min-w-0 rounded-2xl bg-arena-surface border border-arena-border p-3.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md font-display font-extrabold text-[11px] ${style.pill}`}
                  >
                    {style.label}
                  </span>
                  {team && (
                    <span className="text-xs font-bold text-arena-muted truncate">
                      {team.nameAr || team.short}
                    </span>
                  )}
                </div>

                <p className="font-display font-bold text-base text-arena-ink leading-snug truncate">
                  {primaryName}
                </p>

                {subDetail && (
                  <p className="text-xs font-semibold text-arena-muted mt-0.5">
                    {subDetail}
                  </p>
                )}
              </div>

              {/* Crisp Event Vector Emblem */}
              <div
                className="w-10 h-10 rounded-xl bg-arena-elevated border border-arena-border flex items-center justify-center shrink-0"
                aria-hidden="true"
              >
                {style.cardSwatch ? (
                  <span className={`w-4 h-5.5 rounded-[3px] ${style.cardSwatch} block`} />
                ) : style.Icon ? (
                  <style.Icon
                    size={19}
                    strokeWidth={2.4}
                    className={style.ring.split(' ').find((c) => c.startsWith('text-'))}
                  />
                ) : null}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
