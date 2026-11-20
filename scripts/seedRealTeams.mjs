// One-time manual migration. Run from the repository root with node scripts/seedRealTeams.mjs.
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { collection, collectionGroup, doc, getDoc, getDocs, getFirestore, runTransaction } from 'firebase/firestore/lite';

const rosters = [
  ['pharaohs', 'الفراعنة', 'Pharaohs FC', '#1D4ED8', ['نعيم رأفت', 'نوفير مينا', 'كريستيانو رامي', ['يوساب أمير', 5], ['كيرلس مايكل', 10]]],
  ['phoenix', 'فينيكس', 'Phoenix FC', '#06B6D4', ['كيرو هاني', 'كرستيان فخري', 'ديفيد جوزيف', ['مينا ماجدي', 7], ['متياس بسيط', 10], ['توماس مينا', 9]]],
  ['vexoria', 'فيكسوريا', 'Vexoria FC', '#6D28D9', ['كيرلس هاني', 'توماس مينا', 'فارس روماني', ['مكاريوس مرقص', 7], ['كيرلس خلف', 10], ['كاراس راني', 9]]],
  ['atlas-lions', 'أسود الأطلس', 'Atlas Lions', '#DC2626', ['كيرلس عاطف', 'فادي حناوي', 'جورج ابراهيم', ['كيرو مينا', 7], ['بافلي ياسر', 10], ['فيلو ميلاد', 16]]],
  ['al-tofan', 'الطوفان', 'Al-Tofan', '#15803D', [['كيرو سمير', 7], ['يوسف', 9], ['بيشوي', 16], ['مارك سليمان', 21], ['كيرو جاد', 10], ['فارس سامح', 4]]],
  ['al-gababra', 'الجبابرة', 'Al-Gababra', '#D97706', ['كاراس مينا', 'كيرلس اسحق', 'كاراس وائل', ['كيرلس عادل', 7], ['فادي يوسف', 10], ['فيلوباتير اشرف', 16]]],
  ['red-devils', 'الشياطين الحمر', 'Red Devils', '#B91C1C', ['مارك مبسوط', 'كاراس مبسوط', 'مارتن مينا', ['شنوده يوسف', 7], ['توماس روماني', 10], ['رافي', 16]]],
  ['al-ozamaa', 'العظماء', 'Al-Ozamaa', '#FBBF24', ['شنوده جويت', 'فيلوباتير جويت', 'كيرو سعيد', ['جون ماجد', 7], ['استيفن ريمون', 10]]],
  ['al-wohoush', 'الوحوش', 'Al-Wohoush', '#10B981', ['كاراس عماد', 'نوفير أمجد', 'ابانوب شنوده', ['أمير عماد', 7], ['كاراس مينا سمير', 10], ['كاراس عادل', 16]]],
  ['al-shawakeesh', 'الشواكيش', 'Al-Shawakeesh', '#475569', ['بافلي', 'نور حنا', 'نوفير امجد', ['مينا مجدي', 7], ['يوسف عادل', 10], ['كاراس', 16]]],
];

config({ path: ['.env.local', '.env'], quiet: true });
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
assert.equal(projectId, 'fantasy-c4c75', 'Unexpected Firestore project');
assert.ok(process.env.VITE_FIREBASE_API_KEY, 'Missing Firebase configuration');
const db = getFirestore(initializeApp({ projectId, apiKey: process.env.VITE_FIREBASE_API_KEY, appId: process.env.VITE_FIREBASE_APP_ID }));
const marker = doc(db, 'config/officialRosterSeedV1');
const desired = new Map();
for (const [id, nameAr, nameEn, color, roster] of rosters) {
  desired.set(`teams/${id}`, { nameAr, nameEn, shortName: nameAr, short: nameAr, color, logoUrl: `/logos/${id}.svg` });
  roster.forEach((entry, index) => {
    const [playerName, number = null] = Array.isArray(entry) ? entry : [entry];
    desired.set(`players/${id}-${index + 1}`, { nameAr: playerName, teamId: id, number, jerseyNumber: number, manualGoalOffset: 0, manualYellowOffset: 0, manualRedOffset: 0 });
  });
}
assert.equal(rosters.length, 10);
assert.equal(desired.size, 68);
desired.set('config/tournament', { appName: 'Fanta', enableKnockout: false, halfDurationMinutes: 10 });
desired.set('config/bracket', { size: 4 });
const names = ['teams', 'players', 'groups', 'matches', 'penalties'];
async function inventory() {
  const snapshots = await Promise.all(names.map(name => getDocs(collection(db, name))));
  const events = await getDocs(collectionGroup(db, 'matchEvents'));
  return [...snapshots.flatMap(s => s.docs), ...events.docs.filter(d => d.ref.path.startsWith('matches/'))];
}
async function migrate() {
  if ((await getDoc(marker)).exists()) {
    console.log('Official migration already applied. Preserving subsequent Admin edits.');
    return;
  }
  const previous = await inventory();
  const stale = previous.filter(d => !desired.has(d.ref.path));
  await runTransaction(db, async tx => {
    assert.ok(!(await tx.get(marker)).exists(), 'Migration already applied');
    for (const d of stale) tx.delete(d.ref);
    for (const [path, data] of desired) tx.set(doc(db, path), data);
    tx.set(marker, { complete: true });
  });
  const after = await inventory();
  assert.equal(after.length, 68);
  for (const snapshot of [...after, ...await Promise.all(['config/tournament', 'config/bracket'].map(path => getDoc(doc(db, path))))]) {
    assert.deepEqual(snapshot.data(), desired.get(snapshot.ref.path), snapshot.ref.path);
  }
  console.log(`Removed ${stale.length} stale documents and replaced ${previous.length - stale.length} overlapping records.`);
  console.log(`${projectId} verified: 10 teams, 58 players, 0 groups, 0 matches, 0 penalties, 0 legacy match events. Tournament and bracket reset.`);
}
await migrate();
