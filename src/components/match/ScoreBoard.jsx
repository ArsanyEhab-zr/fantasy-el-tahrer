import { useTournament } from '../../hooks/TournamentContext';
import CardboardContainer from '../primitives/CardboardContainer';
import LiveIndicator from './LiveIndicator';
import PaperScrap from '../primitives/PaperScrap';

/**
 * ScoreBoard — Central match score display.
 * Heavy cardboard container with team names and score.
 */
export default function ScoreBoard({ match, className = '' }) {
  const { getTeam } = useTournament();

  const home = getTeam(match.homeTeam);
  const away = getTeam(match.awayTeam);
  const isLive = match.status === 'مباشر';

  return (
    <CardboardContainer variant="board" rotation={0.5} className={`mb-6 ${className}`}>
      {/* Live indicator */}
      {isLive && (
        <div className="flex justify-center mb-3">
          <LiveIndicator minute={match.minute} />
        </div>
      )}

      {/* Half indicator */}
      {match.half && (
        <div className="flex justify-center mb-2">
          <PaperScrap color="yellow" size="sm" rotation={-2}>
            الشوط {match.half}
          </PaperScrap>
        </div>
      )}

      {/* Score display */}
      <div className="flex items-center justify-between gap-2">
        {/* Home team */}
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{home?.emoji || '❓'}</div>
          <h3
            className="text-stamp text-lg text-white leading-tight"
            style={{ transform: 'rotate(-2deg)' }}
          >
            {home?.nameAr || home?.short || 'يُحدد'}
          </h3>
        </div>

        {/* Score */}
        <div className="flex items-center gap-2">
          <span
            className="text-stamp text-5xl text-scrap-cyan"
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.5)',
            }}
          >
            {match.homeScore ?? '-'}
          </span>
          <span className="text-stamp text-3xl text-white/50 mx-1">:</span>
          <span
            className="text-stamp text-5xl text-scrap-magenta"
            style={{
              textShadow: '3px 3px 0px rgba(0,0,0,0.5)',
            }}
          >
            {match.awayScore ?? '-'}
          </span>
        </div>

        {/* Away team */}
        <div className="flex-1 text-center">
          <div className="text-3xl mb-1">{away?.emoji || '❓'}</div>
          <h3
            className="text-stamp text-lg text-white leading-tight"
            style={{ transform: 'rotate(2deg)' }}
          >
            {away?.nameAr || away?.short || 'يُحدد'}
          </h3>
        </div>
      </div>

      {/* Match stats bar */}
      {match.possession && (
        <div className="mt-4 pt-3 border-t border-white/20">
          <div className="grid grid-cols-3 gap-2 text-center text-typewriter text-[10px] text-white/70">
            <div>
              <div className="text-scrap-cyan text-sm font-bold">{match.possession.home}%</div>
              استحواذ
            </div>
            <div>
              <div className="text-white text-sm font-bold">{match.shots?.home || 0} - {match.shots?.away || 0}</div>
              تسديدات
            </div>
            <div>
              <div className="text-scrap-magenta text-sm font-bold">{match.possession.away}%</div>
              استحواذ
            </div>
          </div>
        </div>
      )}
    </CardboardContainer>
  );
}
