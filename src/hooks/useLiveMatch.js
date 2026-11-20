import { useMemo, useState } from 'react';
import { useTournament } from './TournamentContext';
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

export function useLiveMatch(matchId = null) {
  const { matches, liveMatch, loading } = useTournament();
  const [lastId, setLastId] = useState(null);
  if (!matchId && liveMatch && liveMatch.id !== lastId) setLastId(liveMatch.id);
  const match = matches.find(m => m.id === (matchId || liveMatch?.id || lastId)) || null;
  const events = useMemo(() => sortEventsNewestFirst(match?.events), [match]);
  return { match, events, loading, error: matchId?.includes('/') ? 'معرّف المباراة غير صالح' : null };
}
