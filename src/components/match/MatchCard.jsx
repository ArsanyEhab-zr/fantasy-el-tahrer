import { useTournament } from '../../hooks/TournamentContext';
import CardboardContainer from '../primitives/CardboardContainer';
import PaperScrap from '../primitives/PaperScrap';

/**
 * MatchCard — A compact match result card for schedules and results.
 */
export default function MatchCard({ match, className = '', onClick }) {
  const { getTeam, getPlayer } = useTournament();

  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);
  const isFinished = match.status === 'انتهت';

  return (
    <CardboardContainer
      variant="card"
      className={`!p-3 ${className}`}
      withDoodle={false}
      onClick={onClick}
    >
      {/* Date / Status */}
      <div className="flex justify-between items-center mb-2">
        {match.date && (
          <span className="text-typewriter text-[9px] text-scrap-outline">
            {match.date}
          </span>
        )}
        <PaperScrap
          color={isFinished ? 'brown' : 'pink'}
          size="sm"
          rotation={-1}
        >
          {match.status}
        </PaperScrap>
      </div>

      {/* Teams and score */}
      <div className="flex items-center justify-between">
        {/* Home */}
        <div className="flex items-center gap-2 flex-1">
          <span className="text-lg">{home?.emoji}</span>
          <span className="text-marker font-bold text-sm">{home?.short}</span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1 px-3">
          <span className="text-stamp text-2xl">{match.homeScore ?? '-'}</span>
          <span className="text-scrap-outline text-lg mx-0.5">-</span>
          <span className="text-stamp text-2xl">{match.awayScore ?? '-'}</span>
        </div>

        {/* Away */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-marker font-bold text-sm">{away?.short}</span>
          <span className="text-lg">{away?.emoji}</span>
        </div>
      </div>
    </CardboardContainer>
  );
}
