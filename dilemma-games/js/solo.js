// "Play against the computer": one device, nothing sent online. The engine runs here, the
// computer players come from bots.js, and the game is saved in this browser only.
// Left: the board (the projector's view). Right: your own phone screen.
import * as U from './ui.js';
import { fairRandom } from './seal.js';
import * as B from './bots.js';
import * as HarvestUI from './harvest-ui.js';
import * as PetitionUI from './petition-ui.js';
import { icon, palaceScene, chairmanScene } from './art.js';


const DEBRIEF = {
  harvest: `<h3>Debrief</h3>
    <p>Look at the bars: reports and the truth were close when nothing was at stake, and parted as soon as the quota punished low numbers. The state then taxed the reports, not the grain.</p>
    <ul><li>Why did honest villages end up re-educated in Round 2?</li>
    <li>Did inspectors shrink the gap for everyone, or only for the villages they checked?</li>
    <li>Would you have believed the Chairman's premium? Why does a dictator find it hard to promise anything?</li></ul>
    <p class="small muted">Wintrobe (1998), ch. 1: fear makes reports false (p. 22); the enforcement problem (pp. 25–26); competing agencies (pp. 34–35).</p>`,
  petition: `<h3>Debrief</h3>
    <p>The Palace never saw grievance, only signals. Praise under police is cheap and tells it nothing; a petition is costly to allow but tells the truth.</p>
    <ul><li>How well did the Palace's guesses match the real moods on the map?</li>
    <li>Did police make the provinces calmer, or only quieter? What did they do to the Police Chief's strength?</li>
    <li>Was opening a petition box worth 2 tokens?</li></ul>
    <p class="small muted">Wintrobe (1998), ch. 1: the paradox and the subject's dilemma (p. 22); repression and loyalty (p. 33); the security forces as the main threat (p. 34).</p>`,
};

