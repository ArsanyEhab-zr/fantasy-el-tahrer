import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "./firebase";
import { 
  teams, 
  players, 
  groupA, 
  groupB, 
  liveMatch, 
  matchEvents, 
  bracketMatches, 
  recentMatches 
} from "../data/mockData";

export const seedDatabase = async () => {
  try {
    console.log("Starting database seeding...");
    const batch = writeBatch(db);

    // 1. Seed Teams
    teams.forEach(team => {
      const teamRef = doc(collection(db, "teams"), team.id.toString());
      batch.set(teamRef, team);
    });

    // 2. Seed Players
    players.forEach(player => {
      const playerRef = doc(collection(db, "players"), player.id.toString());
      batch.set(playerRef, player);
    });

    // 3. Seed Groups
    const groupARef = doc(collection(db, "groups"), "A");
    batch.set(groupARef, { name: "مجموعة A", standings: groupA });

    const groupBRef = doc(collection(db, "groups"), "B");
    batch.set(groupBRef, { name: "مجموعة B", standings: groupB });

    // 4. Seed Matches (Live, Recent, and Bracket)
    const matchesToSeed = [liveMatch, ...recentMatches, ...bracketMatches];
    
    matchesToSeed.forEach(match => {
      const matchRef = doc(collection(db, "matches"), match.id.toString());
      batch.set(matchRef, match);
    });

    // Commit primary collections
    await batch.commit();
    console.log("Primary collections seeded successfully.");

    // 5. Seed matchEvents (as a sub-collection of the Live Match)
    const eventsBatch = writeBatch(db);
    matchEvents.forEach((event, index) => {
      // Using a generated doc reference for sub-collection items
      const eventRef = doc(collection(db, `matches/${liveMatch.id}/matchEvents`), `event_${index}`);
      eventsBatch.set(eventRef, event);
    });

    await eventsBatch.commit();
    console.log("Database seeded completely! ✨");
    alert("Database seeded completely!");
  } catch (error) {
    console.error("Error seeding database:", error);
    alert("Error seeding database, check console.");
  }
};
