import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { generateKeyPairSync } from 'node:crypto';
import { Messaging } from 'firebase-admin/messaging';
import notify from '../api/notify.js';
import subscribe from '../api/subscribe.js';
import tomorrowCron from '../api/cron/tomorrow-matches.js';
import { buildTomorrowReminderPayload, getTomorrowCairoDateString } from '../src/utils/tomorrowMatches.js';

function response() {
  return {
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.code = code; return this; },
    json(data) { this.data = data; return this; },
  };
}

test('push endpoints validate requests, handle CORS, and send one topic message per accepted event', async t => {
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.FANTA_SKIP_PUSH_STORE = '1';
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON = JSON.stringify({
    project_id: 'demo',
    client_email: 'test@example.org',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  });
  process.env.VITE_APP_TARGET = 'referee';
  process.env.VITE_REFEREE_PIN = '1234';
  process.env.VERCEL_PROJECT_PRODUCTION_URL = 'fanta-ref.vercel.app';

  const send = t.mock.method(Messaging.prototype, 'send', async () => 'mock-id');
  const join = t.mock.method(Messaging.prototype, 'subscribeToTopic', async () => ({ failureCount: 0 }));

  const preflight = response();
  await subscribe({ method: 'OPTIONS', headers: { origin: 'https://fantasy-el-tahrer.vercel.app' } }, preflight);
  assert.equal(preflight.code, 204);
  assert.equal(preflight.headers['Access-Control-Allow-Origin'], 'https://fantasy-el-tahrer.vercel.app');

  const invalidMethod = response();
  await subscribe({ method: 'GET' }, invalidMethod);
  assert.equal(invalidMethod.code, 405);
  assert.equal((await subscribe({ method: 'POST', body: {} }, response())).code, 400);
  assert.equal((await subscribe({ method: 'POST', body: { token: 'mock-token' } }, response())).code, 200);
  assert.deepEqual(join.mock.calls[0].arguments, [['mock-token'], 'fanta_live_fans']);

  const allTypes = ['kickoff', 'goal', 'yellow', 'red', 'sub', 'penalty', 'forfeit', 'fulltime', 'undo', 'reminder'];
  for (const type of allTypes) {
    const req = {
      method: 'POST',
      headers: { 'x-fanta-pin': '1234' },
      body: { type, title: 'عنوان', body: 'تفاصيل', matchId: 'fixture', url: '/live?matchId=fixture' },
    };
    assert.equal((await notify(req, response())).code, 200);
    const [message] = send.mock.calls.at(-1).arguments;
    assert.equal(message.data.type, type);
    assert.equal(message.topic, 'fanta_live_fans');
    assert.equal(message.webpush.headers.TTL, type === 'reminder' ? '3600' : '120');
    assert.equal(message.webpush.fcmOptions.link, 'https://fantasy-el-tahrer.vercel.app/live?matchId=fixture');
    assert.equal((await notify({ ...req, headers: {} }, response())).code, 403);
    assert.equal((await notify({ ...req, body: { ...req.body, url: 'https://example.org' } }, response())).code, 400);
  }
  assert.equal(send.mock.callCount(), allTypes.length);
});

