import { useTournament } from '../../hooks/TournamentContext';

/**
 * TopScorerRow — Leaderboard entry for the top scorers page.
 */
export default function TopScorerRow({ player, rank, className = '', onClick }) {
  const { getTeam } = useTournament();
  const team = getTeam(player.team);

  return (
    <div 
      className={`flex items-center justify-between bg-white/60 p-3 mb-3 border-b-2 border-black/20 w-full animate-fade-in-up card-hover cursor-pointer ${className}`}
      style={{ animationDelay: `${rank * 0.06}s`, opacity: 0 }}
      onClick={onClick}
    >
      {/* Rank (Right in RTL) */}
      <div className="w-10 flex-shrink-0 flex justify-center">
        <span className={`w-8 h-8 rounded-full text-black font-bold flex items-center justify-center border-2 border-black ${rank === 1 ? 'bg-scrap-cyan' : rank === 2 ? 'bg-scrap-magenta' : 'bg-scrap-yellow'}`}>
          {rank}
        </span>
      </div>
      
      {/* Player Info */}
      <div className="flex-1 flex flex-col px-3 text-right">
        <span className="font-bold text-lg leading-none mb-1">{player.nameAr}</span>
        <span className="text-xs text-gray-700 flex items-center gap-1">
          <span>{team?.emoji}</span> 
          <span>{team?.short}</span>
        </span>
      </div>

      {/* Stats (Left in RTL) */}
      <div className="flex gap-4 items-center flex-shrink-0">
        <div className="flex flex-col items-center justify-center w-12">
          <span className="font-bold text-xl leading-none">{player.goals}</span>
          <span className="text-[10px] font-bold text-gray-500 mt-1">أهداف</span>
        </div>
        <div className="flex flex-col items-center justify-center w-12">
          <span className="font-bold text-xl leading-none">{player.assists}</span>
          <span className="text-[10px] font-bold text-gray-500 mt-1">تمريرات</span>
        </div>
      </div>
    </div>
  );
}
