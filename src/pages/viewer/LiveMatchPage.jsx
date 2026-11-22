import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Radio, Users, Clock, CalendarClock } from 'lucide-react';
import { useLiveMatch } from '../../hooks/useLiveMatch';
import { useTournament } from '../../hooks/TournamentContext';
import ScoreBoard from '../../components/match/ScoreBoard';
import MatchTimeline from '../../components/match/MatchTimeline';
import MatchCard from '../../components/match/MatchCard';
import EventOverlay from '../../components/ui/EventOverlay';
import TeamRosterModal from '../../components/tournament/TeamRosterModal';
import { LoadingSkeleton, EmptyState } from '../../components/ui/FeedbackStates';
import { RevealBlock } from '../../components/ui/MotionPrimitives';

const EVENT_PRIORITY = {
  fulltime: 6,
  forfeit: 5,
  red: 4,
  goal: 3,
  penalty: 2,
  yellow: 1,
  sub: 1,
};

/**
 * LiveMatchPage — Fanta Real-Time Live Match Center (/live).
 * - Synced running clock + stoppage indicator via ScoreBoard/useMatchTimer
 * - Event ID-deduped Framer Motion EventOverlay triggering live on Goal, Card, Sub, Penalty, Forfeit & Full Time
 * - Tabbed Timeline + Active 5v5 Pitch Lineups view
 */
export default function LiveMatchPage() {
  const [params] = useSearchParams();
  const matchId = params.get('matchId') || null;
  return <MatchBroadcast key={matchId || 'broadcast'} matchId={matchId} />;
}

