import { useState } from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import GroupTable from '../../components/tournament/GroupTable';
import TeamRosterModal from '../../components/tournament/TeamRosterModal';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';
import { StaggerList, StaggerItem, RevealBlock } from '../../components/ui/MotionPrimitives';

/**
 * StandingsPage — Live League/Group Standings (/standings).
 * - Dynamically reflects real-time match scores AND disciplinary point deductions
 */
export default function StandingsPage() {
  const {
    groups = [],
    penalties = [],
    getTeam,
    loading,
  } = useTournament();
  const [selectedTeamId, setSelectedTeamId] = useState(null);

  const validGroups = groups.filter((g) => g.standings && g.standings.length > 0);

  return (
    <div className="space-y-6">
      <RevealBlock className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
            STANDINGS
          </span>
          <h1 className="font-display font-extrabold text-3xl text-arena-ink leading-tight">
            جدول الترتيب
          </h1>
        </div>

      </RevealBlock>

      {loading ? (
        <LoadingSkeleton count={2} height="h-56" />
      ) : validGroups.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="لم يتم إعداد المجموعات بعد"
          description="ستظهر جداول الترتيب هنا تلقائياً فور إضافة الفرق والمجموعات."
        />
      ) : (
        <StaggerList className="space-y-6">
          {validGroups.map((group) => (
            <StaggerItem key={group.id}>
              <GroupTable
                groupName={group.name || group.id}
                standings={group.standings}
                onSelectTeam={setSelectedTeamId}
              />
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* Disciplinary Point Deductions Notice (if any penalties exist) */}
      {penalties.length > 0 && (
        <section
          aria-label="القرارات الانضباطية وخصم النقاط"
          className="glass-card rounded-3xl bg-fanta-crimson/10 border-2 border-fanta-crimson/40 p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-fanta-crimson">
            <AlertTriangle size={20} strokeWidth={2.4} aria-hidden="true" />
            <h2 className="font-display font-extrabold text-lg">
              قرارات خصم النقاط الانضباطية
            </h2>
          </div>

          <ul className="space-y-2">
            {penalties.map((pen) => {
              const team = getTeam(pen.teamId);
              return (
                <li
                  key={pen.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-arena-surface border border-arena-border text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-arena-ink">
                      {team?.nameAr || 'فريق'}
                    </span>
                    <span className="text-xs font-semibold text-arena-muted">
                      ({pen.reason || 'قرار انضباطي'})
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-fanta-crimson text-white font-display font-extrabold text-xs num-tabular">
                    -{pen.pointsDeducted} نقاط
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <TeamRosterModal teamId={selectedTeamId} onClose={() => setSelectedTeamId(null)} />
    </div>
  );
}
