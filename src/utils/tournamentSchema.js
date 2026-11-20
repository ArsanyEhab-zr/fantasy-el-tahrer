import {
  collection,
  doc,
  runTransaction,
  setDoc,
  deleteDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Canonical Firestore Schema, Safe Normalizers & Write Helpers for Project Fanta.
 * Single Source of Truth for:
 *  - config/tournament: { appName: 'فانتزي التحرير | Fantasy El Tahrrer', enableKnockout: boolean, halfDurationMinutes: number }
 *  - matches: { homeTeamId, awayTeamId, scheduledAt, status, homeScore, awayScore,
 *               timerStatus, timerStartedAt, accumulatedSeconds,
 *               homeActivePitch, awayActivePitch, homeBench, awayBench,
 *               homeSubbedOff, awaySubbedOff, events[] }
 *  - penalties: { id, teamId, matchId?, pointsDeducted, reason, createdAt }
 */

export const DEFAULT_TOURNAMENT_SETTINGS = Object.freeze({
  appName: 'فانتزي التحرير | Fantasy El Tahrrer',
  enableKnockout: false,
  halfDurationMinutes: 10,
});

export const DEFAULT_BRACKET_CONFIG = Object.freeze({
  size: 4,
});

export const KNOCKOUT_ROUNDS = new Set([
  'دور الـ 16',
  'ربع النهائي',
  'نصف النهائي',
  'النهائي',
]);

// ============================================================================
// SAFE NORMALIZERS (Resilient to Fresh & Legacy Firestore Documents)
// ============================================================================

export const normalizeTournamentSettings = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_TOURNAMENT_SETTINGS };
  }
  const parsedHalf = Number(raw.halfDurationMinutes);
  return {
    appName: typeof raw.appName === 'string' && raw.appName.trim() && raw.appName !== 'Fanta'
      ? raw.appName
      : DEFAULT_TOURNAMENT_SETTINGS.appName,
    enableKnockout: Boolean(raw.enableKnockout),
    halfDurationMinutes:
      Number.isFinite(parsedHalf) && parsedHalf >= 1 && parsedHalf <= 90
        ? Math.floor(parsedHalf)
        : DEFAULT_TOURNAMENT_SETTINGS.halfDurationMinutes,
  };
};

export const normalizeMatchEvent = (raw, fallbackIdx = 0) => {
  if (!raw || typeof raw !== 'object' || raw.type === 'assist') return null;
  const numericMinute = Number.isFinite(Number(raw.minute)) ? Math.max(0, Number(raw.minute)) : 0;
  return {
    ...raw,
    id: raw.id || `evt-${fallbackIdx}-${numericMinute}`,
    type: raw.type || 'goal',
    teamId: raw.teamId ? String(raw.teamId) : null,
    playerId: raw.playerId ? String(raw.playerId) : null,
    playerInId: raw.playerInId ? String(raw.playerInId) : null,
    playerOutId: raw.playerOutId ? String(raw.playerOutId) : null,
    minute: numericMinute,
    displayMinute: raw.displayMinute || `${numericMinute}'`,
    createdAt: raw.createdAt || raw.timestamp || null,
  };
};

