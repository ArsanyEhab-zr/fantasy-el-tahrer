import assert from 'node:assert/strict';
import { config } from 'dotenv';
import { initializeApp } from 'firebase/app';
import * as sdk from 'firebase/firestore/lite';
import { publishSnapshot } from '../src/utils/publicSnapshot.js';

config({ path: ['.env.local', '.env'], quiet: true });
const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
assert.equal(projectId, 'fantasy-c4c75');
sdk.setLogLevel('silent');
const db = sdk.getFirestore(initializeApp({ projectId, apiKey: process.env.VITE_FIREBASE_API_KEY }));
await publishSnapshot(db, sdk);
const data = (await sdk.getDoc(sdk.doc(db, 'public/live_snapshot'))).data();
console.log(projectId, 'public/live_snapshot verified:', Object.fromEntries(
  ['teams', 'players', 'groups', 'matches', 'penalties'].map(key => [key, data[key].length])
), 'Day 1 fixtures:', data.matches.filter(m => m.matchDay === 1).length, 'JSON bytes:', Buffer.byteLength(JSON.stringify(data)));
