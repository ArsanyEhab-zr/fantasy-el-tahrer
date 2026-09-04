import { initializeApp } from 'firebase/app';
import { getFirestore, collection, writeBatch, doc } from 'firebase/firestore';
import { config } from 'dotenv';

import { teams, players, groupA, groupB, liveMatch, matchEvents, bracketMatches, recentMatches } from '../src/data/mockData.js';

// Load env vars
config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  try {
    console.log("Starting DB seed from CLI...");
    const batch = writeBatch(db);

    // 1. Teams
    teams.forEach(team => {
      batch.set(doc(collection(db, "teams"), team.id.toString()), team);
    });

    // 2. Players
    players.forEach(player => {
      batch.set(doc(collection(db, "players"), player.id.toString()), player);
    });

    // 3. Groups
    batch.set(doc(collection(db, "groups"), "A"), { name: "مجموعة A", standings: groupA });
    batch.set(doc(collection(db, "groups"), "B"), { name: "مجموعة B", standings: groupB });

    // 4. Matches
    const matchesToSeed = [liveMatch, ...recentMatches, ...bracketMatches];
    matchesToSeed.forEach(match => {
      batch.set(doc(collection(db, "matches"), match.id.toString()), match);
    });

    await batch.commit();
    console.log("Primary collections seeded.");

    // 5. Match events
    const eventsBatch = writeBatch(db);
    matchEvents.forEach((event, index) => {
      const eventRef = doc(collection(db, `matches/${liveMatch.id}/matchEvents`), `event_${index}`);
      eventsBatch.set(eventRef, event);
    });

    await eventsBatch.commit();
    console.log("Database seeded perfectly!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding:", error);
    process.exit(1);
  }
}

seed();
