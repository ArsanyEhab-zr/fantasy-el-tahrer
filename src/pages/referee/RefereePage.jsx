import { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Flag,
  Flame,
  ArrowLeftRight,
  AlertTriangle,
  ShieldAlert,
  CalendarClock,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  StopCircle,
  Undo2,
} from 'lucide-react';
import { useTournament } from '../../hooks/TournamentContext';
import { useMatchTimer } from '../../hooks/useMatchTimer';
import {
  kickOffMatch,
  pauseMatchClock,
  resumeMatchClock,
  recordPlayerMatchEvent,
  recordSubstitutionEvent,
  applyDisciplinaryPenalty,
  recordTeamForfeit,
  endMatchManually,
  undoLastEvent,
  bracketSlotsFor,
} from '../../utils/tournamentSchema';
import TeamCrest from '../../components/ui/TeamCrest';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import MatchTimeline from '../../components/match/MatchTimeline';
import { EmptyState, LoadingSkeleton } from '../../components/ui/FeedbackStates';
import { formatMatchDateTime, parseTimestamp } from '../../utils/formatters';

const MISCONDUCT_REASONS = ['شغب', 'سلوك غير رياضي', 'اعتداء لفظي', 'إفساد المباراة'];

/**
 * RefereePage — Fast, Mobile-First Pitch Controller (/referee).
 * Powered by Zero-Lag Synced Clock (useMatchTimer) & Canonical Firestore Mutations (tournamentSchema).
 *
 * 3-stage workflow:
 *   1. Match Picker (resume live match or choose scheduled match)
 *   2. Starting 5 Lineup Confirmation (strict 5-a-side, non-rolling subs)
 *   3. Live Pitch Controller (serverTimestamp clock + stoppage time, Goal [NO Assists],
 *      Yellow -> auto 2nd-yellow Red, Direct Red, 2-step Sub, Misconduct Penalty, Forfeit, Final Whistle)
 */
