// Manual, one-time schedule import. Writes only to groups and matches.
import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import { collection, doc, getDocs, getFirestore, runTransaction, setLogLevel, Timestamp } from 'firebase/firestore/lite';

config({ path: ['.env.local', '.env'], quiet: true });
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
assert.equal(projectId, 'fantasy-c4c75');
assert.ok(process.env.VITE_FIREBASE_API_KEY);
setLogLevel('silent');
const db = getFirestore(initializeApp({ projectId, apiKey: process.env.VITE_FIREBASE_API_KEY }));
const read = name => getDocs(collection(db, name));
const [teams, players, oldGroups, oldMatches] = await Promise.all(['teams','players','groups','matches'].map(read));
const groups = [
  ['A', 'المجموعة الأولى', ['أسود الأطلس','الجبابرة','الشياطين الحمر','الشواكيش','الفراعنة','الشرقية للدخان']],
  ['B', 'المجموعة الثانية', ['الطوفان','النجوم','الوحوش','فينيكس','العظماء','فيكسوريا']],
];
const fixtures = [
  ['20:00','الشرقية للدخان','الجبابرة'], ['20:20','العظماء','النجوم'],
  ['20:40','الشواكيش','الجبابرة'], ['21:00','العظماء','فيكسوريا'],
  ['21:20','الشرقية للدخان','الشواكيش'], ['21:40','النجوم','فيكسوريا'],
  ['22:00','الشياطين الحمر','الفراعنة'], ['22:20','بطاريق مدغشقر','الوحوش'],
  ['22:40','الفراعنة','أسود الأطلس'], ['23:00','الطوفان','الوحوش'],
  ['23:20','أسود الأطلس','الشياطين الحمر'], ['23:40','الطوفان','بطاريق مدغشقر'],
];
function key(name) {
  const normalized = name.normalize('NFKC').replace(/[\u064b-\u065f\u0670ـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه')
    .trim().split(/\s+/).map(word => word.replace(/^ال/,'')).join(' ');
  if (['بطاريق مدغشقر','فونكس','فينيكس'].includes(normalized)) return 'فينيكس';
  return normalized === 'شرقيه' ? 'شرقيه للدخان' : normalized;
}
function resolve(name) {
  const found = teams.docs.filter(t => key(t.data().nameAr || '') === key(name));
  assert.equal(found.length, 1, 'Unresolved or ambiguous team: ' + name);
  return found[0].id;
}
const planned = new Map();
const membership = new Map();
for (const [index, [code, name, names]] of groups.entries()) {
  const ids = names.map(resolve);
  for (const id of ids) {
    assert.ok(!membership.has(id), 'Repeated group member: ' + id);
    membership.set(id, code);
  }
  planned.set('groups/' + code, { name, code, order: index + 1, qualifyCount: 4, teams: ids });
}
for (const [index, [time, home, away]] of fixtures.entries()) {
  const homeTeamId = resolve(home), awayTeamId = resolve(away);
  const groupId = membership.get(homeTeamId);
  assert.ok(groupId && groupId === membership.get(awayTeamId));
  planned.set('matches/day1-' + String(index + 1).padStart(2,'0'), {
    homeTeamId, awayTeamId, homeTeam: homeTeamId, awayTeam: awayTeamId, groupId,
    type: 'group', stage: 'group', round: 'دور المجموعات', matchDay: 1, matchDayLabel: 'اليوم الأول',
    matchDate: '2026-11-20', scheduledAt: Timestamp.fromDate(new Date('2026-11-20T' + time + ':00+02:00')),
    status: 'قادمة', timerStatus: 'idle', accumulatedSeconds: 0, homeScore: 0, awayScore: 0, events: [],
  });
}
const previous = [...oldGroups.docs, ...oldMatches.docs];
const marker = 'officialDay1Seed';
if (previous.some(d => d.data()[marker])) {
  console.log('Official Day 1 already imported. Preserving subsequent edits.');
} else {
  await runTransaction(db, async tx => {
    const first = await tx.get(doc(db,'groups/A'));
    assert.ok(!first.data()?.[marker], 'Schedule already imported');
    for (const d of previous) if (!planned.has(d.ref.path)) tx.delete(d.ref);
    for (const [path, data] of planned) tx.set(doc(db,path), { ...data, [marker]: true });
  });
  const [savedGroups, savedMatches, savedTeams, savedPlayers] = await Promise.all(['groups','matches','teams','players'].map(read));
  assert.equal(savedGroups.size, 2);
  assert.equal(savedMatches.size, 12);
  for (const d of [...savedGroups.docs,...savedMatches.docs]) assert.deepEqual(d.data(), { ...planned.get(d.ref.path), [marker]: true });
  for (const [before, after] of [[teams,savedTeams],[players,savedPlayers]]) {
    assert.deepEqual(after.docs.map(d => [d.id,d.data()]), before.docs.map(d => [d.id,d.data()]));
  }
  console.log('Verified 2 groups (6 teams each), 12 Day 1 matches, zero unresolved teams. بطاريق مدغشقر → فينيكس.');
  console.log(savedTeams.size + ' teams and ' + savedPlayers.size + ' players intact.');
}
