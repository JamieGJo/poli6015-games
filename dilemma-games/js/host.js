// Projector controller for both games. The projector holds the full game state (in this
// browser's storage), shows only public information, and publishes each phone's private
// view sealed under that phone's key.
import { connect, isLive } from './sync.js';
import { seal, fairRandom } from './seal.js';
import * as U from './ui.js';
import * as HarvestUI from './harvest-ui.js';
import * as PetitionUI from './petition-ui.js';

if (!U.fileWarning()) start();

function start() {
  const GAMES = { harvest: HarvestUI, petition: PetitionUI };
  const q = new URLSearchParams(location.search);
  const gameId = GAMES[q.get('game')] ? q.get('game') : 'harvest';
  const G = GAMES[gameId];
  const LS = U.store('local');
  let code = U.cleanCode(q.get('room'));
  if (!code || !LS.get(`dg:host:${code}`)) {
    const last = LS.get(`dg:last:${gameId}`);
    code = code || (last && LS.get(`dg:host:${last}`) ? last : U.newCode(fairRandom));
  }
  const key = `dg:host:${code}`, undoKey = `dg:undo:${code}`;
  if (q.get('sheet') === '1') return sheet(G, code, key);

  let s = LS.get(key);
  // A game saved under older rules (a different engine version) is replaced by a new one.
  if (!s || s.game !== gameId || s.v !== G.newState(code, fairRandom).v) { s = G.newState(code, fairRandom); LS.set(key, s); LS.del(undoKey); }
  LS.set(`dg:last:${gameId}`, code);
  history.replaceState(null, '', `?game=${gameId}&room=${code}`);
  document.title = `${G.TITLE} · projector`;

  const joinURL = new URL('play.html', location.href).href.split('?')[0];
  let sync = null, rev = Date.now(), chain = Promise.resolve();

  function publish() {
    chain = chain.then(async () => {
      if (!sync) return;
      const pub = G.E.publicView(s);
      const priv = {};
      for (const [pid, p] of Object.entries(s.players)) {
        if (!p.key) continue;
        const view = G.E.privateView(s, pid);
        if (view) priv[pid] = await seal(p.key, view);
      }
      sync.publish({ game: gameId, code, rev: ++rev, pub, priv });
    }).catch((e) => console.error(e));
  }
  function commit(next, undoable) {
    if (!next || next === s) return false;
    if (undoable) {
      const stack = LS.get(undoKey) || [];
      stack.push(s); while (stack.length > 30) stack.shift();
      LS.set(undoKey, stack);
    }
    s = next; LS.set(key, s); render(); publish();
    return true;
  }

  function joinPanel() {
    const url = `${joinURL}?room=${code}`;
    if (!isLive()) {
      return `<div class="card join"><div>
        <div class="caps muted">Rehearsal (local mode): game code</div><div class="code">${code}</div>
        <p class="small" style="margin-top:10px">Phone screens must be <b>tabs of this same browser</b> on this computer, with this projector tab left open: use <b>Menu → Open a phone screen</b>, or open <span class="url">${U.esc(joinURL)}</span> in a new tab and enter the code.</p>
        <p class="small warn">Students' own phones cannot join until live mode is set up (README.md in the game folder).</p></div></div>`;
    }
    return `<div class="card join"><div class="qr">${U.qrSVG(url)}</div><div>
      <div class="caps muted">On your phone, go to</div><div class="url">${U.esc(joinURL)}</div>
      <div class="caps muted" style="margin-top:10px">and enter the code</div><div class="code">${code}</div></div></div>`;
  }

  function render() {
    const pub = G.E.publicView(s);
    const v = G.hostView(pub, { joinPanel: joinPanel(), code });
    const chk = G.E.canAdvance(s);
    document.body.innerHTML = `<div class="host">
      <header><div><span class="gname">${G.TITLE}</span><span class="round">${U.esc(v.round)}</span></div>
        <div class="hright"><span class="code sm">${code}</span>${isLive() ? '' : '<span class="badge">Local mode</span>'}
        <button class="btn ghost" data-cmd="menu">Menu</button></div></header>
      <main>${v.main}</main>
      <footer>
        <button class="btn ghost" data-cmd="undo" ${(LS.get(undoKey) || []).length ? '' : 'disabled'}>Undo</button>
        <div class="why">${chk.ok ? '' : U.esc(chk.why)}</div>
        ${v.next ? `${!chk.ok && chk.soft ? '<button class="btn" data-cmd="force">Move on anyway</button>' : ''}<button class="btn primary" data-cmd="next" ${chk.ok ? '' : 'disabled'}>${U.esc(v.next)} →</button>` : ''}
      </footer>
      <div class="menu hidden" id="menu"><div class="card">
        <h3>Menu</h3>
        ${gameId === 'harvest' ? '<button class="btn wide" data-cmd="sheet">Leader’s sheet (opens a window: keep it off the projector)</button>' : ''}
        <button class="btn wide" data-cmd="phone">Open a phone screen in a new tab (for testing)</button>
        <button class="btn wide" data-cmd="download">Download the game record (JSON)</button>
        <button class="btn wide" data-cmd="new">Start a new game</button>
        <a class="btn wide" href="index.html">Back to the games</a>
        <button class="btn ghost wide" data-cmd="menu">Close</button></div></div>
    </div>`;
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-cmd]');
    if (!el) return;
    const d = el.dataset;
    if (d.cmd === 'menu') { document.getElementById('menu').classList.toggle('hidden'); return; }
    if (d.cmd === 'next') return commit(G.E.advance(s, fairRandom), true);
    if (d.cmd === 'force') {
      if (!confirm(`${G.E.canAdvance(s).why}\n\nMove on anyway? Missing choices count as doing nothing.`)) return;
      return gameId === 'petition' ? commit(G.E.advance(s, fairRandom, true), true) : null;
    }
    if (d.cmd === 'undo') {
      const stack = LS.get(undoKey) || [];
      if (!stack.length || !confirm('Undo the last step? Anything sent from phones since then is lost and must be sent again.')) return;
      s = stack.pop(); LS.set(undoKey, stack); LS.set(key, s); render(); publish(); return;
    }
    if (d.cmd === 'sheet') { window.open(`host.html?game=${gameId}&room=${code}&sheet=1`, `sheet-${code}`, 'width=520,height=720'); return; }
    if (d.cmd === 'phone') { window.open(`play.html?room=${code}`, '_blank'); return; }
    if (d.cmd === 'download') {
      const blob = new Blob([JSON.stringify(s, (k, v) => (k === 'key' ? undefined : v), 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${new Date().toISOString().slice(0, 10)}_${gameId}_${code}.json`; a.click();
      return;
    }
    if (d.cmd === 'new') {
      if (!confirm('Start a new game with a new code? This game stays saved in this browser under its code.')) return;
      location.href = `host.html?game=${gameId}&room=${U.newCode(fairRandom)}`; return;
    }
    commit(G.hostCommand(s, d), true);
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-set]');
    if (el) commit(G.hostCommand(s, { cmd: 'setting', key: el.dataset.set, value: el.value }), false);
  });

  // Paper provinces: reports typed on the leader's sheet arrive on this channel (same browser only).
  const sheetCh = new BroadcastChannel(`dg-sheet:${code}`);
  sheetCh.onmessage = (e) => {
    const a = e.data || {};
    if ((a.type === 'report' || a.type === 'pledge') && s.players[a.pid]?.paper) commit(G.E.applyAction(s, { ...a, trusted: true }), false);
  };

  render();
  connect(U.syncRoom(code), 'host').then((sy) => {
    sync = sy;
    sync.onAction((a) => {
      if (a.type === '__hello') return publish();
      if (a.trusted) return;  // only the leader's sheet may send trusted actions
      if (!commit(G.E.applyAction(s, a), false)) publish();
    });
    publish(); render();
  });
}

function sheet(G, code, key) {
  const LS = U.store('local');
  const ch = new BroadcastChannel(`dg-sheet:${code}`);
  document.title = 'Leader’s sheet';
  const draw = () => {
    const s = LS.get(key);
    const focus = document.activeElement?.dataset?.paper;
    document.body.innerHTML = `<div class="wrap sheetwrap">${s ? G.sheetView(s) : '<p>No game found.</p>'}</div>`;
    if (focus) { const el = document.querySelector(`[data-paper="${focus}"]`); if (el) { el.focus(); const v = el.value; el.value = ''; el.value = v; } }
  };
  window.addEventListener('storage', (e) => { if (e.key === key && !document.activeElement?.dataset?.paper) draw(); });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-paper]');
    if (el && el.value !== '') ch.postMessage({ type: 'report', pid: el.dataset.paper, value: Number(el.value) });
    const pl = e.target.closest('[data-pledge]');
    if (pl) ch.postMessage({ type: 'pledge', pid: pl.dataset.pledge, yes: pl.checked });
    setTimeout(draw, 150);
  });
  draw();
}
