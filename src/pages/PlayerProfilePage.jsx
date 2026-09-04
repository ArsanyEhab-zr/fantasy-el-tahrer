import { useParams } from 'react-router-dom';
import { useTournament } from '../hooks/TournamentContext';
import ScrapbookPage from '../components/layout/ScrapbookPage';
import ScrapbookHeader from '../components/layout/ScrapbookHeader';
import PlayerProfile from '../components/player/PlayerProfile';
import CardboardContainer from '../components/primitives/CardboardContainer';

export default function PlayerProfilePage() {
  const { id } = useParams();
  const { getPlayer, loading } = useTournament();
  
  const player = getPlayer(id);

  return (
    <ScrapbookPage>
      <ScrapbookHeader title="ملف اللاعب" showBack />
      
      <div className="mb-6 animate-paper-drop">
        {loading ? (
          <div className="text-center mt-10">
            <span className="text-marker text-scrap-ink/50 animate-pulse">جاري تحميل اللاعب...</span>
          </div>
        ) : player ? (
          <PlayerProfile player={player} />
        ) : (
          <div className="flex justify-center items-center h-64">
            <CardboardContainer variant="note" rotation={-1} className="p-6 text-center w-3/4">
              <p className="text-stamp text-xl text-scrap-ink/60">لم يتم العثور على اللاعب</p>
            </CardboardContainer>
          </div>
        )}
      </div>

      </ScrapbookPage>
  );
}
