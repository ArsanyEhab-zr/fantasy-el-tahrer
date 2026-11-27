import { useEffect, useMemo, useRef, useState } from 'react';
import { parseTimestamp } from '../utils/formatters.js';

const BREAKING_DURATION_MS = 9000;
const GOAL_FLASH_DURATION_MS = 5500;

const cleanEvents = (events = []) =>
  (Array.isArray(events) ? events : []).filter(ev => ev && ev.type !== 'assist');

/**
 * Pure diff helper comparing previous and next match event lists.
 * Detects newly added referee events AND reversed/undone events (when undoLastEvent removes an item).
 */
export function diffMatchEvents(prevState, nextMatch) {
  const nextId = nextMatch?.id ? String(nextMatch.id) : null;
  const nextEvents = cleanEvents(nextMatch?.events);

  if (!nextId || !prevState || prevState.matchId !== nextId) {
    return { added: [], removed: [] };
  }

  const prevIds = new Set(prevState.events.map(ev => ev.id));
  const nextIds = new Set(nextEvents.map(ev => ev.id));

  const added = nextEvents.filter(ev => ev.id && !prevIds.has(ev.id));
  const removed = prevState.events.filter(ev => ev.id && !nextIds.has(ev.id));

  return { added, removed };
}

/**
 * Pick the highest-priority breaking banner event from a diff batch.
 * Example: a 2nd-yellow ejection adds both yellow + red simultaneously; red takes priority.
 */
export function selectBreakingFromDiff({ added, removed }, nextMatch) {
  if (added.length > 0) {
    const red = added.find(ev => ev.type === 'red');
    const goal = added.find(ev => ev.type === 'goal');
    return red || goal || added.at(-1);
  }
  if (removed.length > 0) {
    // If a 2nd yellow + red were undone together, report the red card reversal cleanly.
    const primary = removed.find(ev => ev.type === 'red') || removed.at(-1);
    return {
      id: `undo-${primary.id || Date.now()}`,
      type: 'undo',
      undoneType: primary.type,
      teamId: primary.teamId || null,
      playerId: primary.playerId || null,
      playerName: primary.playerName || primary.playerInName || primary.teamName || '',
      displayMinute: primary.displayMinute || (primary.minute != null ? `${primary.minute}'` : ''),
      homeScore: nextMatch?.homeScore ?? 0,
      awayScore: nextMatch?.awayScore ?? 0,
      detail: primary.detail || '',
    };
  }
  return null;
}

/**
 * useBroadcastEvents — Real-time match event & undo tracker for Watch Live and OBS Overlay.
 */
export function useBroadcastEvents(match) {
  const prevRef = useRef(null);
  const breakingTimerRef = useRef(null);
  const goalTimerRef = useRef(null);
  const [breakingEvent, setBreakingEvent] = useState(null);
  const [goalFlash, setGoalFlash] = useState(null);

  const matchId = match?.id ? String(match.id) : null;
  const eventsList = useMemo(() => cleanEvents(match?.events), [match?.events]);

  const recentEvents = useMemo(
    () =>
      [...eventsList]
        .sort((a, b) => {
          const ta = parseTimestamp(a.createdAt || a.timestamp)?.getTime() ?? 0;
          const tb = parseTimestamp(b.createdAt || b.timestamp)?.getTime() ?? 0;
          if (tb !== ta) return tb - ta;
          return (b.minute || 0) - (a.minute || 0);
        })
        .slice(0, 5),
    [eventsList]
  );

  // Clean up pending timers strictly on unmount so unrelated match updates never stall an active alert.
  useEffect(() => {
    return () => {
      if (breakingTimerRef.current) clearTimeout(breakingTimerRef.current);
      if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const prev = prevRef.current;
    const diff = diffMatchEvents(prev, match);
    prevRef.current = { matchId, events: eventsList };

    const nextBreaking = selectBreakingFromDiff(diff, match);
    if (!nextBreaking) return;

    setBreakingEvent(nextBreaking);
    if (breakingTimerRef.current) clearTimeout(breakingTimerRef.current);
    breakingTimerRef.current = setTimeout(() => {
      setBreakingEvent(curr => (curr?.id === nextBreaking.id ? null : curr));
    }, BREAKING_DURATION_MS);

    if (nextBreaking.type === 'goal') {
      const flash = {
        id: nextBreaking.id,
        playerName: nextBreaking.playerName || '',
        playerId: nextBreaking.playerId || null,
        teamId: nextBreaking.teamId || null,
        displayMinute: nextBreaking.displayMinute || (nextBreaking.minute != null ? `${nextBreaking.minute}'` : ''),
        homeScore: match?.homeScore ?? 0,
        awayScore: match?.awayScore ?? 0,
      };
      setGoalFlash(flash);
      if (goalTimerRef.current) clearTimeout(goalTimerRef.current);
      goalTimerRef.current = setTimeout(() => {
        setGoalFlash(curr => (curr?.id === flash.id ? null : curr));
      }, GOAL_FLASH_DURATION_MS);
    }
  }, [match, matchId, eventsList]);

  return {
    breakingEvent,
    goalFlash,
    recentEvents,
  };
}