export const normalizeMatch = (raw, id) => {
  const data = raw && typeof raw === 'object' ? raw : {};
  const homeTeamId = String(data.homeTeamId || data.homeTeam || '');
  const awayTeamId = String(data.awayTeamId || data.awayTeam || '');
  const status = ['قادمة', 'scheduled'].includes(data.status) ? 'مجدولة' : data.status || 'مجدولة';
  const isEnded = status === 'منتهية' || status === 'انتهت' || status === 'انسحاب';

  const legacyMinuteSec = Number.isFinite(Number(data.minute))
    ? Math.max(0, Math.floor(Number(data.minute) * 60))
    : 0;
  const accumulatedSeconds =
    data.accumulatedSeconds != null && Number.isFinite(Number(data.accumulatedSeconds))
      ? Math.max(0, Math.floor(Number(data.accumulatedSeconds)))
      : legacyMinuteSec;

  const timerStatus = data.timerStatus || (isEnded ? 'ended' : status === 'مباشر' ? 'paused' : 'idle');

  const events = Array.isArray(data.events)
    ? data.events.map((ev, i) => normalizeMatchEvent(ev, i)).filter(Boolean)
    : [];

  return {
    ...data,
    id: String(id ?? data.id ?? ''),
    homeTeamId,
    awayTeamId,
    // Keep backwards-compatible aliases
    homeTeam: homeTeamId,
    awayTeam: awayTeamId,
    scheduledAt: data.scheduledAt ?? data.date ?? null,
    status,
    homeScore: Number.isFinite(Number(data.homeScore)) ? Math.max(0, Number(data.homeScore)) : 0,
    awayScore: Number.isFinite(Number(data.awayScore)) ? Math.max(0, Number(data.awayScore)) : 0,
    timerStatus,
    timerStartedAt: data.timerStartedAt ?? null,
    accumulatedSeconds,
    homeActivePitch: Array.isArray(data.homeActivePitch) ? data.homeActivePitch.map(String) : [],
    awayActivePitch: Array.isArray(data.awayActivePitch) ? data.awayActivePitch.map(String) : [],
    homeBench: Array.isArray(data.homeBench) ? data.homeBench.map(String) : [],
    awayBench: Array.isArray(data.awayBench) ? data.awayBench.map(String) : [],
    homeSubbedOff: Array.isArray(data.homeSubbedOff) ? data.homeSubbedOff.map(String) : [],
    awaySubbedOff: Array.isArray(data.awaySubbedOff) ? data.awaySubbedOff.map(String) : [],
    events,
  };
};

export const normalizePlayer = (raw, id) => {
  const data = raw && typeof raw === 'object' ? raw : {};
  const teamId = String(data.teamId || data.team || '');
  const jerseyNumber = data.number ?? data.jerseyNumber;
  return {
    ...data,
    id: String(id ?? data.id ?? ''),
    nameAr: data.nameAr || 'لاعب',
    position: data.position || 'لاعب',
    jerseyNumber:
      jerseyNumber != null && Number.isFinite(Number(jerseyNumber))
        ? Number(jerseyNumber)
        : null,
    teamId,
    team: teamId,
    manualGoalOffset: Number.isFinite(Number(data.manualGoalOffset))
      ? Number(data.manualGoalOffset)
      : 0,
    manualYellowOffset: Number.isFinite(Number(data.manualYellowOffset))
      ? Number(data.manualYellowOffset)
      : 0,
    manualRedOffset: Number.isFinite(Number(data.manualRedOffset))
      ? Number(data.manualRedOffset)
      : 0,
  };
};

export const normalizePenalty = (raw, id) => {
  const data = raw && typeof raw === 'object' ? raw : {};
  return {
    id: String(id ?? data.id ?? ''),
    teamId: String(data.teamId || ''),
    matchId: data.matchId ? String(data.matchId) : null,
    pointsDeducted: Number.isFinite(Number(data.pointsDeducted))
      ? Math.max(0, Number(data.pointsDeducted))
      : 0,
    reason: typeof data.reason === 'string' && data.reason.trim() ? data.reason.trim() : 'قرار انضباطي',
    createdAt: data.createdAt ?? null,
  };
};

// ============================================================================
// CANONICAL FIRESTORE WRITE MUTATIONS (Single Source of Truth)
// ============================================================================

const makeEventId = (prefix) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Auto-creates or updates config/tournament safely.
 */
export const saveTournamentSettings = async (partial) => {
  const safeHalf = Number(partial.halfDurationMinutes);
  const payload = {
    appName: DEFAULT_TOURNAMENT_SETTINGS.appName,
    updatedAt: serverTimestamp(),
  };
  if (typeof partial.enableKnockout === 'boolean') {
    payload.enableKnockout = partial.enableKnockout;
  }
  if (Number.isFinite(safeHalf) && safeHalf >= 1 && safeHalf <= 90) {
    payload.halfDurationMinutes = Math.floor(safeHalf);
  }
  await setDoc(doc(db, 'config', 'tournament'), payload, { merge: true });
};

