import { Flame, Shirt, Shield } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../ui/TeamCrest';

/**
 * PlayerProfile — Clean athletic player card (Goals, Yellow Cards, Red Cards ONLY — ZERO Assists).
 */
export default function PlayerProfile({ player }) {
  const { getTeam } = useTournament();
  if (!player) return null;

  const team = getTeam(player.teamId || player.team);

  return (
    <div className="space-y-5">
      {/* Hero Athlete Card */}
      <section className="glass-card rounded-3xl border-2 border-arena-border bg-scoreboard-turf overflow-hidden shadow-xl">
        <div className="h-1.5 w-full bg-gradient-to-l from-fanta-orange to-fanta-volt" />
        <div className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Jersey Avatar */}
          <div className="w-24 h-24 rounded-3xl bg-arena-bg border-2 border-fanta-orange flex flex-col items-center justify-center shrink-0 shadow-[4px_4px_0_#E8C87F]">
            <Shirt size={24} className="text-fanta-orange mb-0.5" aria-hidden="true" />
            <span className="font-display font-extrabold text-3xl leading-none num-tabular text-arena-ink">
              {player.jerseyNumber ?? '—'}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-right min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-fanta-volt text-arena-bg font-display font-extrabold text-xs">
                {player.position || 'لاعب'}
              </span>
              {player.isArchived && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-arena-elevated border border-arena-border text-arena-muted font-display font-bold text-xs">
                  لاعب سابق
                </span>
              )}
            </div>
            <h1 className="font-display font-extrabold text-3xl text-arena-ink leading-tight">
              {player.nameAr}
            </h1>
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-arena-surface border border-arena-border">
              <TeamCrest team={team} size="xs" />
              <span className="font-display font-bold text-sm text-arena-ink">
                {team?.nameAr || team?.short || 'غير مسجل بفريق'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid — Goals, Yellow Cards, Red Cards ONLY (Zero Assists) */}
      <section aria-label="إحصائيات اللاعب" className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl bg-arena-surface border-2 border-fanta-orange/50 p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-fanta-orange/15 text-fanta-orange flex items-center justify-center">
            <Flame size={20} strokeWidth={2.4} aria-hidden="true" />
          </div>
          <div className="font-display font-extrabold text-3xl num-tabular text-fanta-volt leading-none">
            {player.goals || 0}
          </div>
          <div className="text-xs font-bold text-arena-muted mt-1.5">الأهداف</div>
        </div>

        <div className="glass-card rounded-2xl bg-arena-surface border-2 border-arena-border p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-fanta-amber/15 flex items-center justify-center">
            <span className="w-3.5 h-5 rounded-[3px] bg-fanta-amber block" aria-hidden="true" />
          </div>
          <div className="font-display font-extrabold text-3xl num-tabular text-arena-ink leading-none">
            {player.yellowCards || 0}
          </div>
          <div className="text-xs font-bold text-arena-muted mt-1.5">إنذارات</div>
        </div>

        <div className="glass-card rounded-2xl bg-arena-surface border-2 border-arena-border p-4 text-center">
          <div className="w-9 h-9 mx-auto mb-2 rounded-xl bg-fanta-crimson/15 flex items-center justify-center">
            <span className="w-3.5 h-5 rounded-[3px] bg-fanta-crimson block" aria-hidden="true" />
          </div>
          <div className="font-display font-extrabold text-3xl num-tabular text-arena-ink leading-none">
            {player.redCards || 0}
          </div>
          <div className="text-xs font-bold text-arena-muted mt-1.5">طرد</div>
        </div>
      </section>

      {/* Team Info Strip */}
      {team && (
        <div className="glass-card rounded-2xl bg-arena-surface border border-arena-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-sm font-bold text-arena-muted">
            <Shield size={18} className="text-fanta-orange" aria-hidden="true" />
            <span>النادي الحالي في دوري فانتزي التحرير</span>
          </div>
          <span className="font-display font-extrabold text-base text-arena-ink">
            {team.nameAr}
          </span>
        </div>
      )}
    </div>
  );
}
