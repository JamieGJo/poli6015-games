// Sync layer, adapted from Seize the State (simulation/js/sync.js).
// The projector (host) owns the game state and publishes a view of it; phones send actions.
//   local    : BroadcastChannel between tabs of one browser (testing, rehearsal)
//   firebase : Firebase Realtime Database (students' own phones)
import { FIREBASE_CONFIG } from './config.js';

export const isLive = () => !!(FIREBASE_CONFIG && FIREBASE_CONFIG.databaseURL);

export async function connect(room, role) {
  if (isLive()) {
    try {
      return await firebaseSync(room, role);
    } catch (e) {
      console.error('Firebase failed; falling back to local mode', e);
      alert(`The live connection failed: ${e.message}\n\nThis screen will run in local mode, which works only between tabs of this browser.`);
    }
  }
  return localSync(room, role);
}

function localSync(room, role) {
  const ch = new BroadcastChannel(`dg:${room}`);
  const stateKey = `dg:pub:${room}`;
  const stateCbs = [], actionCbs = [];
  ch.onmessage = (e) => {
    const m = e.data || {};
    if (m.k === 'state') stateCbs.forEach((cb) => cb(m.state, { live: true }));
    if (m.k === 'action' && role === 'host') actionCbs.forEach((cb) => cb(m.a));
    if (m.k === 'hello' && role === 'host') actionCbs.forEach((cb) => cb({ type: '__hello' }));
  };
  return {
    mode: 'local',
    publish(state) {
      try { localStorage.setItem(stateKey, JSON.stringify(state)); } catch (e) { /* storage may be blocked */ }
      ch.postMessage({ k: 'state', state });
    },
    onAction(cb) { actionCbs.push(cb); },
    onState(cb) {
      stateCbs.push(cb);
      setTimeout(() => {
        try {
          const saved = localStorage.getItem(stateKey);
          if (saved) cb(JSON.parse(saved), { live: false });
        } catch (e) { console.error(e); }
      }, 0);
      ch.postMessage({ k: 'hello' });
    },
    send(a) { ch.postMessage({ k: 'action', a }); },
  };
}

const FB = 'https://www.gstatic.com/firebasejs/10.12.2';
async function firebaseSync(room, role) {
  const { initializeApp } = await import(`${FB}/firebase-app.js`);
  const db_ = await import(`${FB}/firebase-database.js`);
  const auth_ = await import(`${FB}/firebase-auth.js`);
  const app = initializeApp(FIREBASE_CONFIG);
  const cred = await auth_.signInAnonymously(auth_.getAuth(app));
  const db = db_.getDatabase(app);
  const stateRef = db_.ref(db, `rooms/${room}/state`);
  const actionsRef = db_.ref(db, `rooms/${room}/actions`);
  if (role === 'host') {
    const hostRef = db_.ref(db, `rooms/${room}/host`);
    const uid = cred.user.uid;
    const owner = (await db_.get(hostRef)).val();
    if (!owner) await db_.set(hostRef, uid);
    else if (owner !== uid) throw new Error('This room code is already in use by another projector. Start a new game to get a fresh code.');
  }
  return {
    mode: 'firebase',
    publish(state) {
      db_.set(stateRef, { json: JSON.stringify(state), at: db_.serverTimestamp() });
    },
    onAction(cb) {
      db_.onChildAdded(actionsRef, (snap) => {
        const v = snap.val();
        try { cb(JSON.parse(v.json)); } catch (e) { console.error(e); }
        db_.remove(snap.ref);
      });
    },
    onState(cb) {
      db_.onValue(stateRef, (snap) => {
        const v = snap.val();
        if (v && v.json) cb(JSON.parse(v.json), { live: true });
      });
    },
    send(a) {
      db_.push(actionsRef, { json: JSON.stringify(a), at: db_.serverTimestamp() });
    },
  };
}
