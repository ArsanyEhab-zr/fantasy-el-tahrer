import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import {
  DEFAULT_TOURNAMENT_SETTINGS,
  DEFAULT_BRACKET_CONFIG,
  KNOCKOUT_ROUNDS,
  normalizeTournamentSettings,
  normalizeBroadcastConfig,
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
  const [broadcast, setBroadcast] = useState(() => normalizeBroadcastConfig());
  const [teams, setTeams] = useState([]);
  const [rawPlayers, setRawPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [rawGroups, setRawGroups] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function apply(key, data) {
      switch (key) {
        case 'settings': setSettings(normalizeTournamentSettings(data)); break;
        case 'bracket': setBracketConfig({ ...DEFAULT_BRACKET_CONFIG, ...data }); break;
        case 'broadcast': setBroadcast(normalizeBroadcastConfig(data)); break;
        case 'teams': setTeams(data); break;
        case 'players': setRawPlayers(data.map(d => normalizePlayer(d, d.id))); break;
        case 'matches': setMatches(data.map(d => normalizeMatch(d, d.id))); break;
        case 'groups': setRawGroups(data.map(d => ({ ...d, teams: (d.teams || []).map(String) }))
          .sort((a,b) => (a.order ?? Infinity) - (b.order ?? Infinity) || (a.name || a.id).localeCompare(b.name || b.id,'ar'))); break;
        case 'penalties': setPenalties(data.map(d => normalizePenalty(d, d.id))
          .sort((a,b) => (parseTimestamp(b.createdAt)?.getTime() || 0) - (parseTimestamp(a.createdAt)?.getTime() || 0))); break;
      }
    }
    const keys = ['settings', 'bracket', 'broadcast', 'teams', 'players', 'matches', 'groups', 'penalties'];
    const configDocs = { settings: 'tournament', bracket: 'bracket', broadcast: 'broadcast' };
    if ((import.meta.env.VITE_APP_TARGET || 'viewer') === 'viewer') {
      return onSnapshot(doc(db, 'public/live_snapshot'), snap => {
        if (!snap.exists() && snap.metadata.fromCache && navigator.onLine) return;
        const data = snap.data() || {};
        for (const key of keys) apply(key, data[key] || (Object.hasOwn(configDocs, key) ? {} : []));
        setLoading(false);
      }, error => { console.error('Live snapshot:', error.code); setLoading(false); });
    }
    const ready = new Set();
    function resolved(key) {
      ready.add(key);
      if (ready.size === keys.length) setLoading(false);
    }
    const stops = keys.map(key => {
      const single = Object.hasOwn(configDocs, key);
      const ref = single ? doc(db, 'config', configDocs[key]) : collection(db, key);
      return onSnapshot(ref, { includeMetadataChanges: true }, snap => {
        const data = single ? snap.data() || {} : snap.docs.map(d => ({ ...d.data({ serverTimestamps: 'estimate' }), id: d.id }));
        apply(key, data);
        resolved(key);
      }, error => { console.error(key, error.code); resolved(key); });
    });
    return () => stops.forEach(stop => stop());
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

  const activePlayers = useMemo(
    () => computedPlayers.filter((p) => !p.isArchived),
    [computedPlayers]
  );

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
      broadcast,
      teams,
      players: computedPlayers,
      activePlayers,
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
      broadcast,
      teams,
      computedPlayers,
      activePlayers,
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
