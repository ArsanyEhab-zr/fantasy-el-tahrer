// Start a local Firestore emulator, then run FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node --test tests/league.emulator.test.mjs
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { connectFirestoreEmulator, doc, getDoc, setDoc, terminate, updateDoc } from 'firebase/firestore';
import { createServer } from 'vite';

test('referee mutations and bracket progression', async t => {
  const endpoint = /^127\.0\.0\.1:(\d+)$/.exec(process.env.FIRESTORE_EMULATOR_HOST || '');
  assert.ok(endpoint, 'Set FIRESTORE_EMULATOR_HOST to a running loopback emulator.');
  const server = await createServer({
    configFile: false, envDir: false, appType: 'custom',
    server: { middlewareMode: true, hmr: false },
    optimizeDeps: { noDiscovery: true },
    define: {
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify('demo-league-' + randomUUID().slice(0, 8)),
      'import.meta.env.VITE_FIREBASE_API_KEY': '"demo-key"',
    },
  });
  t.after(() => server.close());
  const { db } = await server.ssrLoadModule('/src/utils/firebase.js');
  connectFirestoreEmulator(db, '127.0.0.1', Number(endpoint[1]));
  t.after(() => terminate(db));
  const api = await server.ssrLoadModule('/src/utils/tournamentSchema.js');
  const clockSnapshot = { totalSeconds: 88, minute: 2, displayMinute: "2'" };
  const matchRef = id => doc(db, 'matches', id);
  const read = async id => (await getDoc(matchRef(id))).data();
  const fixture = {
    homeTeamId: 'home', awayTeamId: 'away', homeScore: 0, awayScore: 0,
    homeActivePitch: ['striker'], homeBench: ['reserve'], events: [], status: 'مباشر',
  };
  const match = { id: 'fixture' };
  const player = { id: 'striker', teamId: 'home', nameAr: 'مهاجم' };
  const log = actionType => api.recordPlayerMatchEvent({ match, player, actionType, clockSnapshot });
  const undo = async () => api.undoLastEvent(match.id, (await read(match.id)).events.at(-1).id);
  const finish = (id, options) => api.endMatchManually({ match: { id }, clockSnapshot, ...options });

  await t.test('undo reverses one confirmed action and all its linked writes', async () => {
    await setDoc(matchRef(match.id), fixture);
    await Promise.all([log('goal'), log('goal')]);
    assert.equal((await read(match.id)).homeScore, 2);
    const lastId = (await read(match.id)).events.at(-1).id;
    await api.undoLastEvent(match.id, lastId);
    await assert.rejects(api.undoLastEvent(match.id, lastId));
    await updateDoc(matchRef(match.id), { homeScore: 0 });
    await undo();
    assert.equal((await read(match.id)).homeScore, 0);

    await log('red');
    await undo();
    await log('yellow');
    await log('yellow');
    assert.deepEqual((await read(match.id)).homeActivePitch, []);
    await undo();
    const restored = await read(match.id);
    assert.deepEqual(restored.events.map(event => event.type), ['yellow']);
    assert.deepEqual(restored.homeActivePitch, ['striker']);

    await api.recordSubstitutionEvent({
      match, offPlayer: player, onPlayer: { ...player, id: 'reserve' }, clockSnapshot,
    });
    await undo();
    const roster = await read(match.id);
    assert.deepEqual(roster.homeActivePitch, ['striker']);
    assert.deepEqual(roster.homeBench, ['reserve']);
    assert.deepEqual(roster.homeSubbedOff, []);

    await api.applyDisciplinaryPenalty({ matchId: match.id, teamId: 'away', pointsDeducted: 2, clockSnapshot });
    const penalty = doc(db, 'penalties', (await read(match.id)).events.at(-1).penaltyDocId);
    assert.equal((await getDoc(penalty)).data().pointsDeducted, 2);
    await undo();
    assert.equal((await getDoc(penalty)).exists(), false);
  });

  await t.test('concurrent feeders, forfeits, ties and disabled knockout', async () => {
    const settings = doc(db, 'config', 'tournament');
    await setDoc(settings, { enableKnockout: true });
    await setDoc(matchRef('R16_1'), { ...fixture, homeScore: 2 });
    await finish('R16_1');
    assert.equal((await read('QF1')).homeTeamId, 'home');
    await setDoc(matchRef('QF1'), { ...fixture, awayScore: 3 });
    await setDoc(matchRef('QF2'), { ...fixture, homeScore: 2 });
    await Promise.all([finish('QF1'), finish('QF2')]);
    assert.equal((await read('SF1')).homeTeamId, 'away');
    assert.equal((await read('SF1')).awayTeamId, 'home');

    await updateDoc(matchRef('SF1'), { status: 'مباشر', homeScore: 4 });
    const forfeit = () => api.recordTeamForfeit({
      match: { id: 'SF1' }, withdrawingTeamId: 'away', applyForfeitScore: false, pointsDeducted: 3, clockSnapshot,
    });
    await forfeit();
    await assert.rejects(forfeit());
    assert.equal((await read('FINAL')).homeTeamId, 'home');
    await setDoc(matchRef('legacy-semi'), { ...fixture, type: 'knockout', round: 'نصف النهائي' });
    await assert.rejects(finish('legacy-semi', { bracketSlotId: 'SF2' }));
    assert.equal((await read('legacy-semi')).status, 'مباشر');
    await finish('legacy-semi', { bracketSlotId: 'SF2', tiebreakWinnerId: 'away' });
    assert.equal((await read('FINAL')).awayTeamId, 'away');

    await setDoc(settings, { enableKnockout: false });
    await setDoc(matchRef('QF3'), { ...fixture, homeScore: 1 });
    await finish('QF3');
    assert.equal(await read('SF2'), undefined);
  });
});
