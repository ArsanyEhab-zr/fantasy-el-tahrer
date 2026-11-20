import test from 'node:test';
import assert from 'node:assert/strict';
import { activeMatchday, matchdays } from '../src/utils/matchdays.js';
import { fromCairoLocal, toDateTimeLocalValue } from '../src/utils/formatters.js';

test('fixtures stay ordered and smart selection prioritizes live, today, upcoming, then latest', () => {
  const matches = [
    { matchDay: 1, scheduledAt: '2026-11-20T21:00:00+02:00' },
    { scheduledAt: '2026-11-21T20:00:00+02:00' },
    { matchDay: 1, scheduledAt: '2026-11-20T20:00:00+02:00' },
    { status: 'مجدولة' },
  ];
  const days = matchdays(matches);
  assert.deepEqual(days.map(d => d.number), [1, 2, 0]);
  assert.deepEqual(days[0].matches, [matches[2], matches[0]]);
  for (const [date, number] of [['2026-11-18', 1], ['2026-11-21', 2], ['2026-11-23', 2]]) {
    assert.equal(activeMatchday(days, date).number, number);
  }
  matches[1].status = 'مباشر';
  assert.equal(activeMatchday(days, '2026-11-20').number, 2);
  assert.equal(activeMatchday([]), undefined);
});

test('Egyptian late-night kickoffs survive admin edit round trips', () => {
  for (const value of ['2026-11-20T20:00', '2026-11-20T23:40', '2026-07-20T00:20']) {
    assert.equal(toDateTimeLocalValue(fromCairoLocal(value)), value);
  }
  assert.equal(fromCairoLocal('2026-11-20T23:40').toISOString(), '2026-11-20T21:40:00.000Z');
});
