// Phone controller for both games. A phone reads the shared public view, opens its own
// sealed private view, and sends actions to the projector.
import { connect, isLive } from './sync.js';
import { newId, unseal } from './seal.js';
import * as U from './ui.js';
import * as HarvestUI from './harvest-ui.js';
import * as PetitionUI from './petition-ui.js';

const GAMES = { harvest: HarvestUI, petition: PetitionUI };
if (!U.fileWarning()) start();

function start() {
  const q = new URLSearchParams(location.search);
  const code = U.cleanCode(q.get('room'));
  if (!code || code.length !== 4) return askCode();
  // In local mode every tab is a separate phone, so the identity lives in this tab only.
  const ID = U.store(isLive() ? 'local' : 'session');
  const idKey = `dg:me:${code}`;
  let me = ID.get(idKey);
  let msg = null, priv = null, lastRev = 0, sync = null, sentJoin = false, live = false, problem = null;

  const app = document.createElement('div'); app.className = 'phone'; document.body.innerHTML = ''; document.body.appendChild(app);
  const draw = () => {
    if (problem) { app.innerHTML = problemCard(problem, code); return; }
    if (!msg || !live) { app.innerHTML = `<div class="card"><h2>Connecting to game ${code}…</h2><p class="muted">If this stays here, check the code and that the projector screen is open.</p><a class="btn" href="play.html">Enter a different code</a></div>`; return; }
    const G = GAMES[msg.game];
    document.title = G.TITLE;
    if (!priv) {
      app.innerHTML = sentJoin && me ? '<div class="card"><p>Joining…</p></div>' : G.phoneJoin(msg.pub);
      return;
    }
    app.innerHTML = G.phoneView(msg.pub, priv);
  };

  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !msg || el.disabled) return;
    const G = GAMES[msg.game];
    const a = G.phoneAction(el.dataset, msg.pub, priv);
    if (a === 'render') return draw();
    if (!a) return;
    if (a.type === 'join') {
      me = { pid: newId(8), key: newId(16) }; ID.set(idKey, me); sentJoin = true;
      setTimeout(() => { if (!priv) { sentJoin = false; problem = 'nojoin'; draw(); } }, 4000);
    }
    if (!me) return;
    sync.send({ ...a, pid: me.pid, key: me.key });
    draw();
  });

  connect(U.syncRoom(code), 'phone').then((sy) => {
    sync = sy;
    sync.onState(async (m, meta = {}) => {
      if (!m || !m.pub) return;
      if (meta.live) { live = true; if (problem === 'noprojector') problem = null; }
      if (m.rev < lastRev) return;
      lastRev = m.rev; msg = m;
      if (me && m.priv && m.priv[me.pid]) {
        try { priv = await unseal(me.key, m.priv[me.pid]); sentJoin = false; if (problem === 'nojoin') problem = null; } catch (e) { priv = null; }
      } else priv = null;
      draw();
    });
    draw();
    // In local mode the projector answers a new tab at once. If nothing live arrives, say why.
    setTimeout(() => { if (!live) { problem = 'noprojector'; draw(); } }, 2500);
  });
  draw();

  app.addEventListener('click', (e) => { if (e.target.closest('[data-retry]')) location.reload(); });
}

function problemCard(kind, code) {
  const local = !isLive();
  const head = kind === 'nojoin' ? 'The projector did not answer' : `No projector is running game ${code}`;
  const why = local
    ? `<p>This copy of the game is in <b>local mode</b> (rehearsal). A phone screen can only join from another tab of <b>the same browser on the same computer</b>, while the projector screen stays open in its own tab.</p>
       <p>It will not work from a real phone, from a different browser, or if the projector page was closed or replaced by this one.</p>
       <p class="small muted">To use students' own phones, the site needs live mode: see README.md in the game folder.</p>`
    : '<p>Check the code, and that the projector screen is still open.</p>';
  return `<div class="card bad"><h2>${head}</h2>${why}<div class="rowc"><button class="btn primary" data-retry="1">Try again</button><a class="btn" href="play.html">Enter a different code</a></div></div>`;
}

function askCode() {
  document.body.innerHTML = `<div class="phone"><div class="card"><h2>Join a game</h2><p>Enter the four-letter code on the projector.</p>
    <form id="f"><input id="c" class="codein" maxlength="4" autocomplete="off" autocapitalize="characters" placeholder="ABCD"><button class="btn primary wide">Join</button></form></div></div>`;
  document.getElementById('f').addEventListener('submit', (e) => {
    e.preventDefault();
    const c = U.cleanCode(document.getElementById('c').value);
    if (c.length === 4) location.href = `play.html?room=${c}`;
  });
}
