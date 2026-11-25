// Sync layer. The main screen (host) owns the game state and publishes it;
// team devices send actions. Two transports share one interface:
//   local    : BroadcastChannel between tabs of one browser (testing, fallback)
//   firebase : Firebase Realtime Database (live classes on students' devices)
import { FIREBASE_CONFIG } from './config.js';
import * as E from './engine.js';

export async function connect(room, role) {
  if (FIREBASE_CONFIG && FIREBASE_CONFIG.databaseURL) {
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
  const ch = new BroadcastChannel(`sts:${room}`);
  const stateKey = `sts:state:${room}`;
  const stateCbs = [], actionCbs = [];
  ch.onmessage = (e) => {
    const m = e.data || {};
    if (m.k === 'state') stateCbs.forEach((cb) => cb(m.state));
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
      // Deliver the last saved state after the caller has finished setting up.
      setTimeout(() => {
        try {
          const saved = localStorage.getItem(stateKey);
          if (saved) cb(JSON.parse(saved));
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
    // Claim the room for this browser. The database rules (SETUP.md) let only
    // the claiming browser write the game state or read the teams' actions.
    const hostRef = db_.ref(db, `rooms/${room}/host`);
    const uid = cred.user.uid;
    const owner = (await db_.get(hostRef)).val();
    if (!owner) await db_.set(hostRef, uid);
    else if (owner !== uid) throw new Error('This room code is already in use by another main screen. Start a new class to get a fresh code.');
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
        if (v && v.json) cb(JSON.parse(v.json));
      });
    },
    send(a) {
      db_.push(actionsRef, { json: JSON.stringify(a), at: db_.serverTimestamp() });
    },
  };
}

// Solo play: the whole game runs inside the player's page, with no main screen.
// Each answer is revealed at once, and the player moves on with "Continue".
// The game is saved in this browser, so a student can stop after Week 1 and come back.
export function soloSync({ wintrobe = false, quick = false, fresh = false } = {}) {
  const KEY = 'sts:solo';
  let st = null;
  if (!fresh) { try { st = JSON.parse(localStorage.getItem(KEY)); } catch (e) { st = null; } }
  if (!st || st.room !== 'SOLO') st = E.newGame('SOLO', { solo: true, quizzes: false, wintrobe, quick });
  const cbs = [];
  const pub = () => {
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage may be blocked */ }
    cbs.forEach((cb) => cb(st));
  };
  return {
    mode: 'solo',
    publish() {},
    onAction() {},
    onState(cb) { cbs.push(cb); setTimeout(() => cb(st), 0); },
    send(a) {
      if (a.type === '__continue') {
        const W = E.weekDef(st);
        if (st.step >= W.steps.length - 1) { if (st.week !== 2) st = E.startWeek2(st); } else st = E.goTo(st, st.step + 1);
      } else if (a.type === '__back') {
        st = E.goTo(st, st.step - 1);
      } else {
        st = E.applyAction(st, a);
        const step = E.currentStep(st);
        const t = st.teams[a.teamId];
        if (a.type === 'join' && step.id === 'lobby') st = E.goTo(st, 1);
        else if (a.type === 'submit' && t && t.submitted[step.id]) {
          if (step.id === 'rejoin') st = E.goTo(st, st.step + 1);
          else if (st.phase === 'open') st = E.reveal(st);
        }
      }
      pub();
    },
  };
}
