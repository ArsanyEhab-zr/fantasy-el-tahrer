import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTournament } from '../../hooks/TournamentContext';
import BroadcastHudStage from '../../components/broadcast/BroadcastHudStage';
import { resolveBroadcastMatch } from '../../utils/broadcast';

/**
 * ObsOverlayPage — Transparent OBS Browser Source Overlay (/overlay/live and /overlay/:matchId).
 *
 * Mounted outside ViewerLayout so OBS composites a pure transparent 16:9 canvas with zero header/background.
 * Append `?preview=1` in a browser to inspect placement over a simulated stadium backdrop.
 * Optional query overrides: `?score=0&logo=0&ticker=0&stamp=0`.
 */
export default function ObsOverlayPage() {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const { broadcast, matches = [], liveMatch } = useTournament();

  const isPreview = searchParams.get('preview') === '1';

  useEffect(() => {
    if (isPreview) return undefined;
    document.documentElement.classList.add('obs-overlay-mode');
    document.body.classList.add('obs-overlay-mode');
    return () => {
      document.documentElement.classList.remove('obs-overlay-mode');
      document.body.classList.remove('obs-overlay-mode');
    };
  }, [isPreview]);

  const activeMatch = useMemo(
    () =>
      resolveBroadcastMatch({
        broadcast,
        matches,
        liveMatch,
        overrideMatchId: matchId || null,
      }),
    [broadcast, matches, liveMatch, matchId]
  );

  // OBS overlay always displays full HUD by default (independent of Watch Live's anti-duplication toggles),
  // while supporting optional query params (?score=0&logo=0&ticker=0&stamp=0) for custom scenes.
  const obsVisibility = useMemo(
    () => ({
      scoreboard: searchParams.get('score') !== '0',
      channelLogo: searchParams.get('logo') !== '0',
      eventTicker: searchParams.get('ticker') !== '0',
      vintageStamp: searchParams.get('stamp') !== '0',
    }),
    [searchParams]
  );

  if (isPreview) {
    return (
      <div dir="rtl" className="min-h-dvh bg-[#060f1d] text-arena-ink flex flex-col items-center justify-center p-4 sm:p-8 gap-4">
        <div className="w-full max-w-[1280px] flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-arena-muted">
          <span>معاينة طبقة OBS Browser Source (1280×720 — الخلفية الحقيقية في OBS شفافة تماماً)</span>
          <span className="text-fanta-orange">
            {activeMatch ? `المباراة: ${activeMatch.id}` : 'بانتظار مباراة مباشرة'}
          </span>
        </div>

        <div className="relative w-full max-w-[1280px] aspect-video rounded-2xl overflow-hidden border-2 border-fanta-orange/50 shadow-2xl bg-[radial-gradient(ellipse_at_center,#1b5e36_0%,#0f3a21_55%,#071b11_100%)]">
          {/* Simulated pitch lines for preview only */}
          <div className="pointer-events-none absolute inset-6 border-2 border-white/15 rounded-lg" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-y-6 left-1/2 w-0.5 bg-white/15" aria-hidden="true" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-white/15" aria-hidden="true" />

          <BroadcastHudStage
            match={activeMatch}
            broadcast={broadcast}
            isWatchLive={false}
            visibilityOverride={obsVisibility}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-transparent">
      <BroadcastHudStage
        match={activeMatch}
        broadcast={broadcast}
        isWatchLive={false}
        visibilityOverride={obsVisibility}
      />
    </div>
  );
}
