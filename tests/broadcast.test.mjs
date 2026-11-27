import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_CHANNEL_LOGO,
  buildObsOverlayUrls,
  buildYouTubeEmbedUrl,
  parseYouTubeVideoId,
  resolveBroadcastMatch,
  sanitizeChannelLogoUrl,
} from '../src/utils/broadcast.js';
import { diffMatchEvents, selectBreakingFromDiff } from '../src/hooks/useBroadcastEvents.js';
import { sections } from '../src/utils/publicSnapshot.js';

test('parseYouTubeVideoId and buildYouTubeEmbedUrl support all YouTube Live URL formats safely', () => {
  const expectedId = 'dQw4w9WgXcQ';
  const validInputs = [
    expectedId,
    `https://www.youtube.com/live/${expectedId}?feature=share`,
    `https://youtube.com/watch?v=${expectedId}&t=42s`,
    `https://m.youtube.com/watch?v=${expectedId}`,
    `https://youtu.be/${expectedId}?si=abc123`,
    `https://www.youtube.com/embed/${expectedId}`,
    `https://www.youtube-nocookie.com/embed/${expectedId}`,
    `youtube.com/live/${expectedId}`,
  ];

  for (const input of validInputs) {
    assert.equal(parseYouTubeVideoId(input), expectedId, `Failed to parse: ${input}`);
  }

  for (const bad of ['', '   ', 'https://example.com/watch?v=dQw4w9WgXcQ', 'javascript:alert(1)', 'short', 'too_long_video_id_123']) {
    assert.equal(parseYouTubeVideoId(bad), '', `Should reject: ${bad}`);
  }

  const embed = buildYouTubeEmbedUrl(`https://www.youtube.com/live/${expectedId}`);
  assert.match(embed, /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.match(embed, /fs=0/);
  assert.match(embed, /playsinline=1/);
  assert.equal(buildYouTubeEmbedUrl('not-a-valid-url'), '');
});

test('sanitizeChannelLogoUrl allows safe paths/URLs and blocks unsafe schemes', () => {
  assert.equal(sanitizeChannelLogoUrl('/channel-logo.png'), '/channel-logo.png');
  assert.equal(sanitizeChannelLogoUrl('https://cdn.example.com/logo.webp'), 'https://cdn.example.com/logo.webp');
  assert.equal(sanitizeChannelLogoUrl(''), DEFAULT_CHANNEL_LOGO);
  assert.equal(sanitizeChannelLogoUrl('javascript:alert(1)'), DEFAULT_CHANNEL_LOGO);
  assert.equal(sanitizeChannelLogoUrl('//evil.example/logo.png'), DEFAULT_CHANNEL_LOGO);
});

test('resolveBroadcastMatch honors route override, manual lock, and live auto tracking', () => {
  const m1 = { id: 'm1', status: 'مجدولة' };
  const m2 = { id: 'm2', status: 'مباشر' };
  const matches = [m1, m2];

  assert.equal(resolveBroadcastMatch({ broadcast: { matchMode: 'auto' }, matches, liveMatch: m2 }), m2);
  assert.equal(resolveBroadcastMatch({ broadcast: { matchMode: 'manual', manualMatchId: 'm1' }, matches, liveMatch: m2 }), m1);
  assert.equal(resolveBroadcastMatch({ broadcast: { matchMode: 'manual', manualMatchId: 'missing' }, matches, liveMatch: m2 }), m2);
  assert.equal(resolveBroadcastMatch({ broadcast: { matchMode: 'auto' }, matches, liveMatch: m2, overrideMatchId: 'm1' }), m1);

  const obs = buildObsOverlayUrls('day1-01', 'https://fantasy-el-tahrer.vercel.app');
  assert.equal(obs.liveUrl, 'https://fantasy-el-tahrer.vercel.app/overlay/live');
  assert.equal(obs.livePreviewUrl, 'https://fantasy-el-tahrer.vercel.app/overlay/live?preview=1');
  assert.equal(obs.matchUrl, 'https://fantasy-el-tahrer.vercel.app/overlay/day1-01');
});

test('broadcast event diff detects goals, 2nd-yellow reds, and undo reversals without false alerts on mount', () => {
  const goalEvent = { id: 'g1', type: 'goal', playerName: 'أحمد', teamId: 't1', displayMinute: "5'" };
  const y2 = { id: 'y2', type: 'yellow', playerName: 'كريم', teamId: 't2', displayMinute: "12'" };
  const red = { id: 'r1', type: 'red', secondYellowId: 'y2', playerName: 'كريم', teamId: 't2', displayMinute: "12'" };

  // Initial mount (prevState null) or match switch must not trigger fake alerts
  assert.deepEqual(diffMatchEvents(null, { id: 'm1', events: [goalEvent] }), { added: [], removed: [] });
  assert.deepEqual(diffMatchEvents({ matchId: 'm0', events: [] }, { id: 'm1', events: [goalEvent] }), { added: [], removed: [] });

  // New goal detected
  const goalDiff = diffMatchEvents({ matchId: 'm1', events: [] }, { id: 'm1', homeScore: 1, awayScore: 0, events: [goalEvent] });
  const goalAlert = selectBreakingFromDiff(goalDiff, { id: 'm1', homeScore: 1, awayScore: 0 });
  assert.equal(goalAlert.type, 'goal');
  assert.equal(goalAlert.id, 'g1');

  // 2nd yellow + red added simultaneously prioritizes red
  const cardDiff = diffMatchEvents({ matchId: 'm1', events: [goalEvent] }, { id: 'm1', events: [goalEvent, y2, red] });
  const cardAlert = selectBreakingFromDiff(cardDiff, { id: 'm1', homeScore: 1, awayScore: 0 });
  assert.equal(cardAlert.type, 'red');
  assert.equal(cardAlert.id, 'r1');

  // Undo (goal removed from match.events) produces an 'undo' alert with updated score
  const undoDiff = diffMatchEvents({ matchId: 'm1', events: [goalEvent] }, { id: 'm1', homeScore: 0, awayScore: 0, events: [] });
  const undoAlert = selectBreakingFromDiff(undoDiff, { id: 'm1', homeScore: 0, awayScore: 0 });
  assert.equal(undoAlert.type, 'undo');
  assert.equal(undoAlert.undoneType, 'goal');
  assert.equal(undoAlert.homeScore, 0);
});

test('publicSnapshot sections include broadcast for 1-doc viewer sync', () => {
  assert.ok(sections.includes('broadcast'));
});
