import { useState, useEffect, useCallback } from 'react';
import { parseTimestamp } from '../utils/formatters.js';

/**
 * Compute formatted match clock state from raw elapsed seconds and regulation minutes.
 * Never returns negative seconds. Automatically formats stoppage time once past regulation
 * (e.g. regulationMinutes = 20 -> 20:05 formats as displayMinute "20+1'", minute 21).
 */
export function computeClockSnapshot(totalSecondsRaw, regulationMinutesRaw = 20) {
  const totalSeconds = Math.max(0, Math.floor(Number(totalSecondsRaw) || 0));
  const regulationMinutes = Math.max(2, Math.floor(Number(regulationMinutesRaw) || 20));
  const regulationSeconds = regulationMinutes * 60;

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');

  const isStoppage = totalSeconds >= regulationSeconds;
  const stoppageSeconds = isStoppage ? totalSeconds - regulationSeconds : 0;
  const stoppageExtraMinutes = isStoppage ? Math.floor(stoppageSeconds / 60) + 1 : 0;

  // Standard football minute: 00:00 -> 0', 00:01..00:59 -> 1', 19:59 -> 20', 20:05 -> 21 (20+1')
  const minute = totalSeconds === 0 ? 0 : Math.floor(totalSeconds / 60) + 1;
  const displayMinute =
    totalSeconds === 0
      ? "0'"
      : isStoppage
        ? `${regulationMinutes}+${stoppageExtraMinutes}'`
        : `${minute}'`;

  const stoppageMinPart = Math.floor(stoppageSeconds / 60);
  const stoppageSecPart = stoppageSeconds % 60;

  return {
    totalSeconds,
    mmss: `${pad(mins)}:${pad(secs)}`,
    minute,
    displayMinute,
    isStoppage,
    stoppageExtraMinutes,
    stoppageMmss: isStoppage ? `+${pad(stoppageMinPart)}:${pad(stoppageSecPart)}` : null,
    regulationMinutes,
  };
}

/**
 * useMatchTimer — Zero-Lag, Zero-Crash Synced Match Clock Hook.
 *
 * Engineering Guarantees:
 *  1. Zero Firestore writes per second: ticks locally every 1s ONLY while timerStatus === 'running'.
 *  2. Optimistic serverTimestamp() null safety: when the referee starts/resumes with serverTimestamp(),
 *     Firestore's local cache temporarily emits timerStartedAt === null. Listeners use the SDK local timestamp estimate
 *     until the real server Timestamp resolves (~100-300ms later).
 *  3. Clock-skew protection: clamps live delta with Math.max(0, ...) so viewers NEVER see negative seconds.
 *  4. Seamless Stoppage Time: counts UP indefinitely past regulationMinutes (halfDurationMinutes * 2)
 *     until the referee explicitly ends the match.
 *  5. getSnapshot(): computes exact up-to-the-millisecond minute/displayMinute right when an event is logged.
 */
export function useMatchTimer(match, halfDurationMinutes = 10) {
  const regulationMinutes = Math.max(2, (Number(halfDurationMinutes) || 10) * 2);
  const timerStatus = match?.timerStatus || 'idle';
  const isRunning = timerStatus === 'running' && match?.status === 'مباشر';

  const [nowMs, setNowMs] = useState(() => Date.now());
  const startMs = parseTimestamp(match?.timerStartedAt)?.getTime();
  const accumulated = Math.max(0, Math.floor(Number(match?.accumulatedSeconds) || 0));
  const computeElapsedAt = useCallback(referenceNowMs => {
    const delta = isRunning && Number.isFinite(startMs) ? Math.max(0, referenceNowMs - startMs) : 0;
    return accumulated + Math.floor(delta / 1000);
  }, [accumulated, isRunning, startMs]);

  // Client-side 1-second ticker ONLY while running
  useEffect(() => {
    if (!isRunning) return undefined;
    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Instant fresh snapshot for stamping events / pausing / ending without 1s lag
  const getSnapshot = useCallback(() => {
    const freshElapsed = computeElapsedAt(Date.now());
    return computeClockSnapshot(freshElapsed, regulationMinutes);
  }, [computeElapsedAt, regulationMinutes]);

  const currentElapsed = computeElapsedAt(nowMs);
  const snapshot = computeClockSnapshot(currentElapsed, regulationMinutes);

  return {
    ...snapshot,
    timerStatus,
    isRunning,
    isPaused: timerStatus === 'paused',
    isIdle: timerStatus === 'idle',
    isEnded: timerStatus === 'ended',
    getSnapshot,
  };
}