/**
 * Kick-off a scheduled match: locks Starting 5 + Bench and starts synced Firestore clock via serverTimestamp().
 */
export const kickOffMatch = async (
  matchId,
  { homeActivePitch, awayActivePitch, homeBench, awayBench, homeScore = 0, awayScore = 0 }
) => {
  const ref = doc(db, 'matches', String(matchId));
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists() || !['مجدولة', 'قادمة', 'scheduled'].includes(snap.data().status || 'مجدولة')) {
      throw new Error('تغيّرت حالة المباراة. أعد فتح قائمة المباريات.');
    }
    tx.update(ref, {
      status: 'مباشر',
      timerStatus: 'running',
      timerStartedAt: serverTimestamp(),
      accumulatedSeconds: 0,
      minute: 0,
      homeScore,
      awayScore,
      homeActivePitch,
      awayActivePitch,
      homeBench,
      awayBench,
      homeSubbedOff: [],
      awaySubbedOff: [],
    });
  });
};

/**
 * Pause the match clock (e.g., Halftime) and persist accumulatedSeconds atomically.
 */
export const pauseMatchClock = async (matchId, clockSnapshot) => {
  return editLiveMatch(matchId, (tx, ref, match) => {
    if (match.timerStatus !== 'running') throw new Error('تغيّرت حالة ساعة المباراة.');
    tx.update(ref, {
      timerStatus: 'paused',
      accumulatedSeconds: Math.max(0, Math.floor(clockSnapshot.totalSeconds || 0)),
      timerStartedAt: null,
      minute: clockSnapshot.minute || 0,
    });
  });
};

/**
 * Resume the match clock seamlessly from accumulatedSeconds using serverTimestamp().
 */
export const resumeMatchClock = async (matchId, clockSnapshot) => {
  return editLiveMatch(matchId, (tx, ref, match) => {
    if (match.timerStatus !== 'paused') throw new Error('تغيّرت حالة ساعة المباراة.');
    tx.update(ref, {
      timerStatus: 'running',
      timerStartedAt: serverTimestamp(),
      accumulatedSeconds: Math.max(0, Math.floor(clockSnapshot.totalSeconds || 0)),
    });
  });
};

// Read the current match on every Firestore retry, including its unmodified legacy event array.
function editLiveMatch(id, change) {
  const ref = doc(db, 'matches', String(id));
  return runTransaction(db, async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists() || snap.data().status !== 'مباشر') throw new Error('هذه المباراة ليست مباشرة.');
    return change(tx, ref, normalizeMatch(snap.data(), id), snap.data().events || []);
  });
}

function teamSide(match, teamId) {
  if (teamId && teamId === match.homeTeamId) return 'home';
  if (teamId && teamId === match.awayTeamId) return 'away';
  throw new Error('الفريق لا يشارك في هذه المباراة.');
}

/**
 * Log Goal, Yellow Card (with automatic 2nd-yellow -> Red ejection), or Direct Red Card.
 * ZERO Assists — stamps exact minute & displayMinute from live clock snapshot.
 */
export const recordPlayerMatchEvent = async ({
  match: selected,
  player,
  actionType,
  clockSnapshot,
}) => {
  return editLiveMatch(selected.id, (tx, ref, match) => {
    const pTeamId = player.teamId || player.team;
    const side = teamSide(match, pTeamId);
    const pitchField = side + 'ActivePitch';
    if (!match[pitchField].includes(player.id)) throw new Error('اللاعب غير موجود في الملعب.');

    const nowIso = new Date().toISOString();
    const eventsToPush = [];
    let finalType = actionType;

    if (actionType === 'yellow') {
      const hasYellow = (match.events || []).some(
        (e) => e.playerId === player.id && e.type === 'yellow'
      );
      if (hasYellow) {
        eventsToPush.push({
          id: makeEventId('y2'),
          type: 'yellow',
          teamId: pTeamId,
          playerId: player.id,
          playerName: player.nameAr,
          minute: clockSnapshot.minute,
          displayMinute: clockSnapshot.displayMinute,
          detail: 'بطاقة صفراء ثانية',
          createdAt: nowIso,
        });
        finalType = 'red';
      }
    }

    eventsToPush.push({
      id: makeEventId(finalType),
      ...(eventsToPush.length ? { secondYellowId: eventsToPush[0].id } : {}),
      type: finalType,
      teamId: pTeamId,
      playerId: player.id,
      playerName: player.nameAr,
      minute: clockSnapshot.minute,
      displayMinute: clockSnapshot.displayMinute,
      detail:
        finalType === 'goal'
          ? 'هدف!'
          : finalType === 'yellow'
            ? 'إنذار أصفر'
            : 'طرد — بطاقة حمراء',
      createdAt: nowIso,
    });

    const updates = {
      minute: clockSnapshot.minute,
      events: arrayUnion(...eventsToPush),
    };

    if (finalType === 'goal') {
      const scoreKey = side + 'Score';
      updates[scoreKey] = (match[scoreKey] || 0) + 1;
    }

    if (finalType === 'red') {
      updates[pitchField] = (match[pitchField] || []).filter((id) => id !== player.id);
    }

    tx.update(ref, updates);
    return { finalType };
  });
};

