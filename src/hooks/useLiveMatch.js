import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { normalizeMatch } from '../utils/tournamentSchema';
import { parseTimestamp } from '../utils/formatters';

const sortEventsNewestFirst = (events = []) =>
  [...events]
    .filter((ev) => ev && ev.type !== 'assist')
    .sort((a, b) => {
      const ta = parseTimestamp(a.createdAt || a.timestamp)?.getTime() ?? 0;
      const tb = parseTimestamp(b.createdAt || b.timestamp)?.getTime() ?? 0;
      if (tb !== ta) return tb - ta;
      return (b.minute || 0) - (a.minute || 0);
    });

/**
 * useLiveMatch — Subscribes in real time to a specific matchId OR the currently live match.
 *
 * Key Live-Broadcast Safeguard:
 *  - If a viewer is watching a live match and the referee blows the Final Whistle (or records a Forfeit),
 *    the match's status changes out of 'مباشر'. Rather than abruptly wiping the screen to an empty state,
 *    we retain the subscription on that just-ended match so the viewer receives the final score,
 *    the `fulltime` / `forfeit` event, and the celebration animation seamlessly!
 *  - If a NEW live match kicks off afterward, the listener automatically transitions to it.
 */
export function useLiveMatch(matchId = null) {
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubInnerMatch = null;
    let activeId = null;

    const detachInner = () => {
      if (unsubInnerMatch) {
        unsubInnerMatch();
        unsubInnerMatch = null;
      }
      activeId = null;
    };

    const attachMatchDoc = (targetId) => {
      if (activeId === targetId && unsubInnerMatch) return;
      detachInner();
      activeId = targetId;

      unsubInnerMatch = onSnapshot(
        doc(db, 'matches', String(targetId)),
        (docSnap) => {
          if (docSnap.exists()) {
            const normalized = normalizeMatch(docSnap.data({ serverTimestamps: 'estimate' }), docSnap.id);
            setMatch(normalized);
            setEvents(sortEventsNewestFirst(normalized.events));
            setError(null);
          } else {
            detachInner();
            setMatch(null);
            setEvents([]);
            setError(null);
          }
          setLoading(false);
        },
        (err) => {
          console.error('useLiveMatch snapshot error:', err);
          setError(err.message);
          setLoading(false);
        }
      );
    };

    if (matchId?.includes('/')) return;
    if (matchId) {
      attachMatchDoc(matchId);
      return () => detachInner();
    }

    const qLive = query(collection(db, 'matches'), where('status', '==', 'مباشر'), limit(1));
    const unsubLiveQuery = onSnapshot(
      qLive,
      (snap) => {
        if (!snap.empty) {
          attachMatchDoc(snap.docs[0].id);
        } else if (!activeId) {
          // Only show empty state if we weren't already watching a match that just ended
          setMatch(null);
          setEvents([]);
          setError(null);
          setLoading(false);
        }
      },
      (err) => {
        console.error('useLiveMatch query error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => {
      unsubLiveQuery();
      detachInner();
    };
  }, [matchId]);

  if (matchId?.includes('/')) return { match: null, events: [], loading: false, error: 'معرّف المباراة غير صالح' };
  return { match, events, loading, error };
}
