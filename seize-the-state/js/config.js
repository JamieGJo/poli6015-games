// Live-sync settings. Leave FIREBASE_CONFIG as null to run in local mode
// (the main screen and team screens as tabs in one browser on one machine).
// To run a live class on students' own devices, paste your Firebase web config
// here. See SETUP.md. These values identify the project; they are not secrets,
// and the database rules in SETUP.md control access.
// Firebase project poli6015-games (database in Belgium, europe-west1), set up 2026-11-25.
// To go back to local mode, set this to null.
export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCsWCm3gD4o5t-FuQBynI-1BUZOn7WhAvs',
  authDomain: 'poli6015-games.firebaseapp.com',
  databaseURL: 'https://poli6015-games-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: 'poli6015-games',
  appId: '1:6510593986:web:ee3c71f355cd717354f85b',
};
// Example:
// export const FIREBASE_CONFIG = {
//   apiKey: '...',
//   authDomain: 'your-project.firebaseapp.com',
//   databaseURL: 'https://your-project-default-rtdb.europe-west1.firebasedatabase.app',
//   projectId: 'your-project',
//   appId: '...',
// };