export default function RefereePage() {
  const {
    matches = [],
    players = [],
    getTeam,
    loading,
    settings,
  } = useTournament();

  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [setupMatchId, setSetupMatchId] = useState(null);

  // Starting 5 Lineup Setup State
  const [lineupTab, setLineupTab] = useState('home');
  const [homeStarters, setHomeStarters] = useState([]);
  const [awayStarters, setAwayStarters] = useState([]);

  // Modals & Action Feedback
  const [actionModal, setActionModal] = useState({
    type: null, // 'goal' | 'yellow' | 'red' | 'sub_off' | 'sub_on' | 'penalty' | 'forfeit' | 'end'
    subOffPlayerId: null,
  });
  const [penaltyTeamId, setPenaltyTeamId] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(3);
  const [penaltyReason, setPenaltyReason] = useState('شغب');

  const [forfeitTeamId, setForfeitTeamId] = useState('');
  const [forfeitApplyScore, setForfeitApplyScore] = useState(true);
  const [forfeitDeduction, setForfeitDeduction] = useState(3);

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (text, tone = 'success') => {
    setToast({ text, tone });
    setTimeout(() => setToast(null), 3500);
  };

  const activeMatch = useMemo(
    () => matches.find((m) => m.id === selectedMatchId) || null,
    [matches, selectedMatchId]
  );

  const setupMatch = useMemo(
    () => matches.find((m) => m.id === setupMatchId) || null,
    [matches, setupMatchId]
  );

  // Zero-Lag Synced Clock Hook (optimistic serverTimestamp() null safety + skew clamping + stoppage time)
  const clock = useMatchTimer(activeMatch, settings?.halfDurationMinutes || 10);

  const liveMatches = matches.filter((m) => m.status === 'مباشر');
  const scheduledMatches = [...matches]
    .filter((m) => m.status === 'مجدولة')
    .sort((a, b) => {
      const da = parseTimestamp(a.scheduledAt || a.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const db = parseTimestamp(b.scheduledAt || b.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return da - db;
    });

  // Open Starting 5 Setup for a scheduled match
  const openLineupSetup = (match) => {
    const hId = match.homeTeamId || match.homeTeam;
    const aId = match.awayTeamId || match.awayTeam;
    const hRoster = players.filter((p) => (p.teamId || p.team) === hId);
    const aRoster = players.filter((p) => (p.teamId || p.team) === aId);

    setHomeStarters(hRoster.slice(0, 5).map((p) => p.id));
    setAwayStarters(aRoster.slice(0, 5).map((p) => p.id));
    setLineupTab('home');
    setSetupMatchId(match.id);
  };

  const toggleStarter = (playerId, isHome) => {
    const setter = isHome ? setHomeStarters : setAwayStarters;
    setter((prev) => {
      if (prev.includes(playerId)) return prev.filter((id) => id !== playerId);
      if (prev.length >= 5) return prev;
      return [...prev, playerId];
    });
  };

  // Start Match & Clock with serverTimestamp()
  const handleKickOff = async () => {
    if (!setupMatch) return;
    const hId = setupMatch.homeTeamId || setupMatch.homeTeam;
    const aId = setupMatch.awayTeamId || setupMatch.awayTeam;
    const hRoster = players.filter((p) => (p.teamId || p.team) === hId);
    const aRoster = players.filter((p) => (p.teamId || p.team) === aId);

    if (homeStarters.length === 0 || awayStarters.length === 0) {
      showToast('يجب اختيار اللاعبين الأساسيين للفريقين (بحد أقصى 5 لكل فريق).', 'error');
      return;
    }

    const hBench = hRoster.filter((p) => !homeStarters.includes(p.id)).map((p) => p.id);
    const aBench = aRoster.filter((p) => !awayStarters.includes(p.id)).map((p) => p.id);

    setBusy(true);
    try {
      await kickOffMatch(setupMatch.id, {
        homeActivePitch: homeStarters,
        awayActivePitch: awayStarters,
        homeBench: hBench,
        awayBench: aBench,
        homeScore: setupMatch.homeScore ?? 0,
        awayScore: setupMatch.awayScore ?? 0,
      });
      setSelectedMatchId(setupMatch.id);
      setSetupMatchId(null);
      showToast('انطلقت المباراة! الساعة متزامنة مباشرة الآن.');
    } catch (err) {
      showToast(err.message || 'تعذر بدء المباراة.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Pause / Resume Synced Clock
  const handleToggleClock = async () => {
    if (!activeMatch) return;
    setBusy(true);
    try {
      const snapshot = clock.getSnapshot();
      if (activeMatch.timerStatus === 'running') {
        await pauseMatchClock(activeMatch.id, snapshot);
        showToast('تم إيقاف الساعة مؤقتاً (استراحة).');
      } else {
        await resumeMatchClock(activeMatch.id, snapshot);
        showToast('تم استئناف ساعة المباراة.');
      }
    } catch (err) {
      showToast(err.message || 'خطأ في تحديث الساعة.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Record Goal, Yellow Card (auto 2nd-yellow -> Red), or Direct Red Card (ZERO Assists)
  const handleLogPlayerEvent = async (player, actionType) => {
    if (!activeMatch || !player) return;
    setBusy(true);
    try {
      const snapshot = clock.getSnapshot();
      const { finalType } = await recordPlayerMatchEvent({
        match: activeMatch,
        player,
        actionType,
        clockSnapshot: snapshot,
      });
      setActionModal({ type: null, subOffPlayerId: null });
      showToast(
        finalType === 'goal'
          ? `تم تسجيل هدف ${player.nameAr} (${snapshot.displayMinute})`
          : finalType === 'red'
            ? `تم طرد ${player.nameAr} (${snapshot.displayMinute})`
            : `إنذار أصفر لـ ${player.nameAr} (${snapshot.displayMinute})`
      );
    } catch (err) {
      showToast(err.message || 'تعذر تسجيل الحدث.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Strict 2-Step Non-Rolling Substitution
  const handleConfirmSubstitution = async (offId, onId) => {
    if (!activeMatch || !offId || !onId) return;
    const offPlayer = players.find((p) => p.id === offId);
    const onPlayer = players.find((p) => p.id === onId);
    if (!offPlayer || !onPlayer) return;

    setBusy(true);
    try {
      const snapshot = clock.getSnapshot();
      await recordSubstitutionEvent({
        match: activeMatch,
        offPlayer,
        onPlayer,
        clockSnapshot: snapshot,
      });
      setActionModal({ type: null, subOffPlayerId: null });
      showToast(`تبديل (${snapshot.displayMinute}): دخول ${onPlayer.nameAr} بدلاً من ${offPlayer.nameAr}`);
    } catch (err) {
      showToast(err.message || 'تعذر تنفيذ التبديل.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Misconduct / Riot Penalty ("خصم نقاط / شغب")
  const handleApplyPenalty = async (e) => {
    e.preventDefault();
    if (!activeMatch || !penaltyTeamId) return;
    setBusy(true);
    try {
      const snapshot = clock.getSnapshot();
      const team = getTeam(penaltyTeamId);
      await applyDisciplinaryPenalty({
        teamId: penaltyTeamId,
        teamName: team?.nameAr || '',
        matchId: activeMatch.id,
        pointsDeducted: penaltyPoints,
        reason: penaltyReason,
        clockSnapshot: snapshot,
      });
      setActionModal({ type: null, subOffPlayerId: null });
      showToast(`تم خصم -${penaltyPoints} نقاط على ${team?.nameAr || 'الفريق'}.`);
    } catch (err) {
      showToast(err.message || 'تعذر تطبيق الخصم.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Team Withdrawal / Forfeit ("انسحاب فريق")
  const handleApplyForfeit = async (e) => {
    e.preventDefault();
    if (!activeMatch || !forfeitTeamId) return;
    setBusy(true);
    try {
      const snapshot = clock.getSnapshot();
      const withdrawingTeam = getTeam(forfeitTeamId);
      await recordTeamForfeit({
        match: activeMatch,
        bracketSlotId: actionModal.slot,
        withdrawingTeamId: forfeitTeamId,
        withdrawingTeamName: withdrawingTeam?.nameAr || '',
        applyForfeitScore: forfeitApplyScore,
        pointsDeducted: forfeitDeduction,
        clockSnapshot: snapshot,
      });
      setActionModal({ type: null, subOffPlayerId: null });
      setSelectedMatchId(null);
      showToast('تم تسجيل الانسحاب وإنهاء المباراة رسمياً.');
    } catch (err) {
      showToast(err.message || 'تعذر تسجيل الانسحاب.', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Manual Final Whistle ("إنهاء المباراة")
  const handleFinalWhistle = async () => {
    if (!activeMatch) return;
    setBusy(true);
    try {
      const snapshot = clock.getSnapshot();
      await endMatchManually({
        bracketSlotId: actionModal.slot,
        tiebreakWinnerId: actionModal.winnerId,
        match: activeMatch,
        clockSnapshot: snapshot,
      });
      setActionModal({ type: null, subOffPlayerId: null });
      setSelectedMatchId(null);
      showToast('تم إطلاق صافرة النهاية وحفظ النتيجة.');
    } catch (err) {
      showToast(err.message || 'تعذر إنهاء المباراة.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleUndo = async () => {
    const last = activeMatch?.events.at(-1);
    if (!last || busy || !window.confirm(`تراجع عن آخر حدث؟ ${last.detail || ''} ${last.playerName || ''} (${last.displayMinute})`)) return;
    setBusy(true);
    try {
      await undoLastEvent(activeMatch.id, last.id);
      showToast('تم التراجع عن الحدث وتحديث المباراة.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <LoadingSkeleton count={3} height="h-24" />;
  }

  // =========================================================================
  // VIEW B: STARTING 5 LINEUP CONFIRMATION (STRICT 5-A-SIDE)
  // =========================================================================
  if (setupMatch) {
    const hId = setupMatch.homeTeamId || setupMatch.homeTeam;
    const aId = setupMatch.awayTeamId || setupMatch.awayTeam;
    const homeTeam = getTeam(hId);
    const awayTeam = getTeam(aId);
    const hRoster = players.filter((p) => (p.teamId || p.team) === hId);
    const aRoster = players.filter((p) => (p.teamId || p.team) === aId);
    const currentRoster = lineupTab === 'home' ? hRoster : aRoster;
    const currentSelected = lineupTab === 'home' ? homeStarters : awayStarters;

    return (
      <div className="space-y-4 pb-8">
        {toast && (
          <div
            role="status"
            className={`px-4 py-3 rounded-2xl text-xs font-bold border-2 ${
              toast.tone === 'error'
                ? 'bg-fanta-crimson/15 border-fanta-crimson text-fanta-crimson'
                : 'bg-fanta-volt/15 border-fanta-volt text-fanta-volt'
            }`}
          >
            {toast.text}
          </div>
        )}

        <button
          type="button"
          onClick={() => setSetupMatchId(null)}
          className="min-h-[44px] inline-flex items-center gap-1.5 text-sm font-display font-bold text-arena-muted hover:text-arena-ink cursor-pointer"
        >
          <ChevronRight size={18} />
          <span>العودة لقائمة المباريات</span>
        </button>

        <div className="glass-card rounded-3xl bg-pitch-surface border-2 border-pitch-border p-4 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fanta-orange/15 text-fanta-orange font-display font-extrabold text-xs">
            <Users size={13} aria-hidden="true" />
            <span>تأكيد التشكيلة الأساسية (خماسي 5 ضد 5)</span>
          </span>
          <h1 className="font-display font-extrabold text-xl text-arena-ink">
            {homeTeam?.nameAr} ضد {awayTeam?.nameAr}
          </h1>
          <p className="text-xs text-arena-muted leading-relaxed">
            اختر حتى 5 لاعبين أساسيين لكل فريق. باقي القائمة تصبح بدلاء، واللاعب الخارج بالتبديل لا يعود للملعب.
          </p>
        </div>

        {/* Home / Away Switcher */}
        <div className="glass-card grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-pitch-surface border-2 border-pitch-border">
          <button
            type="button"
            onClick={() => setLineupTab('home')}
            className={`min-h-[48px] px-3 rounded-xl font-display font-extrabold text-sm flex items-center justify-between cursor-pointer ${
              lineupTab === 'home'
                ? 'bg-fanta-orange text-arena-bg'
                : 'text-arena-muted'
            }`}
          >
            <span className="truncate">{homeTeam?.short || homeTeam?.nameAr}</span>
            <span className="num-tabular px-2 py-0.5 rounded-md bg-black/20 text-xs">
              {homeStarters.length}/5
            </span>
          </button>
          <button
            type="button"
            onClick={() => setLineupTab('away')}
            className={`min-h-[48px] px-3 rounded-xl font-display font-extrabold text-sm flex items-center justify-between cursor-pointer ${
              lineupTab === 'away'
                ? 'bg-fanta-volt text-arena-bg'
                : 'text-arena-muted'
            }`}
          >
            <span className="truncate">{awayTeam?.short || awayTeam?.nameAr}</span>
            <span className="num-tabular px-2 py-0.5 rounded-md bg-black/20 text-xs">
              {awayStarters.length}/5
            </span>
          </button>
        </div>

        {/* Roster Checklist */}
        <div className="space-y-2">
          {currentRoster.length === 0 ? (
            <EmptyState
              icon={Users}
              title="لا يوجد لاعبون مسجلون لهذا الفريق"
              description="اطلب من الإدارة إضافة لاعبي الفريق أولاً قبل انطلاق المباراة."
            />
          ) : (
            currentRoster.map((player) => {
              const selected = currentSelected.includes(player.id);
              const disabled = !selected && currentSelected.length >= 5;
              return (
                <button
                  key={player.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleStarter(player.id, lineupTab === 'home')}
                  className={`glass-card w-full min-h-[58px] px-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-all cursor-pointer ${
                    selected
                      ? 'bg-fanta-volt/12 border-fanta-volt text-arena-ink'
                      : disabled
                        ? 'bg-pitch-surface/50 border-pitch-border text-arena-muted opacity-45 cursor-not-allowed'
                        : 'bg-pitch-surface border-pitch-border text-arena-ink hover:border-arena-muted'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-9 h-9 rounded-xl bg-pitch-bg border border-pitch-border font-display font-extrabold text-sm num-tabular flex items-center justify-center shrink-0">
                      {player.jerseyNumber ?? '—'}
                    </span>
                    <div className="text-right min-w-0">
                      <div className="font-display font-bold text-base truncate">{player.nameAr}</div>
                      <div className="text-xs text-arena-muted">{player.position || 'لاعب'}</div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg font-display font-extrabold text-xs shrink-0 ${
                      selected
                        ? 'bg-fanta-volt text-arena-bg'
                        : 'bg-pitch-elevated text-arena-muted'
                    }`}
                  >
                    {selected ? 'أساسي' : 'بديل'}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Giant Kick-off Button */}
        <button
          type="button"
          disabled={busy || homeStarters.length === 0 || awayStarters.length === 0}
          onClick={handleKickOff}
          className="w-full min-h-[60px] rounded-2xl bg-fanta-volt hover:bg-fanta-volt-dim text-arena-bg font-display font-extrabold text-lg flex items-center justify-center gap-2.5 shadow-[0_12px_30px_-8px_rgba(164,212,182,0.5)] cursor-pointer active:scale-[0.98] disabled:opacity-40"
        >
          <Play size={22} strokeWidth={2.8} className="fill-arena-bg" aria-hidden="true" />
          <span>بدء المباراة — صافرة البداية</span>
        </button>
      </div>
    );
  }

  // =========================================================================
  // VIEW C: LIVE PITCH CONTROLLER (THUMB-FIRST)
  // =========================================================================
  if (activeMatch?.status === 'مباشر') {
    const hId = activeMatch.homeTeamId || activeMatch.homeTeam;
    const aId = activeMatch.awayTeamId || activeMatch.awayTeam;
    const homeTeam = getTeam(hId);
    const awayTeam = getTeam(aId);
    const isRunning = clock.isRunning;

    const homeActiveIds = activeMatch.homeActivePitch || [];
    const awayActiveIds = activeMatch.awayActivePitch || [];
    const homeActivePlayers = players.filter((p) => homeActiveIds.includes(p.id));
    const awayActivePlayers = players.filter((p) => awayActiveIds.includes(p.id));

    const playerYellowCounts = {};
    (activeMatch.events || []).forEach((ev) => {
      if (ev.type === 'yellow' && ev.playerId) {
        playerYellowCounts[ev.playerId] = (playerYellowCounts[ev.playerId] || 0) + 1;
      }
    });

    const subOffPlayer = actionModal.subOffPlayerId
      ? players.find((p) => p.id === actionModal.subOffPlayerId)
      : null;
    const subBenchPlayers = (() => {
      if (!subOffPlayer) return [];
      const isHome = (subOffPlayer.teamId || subOffPlayer.team) === hId;
      const benchIds = isHome ? activeMatch.homeBench || [] : activeMatch.awayBench || [];
      const subbedOffIds = isHome ? activeMatch.homeSubbedOff || [] : activeMatch.awaySubbedOff || [];
      return players.filter((p) => benchIds.includes(p.id) && !subbedOffIds.includes(p.id));
    })();

    const slots = settings?.enableKnockout ? bracketSlotsFor(activeMatch) : [];
    const slotPicker = slots.length > 1 && !activeMatch.bracketSlotId && (
      <label className="block space-y-2">
        <span>موقع المباراة في شجرة الإقصائيات</span>
        <select className="w-full rounded-xl bg-pitch-bg p-3" value={actionModal.slot || ''}
          onChange={e => setActionModal({ ...actionModal, slot: e.target.value })}>
          <option value="">اختر الخانة</option>
          {slots.map(slot => <option key={slot}>{slot}</option>)}
        </select>
      </label>
    );

    const sortedEvents = [...(activeMatch.events || [])]
      .filter((e) => e && e.type !== 'assist')
      .sort((a, b) => {
        const ta = parseTimestamp(a.createdAt || a.timestamp)?.getTime() ?? 0;
        const tb = parseTimestamp(b.createdAt || b.timestamp)?.getTime() ?? 0;
        return tb - ta;
      });

    return (
      <div className="space-y-4 pb-8">
        {toast && (
          <div
            role="status"
            className={`px-4 py-3 rounded-2xl text-xs font-bold border-2 flex items-center gap-2 ${
              toast.tone === 'error'
                ? 'bg-fanta-crimson/15 border-fanta-crimson text-fanta-crimson'
                : 'bg-fanta-volt/15 border-fanta-volt text-fanta-volt'
            }`}
          >
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{toast.text}</span>
          </div>
        )}

        {/* Back to Picker */}
        <button
          type="button"
          onClick={() => setSelectedMatchId(null)}
          className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-display font-bold text-arena-muted hover:text-arena-ink cursor-pointer"
        >
          <ChevronRight size={16} />
          <span>تبديل المباراة</span>
        </button>

        {/* High-Contrast Referee Score + Clock Control Deck */}
        <section className="glass-card rounded-3xl bg-pitch-surface border-2 border-pitch-border overflow-hidden shadow-2xl">
          <div
            className={`h-1.5 w-full ${
              clock.isStoppage
                ? 'bg-fanta-amber'
                : isRunning
                  ? 'bg-fanta-volt'
                  : 'bg-fanta-orange'
            }`}
          />

          <div className="p-4 space-y-4">
            {/* Teams & Score Row */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
              <div className="min-w-0">
                <div className="font-display font-extrabold text-base text-arena-ink truncate">
                  {homeTeam?.short || homeTeam?.nameAr}
                </div>
                <div className="text-[11px] font-bold text-arena-muted num-tabular">
                  {homeActivePlayers.length} بالملعب
                </div>
              </div>

              <div className="px-4 py-1.5 rounded-2xl bg-pitch-bg border-2 border-pitch-border flex items-center gap-2.5">
                <span className="font-display font-extrabold text-4xl num-tabular text-fanta-orange leading-none">
                  {activeMatch.homeScore ?? 0}
                </span>
                <span className="text-arena-muted font-bold text-xl">:</span>
                <span className="font-display font-extrabold text-4xl num-tabular text-fanta-volt leading-none">
                  {activeMatch.awayScore ?? 0}
                </span>
              </div>

              <div className="min-w-0">
                <div className="font-display font-extrabold text-base text-arena-ink truncate">
                  {awayTeam?.short || awayTeam?.nameAr}
                </div>
                <div className="text-[11px] font-bold text-arena-muted num-tabular">
                  {awayActivePlayers.length} بالملعب
                </div>
              </div>
            </div>

            {/* Giant Referee-Controlled Clock (NEVER Auto-Ends) */}
            <div
              className={`glass-card rounded-2xl border-2 p-3 flex items-center justify-between gap-3 ${
                clock.isStoppage
                  ? 'bg-fanta-amber/12 border-fanta-amber'
                  : 'bg-pitch-bg border-pitch-border'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock
                  size={20}
                  className={clock.isStoppage ? 'text-fanta-amber' : 'text-fanta-volt'}
                  aria-hidden="true"
                />
                <div>
                  <div className="font-display font-extrabold text-3xl num-tabular leading-none text-arena-ink">
                    {clock.mmss}
                  </div>
                  <div className="text-[11px] font-bold mt-1 text-arena-muted">
                    {clock.isStoppage ? (
                      <span className="text-fanta-amber">
                        وقت بدل ضائع ({clock.displayMinute}) — لن تنتهي تلقائياً
                      </span>
                    ) : isRunning ? (
                      <span className="text-fanta-volt">الساعة تعمل • الدقيقة {clock.displayMinute}</span>
                    ) : (
                      <span className="text-fanta-orange">متوقفة مؤقتاً (استراحة)</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleToggleClock}
                className={`min-h-[48px] px-4 rounded-xl font-display font-extrabold text-sm inline-flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95 transition-transform ${
                  isRunning
                    ? 'bg-fanta-amber text-arena-bg'
                    : 'bg-fanta-volt text-arena-bg'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause size={18} strokeWidth={2.6} aria-hidden="true" />
                    <span>إيقاف</span>
                  </>
                ) : (
                  <>
                    <Play size={18} strokeWidth={2.6} aria-hidden="true" />
                    <span>استئناف</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        <button type="button" onClick={handleUndo} disabled={busy || !activeMatch.events.length}
          className="glass-card flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-pitch-border font-bold disabled:opacity-45">
          <Undo2 size={18} aria-hidden="true" /> تراجع عن آخر حدث
        </button>

        {/* Thumb-First Pitch Actions Grid (ZERO Assists!) */}
        <section aria-label="أحداث المباراة" className="grid grid-cols-2 gap-3">
          {/* GOAL */}
          <button
            type="button"
            onClick={() => setActionModal({ type: 'goal', subOffPlayerId: null })}
            className="min-h-[82px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white border-2 border-emerald-400/50 p-3.5 flex flex-col items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-transform"
          >
            <Flame size={26} strokeWidth={2.6} aria-hidden="true" />
            <span className="font-display font-extrabold text-lg leading-none">هدف</span>
          </button>

          {/* SUBSTITUTION */}
          <button
            type="button"
            onClick={() => setActionModal({ type: 'sub_off', subOffPlayerId: null })}
            className="min-h-[82px] rounded-2xl bg-sky-600 hover:bg-sky-500 text-white border-2 border-sky-400/50 p-3.5 flex flex-col items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-transform"
          >
            <ArrowLeftRight size={26} strokeWidth={2.6} aria-hidden="true" />
            <span className="font-display font-extrabold text-lg leading-none">تبديل لاعب</span>
          </button>

          {/* YELLOW CARD */}
          <button
            type="button"
            onClick={() => setActionModal({ type: 'yellow', subOffPlayerId: null })}
            className="min-h-[78px] rounded-2xl bg-amber-400 hover:bg-amber-300 text-arena-bg border-2 border-amber-200 p-3.5 flex flex-col items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-transform"
          >
            <span className="w-5 h-7 rounded-[4px] bg-arena-bg/20 border-2 border-arena-bg block" aria-hidden="true" />
            <span className="font-display font-extrabold text-base leading-none">إنذار أصفر</span>
          </button>

          {/* DIRECT RED CARD */}
          <button
            type="button"
            onClick={() => setActionModal({ type: 'red', subOffPlayerId: null })}
            className="min-h-[78px] rounded-2xl bg-red-600 hover:bg-red-500 text-white border-2 border-red-400/50 p-3.5 flex flex-col items-center justify-center gap-1.5 shadow-lg cursor-pointer active:scale-95 transition-transform"
          >
            <span className="w-5 h-7 rounded-[4px] bg-white/25 border-2 border-white block" aria-hidden="true" />
            <span className="font-display font-extrabold text-base leading-none">طرد مباشر</span>
          </button>

          {/* MISCONDUCT / RIOT PENALTY */}
          <button
            type="button"
            onClick={() => {
              setPenaltyTeamId(hId || '');
              setPenaltyPoints(3);
              setPenaltyReason('شغب');
              setActionModal({ type: 'penalty', subOffPlayerId: null });
            }}
            className="min-h-[68px] rounded-2xl bg-pitch-surface hover:bg-pitch-elevated text-fanta-orange border-2 border-fanta-orange/60 p-3 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <AlertTriangle size={20} strokeWidth={2.5} aria-hidden="true" />
            <span className="font-display font-extrabold text-sm">خصم نقاط / شغب</span>
          </button>

          {/* TEAM WITHDRAWAL / FORFEIT */}
          <button
            type="button"
            onClick={() => {
              setForfeitTeamId(hId || '');
              setForfeitApplyScore(true);
              setForfeitDeduction(3);
              setActionModal({ type: 'forfeit', subOffPlayerId: null });
            }}
            className="min-h-[68px] rounded-2xl bg-pitch-surface hover:bg-pitch-elevated text-fanta-crimson border-2 border-fanta-crimson/60 p-3 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
          >
            <ShieldAlert size={20} strokeWidth={2.5} aria-hidden="true" />
            <span className="font-display font-extrabold text-sm">انسحاب فريق</span>
          </button>
        </section>

        {/* Explicit Final Whistle CTA */}
        <button
          type="button"
          onClick={() => setActionModal({ type: 'end', subOffPlayerId: null })}
          className="w-full min-h-[58px] rounded-2xl bg-fanta-crimson hover:brightness-110 text-white font-display font-extrabold text-base flex items-center justify-center gap-2 shadow-[0_10px_28px_-8px_rgba(255,46,84,0.6)] cursor-pointer active:scale-[0.98]"
        >
          <StopCircle size={22} strokeWidth={2.5} aria-hidden="true" />
          <span>إنهاء المباراة — صافرة النهاية</span>
        </button>

        {/* Compact Live Event Log for Referee Verification */}
        <section className="pt-2 space-y-2.5">
          <h2 className="font-display font-extrabold text-base text-arena-muted">
            سجل أحداث هذه المباراة ({sortedEvents.length})
          </h2>
          <MatchTimeline events={sortedEvents} />
        </section>

        {/* MODAL 1: GOAL / YELLOW / RED / SUB_OFF PLAYER PICKER (ACTIVE 5v5) */}
        <Modal
          isOpen={['goal', 'yellow', 'red', 'sub_off'].includes(actionModal.type)}
          onClose={() => setActionModal({ type: null, subOffPlayerId: null })}
          title={
            actionModal.type === 'goal'
              ? 'من سجل الهدف؟'
              : actionModal.type === 'yellow'
                ? 'لمن البطاقة الصفراء؟'
                : actionModal.type === 'red'
                  ? 'لمن الطرد المباشر؟'
                  : 'الخطوة 1: من سيخرج من الملعب؟'
          }
          subtitle={`الدقيقة الحالية: ${clock.displayMinute} • اللاعبون النشطون داخل الملعب فقط`}
        >
          <div className="space-y-4">
            {[
              { team: homeTeam, list: homeActivePlayers, accent: 'text-fanta-orange' },
              { team: awayTeam, list: awayActivePlayers, accent: 'text-fanta-volt' },
            ].map((group, idx) => (
              <div key={group.team?.id || idx} className="space-y-2">
                <h3 className={`font-display font-extrabold text-sm ${group.accent}`}>
                  {group.team?.nameAr || (idx === 0 ? 'المستضيف' : 'الضيف')} ({group.list.length})
                </h3>
                {group.list.length === 0 ? (
                  <p className="text-xs text-arena-muted">لا يوجد لاعبون نشطون في الملعب.</p>
                ) : (
                  <div className="space-y-2">
                    {group.list.map((player) => {
                      const hasYellow = (playerYellowCounts[player.id] || 0) >= 1;
                      return (
                        <button
                          key={player.id}
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            if (actionModal.type === 'sub_off') {
                              setActionModal({ type: 'sub_on', subOffPlayerId: player.id });
                            } else {
                              handleLogPlayerEvent(player, actionModal.type);
                            }
                          }}
                          className="w-full min-h-[54px] px-3.5 rounded-2xl bg-arena-bg hover:bg-arena-elevated border-2 border-arena-border hover:border-fanta-orange flex items-center justify-between gap-2 text-right cursor-pointer active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-arena-elevated font-display font-extrabold text-xs num-tabular flex items-center justify-center shrink-0">
                              {player.jerseyNumber ?? '—'}
                            </span>
                            <span className="font-display font-bold text-base text-arena-ink truncate">
                              {player.nameAr}
                            </span>
                          </div>

                          {actionModal.type === 'yellow' && hasYellow && (
                            <span className="px-2 py-0.5 rounded-md bg-fanta-crimson text-white font-display font-extrabold text-[11px] shrink-0">
                              صفراء ثانية = طرد!
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Modal>

        {/* MODAL 2: SUB_ON BENCH PICKER (SAME TEAM ONLY, NON-ROLLING) */}
        <Modal
          isOpen={actionModal.type === 'sub_on'}
          onClose={() => setActionModal({ type: null, subOffPlayerId: null })}
          title="الخطوة 2: اختر اللاعب البديل"
          subtitle={
            subOffPlayer
              ? `يدخل بدلاً من ${subOffPlayer.nameAr} (اللاعب الخارج لا يعود للملعب)`
              : ''
          }
        >
          <div className="space-y-2.5">
            {subBenchPlayers.length === 0 ? (
              <EmptyState
                icon={Users}
                title="لا يوجد بدلاء متاحون"
                description="جميع بدلاء هذا الفريق قد شاركوا بالفعل أو لا يوجد بدلاء على الدكة."
              />
            ) : (
              subBenchPlayers.map((benchPlayer) => (
                <button
                  key={benchPlayer.id}
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    handleConfirmSubstitution(actionModal.subOffPlayerId, benchPlayer.id)
                  }
                  className="w-full min-h-[56px] px-4 rounded-2xl bg-arena-bg hover:bg-arena-elevated border-2 border-fanta-sky/50 flex items-center justify-between gap-2 text-right cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-fanta-sky/20 text-fanta-sky font-display font-extrabold text-xs num-tabular flex items-center justify-center">
                      {benchPlayer.jerseyNumber ?? '—'}
                    </span>
                    <span className="font-display font-bold text-base text-arena-ink">
                      {benchPlayer.nameAr}
                    </span>
                  </div>
                  <span className="text-xs font-display font-bold text-fanta-sky">دخول للملعب</span>
                </button>
              ))
            )}
          </div>
        </Modal>

        {/* MODAL 3: MISCONDUCT / RIOT PENALTY ("خصم نقاط / شغب") */}
        <Modal
          isOpen={actionModal.type === 'penalty'}
          onClose={() => setActionModal({ type: null, subOffPlayerId: null })}
          title="خصم نقاط / شغب"
          subtitle="يُخصم فوراً من رصيد الفريق في جدول الترتيب المباشر"
        >
          <form onSubmit={handleApplyPenalty} className="space-y-4">
            <div>
              <span className="block text-xs font-bold text-arena-muted mb-2">اختر الفريق</span>
              <div className="grid grid-cols-2 gap-2">
                {[homeTeam, awayTeam].filter(Boolean).map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setPenaltyTeamId(team.id)}
                    className={`min-h-[50px] px-3 rounded-xl border-2 font-display font-bold text-sm cursor-pointer ${
                      penaltyTeamId === team.id
                        ? 'bg-fanta-orange/20 border-fanta-orange text-arena-ink'
                        : 'bg-arena-bg border-arena-border text-arena-muted'
                    }`}
                  >
                    {team.nameAr}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-bold text-arena-muted mb-2">عدد النقاط المخصومة</span>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPenaltyPoints(n)}
                    className={`min-h-[48px] rounded-xl border-2 font-display font-extrabold text-base num-tabular cursor-pointer ${
                      Number(penaltyPoints) === n
                        ? 'bg-fanta-crimson border-fanta-crimson text-white'
                        : 'bg-arena-bg border-arena-border text-arena-ink'
                    }`}
                  >
                    -{n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="ref-pen-reason" className="block text-xs font-bold text-arena-muted mb-2">
                السبب
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {MISCONDUCT_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setPenaltyReason(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                      penaltyReason === r
                        ? 'bg-fanta-orange text-arena-bg border-fanta-orange'
                        : 'bg-arena-bg text-arena-muted border-arena-border'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                id="ref-pen-reason"
                required
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                className="w-full h-12 px-3.5 rounded-xl bg-arena-bg border-2 border-arena-border text-arena-ink font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={busy || !penaltyTeamId}
              className="w-full min-h-[54px] rounded-2xl bg-fanta-orange text-arena-bg font-display font-extrabold text-base cursor-pointer disabled:opacity-50"
            >
              تطبيق خصم -{penaltyPoints} نقاط الآن
            </button>
          </form>
        </Modal>

        {/* MODAL 4: TEAM WITHDRAWAL / FORFEIT ("انسحاب فريق") */}
        <Modal
          isOpen={actionModal.type === 'forfeit'}
          onClose={() => setActionModal({ type: null, subOffPlayerId: null })}
          title="تسجيل انسحاب فريق"
          subtitle="سيتم تسجيل الواقعة وإنهاء المباراة فوراً"
        >
          <form onSubmit={handleApplyForfeit} className="space-y-4">
            {slotPicker}
            <div>
              <span className="block text-xs font-bold text-arena-muted mb-2">الفريق المنسحب</span>
              <div className="grid grid-cols-2 gap-2">
                {[homeTeam, awayTeam].filter(Boolean).map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setForfeitTeamId(team.id)}
                    className={`min-h-[50px] px-3 rounded-xl border-2 font-display font-bold text-sm cursor-pointer ${
                      forfeitTeamId === team.id
                        ? 'bg-fanta-crimson/20 border-fanta-crimson text-arena-ink'
                        : 'bg-arena-bg border-arena-border text-arena-muted'
                    }`}
                  >
                    {team.nameAr}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-arena-bg border border-arena-border cursor-pointer">
              <span className="text-sm font-bold text-arena-ink">
                احتساب النتيجة 3 - 0 لصالح الفريق الخصم
              </span>
              <input
                type="checkbox"
                checked={forfeitApplyScore}
                onChange={(e) => setForfeitApplyScore(e.target.checked)}
                className="w-5 h-5 accent-fanta-crimson"
              />
            </label>

            <div>
              <span className="block text-xs font-bold text-arena-muted mb-2">
                خصم نقاط إضافي على الفريق المنسحب (اختياري)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 3, 6].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForfeitDeduction(n)}
                    className={`min-h-[46px] rounded-xl border-2 font-display font-extrabold text-sm num-tabular cursor-pointer ${
                      Number(forfeitDeduction) === n
                        ? 'bg-fanta-crimson border-fanta-crimson text-white'
                        : 'bg-arena-bg border-arena-border text-arena-ink'
                    }`}
                  >
                    {n === 0 ? 'بدون' : `-${n}`}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={busy || !forfeitTeamId}
              className="w-full min-h-[54px] rounded-2xl bg-fanta-crimson text-white font-display font-extrabold text-base cursor-pointer disabled:opacity-50"
            >
              تأكيد الانسحاب وإنهاء المباراة
            </button>
          </form>
        </Modal>

        {/* MODAL 5: FINAL WHISTLE CONFIRMATION */}
        <Modal
          isOpen={actionModal.type === 'end'}
          onClose={() => setActionModal({ type: null, subOffPlayerId: null })}
          title="تأكيد صافرة النهاية"
          subtitle="سيتم إيقاف الساعة واحتساب النتيجة رسمياً في الترتيب"
        >
          <div className="space-y-4">
            <div className="glass-card p-4 rounded-2xl bg-arena-bg border border-arena-border text-center">
              <div className="text-xs font-bold text-arena-muted mb-1">النتيجة المسجلة</div>
              <div className="font-display font-extrabold text-2xl text-arena-ink num-tabular">
                {homeTeam?.short || homeTeam?.nameAr} ({activeMatch.homeScore ?? 0}) - (
                {activeMatch.awayScore ?? 0}) {awayTeam?.short || awayTeam?.nameAr}
              </div>
              <div className="text-xs font-bold text-fanta-volt mt-1 num-tabular">
                التوقيت: {clock.mmss} ({clock.displayMinute})
              </div>
            </div>

            {slotPicker}
            {settings?.enableKnockout && slots.length > 0 && activeMatch.homeScore === activeMatch.awayScore && (
              <label className="block space-y-2">
                <span>الفائز بعد حسم التعادل</span>
                <select className="w-full rounded-xl bg-pitch-bg p-3" value={actionModal.winnerId || ''}
                  onChange={e => setActionModal({ ...actionModal, winnerId: e.target.value })}>
                  <option value="">اختر الفريق الفائز</option>
                  <option value={hId}>{homeTeam?.nameAr}</option>
                  <option value={aId}>{awayTeam?.nameAr}</option>
                </select>
              </label>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setActionModal({ type: null, subOffPlayerId: null })}
                className="min-h-[50px] rounded-xl bg-arena-elevated text-arena-ink font-display font-bold text-sm cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleFinalWhistle}
                className="min-h-[50px] rounded-xl bg-fanta-crimson text-white font-display font-extrabold text-sm cursor-pointer disabled:opacity-50"
              >
                نعم، أنهِ المباراة
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // =========================================================================
  // VIEW A: MATCH PICKER (LIVE & SCHEDULED MATCHES)
  // =========================================================================
  return (
    <div className="space-y-6 pb-8">
      {toast && (
        <div
          role="status"
          className={`px-4 py-3 rounded-2xl text-xs font-bold border-2 ${
            toast.tone === 'error'
              ? 'bg-fanta-crimson/15 border-fanta-crimson text-fanta-crimson'
              : 'bg-fanta-volt/15 border-fanta-volt text-fanta-volt'
          }`}
        >
          {toast.text}
        </div>
      )}

      <div>
        <span className="text-xs font-display font-extrabold tracking-widest uppercase text-fanta-volt">
          PITCH CONTROLLER
        </span>
        <h1 className="font-display font-extrabold text-2xl text-arena-ink">
          اختر المباراة لإدارتها
        </h1>
      </div>

      {/* Currently Live Matches */}
      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display font-extrabold text-sm text-fanta-crimson flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-fanta-crimson animate-pulse" />
            <span>مباريات جارية الآن — استئناف التحكم</span>
          </h2>
          {liveMatches.map((m) => {
            const home = getTeam(m.homeTeamId || m.homeTeam);
            const away = getTeam(m.awayTeamId || m.awayTeam);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMatchId(m.id)}
                className="glass-card w-full text-right rounded-2xl bg-pitch-surface border-2 border-fanta-crimson p-4 space-y-3 shadow-[0_10px_28px_-10px_rgba(255,46,84,0.45)] cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center justify-between">
                  <StatusBadge status={m.status} timerStatus={m.timerStatus} />
                  <span className="text-xs font-display font-bold text-fanta-volt">
                    ادخل للتحكم الآن
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamCrest team={home} size="sm" />
                    <span className="font-display font-bold text-base truncate">{home?.nameAr}</span>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-pitch-bg border border-pitch-border font-display font-extrabold text-xl num-tabular shrink-0">
                    {m.homeScore ?? 0} - {m.awayScore ?? 0}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-display font-bold text-base truncate">{away?.nameAr}</span>
                    <TeamCrest team={away} size="sm" />
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {/* Scheduled Matches Ready for Kick-off */}
      <section className="space-y-3">
        <h2 className="font-display font-extrabold text-sm text-arena-muted flex items-center gap-2">
          <CalendarClock size={16} className="text-fanta-orange" aria-hidden="true" />
          <span>المباريات المجدولة ({scheduledMatches.length})</span>
        </h2>

        {scheduledMatches.length === 0 ? (
          <EmptyState
            icon={Flag}
            title="لا توجد مباريات مجدولة جاهزة"
            description="ستظهر المباريات هنا فور جدولتها من بوابة إدارة الدوري."
          />
        ) : (
          <div className="space-y-3">
            {scheduledMatches.map((m) => {
              const home = getTeam(m.homeTeamId || m.homeTeam);
              const away = getTeam(m.awayTeamId || m.awayTeam);
              const dt = formatMatchDateTime(m.scheduledAt || m.date);

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => openLineupSetup(m)}
                  className="glass-card w-full text-right rounded-2xl bg-pitch-surface border-2 border-pitch-border hover:border-fanta-volt p-4 space-y-3 transition-colors cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-display font-bold text-arena-muted">
                      {m.round || 'دور المجموعات'}
                    </span>
                    {dt && (
                      <span className="num-tabular font-bold text-fanta-orange">{dt.full}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <TeamCrest team={home} size="sm" />
                      <span className="font-display font-bold text-base text-arena-ink truncate">
                        {home?.nameAr || 'يُحدد'}
                      </span>
                    </div>
                    <span className="text-xs font-display font-extrabold text-fanta-volt px-2.5 py-1 rounded-lg bg-fanta-volt/12 shrink-0">
                      بدء التشكيلة
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-display font-bold text-base text-arena-ink truncate">
                        {away?.nameAr || 'يُحدد'}
                      </span>
                      <TeamCrest team={away} size="sm" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
