import { useTournament } from '../hooks/TournamentContext';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import BracketView from '../components/tournament/BracketView';
import CardboardContainer from '../components/primitives/CardboardContainer';

export default function BracketPage() {
  const { bracket, loading } = useTournament();

  if (loading) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="الأدوار الإقصائية" showBack />
        <div className="flex justify-center items-center h-64">
          <h2 className="text-stamp text-xl animate-pulse text-scrap-ink/50" style={{ transform: 'rotate(-2deg)' }}>
            جاري التحميل...
          </h2>
        </div>
        </ScrapbookPage>
    );
  }

  if (!loading && bracket.length === 0) {
    return (
      <ScrapbookPage>
        <ScrapbookHeader title="الأدوار الإقصائية" showBack />
        <div className="flex justify-center items-center h-64">
          <CardboardContainer variant="note" rotation={-1} className="p-6 text-center w-3/4">
            <p className="text-stamp text-xl text-scrap-ink/60">لا توجد بيانات حتى الآن</p>
          </CardboardContainer>
        </div>
        </ScrapbookPage>
    );
  }

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="الأدوار الإقصائية" showBack />
      
      <div className="mt-4 animate-fade-in-up">
        <BracketView matches={bracket} />
      </div>

      </ScrapbookPage>
  );
}