/**
 * Strict non-rolling 2-step substitution (Active Pitch OFF -> Same-Team Bench ON).
 */
export const recordSubstitutionEvent = async ({
  match: selected, offPlayer, onPlayer, clockSnapshot,
}) => editLiveMatch(selected.id, (tx, ref, match) => {
  const pTeamId = offPlayer.teamId || offPlayer.team;
  const side = teamSide(match, pTeamId);
  const pitchField = side + 'ActivePitch';
  const benchField = side + 'Bench';
  const subbedField = side + 'SubbedOff';
  if ((onPlayer.teamId || onPlayer.team) !== pTeamId ||
      !match[pitchField].includes(offPlayer.id) || !match[benchField].includes(onPlayer.id) ||
      match[subbedField].includes(onPlayer.id)) throw new Error('تغيّرت التشكيلة. اختر اللاعبين مجدداً.');

  const nextPitch = [...(match[pitchField] || []).filter((id) => id !== offPlayer.id), onPlayer.id];
  const nextBench = (match[benchField] || []).filter((id) => id !== onPlayer.id);
  const nextSubbedOff = Array.from(new Set([...(match[subbedField] || []), offPlayer.id]));

  const subEvent = {
    id: makeEventId('sub'),
    type: 'sub',
    teamId: pTeamId,
    playerId: onPlayer.id,
    playerInId: onPlayer.id,
    playerOutId: offPlayer.id,
    playerInName: onPlayer.nameAr,
    playerOutName: offPlayer.nameAr,
    playerName: onPlayer.nameAr,
    minute: clockSnapshot.minute,
    displayMinute: clockSnapshot.displayMinute,
    detail: `دخول ${onPlayer.nameAr} بدلاً من ${offPlayer.nameAr}`,
    createdAt: new Date().toISOString(),
  };

  tx.update(ref, {
    [pitchField]: nextPitch,
    [benchField]: nextBench,
    [subbedField]: nextSubbedOff,
    minute: clockSnapshot.minute,
    events: arrayUnion(subEvent),
  });
});

/**
 * Create a disciplinary point deduction in `penalties` collection,
 * and optionally stamp a `penalty` event onto the active match timeline.
 */
export const applyDisciplinaryPenalty = async ({
  teamId,
  teamName = '',
  matchId = null,
  pointsDeducted,
  reason,
  clockSnapshot = null,
}) => {
  const safePoints = Math.max(1, Math.floor(Number(pointsDeducted) || 1));
  const safeReason = (reason || 'شغب').trim();

  const penalty = doc(collection(db, 'penalties'));
  const data = {
    teamId: String(teamId), matchId: matchId ? String(matchId) : null,
    pointsDeducted: safePoints, reason: safeReason, createdAt: serverTimestamp(),
  };
  if (!matchId || !clockSnapshot) return setDoc(penalty, data);
  await editLiveMatch(matchId, (tx, ref, match) => {
    teamSide(match, data.teamId);
    tx.set(penalty, data);
    tx.update(ref, {
      minute: clockSnapshot.minute,
      events: arrayUnion({
        id: makeEventId('pen'), type: 'penalty', penaltyDocId: penalty.id,
        teamId: data.teamId, teamName, minute: clockSnapshot.minute,
        displayMinute: clockSnapshot.displayMinute, createdAt: new Date().toISOString(),
        detail: `خصم -${safePoints} نقاط • ${safeReason}`,
      }),
    });
  });
};

