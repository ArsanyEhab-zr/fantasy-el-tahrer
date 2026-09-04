import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';

const TournamentContext = createContext();

export function TournamentProvider({ children }) {
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [bracketConfig, setBracketConfig] = useState({ size: 4 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount >= 5) setLoading(false);
    };

    const unsubConfig = onSnapshot(doc(db, 'config', 'bracket'), (docSnap) => {
      if (docSnap.exists()) {
        setBracketConfig(docSnap.data());
      }
      checkLoaded();
    });

    const unsubTeams = onSnapshot(collection(db, 'teams'), (snap) => {
      setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      checkLoaded();
    });

    const unsubPlayers = onSnapshot(collection(db, 'players'), (snap) => {
      setPlayers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      checkLoaded();
    });

    const unsubMatches = onSnapshot(collection(db, 'matches'), (snap) => {
      setMatches(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      checkLoaded();
    });

    const unsubGroups = onSnapshot(collection(db, 'groups'), (snap) => {
      const groupsData = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      groupsData.sort((a, b) => (a.id || '').localeCompare(b.id || ''));
      setGroups(groupsData);
      checkLoaded();
    });

    return () => {
      unsubConfig();
      unsubTeams();
      unsubPlayers();
      unsubMatches();
      unsubGroups();
    };
  }, []);

  // Helper: find team by string ID
  const getTeam = (id) => {
    if (!id) return null;
    const strId = String(id);
    return teams.find(t => t.id === strId) || null;
  };

  // Derived data: computed players with live stats from matches
  const computedPlayers = players.map(player => {
    let goals = player.manualGoalOffset || 0;
    let assists = player.manualAssistOffset || 0;
    let yellowCards = player.manualYellowOffset || 0;
    let redCards = player.manualRedOffset || 0;

    matches.forEach(m => {
      if (m.events && Array.isArray(m.events)) {
        m.events.forEach(e => {
          if (e.playerId === player.id) {
            if (e.type === 'goal') goals += 1;
            if (e.type === 'assist') assists += 1;
            if (e.type === 'yellow') yellowCards += 1;
            if (e.type === 'red') redCards += 1;
          }
        });
      }
    });

    return { ...player, goals, assists, yellowCards, redCards };
  });

  // Helper: find player by string ID
  const getPlayer = (id) => {
    if (!id) return null;
    const strId = String(id);
    return computedPlayers.find(p => p.id === strId) || null;
  };

  // Derived data: computed groups with live standings
  const computedGroups = groups.map(group => {
    const stats = {};
    if (group.teams && Array.isArray(group.teams)) {
      group.teams.forEach(teamId => {
        stats[teamId] = { teamId, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, gd: 0, pts: 0 };
      });
    }

    const groupMatches = matches.filter(m => m.type === 'group' && m.groupId === group.id && m.status === 'منتهية');
    
    groupMatches.forEach(m => {
      const home = m.homeTeam;
      const away = m.awayTeam;
      const hScore = parseInt(m.homeScore) || 0;
      const aScore = parseInt(m.awayScore) || 0;

      if (!stats[home]) stats[home] = { teamId: home, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, gd: 0, pts: 0 };
      if (!stats[away]) stats[away] = { teamId: away, p: 0, w: 0, d: 0, l: 0, f: 0, a: 0, gd: 0, pts: 0 };

      stats[home].p += 1;
      stats[away].p += 1;
      stats[home].f += hScore;
      stats[home].a += aScore;
      stats[away].f += aScore;
      stats[away].a += hScore;

      if (hScore > aScore) {
        stats[home].w += 1;
        stats[home].pts += 3;
        stats[away].l += 1;
      } else if (hScore < aScore) {
        stats[away].w += 1;
        stats[away].pts += 3;
        stats[home].l += 1;
      } else {
        stats[home].d += 1;
        stats[away].d += 1;
        stats[home].pts += 1;
        stats[away].pts += 1;
      }
    });

    Object.values(stats).forEach(s => s.gd = s.f - s.a);

    const standings = Object.values(stats).sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.f !== a.f) return b.f - a.f;
      const teamA = teams.find(t => t.id === a.teamId)?.nameAr || '';
      const teamB = teams.find(t => t.id === b.teamId)?.nameAr || '';
      return teamA.localeCompare(teamB, 'ar');
    });

    return { ...group, standings };
  });

  // Derived data: top scorers (sorted by goals desc, then assists desc)
  const topScorers = [...computedPlayers]
    .sort((a, b) => (b.goals || 0) - (a.goals || 0) || (b.assists || 0) - (a.assists || 0))
    .slice(0, 15);

  // Derived data: bracket matches (knockout rounds only)
  const bracket = matches.filter(m => m.round === 'نصف النهائي' || m.round === 'النهائي');

  // Derived data: live match
  const liveMatch = matches.find(m => m.status === 'مباشر') || null;

  // Derived data: recent finished matches
  const recentMatches = matches
    .filter(m => m.status === 'منتهية')
    .slice(0, 5);

  return (
    <TournamentContext.Provider value={{
      teams, players: computedPlayers, matches, groups: computedGroups, loading,
      bracketConfig,
      getTeam, getPlayer,
      topScorers, bracket, liveMatch, recentMatches
    }}>
      {children}
    </TournamentContext.Provider>
  );
}

export const useTournament = () => useContext(TournamentContext);
