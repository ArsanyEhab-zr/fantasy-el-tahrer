import { useTournament } from '../hooks/TournamentContext';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import GroupTable from '../components/tournament/GroupTable';
import CardboardContainer from '../components/primitives/CardboardContainer';

export default function StandingsPage() {
  const { groups, loading } = useTournament();

  if (loading) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="الترتيب" showBack />
        <div className="flex justify-center items-center h-64">
          <h2 className="text-stamp text-xl animate-pulse text-scrap-ink/50" style={{ transform: 'rotate(-2deg)' }}>
            جاري التحميل...
          </h2>
        </div>
        </ScrapbookPage>
    );
  }

  const validGroups = groups.filter(g => g.standings && g.standings.length > 0);

  if (!loading && validGroups.length === 0) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="الترتيب" showBack />
        <div className="flex justify-center items-center h-64">
          <CardboardContainer variant="note" rotation={-2} className="p-6 text-center w-3/4">
            <p className="text-stamp text-xl text-scrap-ink/60">لم يتم إضافة مجموعات حتى الآن</p>
          </CardboardContainer>
        </div>
        </ScrapbookPage>
    );
  }

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="الترتيب" showBack />

      <div className="space-y-6 animate-fade-in-up">
        {/* Intro Note */}
        <CardboardContainer variant="note" rotation={-1.5}>
          <p className="text-marker text-sm text-scrap-ink font-semibold">
            يتأهل الأول والثاني من كل مجموعة إلى الدور نصف النهائي.
          </p>
        </CardboardContainer>

        {/* Render ALL groups dynamically — skip groups with no standings */}
        {groups
          .filter(group => group.standings && group.standings.length > 0)
          .map((group, idx) => (
          <div
            key={group.id}
            style={{ animationDelay: `${0.1 * (idx + 1)}s`, opacity: 1 }}
            className="animate-fade-in-up"
          >
            <GroupTable groupName={group.name || group.id} standings={group.standings} />
          </div>
        ))}

        {/* BULLETPROOF SPACER */}
        <div className="h-24 w-full shrink-0"></div>
      </div>

      </ScrapbookPage>
  );
}