export function undoLastEvent(matchId, expectedId) {
  return editLiveMatch(matchId, (tx, ref, match, rawEvents) => {
    const event = match.events.at(-1);
    if (!expectedId || event?.id !== expectedId) throw new Error('تغيّر آخر حدث. راجع سجل المباراة.');
    const events = [...rawEvents];
    const index = events.findLastIndex((row, i) => normalizeMatchEvent(row, i)?.id === expectedId);
    events.splice(index, 1);
    const updates = { events };
    const side = teamSide(match, event.teamId);
    const pitch = side + 'ActivePitch';
    const bench = side + 'Bench';
    const off = side + 'SubbedOff';
    switch (event.type) {
      case 'goal':
        updates[side + 'Score'] = Math.max(0, match[side + 'Score'] - 1);
        break;
      case 'red': {
        if (!event.playerId) throw new Error('سجل الطرد يفتقد معرّف اللاعب.');
        const yellow = events[index - 1];
        if (yellow?.type === 'yellow' && yellow.playerId === event.playerId &&
            (event.secondYellowId && event.secondYellowId === yellow.id ||
             yellow.detail === 'بطاقة صفراء ثانية' && yellow.createdAt === event.createdAt)) {
          events.splice(index - 1, 1);
        }
        updates[pitch] = [...new Set([...match[pitch], event.playerId])];
        break;
      }
      case 'sub':
        if (!event.playerInId || !event.playerOutId) throw new Error('سجل التبديل يفتقد معرّفات اللاعبين.');
        updates[pitch] = [...new Set([...match[pitch].filter(id => id !== event.playerInId), event.playerOutId])];
        updates[bench] = [...new Set([...match[bench], event.playerInId])];
        updates[off] = match[off].filter(id => id !== event.playerOutId);
        break;
      case 'penalty':
        if (event.penaltyDocId) tx.delete(doc(db, 'penalties', event.penaltyDocId));
        break;
      case 'yellow':
        break;
      default:
        throw new Error('لا يمكن التراجع عن هذا الحدث.');
    }
    tx.update(ref, updates);
  });
}

/**
 * Reverse / delete a disciplinary penalty so standings immediately recalculate.
 */
export const reverseDisciplinaryPenalty = async (penaltyId) => {
  await deleteDoc(doc(db, 'penalties', String(penaltyId)));
};

// Canonical bracket match document IDs also define which side receives each winner.
const slotPattern = /^(R16_[1-8]|QF[1-4]|SF[12]|FINAL)$/;
export const isBracketSlot = id => slotPattern.test(id);

export const bracketSlotsFor = match => {
  if (isBracketSlot(match.id)) return [match.id];
  const rounds = { 'دور الـ 16': ['R16_', 8], 'ربع النهائي': ['QF', 4], 'نصف النهائي': ['SF', 2], 'النهائي': ['FINAL', 1] };
  const round = rounds[match.round];
  if (!round) return [];
  const [prefix, count] = round;
  return count === 1 ? [prefix] : Array.from({ length: count }, (_, i) => prefix + (i + 1));
};

