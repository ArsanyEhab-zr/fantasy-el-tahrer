import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Maximize2,
  Minimize2,
  Radio,
  Smartphone,
  Clock,
  CalendarClock,
  Trophy,
  X,
  Tv,
  ExternalLink,
} from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import BroadcastHudStage from '../../components/broadcast/BroadcastHudStage';
import TeamCrest from '../../components/ui/TeamCrest';
import StatusBadge from '../../components/ui/StatusBadge';
import { LoadingSkeleton } from '../../components/ui/FeedbackStates';
import {
  FALLBACK_LEAGUE_LOGO,
  buildYouTubeEmbedUrl,
  resolveBroadcastMatch,
  sanitizeChannelLogoUrl,
} from '../../utils/broadcast';
import { formatMatchDateTime, matchViewerUrl } from '../../utils/formatters';

function OfflineLogo({ src }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? FALLBACK_LEAGUE_LOGO : src}
      alt="فانتزي التحرير"
      onError={() => setFailed(true)}
      className="h-14 sm:h-20 w-auto max-w-[260px] object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.75)]"
    />
  );
}

/**
 * WatchLivePage — Dedicated Standalone 16:9 YouTube Live Broadcast Theater (/watch-live).
 * Leaves LiveMatchPage.jsx 100% untouched and reads all live state from the single `public/live_snapshot` doc.
 */
