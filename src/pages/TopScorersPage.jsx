import { useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/TournamentContext';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import CardboardContainer from '../components/primitives/CardboardContainer';
import TopScorerRow from '../components/player/TopScorerRow';
import InkDoodle from '../components/primitives/InkDoodle';

export default function TopScorersPage() {
  const { topScorers, loading } = useTournament();
  const navigate = useNavigate();

  if (loading) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="قائمة الهدافين" showBack />
        <div className="flex justify-center items-center h-64">
          <h2 className="text-stamp text-xl animate-pulse text-scrap-ink/50" style={{ transform: 'rotate(-2deg)' }}>
            جاري التحميل...
          </h2>
        </div>
        </ScrapbookPage>
    );
  }

  if (!loading && topScorers.length === 0) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="قائمة الهدافين" showBack />
        <div className="flex justify-center items-center h-64">
          <CardboardContainer variant="note" rotation={1.5} className="p-6 text-center w-3/4">
            <p className="text-stamp text-xl text-scrap-ink/60">لا توجد بيانات حتى الآن</p>
          </CardboardContainer>
        </div>
        </ScrapbookPage>
    );
  }

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="قائمة الهدافين" showBack />

      <CardboardContainer variant="card" className="mb-12 !px-2 pt-4">
        <div className="relative inline-block mb-4 pr-3">
          <h2 className="text-stamp text-2xl" style={{ transform: 'rotate(-2deg)' }}>
            أفضل الهدافين
          </h2>
          <InkDoodle type="star" size={24} className="-top-3 -right-2 text-scrap-cyan" />
        </div>

        <div className="flex flex-col gap-3">
          {topScorers.map((player, index) => (
            <TopScorerRow
              key={player.id}
              player={player}
              rank={index + 1}
              onClick={() => navigate(`/player/${player.id}`)}
            />
          ))}
          {/* BULLETPROOF SPACER */}
          <div className="h-24 w-full shrink-0"></div>
        </div>
      </CardboardContainer>

      </ScrapbookPage>
  );
}
