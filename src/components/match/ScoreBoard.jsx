import { MapPin, Clock, Trophy } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import TeamCrest from '../ui/TeamCrest';
import StatusBadge from '../ui/StatusBadge';
import { ScoreFlipNumber } from '../ui/MotionPrimitives';
import { formatMatchDateTime } from '../../utils/formatters';

/**
 * ScoreBoard — Broadcast-grade Stadium Scoreboard for Fanta Live Match Center & Home Hero.
 * Automatically runs Zero-Lag Synced Clock via useMatchTimer (supports Pause, Stoppage Time 20+2', clock-skew clamp).
 */
export default function ScoreBoard({
  match,
  clock: externalClock = null,
  compact = false,
  className = '',
}) {
  const { getTeam, settings } = useTournament();
  const internalClock = useMatchTimer(match, settings?.halfDurationMinutes || 10);

  if (!match) return null;

  const activeClock = externalClock || internalClock;
  const homeId = match.homeTeamId || match.homeTeam;
  const awayId = match.awayTeamId || match.awayTeam;
  const home = getTeam(homeId);
  const away = getTeam(awayId);

  const isLive = match.status === 'مباشر' || match.status === 'live';
  const isFinished = match.status === 'منتهية' || match.status === 'انتهت' || match.status === 'finished';
  const isForfeit = match.status === 'انسحاب' || match.status === 'forfeit';
  const scheduled = formatMatchDateTime(match.scheduledAt || match.date);

  return (
    <section
      aria-label="لوحة نتيجة المباراة"
      className={`glass-card relative rounded-3xl border-2 border-arena-border bg-scoreboard-turf overflow-hidden shadow-[0_18px_40px_-14px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Top Citrus-to-Volt Energy Line */}
      <div
        className="h-1.5 w-full bg-gradient-to-l from-fanta-orange via-fanta-amber to-fanta-volt"
        aria-hidden="true"
      />

      <div className={compact ? 'p-4' : 'p-5 sm:p-7'}>
        {/* Top Meta Bar: Round + Status + Minute */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-arena-elevated border border-arena-border text-xs font-display font-bold text-arena-muted truncate">
              <Trophy size={13} className="text-fanta-orange shrink-0" aria-hidden="true" />
              <span className="truncate">{match.round || 'دور المجموعات'}</span>
            </span>
            {match.pitch && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-arena-elevated border border-arena-border text-xs font-semibold text-arena-muted">
                <MapPin size={12} className="text-fanta-volt shrink-0" aria-hidden="true" />
                <span>{match.pitch}</span>
              </span>
            )}
          </div>

          <StatusBadge
            status={match.status}
            timerStatus={match.timerStatus}
            minuteText={isLive ? activeClock.displayMinute : null}
            size="md"
          />
        </div>

        {/* Live Synced Match Clock Banner */}
        {isLive && (
          <div
            className="flex flex-col items-center justify-center mb-5"
            role="status"
            aria-live="off"
          >
            <div
              className={`inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl border-2 ${
                activeClock.isStoppage
                  ? 'bg-fanta-amber/15 border-fanta-amber text-fanta-amber'
                  : match.timerStatus === 'paused'
                    ? 'bg-arena-elevated border-arena-border text-arena-muted'
                    : 'bg-arena-bg/90 border-fanta-orange/60 text-arena-ink'
              }`}
            >
              <Clock size={16} strokeWidth={2.5} aria-hidden="true" />
              <span className="font-display font-extrabold text-2xl sm:text-3xl num-tabular tracking-wider leading-none">
                {activeClock.mmss}
              </span>
              {activeClock.isStoppage && (
                <span className="px-2 py-0.5 rounded-md bg-fanta-amber text-arena-bg font-display font-extrabold text-xs num-tabular">
                  بدل ضائع {activeClock.displayMinute}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Teams + Score Grid */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
          {/* Home Team */}
          <div className="flex flex-col items-center text-center min-w-0">
            <TeamCrest
              team={home}
              size={compact ? 'md' : 'lg'}
              className="mb-2.5 shadow-lg"
            />
            <h2 className="font-display font-extrabold text-base sm:text-xl text-arena-ink leading-tight line-clamp-2 w-full">
              {home?.nameAr || home?.short || 'الفريق الأول'}
            </h2>
            {home?.short && home?.nameAr && home.short !== home.nameAr && (
              <span className="text-xs font-semibold text-arena-muted mt-0.5">
                {home.short}
              </span>
            )}
          </div>

          {/* Giant Tabular Scoreboard */}
          <div className="glass-card flex items-center justify-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-arena-bg border-2 border-arena-border shadow-inner">
            <ScoreFlipNumber
              value={match.homeScore ?? 0}
              className={`font-display font-extrabold leading-none text-fanta-orange ${
                compact ? 'text-4xl' : 'text-5xl sm:text-6xl'
              }`}
            />
            <span
              className="font-display font-bold text-2xl sm:text-3xl text-arena-muted/60 select-none"
              aria-hidden="true"
            >
              :
            </span>
            <ScoreFlipNumber
              value={match.awayScore ?? 0}
              className={`font-display font-extrabold leading-none text-fanta-volt ${
                compact ? 'text-4xl' : 'text-5xl sm:text-6xl'
              }`}
            />
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center text-center min-w-0">
            <TeamCrest
              team={away}
              size={compact ? 'md' : 'lg'}
              className="mb-2.5 shadow-lg"
            />
            <h2 className="font-display font-extrabold text-base sm:text-xl text-arena-ink leading-tight line-clamp-2 w-full">
              {away?.nameAr || away?.short || 'الفريق الثاني'}
            </h2>
            {away?.short && away?.nameAr && away.short !== away.nameAr && (
              <span className="text-xs font-semibold text-arena-muted mt-0.5">
                {away.short}
              </span>
            )}
          </div>
        </div>

        {/* Footer Meta */}
        {(scheduled || isFinished || isForfeit || match.pitch) && (
          <div className="mt-5 pt-3.5 border-t border-arena-border/80 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs font-semibold text-arena-muted">
            {scheduled && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} className="text-fanta-orange" aria-hidden="true" />
                <span>{scheduled.full}</span>
              </span>
            )}
            {match.pitch && (
              <span className="sm:hidden inline-flex items-center gap-1">
                <MapPin size={13} className="text-fanta-volt" aria-hidden="true" />
                <span>{match.pitch}</span>
              </span>
            )}
            {isForfeit && match.forfeitReason && (
              <span className="text-fanta-crimson font-bold">{match.forfeitReason}</span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
