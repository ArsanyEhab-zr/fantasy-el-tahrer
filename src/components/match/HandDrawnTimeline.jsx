import { useTournament } from '../../hooks/TournamentContext';
import PaperScrap from '../primitives/PaperScrap';
import { DoodleSVG } from '../../utils/doodleSVGs';

const eventIcons = {
  goal: '⚽',
  yellow: '🟨',
  red: '🟥',
  sub: '🔄',
};

const eventLabels = {
  goal: 'هدف',
  yellow: 'إنذار',
  red: 'طرد',
  sub: 'تبديل',
};

/**
 * HandDrawnTimeline — Vertical timeline of live match events.
 * Dashed hand-drawn line with alternating paper scraps.
 */
export default function HandDrawnTimeline({ events = [], className = '' }) {
  const { getTeam, getPlayer } = useTournament();

  if (!events || events.length === 0) {
    return (
      <div className={`text-center font-bold font-marker text-scrap-ink/50 p-4 ${className}`}>
        لا توجد أحداث حتى الآن
      </div>
    );
  }

  return (
    <div className={`relative pr-8 ${className}`}>
      {/* Hand-drawn dashed vertical line */}
      <svg
        className="absolute right-3 top-0 bottom-0 w-4 h-full text-scrap-ink/30"
        preserveAspectRatio="none"
      >
        <line
          x1="8" y1="0" x2="8" y2="100%"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="8 6"
          strokeLinecap="round"
        />
      </svg>

      {/* Event nodes */}
      <div className="space-y-4">
        {events.map((event, idx) => {
          const player = getPlayer(event.playerId);
          const team = getTeam(event.teamId);
          const isLeft = idx % 2 === 0;

          return (
            <div
              key={idx}
              className="relative animate-fade-in-up"
              style={{
                animationDelay: `${idx * 0.1}s`,
                opacity: 0,
              }}
            >
              {/* Node dot */}
              <div
                className={`
                  absolute right-1 top-3 w-5 h-5 rounded-full z-10
                  flex items-center justify-center text-[10px]
                  ${event.type === 'goal' ? 'bg-scrap-cyan' : ''}
                  ${event.type === 'yellow' ? 'bg-amber-300' : ''}
                  ${event.type === 'red' ? 'bg-red-500' : ''}
                  ${event.type === 'sub' ? 'bg-scrap-surface-container' : ''}
                  shadow-hard-sm
                `}
              >
                {eventIcons[event.type]}
              </div>

              {/* Event card */}
              <div className="mr-8">
                <PaperScrap
                  color={event.type === 'goal' ? 'cyan' : event.type === 'yellow' ? 'yellow' : 'paper'}
                  size="lg"
                  rotation={isLeft ? -1.5 : 1.5}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-typewriter text-[11px] font-bold">
                      {event.minute}'
                    </span>
                    <span className="text-marker font-bold text-sm">
                      {eventLabels[event.type]}
                    </span>
                  </div>
                  <div className="text-marker text-xs mt-0.5 opacity-80">
                    {player?.nameAr} — {team?.short}
                  </div>
                  {event.detail && (
                    <div className="text-[10px] mt-1 opacity-60 font-marker">
                      {event.detail}
                    </div>
                  )}
                </PaperScrap>
              </div>

              {/* Connecting doodle */}
              {event.type === 'goal' && (
                <DoodleSVG
                  type="star"
                  size={16}
                  className="absolute -left-2 top-0 text-scrap-ink opacity-30"
                  animated
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
