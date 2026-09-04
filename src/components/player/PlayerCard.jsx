import { useTournament } from '../../hooks/TournamentContext';
import { useMemo } from 'react';
import { randomRotation } from '../../utils/clipPaths';
import MaskingTape from '../primitives/MaskingTape';
import StickerBadge from '../primitives/StickerBadge';

/**
 * PlayerCard — Polaroid-style player photo card.
 * White border frame with player photo, name, and tape pinning it to the page.
 */
export default function PlayerCard({ player, rotation, className = '', size = 'md', onClick }) {
  const { getTeam, getPlayer } = useTournament();

  const rot = useMemo(
    () => (rotation !== undefined ? rotation : randomRotation(-5, 5)),
    [rotation]
  );
  const team = getTeam(player.team);

  const sizeClasses = {
    sm: 'w-28',
    md: 'w-40',
    lg: 'w-52',
  }[size];

  return (
    <div
      className={`
        relative ${sizeClasses} bg-white p-2 pb-6
        shadow-hard-lg card-hover
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{ transform: `rotate(${rot}deg)` }}
      onClick={onClick}
    >
      {/* Tape */}
      <MaskingTape color="cyan" position="center" width="50px" rotation={0} />

      {/* Photo placeholder */}
      <div
        className="w-full aspect-[3/4] bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center relative overflow-hidden"
        style={{ filter: 'grayscale(10%)' }}
      >
        {/* Player emoji / avatar */}
        <span className="text-5xl">{team?.emoji || '⚽'}</span>

        {/* Jersey number watermark */}
        <span
          className="absolute bottom-1 right-1 text-stamp text-6xl text-scrap-ink/10 leading-none"
        >
          {player.number}
        </span>

        {/* Captain badge */}
        {player.isCaptain && (
          <StickerBadge color="yellow" size="sm" className="absolute top-1 left-1">
            C
          </StickerBadge>
        )}
      </div>

      {/* Name */}
      <div className="mt-2 text-center">
        <h4 className="text-marker font-bold text-sm text-scrap-ink leading-tight">
          {player.nameAr}
        </h4>
        <span className="text-typewriter text-[9px] text-scrap-outline block mt-0.5">
          {player.name} • #{player.number}
        </span>
      </div>

      {/* Team color strip */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1.5"
        style={{ backgroundColor: team?.color }}
      />
    </div>
  );
}
