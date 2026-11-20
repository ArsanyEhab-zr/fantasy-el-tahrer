// Manual append. Each team and its six players are created atomically.
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, runTransaction, setLogLevel } from 'firebase/firestore/lite';

const additions = [
  {
    id: 'al-nogoom', nameAr: 'النجوم', nameEn: 'Al-Nogoom FC', shortName: 'النجوم', color: '#06B6D4',
    players: [['جون مايكل'], ['كاراس هاني عاطف'], ['كاراس هاني شفيق'], ['بيمن ايمن', 7], ['كيرو جرجس', 10], ['توماس عماد', 16]],
  },
  {
    id: 'eastern-company', nameAr: 'الشرقية للدخان', nameEn: 'Eastern Company FC', shortName: 'الشرقية', color: '#1E3A8A',
    players: [['ادم امجد'], ['مارتن روماني'], ['رفائيل رائف'], ['شنوده مينا', 7], ['كاراس رياض', 10], ['مكاريوس فهمي', 16]],
  },
];

config({ path: ['.env.local', '.env'], quiet: true });
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
assert.equal(projectId, 'fantasy-c4c75', 'Unexpected Firestore project');
assert.ok(process.env.VITE_FIREBASE_API_KEY, 'Missing Firebase configuration');
setLogLevel('silent');
const db = getFirestore(initializeApp({ projectId, apiKey: process.env.VITE_FIREBASE_API_KEY, appId: process.env.VITE_FIREBASE_APP_ID }));

async function snapshot() {
  const [teams, players] = await Promise.all(['teams', 'players'].map(name => getDocs(collection(db, name))));
  return { teams, players };
}

const before = await snapshot();
const created = [];
for (const { id, nameAr, nameEn, shortName, color, players } of additions) {
  if (before.teams.docs.some(team => team.data().nameAr === nameAr)) {
    console.log('Skipped existing team and roster:', nameAr);
    continue;
  }
  const records = [
    [doc(db, 'teams', id), { nameAr, nameEn, shortName, short: shortName, color, logoUrl: '/logos/' + id + '.svg' }],
    ...players.map(([name, number = null], index) => [
      doc(db, 'players', id + '-' + (index + 1)),
      { nameAr: name, teamId: id, number, jerseyNumber: number, manualGoalOffset: 0, manualYellowOffset: 0, manualRedOffset: 0 },
    ]),
  ];
  const inserted = await runTransaction(db, async tx => {
    const existing = await Promise.all(records.map(([ref]) => tx.get(ref)));
    if (existing[0].data()?.nameAr === nameAr) return false;
    for (const entry of existing) assert.ok(!entry.exists(), 'Occupied document: ' + entry.ref.path);
    for (const [ref, data] of records) tx.set(ref, data);
    return true;
  });
  if (inserted) created.push(...records);
  console.log(inserted ? 'Added team and six players:' : 'Skipped existing team and roster:', nameAr);
}

const after = await snapshot();
const actual = new Map([...after.teams.docs, ...after.players.docs].map(d => [d.ref.path, d.data()]));
for (const entry of [...before.teams.docs, ...before.players.docs]) {
  assert.deepEqual(actual.get(entry.ref.path), entry.data(), 'Previously existing record changed: ' + entry.ref.path);
}
for (const [ref, data] of created) assert.deepEqual(actual.get(ref.path), data, ref.path);
console.log(projectId + ': ' + after.teams.size + ' teams, ' + after.players.size + ' players. All pre-existing records verified intact.');