function start() {
  const q = new URLSearchParams(location.search);
  const game = ['harvest', 'petition'].includes(q.get('game')) ? q.get('game') : null;
  if (!game) { location.href = 'index.html'; return; }
  const G = game === 'harvest' ? HarvestUI : PetitionUI;
  const E = G.E;
  const LS = U.store('local');
  const key = `dg:solo:${game}`;
  let saved = LS.get(key);
  document.title = `${G.TITLE} · against the computer`;
  const app = document.createElement('div'); app.className = 'solo';
  document.body.innerHTML = ''; document.body.appendChild(app);

  const top = (extra = '') => `<div class="top"><div><span class="gname">${G.TITLE}</span> <span class="muted small" style="color:#c9ccd6">against the computer</span></div>
    <div class="rowc">${extra}<a class="btn ghost" href="index.html">All games</a></div></div>`;

  let style = 'balanced';  // the computer Palace's style, chosen when you play a province
  function newGame(role) {
    const r = game === 'harvest' ? B.harvestSetup(fairRandom) : B.petitionSetup(fairRandom, role, style);
    saved = { role: role || 'village', s: r.s, mem: r.mem, at: Date.now() };
    LS.set(key, saved); render();
  }

  function rolePicker() {
    const seats = [['palace', 'The Palace', 'Rule Valmora. Spend 8 tokens a year on aid, police and petition boxes, and keep the Police Chief in check. You never see how angry the provinces really are.']]
      .concat(E.PROVS.map((k) => [k, E.SEAT_NAME[k], `Play the ${PetitionUI.PROV[k].people}. You know your own grievance and choose what to show the Palace: praise, silence, a petition or a protest.`]));
    app.innerHTML = top() + `<div class="explain"><div class="exart">${palaceScene()}</div><div><h2>Who do you want to be?</h2>
      <p>The computer plays everyone else, using simple rules: its provinces signal their real mood, though some protest when they could stay quiet; its Chief strikes when the odds are one in three or better.</p></div></div>
      <div class="rolepick">${seats.slice(0, 1).map(([k, name, blurb]) => `<button class="btn" data-role="${k}"><b>${name}</b><span class="small">${blurb}</span></button>`).join('')}</div>
      <h3 style="margin-top:18px">Or play a province</h3>
      <p class="small">First choose how the computer Palace rules:</p>
      <div class="rowc">${Object.entries(B.PALACE_STYLES).map(([k, t]) => `<button class="btn ${style === k ? 'primary' : ''}" data-style="${k}" aria-pressed="${style === k}">${t.split(':')[0]}</button>`).join('')}</div>
      <p class="small muted">${((t) => t.charAt(0).toUpperCase() + t.slice(1))(B.PALACE_STYLES[style].split(': ')[1])}${style === 'harsh' ? ' Watch the Police Chief.' : ''}</p>
      <div class="rolepick">${seats.slice(1).map(([k, name, blurb]) => `<button class="btn" data-role="${k}"><b>${name}</b><span class="small">${blurb}</span></button>`).join('')}</div>`;
  }

  function intro() {
    app.innerHTML = top() + `<div class="explain"><div class="exart">${chairmanScene()}</div><div><h2>You are one village among twenty</h2>
      <p>The other nineteen are played by the computer. Like a real class, some report the truth, some inflate to stay safe, and a few always claim the most they can. The computer is also the Chairman.</p>
      <p>The board on the left is what the projector would show. Your own phone screen is on the right: that is where you act.</p>
      <button class="btn primary" data-role="village">Start</button></div></div>`;
  }

  function render() {
    if (!saved) return game === 'petition' ? rolePicker() : intro();
    // The computer players move first, whenever the current step needs them.
    saved.s = game === 'harvest' ? B.harvestBots(saved.s, saved.mem, fairRandom) : B.petitionBots(saved.s, saved.mem, fairRandom);
    LS.set(key, saved);
    const s = saved.s;
    const pub = E.publicView(s), priv = E.privateView(s, B.ME);
    const you = game === 'petition' ? saved.role : null;
    const board = G.hostView(pub, { joinPanel: '', you });
    const chk0 = E.canAdvance(s);
    // The Harvest engine lets the leader close a round early; here we wait for you.
    const mine = game === 'harvest' && (
      (E.REPORT_PHASES[s.phase] && !(priv.inspector && s.phase.startsWith('r4')) && priv.myReport == null)
      || ((s.phase === 'r4a_check' || s.phase === 'r4b_check') && priv.inspector && !(priv.checks && priv.checks.length))
      || (s.phase === 'r4b_poll' && priv.believe == null));
    const chk = mine ? { ok: false } : chk0;
    const over = game === 'harvest' ? s.phase === 'end' : s.step === 'end';
    const youLabel = game === 'harvest' ? `You: village ${priv.n}`
      : `You: ${E.SEAT_NAME[saved.role]}${saved.role !== 'palace' ? ` · computer Palace: ${(saved.mem.palaceStyle || 'balanced') === 'harsh' ? 'harsh' : 'balanced'}` : ''}`;
    const nextBtn = over ? '' : `<div class="next"><button class="btn primary" data-solo="next" ${chk.ok ? '' : 'disabled'}>${U.esc(board.next || 'Continue')} →</button>
      <span class="why">${chk.ok ? 'Everyone has moved. Continue when you are ready.' : `${icon('arrow')} <b>Your move:</b> use the panel marked “You”.`}</span></div>`;
    app.innerHTML = top(`<button class="btn ghost" data-solo="restart">Start again</button>`)
      + `<div class="cols"><div class="board-wrap"><div class="caps">${U.esc(board.round)}</div>${board.main}${nextBtn}
        ${over ? `<div class="card">${DEBRIEF[game]}<div class="rowc"><button class="btn primary" data-solo="restart">Play again</button></div></div>` : ''}</div>
        <div><div class="youpane"><div class="caps">${icon('phone')} ${youLabel}</div><div class="phone">${G.phoneView(pub, priv).replace(/the projector/g, 'the board')}</div>${over ? '' : nextBtn}</div></div></div>`;
  }

  app.addEventListener('click', (e) => {
    const st = e.target.closest('[data-style]');
    if (st) { style = st.dataset.style; return rolePicker(); }
    const r = e.target.closest('[data-role]');
    if (r) return newGame(r.dataset.role);
    const so = e.target.closest('[data-solo]');
    if (so) {
      if (so.disabled) return;
      if (so.dataset.solo === 'next') {
        const nx = E.advance(saved.s, fairRandom);
        if (nx !== saved.s) { saved.s = nx; LS.set(key, saved); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
        return;
      }
      if (so.dataset.solo === 'restart') {
        if (!confirm('Start a new game? This one will be lost.')) return;
        LS.del(key); saved = null; render(); return;
      }
    }
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled || !saved) return;
    const s = saved.s;
    const a = G.phoneAction(el.dataset, E.publicView(s), E.privateView(s, B.ME));
    if (a === 'render') return render();
    if (!a) return;
    const nx = E.applyAction(s, { ...a, pid: B.ME, key: B.ME });
    if (nx !== s) { saved.s = nx; LS.set(key, saved); }
    render();
  });

  render();
}

if (!U.fileWarning()) start();