function MatchBroadcast({ matchId }) {
  const navigate = useNavigate();
  const { match, events, loading, error } = useLiveMatch(matchId);
  const { upcomingMatches: contextUpcoming = [], getPlayer, getTeam } = useTournament();

  const [activeTab, setActiveTab] = useState('timeline');
  const [overlayEvent, setOverlayEvent] = useState(null);
  const [rosterTeamId, setRosterTeamId] = useState(null);

  const hydratedMatchIdRef = useRef(null);
  const seenEventIdsRef = useRef(new Set());

  // Trigger real-time punchy Gen Z animation ONLY for newly arriving events (deduped by event.id)
  useEffect(() => {
    if (!match?.id) {
      hydratedMatchIdRef.current = null;
      seenEventIdsRef.current = new Set();
      return;
    }

    const validEvents = (events || []).filter((e) => e && e.type !== 'assist');

    // Initial hydration for this match: seed seen IDs without spamming historical animations
    if (hydratedMatchIdRef.current !== match.id) {
      hydratedMatchIdRef.current = match.id;
      seenEventIdsRef.current = new Set(validEvents.map((e) => e.id));
      return;
    }

    const brandNew = validEvents.filter((e) => e.id && !seenEventIdsRef.current.has(e.id));
    if (brandNew.length > 0) {
      brandNew.forEach((e) => seenEventIdsRef.current.add(e.id));
      // If multiple events arrive atomically (e.g., 2nd Yellow + Red Card), animate the highest-impact one
      const featured = [...brandNew].sort(
        (a, b) => (EVENT_PRIORITY[b.type] || 0) - (EVENT_PRIORITY[a.type] || 0)
      )[0];
      if (featured && EVENT_PRIORITY[featured.type] != null) {
        setOverlayEvent(featured);
      }
    }
  }, [match?.id, events]);

  const upcomingMatches = contextUpcoming.slice(0, 3);

  if (loading) {
    return (
      <div className="space-y-4">
        <LoadingSkeleton count={1} height="h-56" />
        <LoadingSkeleton count={3} height="h-20" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon={Radio}
          title={matchId ? 'تعذر عرض المباراة المحددة' : 'لا توجد مباراة مباشرة في هذه اللحظة'}
          description="بمجرد إطلاق الحكم لصافرة البداية، ستظهر هنا النتيجة والساعة والأحداث مباشرة مع الاحتفالات الفورية."
          action={
            <button
              type="button"
              onClick={() => navigate('/standings')}
              className="min-h-[46px] px-5 rounded-xl bg-fanta-orange text-arena-bg font-display font-extrabold text-sm cursor-pointer"
            >
              تصفح جدول الترتيب
            </button>
          }
        />

        {upcomingMatches.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display font-extrabold text-lg text-arena-ink flex items-center gap-2">
              <CalendarClock size={19} className="text-fanta-orange" aria-hidden="true" />
              <span>المباريات القادمة</span>
            </h2>
            <div className="space-y-3">
              {upcomingMatches.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  }

  const homeTeam = getTeam(match.homeTeamId || match.homeTeam);
  const awayTeam = getTeam(match.awayTeamId || match.awayTeam);
  const resolvePitchPlayer = (id) => {
    const found = getPlayer(id);
    if (found) return found;
    const ev = (events || []).find((e) => e.playerId === id || e.playerInId === id || e.playerOutId === id);
    const recoveredName = ev
      ? (ev.playerOutId === id ? ev.playerOutName : ev.playerInId === id ? ev.playerInName : ev.playerName)
      : null;
    return {
      id: String(id),
      nameAr: recoveredName || 'لاعب مسجل سابقاً',
      position: 'لاعب',
      jerseyNumber: null,
      isFallback: true,
    };
  };
  const homePitchPlayers = (match.homeActivePitch || []).map(resolvePitchPlayer);
  const awayPitchPlayers = (match.awayActivePitch || []).map(resolvePitchPlayer);

  return (
    <div className="space-y-6">
      {/* Real-Time Event Celebration Overlay */}
      <EventOverlay event={overlayEvent} onDismiss={() => setOverlayEvent(null)} />

      {/* Broadcast Scoreboard (ticks live via useMatchTimer) */}
      <RevealBlock>
        <ScoreBoard match={match} />
      </RevealBlock>

      {/* Section Switcher: Timeline vs Active 5v5 Pitch Lineups */}
      <div
        role="tablist"
        aria-label="تفاصيل المباراة"
        className="glass-card grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-arena-surface border-2 border-arena-border"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          className={`min-h-[46px] rounded-xl font-display font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'timeline'
              ? 'bg-fanta-orange text-arena-bg'
              : 'text-arena-muted hover:text-arena-ink'
          }`}
        >
          <Clock size={17} strokeWidth={2.4} aria-hidden="true" />
          <span>أحداث المباراة</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'lineups'}
          onClick={() => setActiveTab('lineups')}
          className={`min-h-[46px] rounded-xl font-display font-extrabold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer ${
            activeTab === 'lineups'
              ? 'bg-fanta-volt text-arena-bg'
              : 'text-arena-muted hover:text-arena-ink'
          }`}
        >
          <Users size={17} strokeWidth={2.4} aria-hidden="true" />
          <span>اللاعبون في الملعب</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'timeline' ? (
        <section aria-label="أحداث المباراة">
          <MatchTimeline events={events} />
        </section>
      ) : (
        <section aria-label="التشكيلة النشطة في الملعب" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { team: homeTeam, list: homePitchPlayers, accent: 'text-fanta-orange' },
            { team: awayTeam, list: awayPitchPlayers, accent: 'text-fanta-volt' },
          ].map((side, idx) => (
            <div
              key={side.team?.id || idx}
              className="glass-card rounded-2xl bg-arena-surface border-2 border-arena-border p-4 space-y-3"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-arena-border gap-2">
                <h3 className={`font-display font-extrabold text-base ${side.accent} truncate`}>
                  {side.team?.nameAr || (idx === 0 ? 'الفريق الأول' : 'الفريق الثاني')}
                </h3>
                <div className="flex items-center gap-2 shrink-0">
                  {side.team?.id && (
                    <button
                      type="button"
                      onClick={() => setRosterTeamId(side.team.id)}
                      className="text-xs font-display font-bold text-fanta-orange hover:underline cursor-pointer"
                    >
                      القائمة الكاملة
                    </button>
                  )}
                  <span className="num-tabular text-xs font-bold px-2 py-0.5 rounded-md bg-arena-elevated text-arena-muted">
                    {side.list.length} / 5
                  </span>
                </div>
              </div>

              {side.list.length > 0 ? (
                <ul className="space-y-2">
                  {side.list.map((player) => (
                    <li key={player.id}>
                      {player.isFallback ? (
                        <div className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-arena-bg border border-arena-border/60 opacity-80">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-arena-elevated text-arena-muted font-display font-extrabold text-xs num-tabular flex items-center justify-center shrink-0">
                              —
                            </span>
                            <span className="font-bold text-sm text-arena-ink truncate">
                              {player.nameAr}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-arena-muted shrink-0">
                            {player.position}
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => navigate(`/player/${player.id}`)}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-arena-bg border border-arena-border hover:border-fanta-orange/50 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 h-7 rounded-lg bg-arena-elevated text-arena-ink font-display font-extrabold text-xs num-tabular flex items-center justify-center shrink-0">
                              {player.jerseyNumber ?? '—'}
                            </span>
                            <span className="font-bold text-sm text-arena-ink truncate">
                              {player.nameAr}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-arena-muted shrink-0">
                            {player.position || 'لاعب'}
                          </span>
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-arena-muted text-center py-4">
                  لم يتم تسجيل التشكيلة النشطة بعد.
                </p>
              )}
            </div>
          ))}
        </section>
      )}

      <TeamRosterModal teamId={rosterTeamId} onClose={() => setRosterTeamId(null)} />
    </div>
  );
}
