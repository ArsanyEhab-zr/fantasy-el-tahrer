import { useTournament } from '../../hooks/TournamentContext';
import PlayerCard from './PlayerCard';
import StatBar from './StatBar';
import CardboardContainer from '../primitives/CardboardContainer';
import PaperScrap from '../primitives/PaperScrap';
import InkDoodle from '../primitives/InkDoodle';

/**
 * PlayerProfile — Full profile page content with stats and bio.
 * All data comes from Firebase via TournamentContext.
 */
export default function PlayerProfile({ player }) {
  const { getTeam } = useTournament();

  const team = getTeam(player.team);

  return (
    <div className="space-y-5">
      {/* Player card + quick stats */}
      <div className="flex gap-4 items-start">
        <PlayerCard player={player} rotation={-4} size="md" />

        {/* Quick stats */}
        <div className="flex-1 space-y-2 pt-4">
          <PaperScrap color="cyan" size="sm" rotation={2}>
            {player.position || 'لاعب'}
          </PaperScrap>

          <div className="flex items-center gap-2 mt-1 text-marker text-sm">
            <span>{team?.emoji}</span>
            <span className="font-bold">{team?.nameAr || team?.short || ''}</span>
          </div>

          {player.jerseyNumber != null && (
            <div className="text-typewriter text-xs text-scrap-outline">
              رقم القميص: {player.jerseyNumber}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mt-3">
            <StatPill label="أهداف" value={player.goals || 0} emoji="⚽" />
            <StatPill label="تمريرات" value={player.assists || 0} emoji="👟" />
            <StatPill label="أصفر" value={player.yellowCards || 0} emoji="🟡" />
            <StatPill label="أحمر" value={player.redCards || 0} emoji="🔴" />
          </div>
        </div>
      </div>

      {/* Performance bars */}
      <CardboardContainer variant="note" rotation={1}>
        <h3 className="text-stamp text-base mb-3" style={{ transform: 'rotate(-1deg)' }}>
          الأداء
        </h3>
        <div className="space-y-3">
          <StatBar label="الأهداف" value={player.goals || 0} maxValue={10} color="cyan" />
          <StatBar label="التمريرات الحاسمة" value={player.assists || 0} maxValue={10} color="pink" />
        </div>
        <InkDoodle type="star" size={22} className="top-2 left-2 opacity-30" />
      </CardboardContainer>
    </div>
  );
}

function StatPill({ label, value, emoji }) {
  return (
    <div className="bg-white px-2 py-1.5 shadow-hard-sm text-center" style={{ clipPath: 'polygon(2% 0%, 98% 3%, 100% 97%, 0% 100%)' }}>
      <div className="text-stamp text-lg leading-none">{value}</div>
      <div className="text-[9px] text-scrap-outline mt-0.5 font-marker">{emoji} {label}</div>
    </div>
  );
}
