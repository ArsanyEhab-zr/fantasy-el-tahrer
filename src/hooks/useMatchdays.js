import { useMemo, useState } from 'react';
import { activeMatchday, matchdays } from '../utils/matchdays';

export function useMatchdays(matches) {
  const days = useMemo(() => matchdays(matches), [matches]);
  const [number, select] = useState(null);
  const selected = days.find(d => d.number === number) || activeMatchday(days);
  return { days, selected, select };
}
