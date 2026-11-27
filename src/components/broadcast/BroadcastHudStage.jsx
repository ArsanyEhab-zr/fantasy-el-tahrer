import BroadcastScoreBar from './BroadcastScoreBar';
import BroadcastChannelLogo from './BroadcastChannelLogo';
import BroadcastEventTicker from './BroadcastEventTicker';
import BroadcastVintageStamp from './BroadcastVintageStamp';
import { useBroadcastEvents } from '../../hooks/useBroadcastEvents';

/**
 * BroadcastHudStage — Composable 16:9 Broadcast HUD overlay layer shared by Watch Live and OBS Overlay.
 * Strictly uses `pointer-events-none` on the container so viewers can freely interact with YouTube controls.
 */
export default function BroadcastHudStage({
  match,
  broadcast,
  isWatchLive = false,
  visibilityOverride = null,
  bottomLeftAction = null,
}) {
  const { breakingEvent, goalFlash, recentEvents } = useBroadcastEvents(match);

  const hud = visibilityOverride || broadcast?.hudVisibility || {
    scoreboard: true,
    channelLogo: true,
    eventTicker: true,
    vintageStamp: true,
  };

  const showScoreboard = hud.scoreboard !== false && Boolean(match);
  const showChannelLogo = hud.channelLogo !== false;
  const showTicker = hud.eventTicker !== false && Boolean(match);
  const showStamp = hud.vintageStamp !== false;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 overflow-hidden select-none"
      aria-label="طبقة معلومات البث المباشر"
    >
      {/* Top Broadcast Row: Physical Left = Scoreboard, Physical Right = Channel Logo */}
      <div
        dir="ltr"
        className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2.5 sm:p-4"
      >
        <div className="min-w-0 flex-1 flex justify-start">
          {showScoreboard && <BroadcastScoreBar match={match} goalFlash={goalFlash} />}
        </div>
        {showChannelLogo && <BroadcastChannelLogo logoUrl={broadcast?.channelLogoUrl} />}
      </div>

      {/* Bottom Broadcast Row: Safely raised above YouTube's seek/volume bar in Watch Live */}
      <div
        dir="rtl"
        className={`absolute inset-x-0 flex items-end justify-between gap-2 px-2.5 sm:px-4 ${
          isWatchLive ? 'bottom-[52px] sm:bottom-[56px]' : 'bottom-3 sm:bottom-5'
        }`}
      >
        <div className="min-w-0 flex-1 flex justify-start">
          {showTicker && (
            <BroadcastEventTicker
              breakingEvent={breakingEvent}
              recentEvents={recentEvents}
            />
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {showStamp && <BroadcastVintageStamp name={broadcast?.cameraStampName} />}
          {bottomLeftAction && (
            <div className="pointer-events-auto">{bottomLeftAction}</div>
          )}
        </div>
      </div>
    </div>
  );
}
