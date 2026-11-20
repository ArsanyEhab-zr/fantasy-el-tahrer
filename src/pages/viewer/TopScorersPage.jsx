import { useNavigate } from 'react-router-dom';
import { Flame, Crown } from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import TopScorerRow from '../../components/player/TopScorerRow';
import TeamCrest from '../../components/ui/TeamCrest';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';
import { StaggerList, StaggerItem, RevealBlock } from '../../components/ui/MotionPrimitives';

/**
 * TopScorersPage — Live Top Scorers Race (/scorers).
 * GOALS ONLY — 100% of Assists UI/columns/stats permanently removed.
 */
export default function TopScorersPage() {
  const navigate = useNavigate();
  const { topScorers = [], getTeam, loading } = useTournament();

  // Sort strictly by goals descending (never assists)
  const rankedScorers = [...topScorers].sort((a, b) => (b.goals || 0) - (a.goals || 0));
  const leader = rankedScorers[0] || null;
  const maxGoals = leader?.goals || 1;
  const leaderTeam = leader ? getTeam(leader.teamId || leader.team) : null;

  return (
    <div className="space-y-6">
      <RevealBlock>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
          GOLDEN BOOT RACE
        </span>
        <h1 className="font-display font-extrabold text-3xl text-arena-ink leading-tight">
          سباق الهدافين
        </h1>
        <p className="text-sm text-arena-muted mt-1">
          ترتيب هدافي دوري فانتزي التحرير بناءً على الأهداف المسجلة فقط.
        </p>
      </RevealBlock>

      {loading ? (
        <LoadingSkeleton count={5} height="h-20" />
      ) : rankedScorers.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="لا توجد أهداف مسجلة حتى الآن"
          description="سيظهر هنا ترتيب الهدافين فور انطلاق المباريات وتسجيل أول الأهداف."
        />
      ) : (
        <>
          {/* #1 Golden Boot Spotlight Card */}
          {leader && (
            <RevealBlock>
              <button
                type="button"
                onClick={() => navigate(`/player/${leader.id}`)}
                className="glass-card w-full text-right rounded-3xl border-2 border-fanta-volt bg-scoreboard-turf p-5 sm:p-6 flex items-center justify-between gap-4 shadow-[0_14px_36px_-12px_rgba(164,212,182,0.3)] cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="min-w-0 space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fanta-volt text-arena-bg font-display font-extrabold text-xs">
                    <Crown size={14} strokeWidth={2.6} aria-hidden="true" />
                    <span>متصدر الهدافين</span>
                  </span>
                  <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-arena-ink truncate">
                    {leader.nameAr}
                  </h2>
                  <div className="inline-flex items-center gap-2">
                    <TeamCrest team={leaderTeam} size="xs" />
                    <span className="text-sm font-bold text-arena-muted">
                      {leaderTeam?.nameAr || leaderTeam?.short || ''}
                    </span>
                  </div>
                </div>

                <div className="px-5 py-3 rounded-2xl bg-arena-bg border-2 border-fanta-volt text-center shrink-0">
                  <div className="font-display font-extrabold text-4xl sm:text-5xl num-tabular text-fanta-volt leading-none">
                    {leader.goals || 0}
                  </div>
                  <div className="text-xs font-display font-bold text-arena-muted mt-1">
                    هدف
                  </div>
                </div>
              </button>
            </RevealBlock>
          )}

          {/* Full Ranked List */}
          <StaggerList className="space-y-2.5">
            {rankedScorers.map((player, index) => (
              <StaggerItem key={player.id}>
                <TopScorerRow
                  player={player}
                  rank={index + 1}
                  maxGoals={maxGoals}
                  onClick={() => navigate(`/player/${player.id}`)}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        </>
      )}
    </div>
  );
}
