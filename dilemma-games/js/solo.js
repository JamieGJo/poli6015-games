// "Play against the computer": one device, nothing sent online. The engine runs here, the
// computer players come from bots.js, and the game is saved in this browser only.
// Left: the board (the projector's view). Right: your own phone screen.
import * as U from './ui.js';
import { plural } from './ui.js';
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
  chairman: `<h3>Debrief</h3>
    <p>You never saw a harvest, only reports. The harder you pushed the Plan, the bigger the reports, and the more grain you could take on paper. The famine came from the gap between the two.</p>
    <ul><li>Which of your choices told you the truth, and which made it harder to see?</li>
    <li>Did the quota feed the cities, or only make the reports look as if it could?</li>
    <li>When you decided on the premium, what did each choice cost you? Why might a dictator break his word even when he knows it costs him?</li></ul>
    <p class="small muted">Wintrobe (1998), ch. 1: fear makes reports false (p. 22); the enforcement problem (pp. 25–26); competing agencies (pp. 34–35).</p>`,
  petition: `<h3>Debrief</h3>
    <p>The Palace never saw grievance, only signals. Praise under police is cheap and tells it nothing; a petition is costly to allow but tells the truth.</p>
    <ul><li>How well did the Palace's guesses match the real moods on the map?</li>
    <li>Did police make the provinces calmer, or only quieter? What did they do to the Police Chief's strength?</li>
    <li>Was opening a petition box worth 2 tokens?</li>
    <li>Who hid their grievance because they did not know where the police were? Would you have protested if you had known?</li>
    <li>Did the Palace ever reward a province that protested? What did that teach the other provinces?</li>
    <li>Which angry provinces did the Palace ignore, and what did it cost?</li></ul>
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
  if (saved && saved.s?.v !== (game === 'harvest' ? HarvestUI.E.newGame('X').v : PetitionUI.E.newGame('X').v)) saved = null;  // saved under older rules
  document.title = `${G.TITLE} · against the computer`;
  const app = document.createElement('div'); app.className = 'solo';
  document.body.innerHTML = ''; document.body.appendChild(app);

  const top = (extra = '') => `<div class="top"><div><span class="gname">${G.TITLE}</span> <span class="muted small" style="color:#c9ccd6">against the computer</span></div>
    <div class="rowc">${extra}<a class="btn ghost" href="index.html">All games</a></div></div>`;

  let style = 'balanced';  // the computer Palace's style, chosen when you play a province
  function newGame(role) {
    const r = game === 'harvest' ? B.harvestSetup(fairRandom, 20, role === 'chairman' ? 'chairman' : 'village') : B.petitionSetup(fairRandom, role, style);
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
    app.innerHTML = top() + `<div class="explain"><div class="exart">${chairmanScene()}</div><div><h2>Who do you want to be?</h2>
      <p>The computer's villages behave like a real class: some report the truth, some inflate to stay safe, and a few always claim the most they can.</p>
      <p>The board on the left is what the projector would show. Your own screen is on the right: that is where you act.</p></div></div>
      <div class="rolepick">
        <button class="btn" data-role="village"><b>A village</b><span class="small">One village among twenty, with a secret harvest. The computer plays the other villages and the Chairman. Keep as much grain as you can, and avoid the purge.</span></button>
        <button class="btn" data-role="chairman"><b>The Chairman</b><span class="small">Rule the republic. You see only what the villages report. Choose how hard to push the Plan, how much grain to take, whether to pay for inspectors, and whether to keep your word. Feed the cities and keep the regime standing.</span></button>
      </div>`;
  }

  // Village mode: the computer Chairman's secret character, revealed at the end.
  function chairReveal(s) {
    const t = saved.mem.chairType, offered = s.policy.premium && s.premium !== null;
    const what = !offered ? 'The regime fell before he had to decide.' : s.premium ? 'This time he paid.' : 'This time he broke it.';
    return `<p><b>The Chairman you faced ${t === 'keeps' ? 'keeps his word' : 'breaks his word whenever paying would leave the cities short'}.</b> ${what} Half the computer Chairmen are of each kind, and nobody is told which until now.</p>`;
  }

  // The Chairman's desk ("play as the Chairman"): the decisions, and what the villages told you.
  const DECIDE = { r1_done: ['k', 'rate'], r3_done: ['inspectors'], r4a_done: ['premium'] };
  function desk(s) {
    const pub = E.publicView(s), seen = E.chairView(s), P = s.policy, ph = s.phase, R = s.regime, n = Object.keys(s.players).length;
    const decided = saved.mem.decided || (saved.mem.decided = {});
    const opt = (key, val, label, desc) => `<button class="btn pol ${String(P[key] ?? E.groupSize(n)) === String(val) && decided[key] ? 'primary' : ''}" data-pol="${key}" data-val="${val}"><b>${label}</b><span class="small">${desc}</span></button>`;
    let h = '';
    if (R.fell && ph !== 'end') h += `<div class="story bad">${icon('protest')}<p><span class="st">The villages have risen.</span> Your regime has fallen.</p></div>`;
    else if (ph === 'r1') h += '<p>The villages are reporting their first harvest. Nothing depends on it.</p>';
    else if (ph === 'r1_done') {
      h += `<h3>How hard do you push the Plan?</h3><p class="small">The villages say they grew <b>${pub.r1.total}</b> sacks. After the harvest the cities will need <b>${E.NEED_PER * n}</b>.</p>
        <div class="rolepick">${opt('k', 0, 'No quota', 'Nobody punished or promoted. The villages have no reason to inflate.')}${opt('k', 2, 'Two each way', `The 2 lowest reports re-educated (−2 sacks), the 2 highest promoted (+2). Mobilisation: every village really grows ${E.QUOTA_BOOST[2]} more.`)}${opt('k', 3, 'Three each way', `The 3 lowest re-educated, the 3 highest promoted; a second re-education means the purge. Mobilisation: every village really grows ${E.QUOTA_BOOST[3]} more.`)}</div>`;
      const reps = Object.values(seen.r1 || {});
      const proj = (r) => reps.reduce((a, x) => a + Math.ceil(x * r), 0);
      h += `<h3>How much grain will you take?</h3><p class="small">Announced with the Plan, so the villages hear it before they report. If the villages report what they did in Round 1, each choice collects the sacks shown. You will not see what they really grow: a village that cannot pay hands over everything, and that is a famine (Stability −${E.FAMINE_COST} each). A village left with under ${E.HUNGRY_BELOW} sacks goes hungry (Stability −1 for every ${E.HUNGRY_PER}).</p>
        <div class="rolepick">${E.RATES.map((r) => opt('rate', r, `${HarvestUI.RATE_WORD[r][0].toUpperCase()}${HarvestUI.RATE_WORD[r].slice(1)} of each report`, `About ${proj(r)} sacks.`)).join('')}</div>`;
    } else if (ph === 'r2_brief' || ph === 'r2') h += `<p>Your Plan has been announced: ${E.quotaK(s) ? `the ${E.quotaK(s)} lowest re-educated and the ${E.quotaK(s)} highest promoted` : 'no quota'}, and ${HarvestUI.RATE_WORD[P.rate]} of each report taken. The villages are reporting.</p>`;
    else if (ph === 'r2_done') h += `<p>The villages report <b>${pub.r2.total}</b> sacks in all. Continue to collect ${HarvestUI.RATE_WORD[P.rate]} of each report.</p>`;
    else if (ph === 'r3_done') {
      h += `<h3>Do you pay for inspectors?</h3><p class="small">Each inspector checks about a third of the villages and catches any report off by 2 or more. Each costs <b>${E.INSPECTOR_COST}</b> sacks from the granary (now ${R.granary}; the cities need ${R.need}). A new harvest is coming.</p>
        <div class="rolepick">${[0, 1, 2].map((k) => opt('inspectors', k, k ? `${k === 1 ? 'One inspector' : 'Two inspectors'}` : 'No inspectors', k ? `Granary ${R.granary} → ${Math.max(0, R.granary - E.INSPECTOR_COST * k)}.` : 'Free, but nobody checks anything.')).join('')}</div>`;
    } else if (ph === 'r4_brief' || ph === 'r4a' || ph === 'r4a_check') h += '<p>The villages are reporting their new harvest.</p>';
    else if (ph === 'r4a_done') {
      h += `<h3>Do you offer an honesty premium?</h3><p class="small">Villages that sign a pledge report their true harvest. Later you decide: pay ${E.PREMIUM} sacks to each signer an inspector confirmed, from the granary, or break your word (Stability −1 for every ${E.RENEGE_PER} signers).${s.inspectors.length ? '' : ' <b>You have no inspectors</b>, so nobody can be confirmed.'}</p>
        <div class="rolepick">${opt('premium', true, 'Offer the premium', 'You learn the truth from those who sign.')}${opt('premium', false, 'No offer', 'Nothing promised, nothing owed.')}</div>`;
    } else if (ph === 'r4b_poll' || ph === 'r4b' || ph === 'r4b_check') h += `<p>${ph === 'r4b_poll' ? 'The villages are deciding whether to sign.' : `${pub.poll ? plural(pub.poll.yes, 'village has', 'villages have') + ' signed. ' : ''}The villages are reporting.`}</p>`;
    else if (ph === 'r4b_chair') {
      const C = pub.chairPreview;
      h += `<h3>Do you keep your word?</h3><p class="small">${plural(C.signers, 'village', 'villages')} signed; inspectors confirmed ${C.confirmed}.</p>
        <div class="rolepick"><button class="btn" data-chair="1"><b>Pay the premium</b><span class="small">Granary ${C.granaryFrom} → ${C.granaryTo}${C.payStab ? `; Stability −${C.payStab} (the cities go short)` : '; Stability unchanged'}.</span></button>
        <button class="btn" data-chair="0"><b>“The Plan has been reconsidered”</b><span class="small">${C.renegeStab ? `Stability −${C.renegeStab}: word spreads.` : 'Nobody signed: no cost.'}</span></button></div>`;
    } else if (ph === 'r4b_done') h += '<p>Continue for the final count.</p>';
    else if (ph === 'end') h += `<p>${R.fell ? 'The regime fell.' : `The regime survived with Stability ${R.stab} of ${E.STAB0}.`} The granary holds ${R.granary}; the cities needed ${R.need}.</p>`;
    const last = ['r4b', 'r4a', 'r2', 'r1'].find((r) => seen[r] && Object.keys(seen[r]).length);
    if (last) h += `<div class="card flat"><div class="caps">What the villages told you (${HarvestUI.ROUND(last)})</div><div class="chips">${Object.entries(seen[last]).map(([v, r]) => `<span class="chip" title="Village ${v}">${v}: <b>${r}</b></span>`).join(' ')}</div><p class="small muted">Reports only. You never see a harvest until the reveal.</p></div>`;
    return `<div class="phead"><div><div class="caps">${HarvestUI.ROUND(ph)}</div><div class="pseat">The Chairman</div></div><div class="mini">Stability <b>${R.stab}</b>/${E.STAB0}${R.need ? `<br>Granary <b>${R.granary}</b>/${R.need}` : ''}</div></div><div class="pbody">${h}</div>`;
  }

  function render() {
    if (!saved) return game === 'petition' ? rolePicker() : intro();
    // The computer players move first, whenever the current step needs them.
    saved.s = game === 'harvest' ? B.harvestBots(saved.s, saved.mem, fairRandom) : B.petitionBots(saved.s, saved.mem, fairRandom);
    LS.set(key, saved);
    const s = saved.s;
    const chair = game === 'harvest' && saved.role === 'chairman';
    const pub = E.publicView(s), priv = chair ? null : E.privateView(s, B.ME);
    const you = game === 'petition' ? saved.role : null;
    const board = G.hostView(pub, { joinPanel: '', you, solo: game === 'harvest' ? saved.role : undefined });
    const chk0 = E.canAdvance(s);
    // The Harvest engine lets the leader close a round early; here we wait for you.
    const mine = game === 'harvest' && !s.regime.fell && (chair
      ? (DECIDE[s.phase] && DECIDE[s.phase].some((k) => !(saved.mem.decided || {})[k]))
      : ((E.REPORT_PHASES[s.phase] && !(priv.inspector && s.phase.startsWith('r4')) && !(s.phase === 'r4b' && priv.pledged) && priv.myReport == null)
        || ((s.phase === 'r4a_check' || s.phase === 'r4b_check') && priv.inspector && !(priv.checks && priv.checks.length))
        || (s.phase === 'r4b_poll' && !priv.inspector && priv.pledged == null)));
    const chk = mine ? { ok: false } : chk0;
    const over = game === 'harvest' ? s.phase === 'end' : s.step === 'end';
    const youLabel = game === 'harvest' ? (chair ? 'You: the Chairman’s desk' : `You: village ${priv.n}`)
      : `You: ${E.SEAT_NAME[saved.role]}${saved.role !== 'palace' ? ` · computer Palace: ${(saved.mem.palaceStyle || 'balanced') === 'harsh' ? 'harsh' : 'balanced'}` : ''}`;
    const nextBtn = over ? '' : `<div class="next"><button class="btn primary" data-solo="next" ${chk.ok ? '' : 'disabled'}>${U.esc(board.next || 'Continue')} →</button>
      <span class="why">${chk.ok ? 'Everyone has moved. Continue when you are ready.' : `${icon('arrow')} <b>Your move:</b> use the panel marked “You”.`}</span></div>`;
    app.innerHTML = top(`<button class="btn ghost" data-solo="restart">Start again</button>`)
      + `<div class="cols"><div class="board-wrap"><div class="caps">${U.esc(board.round)}</div>${board.main}${nextBtn}
        ${over ? `<div class="card">${DEBRIEF[chair ? 'chairman' : game]}${chair && pub.r3?.boost ? `<p><b>Your quota's mobilisation added ${pub.r3.boost} real sacks. The reports grew by ${pub.r2.total - pub.r1.total}.</b> You taxed the reports, not the grain.</p>` : ''}${game === 'harvest' && !chair && saved.mem.chairType ? chairReveal(s) : ''}<div class="rowc"><button class="btn primary" data-solo="restart">Play again</button></div></div>` : ''}</div>
        <div><div class="youpane"><div class="caps">${icon('phone')} ${youLabel}</div><div class="phone">${chair ? desk(s) : G.phoneView(pub, priv).replace(/the projector/g, 'the board')}</div>${over ? '' : nextBtn}</div></div></div>`;
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
    const pol = e.target.closest('[data-pol]');
    if (pol && saved) {
      const k = pol.dataset.pol, raw = pol.dataset.val;
      const val = k === 'premium' ? raw === 'true' : Number(raw);
      const nx = E.setPolicy(saved.s, k, val);
      if (nx !== saved.s || saved.s.policy[k] === val) { saved.s = nx; (saved.mem.decided || (saved.mem.decided = {}))[k] = true; LS.set(key, saved); }
      return render();
    }
    const ch = e.target.closest('[data-chair]');
    if (ch && saved) { saved.s = E.chair(saved.s, ch.dataset.chair === '1'); LS.set(key, saved); return render(); }
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
