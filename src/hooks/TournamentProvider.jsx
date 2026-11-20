import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
  DEFAULT_TOURNAMENT_SETTINGS,
  DEFAULT_BRACKET_CONFIG,
  KNOCKOUT_ROUNDS,
  normalizeTournamentSettings,
  normalizeMatch,
  normalizePlayer,
  normalizePenalty,
} from '../utils/tournamentSchema';
import { parseTimestamp } from '../utils/formatters';

import { TournamentContext } from './TournamentContext';

const STANDINGS_MATCH_STATUSES = new Set(['منتهية', 'انتهت', 'انسحاب', 'مباشر']);

/**
 * TournamentProvider — Real-Time Single Source of Truth for Project Fanta.
 *
 * Subscribes live to:
 *  - config/tournament -> global settings (appName, enableKnockout, halfDurationMinutes)
 *  - config/bracket    -> knockout tree size
 *  - teams, players, matches, groups, penalties
 *
 * Dynamically derives:
 *  - Standings per group from finished/forfeited/live group matches MINUS disciplinary penalties
 *  - Top Scorers from match.events (type === 'goal' ONLY + manualGoalOffset; ZERO assists)
 *  - Live, upcoming (sorted by scheduledAt), recent, and knockout bracket matches
 */
export function TournamentProvider({ children }) {
  const [settings, setSettings] = useState({ ...DEFAULT_TOURNAMENT_SETTINGS });
  const [bracketConfig, setBracketConfig] = useState({ ...DEFAULT_BRACKET_CONFIG });
  const [teams, setTeams] = useState([]);
  const [rawPlayers, setRawPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rawGroups, setRawGroups] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const resolvedStreams = new Set();
    const markResolved = (key) => {
      resolvedStreams.add(key);
      if (resolvedStreams.size >= 7) {
        setLoading(false);
      }
    };

    // 1. Global Tournament Settings (Safe default if config/tournament doesn't exist yet)
    const unsubTournamentConfig = onSnapshot(
      doc(db, 'config', 'tournament'),
      (docSnap) => {
        setSettings(
          docSnap.exists()
            ? normalizeTournamentSettings(docSnap.data())
            : { ...DEFAULT_TOURNAMENT_SETTINGS }
        );
        markResolved('tournamentConfig');
      },
      (err) => {
        console.error('config/tournament listener error:', err);
        setSettings({ ...DEFAULT_TOURNAMENT_SETTINGS });
        markResolved('tournamentConfig');
      }
    );

    // 2. Bracket Size Config
    const unsubBracketConfig = onSnapshot(
      doc(db, 'config', 'bracket'),
      (docSnap) => {
        setBracketConfig(
          docSnap.exists()
            ? { ...DEFAULT_BRACKET_CONFIG, ...docSnap.data() }
            : { ...DEFAULT_BRACKET_CONFIG }
        );
        markResolved('bracketConfig');
      },
      (err) => {
        console.error('config/bracket listener error:', err);
        markResolved('bracketConfig');
      }
    );

    // 3. Teams
    const unsubTeams = onSnapshot(
      collection(db, 'teams'),
      (snap) => {
        setTeams(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
        markResolved('teams');
      },
      (err) => {
        console.error('teams listener error:', err);
        markResolved('teams');
      }
    );

    // 4. Players
    const unsubPlayers = onSnapshot(
      collection(db, 'players'),
      (snap) => {
        setRawPlayers(snap.docs.map((d) => normalizePlayer(d.data(), d.id)));
        markResolved('players');
      },
      (err) => {
        console.error('players listener error:', err);
        markResolved('players');
      }
    );

    // 5. Matches
    const unsubMatches = onSnapshot(
      collection(db, 'matches'),
      (snap) => {
        setMatches(snap.docs.map((d) => normalizeMatch(d.data({ serverTimestamps: 'estimate' }), d.id)));
        markResolved('matches');
      },
      (err) => {
        console.error('matches listener error:', err);
        markResolved('matches');
      }
    );

    // 6. Groups
    const unsubGroups = onSnapshot(
      collection(db, 'groups'),
      (snap) => {
        const list = snap.docs.map((d) => ({
          ...d.data(),
          id: d.id,
          teams: Array.isArray(d.data()?.teams) ? d.data().teams.map(String) : [],
        }));
        list.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || (a.name || a.id || '').localeCompare(b.name || b.id || '', 'ar'));
        setRawGroups(list);
        markResolved('groups');
      },
      (err) => {
        console.error('groups listener error:', err);
        markResolved('groups');
      }
    );

    // 7. Disciplinary Penalties (Safe if collection doesn't exist yet)
    const unsubPenalties = onSnapshot(
      collection(db, 'penalties'),
      (snap) => {
        const list = snap.docs
          .map((d) => normalizePenalty(d.data(), d.id))
          .sort((a, b) => {
            const ta = parseTimestamp(a.createdAt)?.getTime() ?? 0;
            const tb = parseTimestamp(b.createdAt)?.getTime() ?? 0;
            return tb - ta;
          });
        setPenalties(list);
        markResolved('penalties');
      },
      (err) => {
        console.error('penalties listener error:', err);
        setPenalties([]);
        markResolved('penalties');
      }
    );

    return () => {
      unsubTournamentConfig();
      unsubBracketConfig();
      unsubTeams();
      unsubPlayers();
      unsubMatches();
      unsubGroups();
      unsubPenalties();
    };
  }, []);

  // Fast Lookup Maps
  const teamMap = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => map.set(String(t.id), t));
    return map;
  }, [teams]);

  const getTeam = useCallback(
    (id) => {
      if (!id) return null;
      return teamMap.get(String(id)) || null;
    },
    [teamMap]
  );

  // Derived: Players with live Goals, Yellow Cards, Red Cards (ZERO Assists)
  const computedPlayers = useMemo(() => {
    const goalCounts = new Map();
    const yellowCounts = new Map();
    const redCounts = new Map();

    matches.forEach((m) => {
      (m.events || []).forEach((ev) => {
        if (!ev || !ev.playerId) return;
        const pid = String(ev.playerId);
        if (ev.type === 'goal') {
          goalCounts.set(pid, (goalCounts.get(pid) || 0) + 1);
        } else if (ev.type === 'yellow') {
          yellowCounts.set(pid, (yellowCounts.get(pid) || 0) + 1);
        } else if (ev.type === 'red') {
          redCounts.set(pid, (redCounts.get(pid) || 0) + 1);
        }
      });
    });

    return rawPlayers.map((player) => {
      const pid = String(player.id);
      const goals = Math.max(0, (goalCounts.get(pid) || 0) + (player.manualGoalOffset || 0));
      const yellowCards = Math.max(
        0,
        (yellowCounts.get(pid) || 0) + (player.manualYellowOffset || 0)
      );
      const redCards = Math.max(0, (redCounts.get(pid) || 0) + (player.manualRedOffset || 0));
      return {
        ...player,
        goals,
        yellowCards,
        redCards,
      };
    });
  }, [rawPlayers, matches]);

  const playerMap = useMemo(() => {
    const map = new Map();
    computedPlayers.forEach((p) => map.set(String(p.id), p));
    return map;
  }, [computedPlayers]);

  const getPlayer = useCallback(
    (id) => {
      if (!id) return null;
      return playerMap.get(String(id)) || null;
    },
    [playerMap]
  );

  // Aggregate Disciplinary Penalties per Team
  const penaltiesByTeam = useMemo(() => {
    const map = new Map();
    penalties.forEach((pen) => {
      if (!pen.teamId || pen.pointsDeducted <= 0) return;
      const tid = String(pen.teamId);
      const current = map.get(tid) || { totalDeducted: 0, list: [] };
      current.totalDeducted += pen.pointsDeducted;
      current.list.push(pen);
      map.set(tid, current);
    });
    return map;
  }, [penalties]);

  // Derived: Groups with Real-Time Standings (Finished + Forfeited + Live Group Matches MINUS Penalties)
  const computedGroups = useMemo(() => {
    return rawGroups.map((group) => {
      const groupTeamSet = new Set((group.teams || []).map(String));
      const stats = {};

      const ensureTeamRow = (tid) => {
        if (!tid) return null;
        const key = String(tid);
        if (!stats[key]) {
          stats[key] = {
            teamId: key,
            p: 0,
            w: 0,
            d: 0,
            l: 0,
            f: 0,
            a: 0,
            gd: 0,
            rawPts: 0,
            deductedPoints: 0,
            penaltiesList: [],
            pts: 0,
            isLiveActive: false,
          };
        }
        return stats[key];
      };

      groupTeamSet.forEach((tid) => ensureTeamRow(tid));

      const eligibleMatches = matches.filter((m) => {
        if (!STANDINGS_MATCH_STATUSES.has(m.status)) return false;
        if (m.type === 'knockout' || KNOCKOUT_ROUNDS.has(m.round)) return false;

        const homeId = m.homeTeamId;
        const awayId = m.awayTeamId;
        if (!homeId || !awayId) return false;

        if (m.groupId) {
          return String(m.groupId) === String(group.id);
        }
        return groupTeamSet.has(homeId) && groupTeamSet.has(awayId);
      });

      eligibleMatches.forEach((m) => {
        const homeRow = ensureTeamRow(m.homeTeamId);
        const awayRow = ensureTeamRow(m.awayTeamId);
        if (!homeRow || !awayRow) return;

        const hScore = m.homeScore ?? 0;
        const aScore = m.awayScore ?? 0;

        homeRow.p += 1;
        awayRow.p += 1;
        homeRow.f += hScore;
        homeRow.a += aScore;
        awayRow.f += aScore;
        awayRow.a += hScore;

        if (m.status === 'مباشر') {
          homeRow.isLiveActive = true;
          awayRow.isLiveActive = true;
        }

        if (hScore > aScore) {
          homeRow.w += 1;
          homeRow.rawPts += 3;
          awayRow.l += 1;
        } else if (hScore < aScore) {
          awayRow.w += 1;
          awayRow.rawPts += 3;
          homeRow.l += 1;
        } else {
          homeRow.d += 1;
          awayRow.d += 1;
          homeRow.rawPts += 1;
          awayRow.rawPts += 1;
        }
      });

      // Apply Goal Difference & Subtract Disciplinary Penalties
      const standings = Object.values(stats).map((row) => {
        const teamPen = penaltiesByTeam.get(row.teamId);
        const deductedPoints = teamPen?.totalDeducted || 0;
        const penaltiesList = teamPen?.list || [];
        return {
          ...row,
          gd: row.f - row.a,
          deductedPoints,
          penaltiesList,
          pts: row.rawPts - deductedPoints,
        };
      });

      standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.f !== a.f) return b.f - a.f;
        if (b.w !== a.w) return b.w - a.w;
        const nameA = teamMap.get(a.teamId)?.nameAr || '';
        const nameB = teamMap.get(b.teamId)?.nameAr || '';
        return nameA.localeCompare(nameB, 'ar');
      });

      return { ...group, standings };
    });
  }, [rawGroups, matches, penaltiesByTeam, teamMap]);

  // Derived: Top Scorers (Goals ONLY — strictly excludes 0-goal players from leader podium)
  const topScorers = useMemo(() => {
    return computedPlayers
      .filter((p) => (p.goals || 0) > 0)
      .sort(
        (a, b) =>
          (b.goals || 0) - (a.goals || 0) ||
          (a.nameAr || '').localeCompare(b.nameAr || '', 'ar')
      )
      .slice(0, 20);
  }, [computedPlayers]);

  // Derived: Knockout Bracket Matches
  const bracket = useMemo(
    () => matches.filter((m) => m.type === 'knockout' || KNOCKOUT_ROUNDS.has(m.round)),
    [matches]
  );

  // Derived: Live Match(es)
  const liveMatches = useMemo(
    () => matches.filter((m) => m.status === 'مباشر'),
    [matches]
  );
  const liveMatch = liveMatches[0] || null;

  // Derived: Upcoming Scheduled Matches (sorted soonest first)
  const upcomingMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === 'مجدولة' || m.status === 'scheduled')
      .sort((a, b) => {
        const ta = parseTimestamp(a.scheduledAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const tb = parseTimestamp(b.scheduledAt)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });
  }, [matches]);

  // Derived: Recent Finished / Forfeited Matches (newest first)
  const recentMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === 'منتهية' || m.status === 'انتهت' || m.status === 'انسحاب')
      .sort((a, b) => {
        const ta = parseTimestamp(a.scheduledAt || a.createdAt)?.getTime() ?? 0;
        const tb = parseTimestamp(b.scheduledAt || b.createdAt)?.getTime() ?? 0;
        return tb - ta;
      })
      .slice(0, 8);
  }, [matches]);

  const value = useMemo(
    () => ({
      settings,
      bracketConfig,
      teams,
      players: computedPlayers,
      matches,
      groups: computedGroups,
      penalties,
      loading,
      getTeam,
      getPlayer,
      topScorers,
      bracket,
      liveMatch,
      liveMatches,
      upcomingMatches,
      recentMatches,
    }),
    [
      settings,
      bracketConfig,
      teams,
      computedPlayers,
      matches,
      computedGroups,
      penalties,
      loading,
      getTeam,
      getPlayer,
      topScorers,
      bracket,
      liveMatch,
      liveMatches,
      upcomingMatches,
      recentMatches,
    ]
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}