async function finishMatch({ match: selected, clockSnapshot, tiebreakWinnerId, bracketSlotId, withdrawingTeamId,
  withdrawingTeamName = '', applyForfeitScore = true, pointsDeducted = 0 }) {
  return editLiveMatch(selected.id, async (tx, ref, match) => {
    const forfeit = withdrawingTeamId != null;
    const updates = {
      status: forfeit ? 'انسحاب' : 'منتهية', timerStatus: 'ended',
      accumulatedSeconds: Math.max(0, Math.floor(clockSnapshot.totalSeconds || 0)),
      timerStartedAt: null, minute: clockSnapshot.minute,
    };
    let winner = match.homeScore === match.awayScore ? tiebreakWinnerId :
      match.homeScore > match.awayScore ? match.homeTeamId : match.awayTeamId;
    if (forfeit) {
      const side = teamSide(match, withdrawingTeamId);
      winner = side === 'home' ? match.awayTeamId : match.homeTeamId;
      updates.forfeitTeamId = withdrawingTeamId;
      updates.forfeitReason = `انسحاب ${withdrawingTeamName || 'الفريق'}`;
      if (applyForfeitScore) {
        updates.homeScore = side === 'home' ? 0 : 3;
        updates.awayScore = side === 'away' ? 0 : 3;
      }
    }
    const slots = bracketSlotsFor(match);
    if (slots.length && (await tx.get(doc(db, 'config', 'tournament'))).data()?.enableKnockout === true) {
      if (!winner) throw new Error('اختر الفائز بعد حسم التعادل.');
      teamSide(match, winner);
      updates.winnerTeamId = winner;
      const slot = slots.length === 1 ? slots[0] : match.bracketSlotId || bracketSlotId;
      if (!slots.includes(slot)) throw new Error('حدّد موقع المباراة في شجرة الإقصائيات.');
      // Pre-rebuild fixtures can have random document IDs. Reserve their selected slot atomically.
      let binding;
      if (slot !== match.id) {
        const canonical = await tx.get(doc(db, 'matches', slot));
        binding = doc(db, 'config', 'bracket');
        const bound = (await tx.get(binding)).data()?.slotMatches?.[slot];
        if (canonical.exists() || (bound && bound !== match.id)) throw new Error('هذه الخانة مرتبطة بمباراة أخرى.');
        updates.bracketSlotId = slot;
      }
      if (slot !== 'FINAL') {
        const number = Number(slot.match(/\d+$/)[0]);
        const parent = slot.startsWith('R16_') ? 'QF' + Math.ceil(number / 2) :
          slot.startsWith('QF') ? 'SF' + Math.ceil(number / 2) : 'FINAL';
        const side = number % 2 ? 'home' : 'away';
        const target = doc(db, 'matches', parent);
        const next = await tx.get(target);
        const data = next.data() || {};
        const occupant = data[side + 'TeamId'] || data[side + 'Team'];
        if ((data.status && !['مجدولة', 'قادمة', 'scheduled'].includes(data.status)) || (occupant && occupant !== winner)) {
          throw new Error('تعذّر التصعيد. راجع مواجهة الدور التالي في لوحة الإدارة.');
        }
        tx.set(target, {
          type: 'knockout', round: parent === 'FINAL' ? 'النهائي' : parent.startsWith('SF') ? 'نصف النهائي' : 'ربع النهائي',
          ...(!next.exists() ? {status: 'مجدولة', timerStatus: 'idle', homeScore: 0, awayScore: 0} : {}),
          [side + 'TeamId']: winner, [side + 'Team']: winner,
        }, { merge: true });
      }
      if (binding) tx.set(binding, { slotMatches: { [slot]: match.id } }, { merge: true });
    }
    const points = Math.max(0, Math.floor(Number(pointsDeducted) || 0));
    if (forfeit && points) tx.set(doc(collection(db, 'penalties')), {
      teamId: withdrawingTeamId, matchId: match.id, pointsDeducted: points,
      reason: 'انسحاب', createdAt: serverTimestamp(),
    });
    const type = forfeit ? 'forfeit' : 'fulltime';
    updates.events = arrayUnion({
      id: makeEventId(type), type, minute: clockSnapshot.minute,
      displayMinute: clockSnapshot.displayMinute, createdAt: new Date().toISOString(),
      ...(forfeit ? { teamId: withdrawingTeamId, teamName: withdrawingTeamName } : {}),
      detail: forfeit ? `${updates.forfeitReason}${applyForfeitScore ? ' • احتساب 3-0 للخصم' : ''}${points ? ' • خصم ' + points + ' نقاط' : ''}` :
        `النتيجة النهائية: ${match.homeScore} - ${match.awayScore}`,
    });
    tx.update(ref, updates);
  });
}

export const endMatchManually = finishMatch;
export const recordTeamForfeit = finishMatch;
