import { AlertTriangle, Shield } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import TeamCrest from '../ui/TeamCrest';

/**
 * GroupTable — Crisp, editorial-grade League/Group Standings Table.
 * - Tabular lining figures for aligned columns
 * - Clear disciplinary point deduction badge (-N خصم • السبب) from computed penaltiesList
 * - Subtle live pulse dot when a team's row includes a live match in progress
 * - Conditional qualification highlight based on settings.enableKnockout
 */
export default function GroupTable({
  groupName,
  standings = [],
  enableKnockout = false,
  className = '',
}) {
  const { getTeam } = useTournament();

  return (
    <section
      aria-label={`جدول ترتيب ${groupName}`}
      className={`glass-card rounded-3xl border-2 border-arena-border bg-arena-surface overflow-hidden shadow-[0_12px_30px_-14px_rgba(0,0,0,0.75)] ${className}`}
    >
      {/* Group Header */}
      <div className="px-4 sm:px-5 py-3.5 bg-arena-elevated border-b border-arena-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-6 rounded-full bg-fanta-orange shrink-0" aria-hidden="true" />
          <h2 className="font-display font-extrabold text-lg sm:text-xl text-arena-ink truncate">
            {groupName}
          </h2>
        </div>
        <span className="text-xs font-display font-bold text-arena-muted shrink-0">
          {standings.length} فرق
        </span>
      </div>

      {/* Responsive Table Wrapper */}
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-right">
          <thead>
            <tr className="border-b border-arena-border text-xs font-display font-bold text-arena-muted bg-arena-bg/50">
              <th scope="col" className="py-3 pr-4 pl-2 w-10 text-center">#</th>
              <th scope="col" className="py-3 px-2">الفريق</th>
              <th scope="col" className="py-3 px-1.5 text-center w-9" title="لعب">ل</th>
              <th scope="col" className="py-3 px-1.5 text-center w-9" title="فاز">ف</th>
              <th scope="col" className="py-3 px-1.5 text-center w-9" title="تعادل">ت</th>
              <th scope="col" className="py-3 px-1.5 text-center w-9" title="خسر">خ</th>
              <th scope="col" className="py-3 px-1.5 text-center w-11" title="فارق الأهداف">±</th>
              <th scope="col" className="py-3 pl-4 pr-2 text-center w-14 text-fanta-volt">نقاط</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-arena-border/60">
            {standings.map((entry, idx) => {
              const rank = idx + 1;
              const team = getTeam(entry.teamId);
              const isLeader = rank === 1;
              const isQualifying = enableKnockout ? rank <= 2 : rank === 1;
              const goalsFor = entry.f ?? 0;
              const goalsAgainst = entry.a ?? 0;
              const gd = entry.gd != null ? entry.gd : goalsFor - goalsAgainst;
              const deducted = entry.deductedPoints || 0;
              const uniqueReasons = Array.from(
                new Set((entry.penaltiesList || []).map((p) => p.reason).filter(Boolean))
              );
              const reasonSummary = uniqueReasons.slice(0, 2).join('، ');

              return (
                <tr
                  key={entry.teamId || idx}
                  className={`transition-colors hover:bg-arena-elevated/60 ${
                    isQualifying ? 'bg-fanta-volt/[0.04]' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3.5 pr-4 pl-2 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg font-display font-extrabold text-xs num-tabular ${
                        isLeader
                          ? 'bg-fanta-volt text-arena-bg'
                          : isQualifying
                            ? 'bg-fanta-orange text-arena-bg'
                            : 'bg-arena-elevated text-arena-muted border border-arena-border'
                      }`}
                    >
                      {rank}
                    </span>
                  </td>

                  {/* Team Name, Live Dot & Disciplinary Deduction Reason */}
                  <td className="py-3.5 px-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamCrest team={team} size="xs" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-display font-bold text-sm sm:text-base text-arena-ink truncate max-w-[130px] sm:max-w-[220px]">
                            {team?.nameAr || team?.short || 'فريق غير معروف'}
                          </span>
                          {entry.isLiveActive && (
                            <span
                              title="مباراة جارية الآن"
                              className="inline-block w-2 h-2 rounded-full bg-fanta-crimson animate-pulse shrink-0"
                              aria-label="يلعب الآن"
                            />
                          )}
                        </div>
                        {deducted > 0 && (
                          <div
                            title={uniqueReasons.join(' • ')}
                            className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded bg-fanta-crimson/15 border border-fanta-crimson/40 text-[11px] font-bold text-fanta-crimson num-tabular max-w-full"
                          >
                            <AlertTriangle size={11} className="shrink-0" aria-hidden="true" />
                            <span className="truncate">
                              -{deducted} خصم{reasonSummary ? ` (${reasonSummary})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Played / Won / Drawn / Lost */}
                  <td className="py-3.5 px-1.5 text-center num-tabular text-sm font-semibold text-arena-ink">
                    {entry.p ?? 0}
                  </td>
                  <td className="py-3.5 px-1.5 text-center num-tabular text-sm font-semibold text-arena-muted">
                    {entry.w ?? 0}
                  </td>
                  <td className="py-3.5 px-1.5 text-center num-tabular text-sm font-semibold text-arena-muted">
                    {entry.d ?? 0}
                  </td>
                  <td className="py-3.5 px-1.5 text-center num-tabular text-sm font-semibold text-arena-muted">
                    {entry.l ?? 0}
                  </td>

                  {/* Goal Difference */}
                  <td
                    className={`py-3.5 px-1.5 text-center num-tabular text-sm font-bold ${
                      gd > 0
                        ? 'text-emerald-400'
                        : gd < 0
                          ? 'text-fanta-crimson'
                          : 'text-arena-muted'
                    }`}
                  >
                    {gd > 0 ? `+${gd}` : gd}
                  </td>

                  {/* Net Points (After Deductions) */}
                  <td className="py-3.5 pl-4 pr-2 text-center">
                    <span className="inline-flex items-center justify-center min-w-[34px] px-2 py-1 rounded-lg bg-arena-bg border border-arena-border font-display font-extrabold text-base num-tabular text-fanta-volt">
                      {entry.pts ?? 0}
                    </span>
                  </td>
                </tr>
              );
            })}

            {standings.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-sm text-arena-muted">
                  <Shield size={24} className="mx-auto mb-1.5 opacity-50" aria-hidden="true" />
                  <span>لا توجد فرق مسجلة في هذه المجموعة بعد.</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
