import { Calendar, Clock, MapPin, ChevronLeft } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../ui/TeamCrest';
import StatusBadge from '../ui/StatusBadge';
import { formatMatchDateTime } from '../../utils/formatters';

/**
 * MatchCard — Compact high-contrast match card for schedules, upcoming fixtures, and results.
 */
export default function MatchCard({ match, onClick, className = '' }) {
  const { getTeam } = useTournament();
  if (!match) return null;

  const home = getTeam(match.homeTeamId || match.homeTeam);
  const away = getTeam(match.awayTeamId || match.awayTeam);
  const isLive = match.status === 'مباشر' || match.status === 'live';
  const isScheduled = match.status === 'مجدولة' || match.status === 'scheduled';
  const scheduled = formatMatchDateTime(match.scheduledAt || match.date);

  const Tag = onClick ? 'button' : 'article';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`glass-card w-full text-right rounded-2xl border-2 p-4 transition-all ${
        isLive
          ? 'bg-arena-surface border-fanta-crimson shadow-[0_8px_24px_-8px_rgba(255,46,84,0.4)]'
          : 'bg-arena-surface border-arena-border hover:border-fanta-orange/60'
      } ${onClick ? 'cursor-pointer active:scale-[0.99]' : ''} ${className}`}
    >
      {/* Top Row: Round + Exact Date/Time + Status */}
      <div className="flex items-center justify-between gap-2 mb-3.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {match.round && (
            <span className="text-xs font-display font-bold text-arena-muted bg-arena-elevated px-2.5 py-0.5 rounded-md border border-arena-border whitespace-nowrap">
              {match.round}
            </span>
          )}
          {scheduled && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-arena-muted whitespace-nowrap">
              <Calendar size={12} className="text-fanta-orange shrink-0" aria-hidden="true" />
              <span>{scheduled.datePart}</span>
              <span className="text-arena-border">•</span>
              <Clock size={12} className="text-fanta-volt shrink-0" aria-hidden="true" />
              <span className="num-tabular text-arena-ink font-bold">{scheduled.timePart}</span>
            </span>
          )}
        </div>

        <StatusBadge status={match.status} timerStatus={match.timerStatus} />
      </div>

      {/* Matchup Row */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Home */}
        <div className="flex items-center gap-2.5 min-w-0">
          <TeamCrest team={home} size="sm" />
          <span className="font-display font-bold text-sm sm:text-base text-arena-ink truncate">
            {home?.nameAr || home?.short || 'يُحدد'}
          </span>
        </div>

        {/* Center Score or Kick-off VS */}
        <div className="px-3 py-1.5 rounded-xl bg-arena-bg border border-arena-border flex items-center justify-center gap-2 shrink-0">
          {isScheduled ? (
            <span className="font-display font-extrabold text-sm tracking-widest text-fanta-orange px-1">
              VS
            </span>
          ) : (
            <>
              <span className="font-display font-extrabold text-xl num-tabular text-fanta-orange">
                {match.homeScore ?? 0}
              </span>
              <span className="text-arena-muted font-bold text-sm" aria-hidden="true">
                -
              </span>
              <span className="font-display font-extrabold text-xl num-tabular text-fanta-volt">
                {match.awayScore ?? 0}
              </span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center justify-end gap-2.5 min-w-0">
          <span className="font-display font-bold text-sm sm:text-base text-arena-ink truncate text-left">
            {away?.nameAr || away?.short || 'يُحدد'}
          </span>
          <TeamCrest team={away} size="sm" />
        </div>
      </div>

      {/* Optional Pitch / CTA Footer */}
      {(match.pitch || (isLive && onClick)) && (
        <div className="mt-3 pt-2.5 border-t border-arena-border/60 flex items-center justify-between text-xs">
          {match.pitch ? (
            <span className="inline-flex items-center gap-1 text-arena-muted font-semibold">
              <MapPin size={12} className="text-fanta-volt" aria-hidden="true" />
              <span>{match.pitch}</span>
            </span>
          ) : (
            <span />
          )}
          {isLive && onClick && (
            <span className="inline-flex items-center gap-1 font-display font-bold text-fanta-orange">
              <span>افتح مركز البث المباشر</span>
              <ChevronLeft size={14} aria-hidden="true" />
            </span>
          )}
        </div>
      )}
    </Tag>
  );
}
