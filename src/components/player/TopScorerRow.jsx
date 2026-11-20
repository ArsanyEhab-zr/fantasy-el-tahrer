import { ChevronLeft, Flame } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../ui/TeamCrest';

/**
 * TopScorerRow — Goals ONLY leaderboard row (ZERO Assists).
 */
export default function TopScorerRow({ player, rank, maxGoals = 1, onClick, className = '' }) {
  const { getTeam } = useTournament();
  const team = getTeam(player.teamId || player.team);
  const goals = player.goals || 0;
  const barPercent = maxGoals > 0 ? Math.max(8, Math.round((goals / maxGoals) * 100)) : 0;

  const isTop1 = rank === 1;
  const isTop3 = rank <= 3;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`glass-card w-full text-right rounded-2xl border-2 p-3.5 flex items-center gap-3.5 transition-all cursor-pointer active:scale-[0.99] ${
        isTop1
          ? 'bg-arena-surface border-fanta-volt shadow-[0_8px_24px_-10px_rgba(164,212,182,0.3)]'
          : 'bg-arena-surface border-arena-border hover:border-fanta-orange/60'
      } ${className}`}
    >
      {/* Rank Badge */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-display font-extrabold text-base num-tabular ${
          rank === 1
            ? 'bg-fanta-volt text-arena-bg'
            : rank === 2
              ? 'bg-fanta-orange text-arena-bg'
              : rank === 3
                ? 'bg-fanta-amber text-arena-bg'
                : 'bg-arena-elevated text-arena-muted border border-arena-border'
        }`}
      >
        {rank}
      </div>

      {/* Player & Team Info + Goal Progress */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-extrabold text-base sm:text-lg text-arena-ink truncate">
            {player.nameAr}
          </span>
          {player.jerseyNumber != null && (
            <span className="num-tabular text-xs font-bold px-1.5 py-0.5 rounded bg-arena-elevated text-arena-muted border border-arena-border shrink-0">
              #{player.jerseyNumber}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <TeamCrest team={team} size="xs" className="!w-5 !h-5 !text-[10px] !rounded-md" />
          <span className="text-xs font-semibold text-arena-muted truncate">
            {team?.nameAr || team?.short || 'فريق الدوري'}
          </span>
        </div>

        {/* Relative Goal Race Bar */}
        <div className="mt-2 h-1.5 w-full rounded-full bg-arena-bg overflow-hidden">
          <div
            className={`h-full rounded-full ${isTop1 ? 'bg-fanta-volt' : 'bg-fanta-orange'}`}
            style={{ width: `${barPercent}%` }}
          />
        </div>
      </div>

      {/* Goals Count ONLY */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className={`px-3 py-1.5 rounded-xl border flex flex-col items-center justify-center min-w-[56px] ${
            isTop3
              ? 'bg-arena-bg border-fanta-orange/50'
              : 'bg-arena-bg border-arena-border'
          }`}
        >
          <span
            className={`font-display font-extrabold text-2xl leading-none num-tabular ${
              isTop1 ? 'text-fanta-volt' : 'text-fanta-orange'
            }`}
          >
            {goals}
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-arena-muted mt-1">
            <Flame size={10} className="text-fanta-orange" aria-hidden="true" />
            <span>هدف</span>
          </span>
        </div>
        <ChevronLeft size={18} className="text-arena-muted" aria-hidden="true" />
      </div>
    </button>
  );
}
