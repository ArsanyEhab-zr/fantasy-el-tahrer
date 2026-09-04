import CardboardContainer from '../primitives/CardboardContainer';
import StandingsRow from './StandingsRow';
import MaskingTape from '../primitives/MaskingTape';

/**
 * GroupTable — Standings table for a single group.
 */
export default function GroupTable({ groupName, standings, className = '' }) {
  return (
    <CardboardContainer variant="card" className={`!p-0 overflow-hidden mb-5 ${className}`}>
      {/* Group header */}
      <div className="relative bg-scrap-ink text-white px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-stamp text-base" style={{ transform: 'rotate(-1deg)' }}>
          {groupName}
        </h3>
        <MaskingTape color="cyan" position="top-right" width="50px" rotation={12} />
        
        {/* Column headers */}
        <div className="flex items-center gap-3 text-typewriter text-[8px] text-white/50 tracking-wider">
          <span>لعب</span>
          <span>فاز</span>
          <span>خسر</span>
          <span>±</span>
          <span>نقاط</span>
        </div>
      </div>

      {/* Rows */}
      <div className="px-2 py-1">
        {standings.map((entry, idx) => (
          <StandingsRow key={entry.teamId} entry={entry} rank={idx + 1} />
        ))}
      </div>
    </CardboardContainer>
  );
}
