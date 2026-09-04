import { useTournament } from '../../hooks/TournamentContext';
import StickerBadge from '../primitives/StickerBadge';

/**
 * StandingsRow — A single row in the group standings table.
 * Reads Firestore field names: p, w, d, l, f, a, pts
 */
export default function StandingsRow({ entry, rank, className = '' }) {
  const { getTeam } = useTournament();

  const team = getTeam(entry.teamId);
  const isQualified = rank <= 2;

  // Compute goal difference from Firestore fields
  const goalsFor = entry.f || 0;
  const goalsAgainst = entry.a || 0;
  const gd = goalsFor - goalsAgainst;

  return (
    <div
      className={`
        flex items-center gap-2 py-2.5 px-2 border-b border-scrap-ink/10
        ${isQualified ? 'bg-scrap-cyan/5' : ''}
        ${className}
      `}
      style={{
        animationDelay: `${rank * 0.08}s`,
      }}
    >
      {/* Rank */}
      <StickerBadge
        color={rank === 1 ? 'cyan' : rank === 2 ? 'pink' : 'white'}
        size="sm"
        animated={false}
      >
        {rank}
      </StickerBadge>

      {/* Team */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-lg">{team?.emoji}</span>
        <span className="text-marker font-bold text-sm truncate">{team?.nameAr || team?.short || 'غير معروف'}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-typewriter text-[10px] text-scrap-ink/70">
        <span title="لعب">{entry.p || 0}</span>
        <span title="فاز">{entry.w || 0}</span>
        <span title="خسر">{entry.l || 0}</span>
        <span title="فارق" className={gd > 0 ? 'text-emerald-600' : gd < 0 ? 'text-scrap-error' : ''}>
          {gd > 0 ? `+${gd}` : gd}
        </span>
        <span
          className="text-stamp text-sm text-scrap-ink font-black min-w-[20px] text-center"
        >
          {entry.pts || 0}
        </span>
      </div>
    </div>
  );
}
