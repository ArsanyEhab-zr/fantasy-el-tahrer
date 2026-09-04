import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';

export function useTournamentData() {
  const [groups, setGroups] = useState([]);
  const [topScorers, setTopScorers] = useState([]);
  const [bracket, setBracket] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs = [];

    // Live sync Groups
    const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => {
      const groupsData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      groupsData.sort((a, b) => a.id.localeCompare(b.id));
      setGroups(groupsData);
    });
    unsubs.push(unsubGroups);

    // Live sync Top Scorers
    const qPlayers = query(collection(db, 'players'), orderBy('goals', 'desc'), limit(10));
    const unsubPlayers = onSnapshot(qPlayers, (snap) => {
      setTopScorers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    unsubs.push(unsubPlayers);

    // Live sync Bracket Matches
    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      const matchesData = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      const bracketMatches = matchesData.filter(m => m.round === 'نصف النهائي' || m.round === 'النهائي');
      setBracket(bracketMatches);
      setLoading(false);
    });
    unsubs.push(unsubMatches);

    return () => unsubs.forEach(unsub => unsub());
  }, []);

  return { groups, topScorers, bracket, loading };
}