test('subscribe falls back to legacy topic API when v1 topic subscription fails', async t => {
  process.env.FANTA_SKIP_PUSH_STORE = '1';
  const v1 = t.mock.method(Messaging.prototype, 'subscribeToTopic', async () => ({
    failureCount: 1,
    errors: [{ index: 0, error: { code: 'messaging/invalid-argument', message: 'v1 failed' } }],
  }));
  const legacy = t.mock.method(Messaging.prototype, 'subscribeToTopicLegacy', async () => ({
    failureCount: 0,
  }));

  const res = response();
  await subscribe({ method: 'POST', body: { token: 'mock-token-2' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.data.ok, true);
  assert.equal(v1.mock.callCount(), 1);
  assert.equal(legacy.mock.callCount(), 1);
});

test('worker opens the viewer match, root reminders, and shows at most one background banner', async () => {
  let receive, click, opened, banners = 0, pending;
  const self = {
    location: { origin: 'https://viewer.example' },
    addEventListener(_, cb) { click = cb; },
    registration: { showNotification() { banners++; } },
    clients: { matchAll: async () => [], openWindow(url) { opened = url; } },
  };
  vm.runInNewContext(readFileSync(new URL('../public/firebase-messaging-sw.js', import.meta.url), 'utf8'), {
    self,
    URL,
    importScripts() {},
    firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage(cb) { receive = cb; } }) },
  });
  receive({ notification: { title: 'goal' } });
  assert.equal(banners, 0);
  receive({ data: { title: 'goal' } });
  assert.equal(banners, 1);

  click({ stopImmediatePropagation() {}, notification: { close() {}, data: { FCM_MSG: { data: { type: 'goal', matchId: 'a b' } } } }, waitUntil(p) { pending = p; } });
  await pending;
  assert.equal(opened, 'https://viewer.example/live?matchId=a%20b');

  click({ stopImmediatePropagation() {}, notification: { close() {}, data: { FCM_MSG: { data: { type: 'reminder', url: '/' } } } }, waitUntil(p) { pending = p; } });
  await pending;
  assert.equal(opened, 'https://viewer.example/');
});

test('tomorrow matches reminder filters scheduled matches in Africa/Cairo and formats Arabic summary', () => {
  // 2026-11-22 19:00 Cairo time (17:00 UTC) -> tomorrow in Cairo is 2026-11-23
  const now = new Date('2026-11-22T17:00:00Z');
  assert.equal(getTomorrowCairoDateString(now), '2026-11-23');

  const teams = [
    { id: 't1', nameAr: 'الفراعنة' },
    { id: 't2', nameAr: 'الشواكيش' },
    { id: 't3', nameAr: 'الجبابرة' },
    { id: 't4', nameAr: 'النجوم' },
  ];
  const matches = [
    // Today match (excluded)
    { id: 'm0', homeTeamId: 't1', awayTeamId: 't2', status: 'مجدولة', scheduledAt: '2026-11-22T20:00:00+02:00' },
    // Tomorrow scheduled matches (included & sorted)
    { id: 'm2', homeTeamId: 't3', awayTeamId: 't4', status: 'مجدولة', scheduledAt: '2026-11-23T20:30:00+02:00' },
    { id: 'm1', homeTeamId: 't1', awayTeamId: 't2', status: 'قادمة', scheduledAt: '2026-11-23T18:00:00+02:00' },
    // Tomorrow finished match (excluded)
    { id: 'm3', homeTeamId: 't1', awayTeamId: 't3', status: 'منتهية', scheduledAt: '2026-11-23T16:00:00+02:00' },
  ];

  const payload = buildTomorrowReminderPayload({ matches, teams, now });
  assert.equal(payload.tomorrowDate, '2026-11-23');
  assert.equal(payload.count, 2);
  assert.equal(payload.title, '📅 خلي بالك! مواعيد ماتشات بكرة في فانتزي التحرير');
  assert.equal(payload.matches[0].id, 'm1');
  assert.equal(payload.matches[1].id, 'm2');
  assert.match(payload.body, /الفراعنة × الشواكيش/);
  assert.match(payload.body, /الجبابرة × النجوم/);
});

test('cron endpoint enforces CRON_SECRET and skips non-viewer targets', async () => {
  process.env.CRON_SECRET = 'super-secret-cron-token-12345';
  process.env.VITE_APP_TARGET = 'referee';

  const unauth = response();
  await tomorrowCron({ method: 'GET', headers: {} }, unauth);
  assert.equal(unauth.code, 401);

  const skipped = response();
  await tomorrowCron({ method: 'GET', headers: { authorization: 'Bearer super-secret-cron-token-12345' } }, skipped);
  assert.equal(skipped.code, 200);
  assert.equal(skipped.data.skipped, 'target=referee');
});
