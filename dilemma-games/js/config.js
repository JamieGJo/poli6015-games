// Live-sync settings. Leave FIREBASE_CONFIG as null to run in local mode
// (the projector and phone screens as tabs in one browser on one machine).
// To play on students' own phones, paste a Firebase web config here. The same
// Firebase project and database rules as Seize the State work (simulation/SETUP.md);
// rooms from these games start with "DG" so they never clash with its rooms.
// Firebase project poli6015-games (database in Belgium, europe-west1), set up 2026-11-25.
// To go back to local mode, set this to null.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCsWCm3gD4o5t-FuQBynI-1BUZOn7WhAvs',
  authDomain: 'poli6015-games.firebaseapp.com',
  databaseURL: 'https://poli6015-games-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'poli6015-games',
  appId: '1:6510593986:web:ee3c71f355cd717354f85b',
};
