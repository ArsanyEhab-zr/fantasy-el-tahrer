import { useState, useEffect } from 'react';
import { doc, collection, onSnapshot, query, where, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';

export function useLiveMatch(matchId) {
  const [match, setMatch] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribeMatch;
    let unsubscribeEvents;
    setLoading(true);

    const setupListeners = (activeMatchId) => {
      const matchRef = doc(db, 'matches', activeMatchId);
      unsubscribeMatch = onSnapshot(matchRef, (docSnap) => {
        if (docSnap.exists()) {
          const matchData = { ...docSnap.data(), id: docSnap.id };
          setMatch(matchData);
          
          // Derive events from match array and sort descending by timestamp
          const matchEvents = matchData.events || [];
          const sortedEvents = [...matchEvents].sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
          });
          setEvents(sortedEvents);
        } else {
          setError('Match not found');
          setMatch(null);
          setEvents([]);
        }
        setLoading(false);
      });
    };

    if (matchId) {
      setupListeners(matchId);
    } else {
      const qLive = query(collection(db, 'matches'), where('status', '==', 'مباشر'), limit(1));
      const unsubLive = onSnapshot(qLive, (snap) => {
        if (!snap.empty) {
          const liveId = snap.docs[0].id;
          setupListeners(liveId);
        } else {
          setMatch(null);
          setEvents([]);
          setLoading(false);
        }
      });
      return () => {
        unsubLive();
        if (unsubscribeMatch) unsubscribeMatch();
      };
    }

    return () => {
      if (unsubscribeMatch) unsubscribeMatch();
    };
  }, [matchId]);

  return { match, events, loading, error };
}