export default function WatchLivePage() {
  const {
    broadcast,
    matches = [],
    liveMatch,
    upcomingMatches = [],
    getTeam,
    loading,
  } = useTournament();

  const theaterRef = useRef(null);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(false);
  const [pseudoFullscreen, setPseudoFullscreen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [isSmallPortrait, setIsSmallPortrait] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 48rem) and (orientation: portrait)').matches
      : false
  );

  const isFullscreen = isNativeFullscreen || pseudoFullscreen;

  const activeMatch = useMemo(
    () => resolveBroadcastMatch({ broadcast, matches, liveMatch }),
    [broadcast, matches, liveMatch]
  );

  const nextMatch = upcomingMatches[0] || null;
  const embedUrl = useMemo(
    () => buildYouTubeEmbedUrl(broadcast?.youtubeVideoId || broadcast?.youtubeUrl),
    [broadcast?.youtubeVideoId, broadcast?.youtubeUrl]
  );
  const isStreamLive = Boolean(broadcast?.isActive && embedUrl);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 48rem) and (orientation: portrait)');
    const onChange = (e) => setIsSmallPortrait(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      const active = Boolean(fsEl && fsEl === theaterRef.current);
      setIsNativeFullscreen(active);
      if (!active) {
        try {
          window.screen?.orientation?.unlock?.();
        } catch {
          // Orientation unlock not supported in all browsers.
        }
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  useEffect(() => {
    if (!pseudoFullscreen) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setPseudoFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pseudoFullscreen]);

  const enterLandscapeFullscreen = useCallback(async () => {
    const el = theaterRef.current;
    if (!el) return;
    const requestFs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (typeof requestFs === 'function') {
      try {
        await requestFs.call(el);
        try {
          await window.screen?.orientation?.lock?.('landscape');
        } catch {
          // Graceful fallback when browser/OS disallows orientation lock.
        }
        return;
      } catch {
        // Fallback to CSS viewport theater fullscreen below.
      }
    }
    setPseudoFullscreen(true);
  }, []);

  const exitFullscreen = useCallback(async () => {
    setPseudoFullscreen(false);
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        await exitFs?.call(document);
      } catch {
        // Ignore exit error
      }
    }
    try {
      window.screen?.orientation?.unlock?.();
    } catch {
      // Ignore unlock error
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      void exitFullscreen();
    } else {
      void enterLandscapeFullscreen();
    }
  }, [enterLandscapeFullscreen, exitFullscreen, isFullscreen]);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={1} height="h-[52vw] max-h-[540px]" />
        <LoadingSkeleton count={1} height="h-24" />
      </div>
    );
  }

  const homeTeam = activeMatch ? getTeam(activeMatch.homeTeamId || activeMatch.homeTeam) : null;
  const awayTeam = activeMatch ? getTeam(activeMatch.awayTeamId || activeMatch.awayTeam) : null;
  const nextHome = nextMatch ? getTeam(nextMatch.homeTeamId || nextMatch.homeTeam) : null;
  const nextAway = nextMatch ? getTeam(nextMatch.awayTeamId || nextMatch.awayTeam) : null;
  const nextSchedule = nextMatch ? formatMatchDateTime(nextMatch.scheduledAt || nextMatch.date) : null;
  const logoSrc = sanitizeChannelLogoUrl(broadcast?.channelLogoUrl);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-2 text-xs font-display font-extrabold tracking-widest uppercase text-fanta-orange">
            <Tv size={14} aria-hidden="true" />
            <span dir="ltr">WATCH LIVE BROADCAST</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-arena-ink leading-tight">
            البث المباشر للدوري
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {isStreamLive ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-fanta-crimson text-white font-display font-extrabold text-xs shadow-[0_0_18px_rgba(253,113,129,0.5)]">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-live-beacon absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              <span>على الهواء الآن</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-arena-elevated border border-arena-border text-arena-muted font-display font-bold text-xs">
              <Radio size={13} aria-hidden="true" />
              <span>البث غير نشط</span>
            </span>
          )}
        </div>
      </div>

      {/* Dismissible Mobile Portrait Orientation Hint */}
      {isStreamLive && isSmallPortrait && !hintDismissed && !isFullscreen && (
        <div
          role="note"
          className="glass-card rounded-2xl border border-fanta-orange/40 bg-arena-surface/90 px-3.5 py-2.5 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-xs font-bold text-arena-ink">
            <Smartphone size={17} className="text-fanta-orange shrink-0 -rotate-90" aria-hidden="true" />
            <span>أدر الهاتف بالعرض لأفضل مشاهدة مع لوحة النتيجة المباشرة</span>
          </div>
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            aria-label="إغلاق التلميح"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-arena-muted hover:text-arena-ink hover:bg-arena-elevated cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 16:9 Smart Broadcast Theater Container (Fullscreen Target) */}
      <div
        ref={theaterRef}
        className={
          isFullscreen
            ? 'watch-theater-fullscreen fixed inset-0 z-[95] bg-black flex items-center justify-center'
            : 'relative w-full'
        }
      >
        <div
          className={
            isFullscreen
              ? 'relative aspect-video w-full max-h-full max-w-[calc(100dvh*16/9)] overflow-hidden bg-black'
              : 'relative w-full aspect-video rounded-3xl overflow-hidden bg-black border-2 border-arena-border shadow-[0_24px_64px_-16px_rgba(0,0,0,0.85)]'
          }
        >
          {isStreamLive ? (
            <>
              {/* 16:9 YouTube Privacy-Enhanced Embed */}
              <iframe
                title="البث المباشر — فانتزي التحرير"
                src={embedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
              />

              {/* Animated Broadcast HUD Layer (pointer-events-none wrapper so YouTube controls stay tappable) */}
              <BroadcastHudStage
                match={activeMatch}
                broadcast={broadcast}
                isWatchLive
                bottomLeftAction={
                  isFullscreen ? (
                    <button
                      type="button"
                      onClick={exitFullscreen}
                      aria-label="إنهاء ملء الشاشة"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#071528]/88 hover:bg-[#0b213d] border border-fanta-orange/50 text-arena-ink font-display font-bold text-xs backdrop-blur-md shadow-lg cursor-pointer"
                    >
                      <Minimize2 size={14} aria-hidden="true" />
                      <span>تصغير</span>
                    </button>
                  ) : null
                }
              />
            </>
          ) : (
            /* Sleek On-Brand Offline / Pre-Match Broadcast Screen */
            <div className="absolute inset-0 bg-scoreboard-turf flex flex-col items-center justify-center text-center p-5 sm:p-8">
              <div
                className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l from-fanta-orange via-fanta-amber to-fanta-volt"
                aria-hidden="true"
              />

              <OfflineLogo key={logoSrc} src={logoSrc} />

              <h2 className="font-display font-extrabold text-xl sm:text-3xl text-arena-ink mt-4">
                البث المباشر غير متاح حالياً
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-arena-muted mt-1.5 max-w-md leading-relaxed">
                سيبدأ البث المباشر هنا تلقائياً فور انطلاق البث من أرض الملعب مع لوحة النتيجة الحية والأحداث الفورية.
              </p>

              {/* Next Scheduled Match Preview Card */}
              {nextMatch && (
                <div className="mt-5 w-full max-w-md rounded-2xl border border-fanta-orange/35 bg-[#071528]/85 backdrop-blur-md p-3.5 sm:p-4 shadow-xl">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-display font-extrabold text-fanta-orange mb-2.5">
                    <CalendarClock size={13} aria-hidden="true" />
                    <span>المباراة القادمة في جدول الدوري</span>
                  </div>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5">
                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <TeamCrest team={nextHome} size="sm" />
                      <span className="font-display font-extrabold text-xs sm:text-sm text-arena-ink truncate w-full">
                        {nextHome?.nameAr || 'الفريق الأول'}
                      </span>
                    </div>

                    <div className="px-2.5 py-1 rounded-xl bg-arena-elevated/90 border border-arena-border font-display font-extrabold text-xs text-fanta-volt">
                      VS
                    </div>

                    <div className="flex flex-col items-center gap-1.5 min-w-0">
                      <TeamCrest team={nextAway} size="sm" />
                      <span className="font-display font-extrabold text-xs sm:text-sm text-arena-ink truncate w-full">
                        {nextAway?.nameAr || 'الفريق الثاني'}
                      </span>
                    </div>
                  </div>

                  {nextSchedule && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 inline-flex items-center gap-1.5 text-[11px] font-bold text-arena-muted">
                      <Clock size={12} className="text-fanta-orange" aria-hidden="true" />
                      <span>{nextSchedule.full}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                <Link
                  to="/live"
                  className="min-h-[42px] px-4 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Radio size={14} aria-hidden="true" />
                  <span>المتابعة المباشرة</span>
                </Link>
                <Link
                  to="/"
                  className="min-h-[42px] px-4 rounded-xl bg-arena-elevated hover:bg-arena-border border border-arena-border text-arena-ink font-display font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trophy size={14} className="text-fanta-orange" aria-hidden="true" />
                  <span>جدول المباريات</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Theater Control Bar & Active Match Strip */}
      <div className="glass-card rounded-2xl border border-arena-border bg-arena-surface/90 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {activeMatch ? (
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            <StatusBadge status={activeMatch.status} timerStatus={activeMatch.timerStatus} size="sm" />
            <div className="font-display font-extrabold text-sm sm:text-base text-arena-ink truncate">
              {homeTeam?.nameAr || 'المستضيف'}{' '}
              <span className="num-tabular text-fanta-orange mx-1">
                {activeMatch.homeScore ?? 0} - {activeMatch.awayScore ?? 0}
              </span>{' '}
              {awayTeam?.nameAr || 'الضيف'}
            </div>
            {activeMatch.round && (
              <span className="hidden sm:inline text-xs font-semibold text-arena-muted">
                • {activeMatch.round}
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs sm:text-sm font-semibold text-arena-muted">
            لا توجد مباراة مباشرة محددة حالياً للوحة النتيجة.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isStreamLive && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-h-[42px] px-4 rounded-xl bg-fanta-orange hover:bg-fanta-orange-deep text-arena-bg font-display font-extrabold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer shadow-[0_6px_20px_-6px_rgba(232,200,127,0.55)]"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={15} aria-hidden="true" />
                  <span>إنهاء ملء الشاشة</span>
                </>
              ) : (
                <>
                  <Maximize2 size={15} aria-hidden="true" />
                  <span>ملء الشاشة بالعرض</span>
                </>
              )}
            </button>
          )}

          {activeMatch && (
            <Link
              to={matchViewerUrl(activeMatch.id)}
              className="min-h-[42px] px-3.5 rounded-xl bg-arena-elevated hover:bg-arena-border border border-arena-border text-arena-ink font-display font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink size={14} aria-hidden="true" />
              <span>تفاصيل المباراة</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
