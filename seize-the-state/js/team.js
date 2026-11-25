// Team device. Shows the current step's form, sends the team's choices to the main screen.
// With ?solo=1 the game runs on this device alone (see sync.js), with no main screen.
import {
  WEEK1, REGIME_TYPES, RULER_QUESTIONS, CLASSIFY_EXPLANATIONS, CLAIM_OPTIONS, SELECTORATE, selectorateModel,
  MAX_CLAIMS, JUSTIFY, JUSTIFY_HINT, ELECTORAL_LAYERS, ELECTORAL_MISMATCH, compareClaim,
  selectorateContext, selectorateRanges, selectorateAnalysis, rung, ELECTION_NOMINAL, ELECTIONS_PHRASE,
  DECREE, MISMATCH_NOTE, LESSONS,
} from './content/week1.js';
import { OLD_ORDERS, OLD_ORDER_INTRO } from './content/week2.js';
import { DILEMMA } from './content/wintrobe.js';
import { quizFor } from './content/quizzes.js';
import { PUZZLES, researchFor } from './content/puzzles.js';
import { storyFor } from './content/stories.js';
import { currentStep, teamList, weekDef, quizzesOn, settingsOf } from './engine.js';
import { week2Steps } from './team2.js';
import { connect, soloSync } from './sync.js';
import { mapSVG, svgPoint, territoryAt, territoryViewBox, provincesFor } from './map.js';
import { flagSVG, FLAG_COLOURS, FLAG_LAYOUTS, EMBLEMS, randomFlag, emblemMarkup } from './flag.js';
import { esc, citeHTML, typePill, claimPills, resultPills, ladderSVG, decreeDetail, accent, fmt, money, nestedCircles, meters, moodColour, storyHTML } from './ui.js';
import { TERRITORIES } from './territories.js';
import { LAND_INTRO, POPULATION, ETHNIC, DEFAULT_GROUPS, GROUP_COLOURS, RELIGION, URBAN, WEALTH, groupShares, find } from './content/land.js';
import { iconSVG } from './icons.js';
import { charterHTML, downloadCharterPNG, profileHTML } from './charter.js';
import { drawQuiz, allAnswered } from './quizui.js';
import { portraitHTML } from './portrait.js';
import { heroHTML, deltaHTML } from './outcome.js';

const $ = (s, el = document) => el.querySelector(s);
const params = new URLSearchParams(location.search);
const solo = params.get('solo') === '1';
const room = solo ? 'SOLO' : (params.get('room') || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
if (room.length !== 4) location.href = 'index.html';
const ID_KEY = `sts:team:${room}`;
let teamId = solo ? 'solo' : params.get('as');
if (!teamId) {
  try { teamId = localStorage.getItem(ID_KEY); } catch (e) { /* ignore */ }
}
const freshId = () => 't' + Math.random().toString(36).slice(2, 10);

let state = null;
let lastKey = '';
let editing = false;
const draft = {};
const sync = solo ? soloSync({ wintrobe: params.get('extra') === '1', quick: params.get('start') === '2', fresh: params.get('new') === '1' }) : await connect(room, 'team');
if (solo && params.get('new') === '1') history.replaceState(null, '', location.pathname + '?solo=1');
sync.onState((s) => {
  if (!s || s.room !== room) return;
  state = s;
  render();
});
setTimeout(() => { if (!state) $('#main').innerHTML = `<div class="waiting"><h2>Waiting for the main screen</h2><p class="muted">Check the code <b>${room}</b>. ${sync.mode === 'local' ? 'In local mode, the main screen must be open in this same browser.' : ''}</p></div>`; }, 2500);

const me = () => (state && teamId ? state.teams[teamId] : null);
function send(type, data = {}) {
  // Send plain data only: drafts carry helper functions that cannot be sent.
  const msg = JSON.parse(JSON.stringify({ type, teamId, ...data }));
  try {
    sync.send(msg);
  } catch (e) {
    console.error(e);
    alert('Your answer could not be sent. Please try again.');
  }
}
function submit(stepId, data) {
  editing = false;
  send('submit', { stepId, data });
}

// ---------- Render ----------

function render() {
  if (!state) return;
  const step = currentStep(state);
  const t = me();
  renderHead(t, step);
  const pe = $('#portrait');
  if (pe) { const was = pe.querySelector('details')?.open; pe.innerHTML = t && step.id !== 'lobby' ? portraitHTML(t, state.week || 1, { open: !!was }) : ''; }
  const key = [state.week || 1, state.step, state.phase, t ? 1 : 0, t?.submitted[step.id] ? 1 : 0, editing ? 1 : 0, t?.decree ? 1 : 0, Object.keys(state.teams).length, t?.w2 ? `${t.w2.order}/${t.w2.crisis}/${t.w2.flip}` : '', t?.decree?.detected ?? ''].join('|');
  if (key === lastKey) return; // keep the form as it is while others play
  lastKey = key;
  const main = $('#main'), foot = $('#foot');
  foot.innerHTML = '';
  if (!t) { renderJoin(main, foot); return; }
  const submitted = !!t.submitted[step.id] && !editing;
  const view = STEPS[step.id];
  if (state.phase === 'reveal' && view.reveal) view.reveal(main, foot, t, step);
  else if (submitted && view.after) view.after(main, foot, t, step);
  else if (submitted) waiting(main, foot, t, step);
  else view.form(main, foot, t, step);
  if (solo && state.phase === 'reveal') soloFoot(foot);
  window.scrollTo({ top: 0 });
}

// Solo play: no main screen, so the player moves on when ready.
function soloFoot(foot) {
  const W = weekDef(state);
  const last = state.step >= W.steps.length - 1;
  const label = last ? (state.week === 2 ? 'Start again' : 'Go on to Week 2: how did we get here?') : 'Continue';
  foot.innerHTML = `<div class="inner row" style="gap:8px"><button class="btn" id="sback"${state.step === 0 ? ' disabled' : ''}>Back</button><button class="btn btn-primary btn-big grow" id="go">${esc(label)}</button></div>`;
  $('#sback', foot).onclick = () => { send('__back'); };
  $('#go', foot).onclick = () => {
    if (last && state.week === 2) { if (confirm('Start a new game? This one will be lost unless you have saved your dossier with “Print or save PDF”.')) location.href = 'team.html?solo=1&new=1'; return; }
    send('__continue');
  };
}

// Quiz questions inside a form. Returns a function that says whether all are answered.
function quizBox(el, stepId, when, t, onAnswer = () => {}) {
  if (!el) return () => true;
  if (!quizzesOn(state)) { el.innerHTML = ''; return () => true; }
  const qs = quizFor(stepId, when, { team: t });
  const answers = (draft.quiz ||= {});
  for (const [k, v] of Object.entries(t?.quiz || {})) answers[k] = v;
  drawQuiz(el, qs, answers, (qid, a) => { send('quiz', { qid, answer: a }); onAnswer(); });
  return () => allAnswered(qs, answers);
}

function renderHead(t, step) {
  const slot = t ? t.slot : null;
  const col = slot === null ? 'var(--ink)' : accent(slot);
  $('#head').style.setProperty('--tc', col);
  $('#head').innerHTML = `<div class="bar-top"></div><div class="inner">
    ${t?.country?.flag ? flagSVG(t.country.flag, { width: 36 }) : ''}
    <div class="grow"><div style="font-weight:700">${esc(t ? (t.country?.name || t.name) : 'Seize the State')}</div>
    <div class="tiny muted">${t ? esc(TERRITORIES[t.slot].region) + ' · ' : ''}Week ${weekDef(state).id} · ${esc(step.title)}</div></div>
    ${solo ? '<a class="tiny" href="index.html">Leave</a>' : `<span class="code" style="font-size:.9rem">${room}</span>`}</div>
    <div style="max-width:720px;margin:0 auto;padding:0 16px"><div class="stepper">${weekDef(state).steps.map((s, i) => `<i class="${i < state.step ? 'done' : i === state.step ? 'now' : ''}"></i>`).join('')}</div></div>`;
}

function footButton(foot, label, onClick, { disabled = false, cls = 'btn-primary' } = {}) {
  foot.innerHTML = `<div class="inner"><button class="btn ${cls} btn-big" id="go">${esc(label)}</button></div>`;
  const b = $('#go', foot);
  b.disabled = disabled;
  b.onclick = onClick;
  return b;
}

function waiting(main, foot, t, step) {
  main.innerHTML = `<div class="waiting"><div class="seal">SENT</div><h2>Sent to the main screen</h2><p class="muted">Waiting for the other states and the reveal.</p></div>`;
  if (state.phase === 'open' && step.id !== 'lobby' && step.id !== 'rejoin') {
    footButton(foot, 'Change our answer', () => { editing = true; lastKey = ''; render(); }, { cls: '' });
  }
}

// ---------- Join ----------

function renderJoin(main, foot) {
  if (state.week === 2 && teamList(state).length) { renderRejoin(main, foot); return; }
  const taken = new Set(teamList(state).map((x) => x.slot));
  if (taken.size >= 5) { main.innerHTML = '<div class="waiting"><h2>All five territories are taken</h2><p class="muted">Join one of the existing teams.</p></div>'; return; }
  let pick = draft.joinSlot ?? [0, 1, 2, 3, 4].find((i) => !taken.has(i));
  main.innerHTML = `<h2>Claim a territory</h2><p class="muted">${solo ? 'You are founding a new state in Meridia. Tap a territory on the map, then give yourself a name.' : 'Tap a free territory on the map, then name your team.'}</p>
    <div class="map-wrap pick" id="jm" style="aspect-ratio:1000/640"></div>
    <div class="options two" id="slots" style="margin-top:12px"></div>
    <label class="field" style="margin-top:12px"><span>Team name</span><input type="text" id="tname" maxlength="32" placeholder="${esc(TERRITORIES[pick].defaultTeam)}"></label>`;
  const draw = () => {
    $('#jm').innerHTML = mapSVG({ teams: teamList(state), highlight: pick, compact: true });
    $('#slots').innerHTML = TERRITORIES.map((T, i) => `<button class="opt ${i === pick ? 'on' : ''}" data-slot="${i}" ${taken.has(i) ? 'disabled style="opacity:.4"' : ''}><span class="opt-title"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${T.accent};margin-right:6px"></span>${esc(T.region)}</span><span class="opt-detail">${taken.has(i) ? 'Taken' : 'Free'}</span></button>`).join('');
    $('#tname').placeholder = TERRITORIES[pick].defaultTeam;
  };
  draw();
  $('#slots').onclick = (e) => { const b = e.target.closest('[data-slot]'); if (b && !b.disabled) { pick = draft.joinSlot = +b.dataset.slot; draw(); } };
  $('#jm').onclick = (e) => {
    const svg = $('svg', $('#jm'));
    const [x, y] = svgPoint(svg, e);
    const k = territoryAt(x, y);
    if (k >= 0 && !taken.has(k)) { pick = draft.joinSlot = k; draw(); }
  };
  footButton(foot, 'Join the game', () => {
    teamId = teamId || freshId();
    try { if (!params.get('as')) localStorage.setItem(ID_KEY, teamId); } catch (e) { /* ignore */ }
    send('join', { slot: pick, name: $('#tname').value.trim() || TERRITORIES[pick].defaultTeam });
    lastKey = '';
  });
}

// Week 2: a team may be on a different device, so it picks its country from the list.
function renderRejoin(main, foot) {
  const ts = teamList(state);
  let pick = draft.rejoin ?? null;
  main.innerHTML = `<div class="caps muted">Week 2 · Origins</div><h2>Which state are you?</h2><p class="muted">Choose the country your team founded last week.</p>
    <div class="options" id="rj"></div>`;
  optionCards($('#rj'), ts.map((x) => ({ value: x.id, raw: true, title: `<span style="display:inline-flex;gap:8px;align-items:center">${x.country?.flag ? flagSVG(x.country.flag, { width: 30 }) : ''}${esc(x.country?.name || x.name)}</span>`, detail: esc(TERRITORIES[x.slot].region) })), pick, (v) => { pick = draft.rejoin = v; btn.disabled = false; });
  const btn = footButton(foot, 'This is us', () => {
    if (!pick) return;
    teamId = pick;
    try { if (!params.get('as')) localStorage.setItem(ID_KEY, teamId); } catch (e) { /* ignore */ }
    lastKey = '';
    render();
  }, { disabled: !pick });
}

// ---------- Helpers for forms ----------

function optionCards(container, items, value, onPick) {
  container.innerHTML = items.map((it) => `<button type="button" class="opt ${it.value === value ? 'on' : ''}" data-v="${esc(it.value)}"${it.disabled ? ' disabled' : ''}><span class="opt-title">${it.raw ? it.title : esc(it.title)}</span>${it.detail ? `<span class="opt-detail">${it.detail}</span>` : ''}</button>`).join('');
  container.onclick = (e) => {
    const b = e.target.closest('[data-v]');
    if (!b || b.disabled) return;
    [...container.children].forEach((c) => c.classList.toggle('on', c === b));
    onPick(b.dataset.v);
  };
}

function landSummary(t) {
  const L = t.land;
  if (!L) return '<p class="muted">Not described.</p>';
  const shares = groupShares(L.ethnic);
  const bar = `<div class="groupbar">${shares.map((sh, i) => `<span style="width:${sh}%;background:${GROUP_COLOURS[i]}" title="${esc(L.groups[i])}">${sh >= 15 ? esc(L.groups[i]) : ''}${i === L.rulerGroup ? ' ★' : ''}</span>`).join('')}</div>`;
  const w = find(WEALTH, L.wealth);
  return `<h2>${esc(t.country?.name || t.name)}: land and people</h2>
    <div class="card flat stack" style="margin-top:10px">
      <div class="row spread"><span>People</span><b>${L.population} million</b></div>
      ${bar}
      <div class="small muted">${esc(find(ETHNIC, L.ethnic).text)} The ruler comes from the <b>${esc(L.groups[L.rulerGroup])}</b> (${shares[L.rulerGroup]}%).</div>
      <div class="row spread"><span>Faith</span><b>${esc(find(RELIGION, L.religion).label)}</b></div>
      <div class="row spread"><span>Where people live</span><b>${esc(find(URBAN, L.urban).label)}</b></div>
      <div class="row spread"><span>Wealth</span><b>${iconSVG(w.icon, 16)} ${esc(w.label)}</b></div>
      <div class="small muted">${esc(w.economy)}</div>
    </div>`;
}

function nice(n) {
  if (n < 20) return Math.max(1, Math.round(n));
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
  return Math.round(n / p) * p;
}
function articleType(label) {
  const named = { 'personal rule': 'a regime of personal rule', 'mixed rule': 'a regime of mixed rule' };
  const l = label.toLowerCase();
  return named[l] || (/^[aeiou]/.test(l) ? 'an ' : 'a ') + l;
}

function bindText(el, obj, key) {
  el.value = obj[key] || '';
  el.oninput = () => { obj[key] = el.value; if (obj._check) obj._check(); };
}

// Questions from a fixed list (the dilemma's own), with immediate feedback.
function quizList(el, qs, t, onAnswer = () => {}) {
  if (!el) return () => true;
  if (!quizzesOn(state)) { el.innerHTML = ''; return () => true; }
  const answers = (draft.quiz ||= {});
  for (const [k, v] of Object.entries(t?.quiz || {})) answers[k] = v;
  drawQuiz(el, qs, answers, (qid, a) => { send('quiz', { qid, answer: a }); onAnswer(); });
  return () => allAnswered(qs, answers);
}

function researchHTML(t, week) {
  const r = researchFor(t, week);
  if (!r) return '';
  return `<div class="card flat research" style="margin-top:14px"><div class="caps muted">Research a regime like yours</div>
    <p class="small" style="margin:4px 0 0"><b>${esc(r.name)}.</b> ${esc(r.text)} ${citeHTML(r.cite)}${r.cite2 ? ' ' + citeHTML(r.cite2) : ''}</p>
    <p class="small" style="margin:6px 0 0">${week === 1 ? 'Where did it come from? Who seized power, and by which road? Bring one fact to next week’s class.' : 'Look it up: what happened to it within ten years? Did it stay the same type of regime?'}</p></div>`;
}

// The dictator's dilemma, stage 1: the levers.
function dilemmaLevers(main, foot, t) {
  const d = (draft.dilemma ||= { repression: 1, loyalty: 0, watch: 'one', insure: 'none' });
  main.innerHTML = `<h2>Extra: the dictator’s dilemma</h2>
    <p class="muted">${esc(DILEMMA.intro)} ${citeHTML(DILEMMA.introCite)}</p>
    <div class="card flat"><b>${esc(DILEMMA.nero.head)}${/[?.!]$/.test(DILEMMA.nero.head) ? "" : "."}</b> <span class="small">${esc(DILEMMA.nero.text)} ${citeHTML(DILEMMA.nero.cite)}</span></div>
    <div id="dl-q1"></div>
    <h3 style="margin-top:18px">1. How hard do you repress?</h3><div class="options two" id="d-rep"></div>
    <h3 style="margin-top:16px">2. Do you buy loyalty?</h3><div class="options" id="d-loy"></div>
    <p class="small muted">${esc(DILEMMA.loyaltyWhy.text)} ${citeHTML(DILEMMA.loyaltyWhy.cite)} ${citeHTML(DILEMMA.loyaltyWhy.cite2)}</p>
    <div id="dl-q2"></div>
    <h3 style="margin-top:16px">3. Who watches the watchers?</h3><div class="options" id="d-watch"></div>
    <h3 style="margin-top:16px">4. What if it all goes wrong?</h3><div class="options" id="d-ins"></div>
    <p style="margin-top:12px">Treasury after this decree: <b id="d-tr"></b> of ${DECREE.treasuryStart}</p>`;
  const cost = () => DECREE.loyalty[d.loyalty].cost + (DILEMMA.watch.find((x) => x.value === d.watch).cost || 0) + (DILEMMA.insure.find((x) => x.value === d.insure).cost || 0);
  const tr = () => { $('#d-tr').textContent = DECREE.treasuryStart - cost(); };
  optionCards($('#d-rep'), DECREE.repression.map((o) => ({ value: String(o.value), title: o.label, detail: esc(o.detail) })), String(d.repression), (v) => { d.repression = +v; });
  optionCards($('#d-loy'), DECREE.loyalty.map((o) => ({ value: String(o.value), title: `${o.label} (cost ${o.cost})`, detail: esc(o.detail) })), String(d.loyalty), (v) => { d.loyalty = +v; tr(); });
  optionCards($('#d-watch'), DILEMMA.watch.map((o) => ({ value: o.value, title: `${o.label}${o.cost ? ` (cost ${o.cost})` : ''}`, detail: `${esc(o.detail)} ${citeHTML(o.cite)} ${citeHTML(o.cite2)}` })), d.watch, (v) => { d.watch = v; tr(); });
  optionCards($('#d-ins'), DILEMMA.insure.map((o) => ({ value: o.value, title: `${o.label}${o.cost ? ` (cost ${o.cost})` : ''}`, detail: `${esc(o.detail)} ${citeHTML(o.cite)}` })), d.insure, (v) => { d.insure = v; tr(); });
  tr();
  const q1 = quizList($('#dl-q1'), DILEMMA.quiz.filter((q) => q.part === 'nero'), t, () => check());
  const q2 = quizList($('#dl-q2'), DILEMMA.quiz.filter((q) => q.part === 'levers'), t, () => check());
  const check = () => { btn.disabled = !(q1() && q2()); };
  const btn = footButton(foot, 'Issue the decree', () => submit('dilemma', { stage: 'decree', ...d }));
  check();
}

// Stage 2: the dispatches, and one inspector.
function dilemmaDispatches(main, foot, t) {
  const d = t.decree;
  const pick = (draft.inspect ??= null);
  const provs = provincesFor(t.slot, t.country?.capitalAt);
  const vb = territoryViewBox(t.slot, 20);
  main.innerHTML = `<h2>Dispatches from the provinces</h2>
    <p class="muted">${esc(DILEMMA.dispatchIntro)}</p>
    <div class="map-wrap" style="aspect-ratio:${vb[2]}/${vb[3]};margin-bottom:12px">${mapSVG({ teams: [t], highlight: t.slot, dim: true, compact: true, labels: false, flags: false, viewBox: vb, provinces: { list: provs.map((p, i) => ({ cells: p.cells, fill: moodColour(d.provinces[i].reported) })) }, provinceLabels: provs.map((p, i) => ({ at: p.centre, text: String(i + 1) })) })}</div>
    <div class="stack">${d.provinces.map((p, i) => `<div class="dispatch"><div class="from">${i + 1} · ${esc(p.name)}</div>${esc(DECREE.moodText[p.reported])}</div>`).join('')}</div>
    <h3 style="margin-top:16px">Where do you send your inspector?</h3>
    <div class="options two" id="d-insp"></div>`;
  optionCards($('#d-insp'), [...d.provinces.map((p, i) => ({ value: String(i), title: `${i + 1} · ${p.name}` })), { value: 'none', title: 'Nowhere: I trust my officials' }], pick === null ? null : String(pick), (v) => { draft.inspect = v === 'none' ? 'none' : +v; btn.disabled = false; });
  const btn = footButton(foot, 'Send the inspector', () => submit('dilemma', { stage: 'inspect', inspect: draft.inspect === 'none' ? null : draft.inspect }), { disabled: pick === null });
}

// ---------- Steps ----------

const STEPS = {
  lobby: {
    form: (main) => {
      const t = me();
      main.innerHTML = `<div class="waiting"><div class="seal" style="color:${accent(t.slot)};border-color:${accent(t.slot)}">JOINED</div><h2>${esc(t.name)}</h2><p>Your territory: <b>${esc(TERRITORIES[t.slot].region)}</b></p><p class="muted">Wait for the main screen to begin.</p></div>`;
    },
  },

  found: {
    form: (main, foot, t) => {
      const d = (draft.found ||= { flag: randomFlag(), name: '', capital: '', motto: '', leader: '', capitalAt: null });
      const vb = territoryViewBox(t.slot, 25);
      main.innerHTML = `<h2>Found the state</h2>
        <div class="stack">
          <label class="field"><span>Name of the country</span><input type="text" id="f-name" maxlength="40" placeholder="e.g. The People’s Republic of …"></label>
          <label class="field"><span>The ruler’s name and title</span><input type="text" id="f-leader" maxlength="40" placeholder="e.g. Marshal-President Okono"></label>
          <label class="field"><span>Capital city</span><input type="text" id="f-capital" maxlength="32"></label>
          <div><div style="font-weight:600;font-size:.9rem;margin-bottom:4px">Tap your territory to place the capital</div>
            <div class="map-wrap pick" id="f-map" style="aspect-ratio:${vb[2]}/${vb[3]}"></div><div class="tiny muted" id="f-maphint"></div></div>
          <label class="field"><span>Motto</span><input type="text" id="f-motto" maxlength="60" placeholder="e.g. Order, Bread, Destiny"></label>
          <div class="card">
            <div class="row spread"><b>Flag</b><button class="btn btn-ghost small" id="f-rand">Surprise us</button></div>
            <div id="f-flag" style="margin:10px 0;text-align:center"></div>
            <div class="caps muted">Layout</div><div class="layouts" id="f-layouts" style="margin:6px 0 12px"></div>
            <div class="caps muted">Colours</div>
            <div id="f-cols" class="stack" style="margin:6px 0 12px"></div>
            <div class="caps muted">Emblem</div><div class="embs" id="f-emb" style="margin:6px 0"></div>
            <div class="swatches" id="f-ec" style="margin-top:6px"></div>
          </div>
        </div>`;
      const drawMap = () => {
        $('#f-map').innerHTML = mapSVG({ teams: [{ ...t, country: d.capitalAt ? { name: '', capital: d.capital || 'Capital', capitalAt: d.capitalAt, flag: d.flag } : null }], highlight: t.slot, dim: true, compact: true, labels: false, viewBox: vb });
      };
      const drawFlag = () => {
        $('#f-flag').innerHTML = flagSVG(d.flag, { width: 210 });
        $('#f-layouts').innerHTML = FLAG_LAYOUTS.map((l) => `<button data-l="${l.id}" class="${d.flag.layout === l.id ? 'on' : ''}" title="${esc(l.name)}">${flagSVG({ ...d.flag, layout: l.id, emblem: 'none' }, { width: 50 })}</button>`).join('');
        $('#f-cols').innerHTML = ['c1', 'c2', 'c3'].map((k, i) => `<div class="row"><span class="tiny muted" style="width:48px">Colour ${i + 1}</span><div class="swatches">${FLAG_COLOURS.map((c) => `<button class="swatch ${d.flag[k] === c.hex ? 'on' : ''}" data-k="${k}" data-c="${c.hex}" style="background:${c.hex}" title="${c.name}"></button>`).join('')}</div></div>`).join('');
        $('#f-emb').innerHTML = Object.entries(EMBLEMS).map(([k, e]) => `<button class="emb ${d.flag.emblem === k ? 'on' : ''}" data-e="${k}" title="${esc(e.name)}" aria-label="${esc(e.name)}">${k === 'none' ? '<span class="tiny">None</span>' : `<svg viewBox="-1.1 -1.1 2.2 2.2" width="30" height="30">${emblemMarkup(e, '', '#1d2433')}</svg>`}</button>`).join('');
        $('#f-ec').innerHTML = '<span class="tiny muted" style="align-self:center;margin-right:4px">Emblem colour</span>' + FLAG_COLOURS.map((c) => `<button class="swatch ${d.flag.ec === c.hex ? 'on' : ''}" data-ec="${c.hex}" style="background:${c.hex}" title="${c.name}"></button>`).join('');
        drawMap();
      };
      drawFlag();
      $('#f-layouts').onclick = (e) => { const b = e.target.closest('[data-l]'); if (b) { d.flag.layout = b.dataset.l; drawFlag(); } };
      $('#f-cols').onclick = (e) => { const b = e.target.closest('[data-k]'); if (b) { d.flag[b.dataset.k] = b.dataset.c; drawFlag(); } };
      $('#f-emb').onclick = (e) => { const b = e.target.closest('[data-e]'); if (b) { d.flag.emblem = b.dataset.e; drawFlag(); } };
      $('#f-ec').onclick = (e) => { const b = e.target.closest('[data-ec]'); if (b) { d.flag.ec = b.dataset.ec; drawFlag(); } };
      $('#f-rand').onclick = () => { d.flag = randomFlag(); drawFlag(); };
      $('#f-map').onclick = (e) => {
        const [x, y] = svgPoint($('svg', $('#f-map')), e);
        if (territoryAt(x, y) === t.slot) { d.capitalAt = [x, y]; $('#f-maphint').textContent = ''; drawMap(); check(); }
        else $('#f-maphint').textContent = 'That is outside your territory.';
      };
      const check = () => { btn.disabled = !(d.name.trim() && d.capital.trim() && d.capitalAt); };
      d._check = check;
      bindText($('#f-name'), d, 'name');
      bindText($('#f-leader'), d, 'leader');
      bindText($('#f-capital'), d, 'capital');
      bindText($('#f-motto'), d, 'motto');
      $('#f-capital').addEventListener('input', drawMap);
      const btn = footButton(foot, 'Found the state', () => submit('found', { name: d.name, capital: d.capital, motto: d.motto, leader: d.leader, capitalAt: d.capitalAt, flag: d.flag }));
      check();
    },
    after: (main, foot, t) => {
      main.innerHTML = `<div class="waiting">${flagSVG(t.country?.flag, { width: 180 })}<h2 style="margin-top:14px">${esc(t.country?.name)}</h2><p class="muted">Founded. Waiting for the other states and the reveal.</p></div>`;
      footButton(foot, 'Change our answer', () => { editing = true; lastKey = ''; render(); }, { cls: '' });
    },
    reveal: (main, foot, t) => {
      main.innerHTML = `<h2>Meridia is born</h2><div class="map-wrap" style="aspect-ratio:1000/640">${mapSVG({ teams: teamList(state), compact: true })}</div>
        ${solo ? '' : '<p class="muted" style="margin-top:10px">Look at the main screen.</p>'}`;
    },
  },

  land: {
    form: (main, foot, t) => {
      const d = (draft.land ||= { population: null, ethnic: null, groups: DEFAULT_GROUPS.slice(), rulerGroup: 0, religion: null, urban: null, wealth: null });
      main.innerHTML = `<h2>Land and people</h2><p class="muted">${esc(LAND_INTRO)}</p>
        <div class="caps muted" style="margin-top:14px">How many people?</div><div class="options two" id="l-pop"></div>
        <div class="caps muted" style="margin-top:16px">Who are they?</div><div class="options" id="l-eth"></div>
        <div id="l-groups"></div>
        <div class="caps muted" style="margin-top:16px">Faith</div><div class="options" id="l-rel"></div>
        <div class="caps muted" style="margin-top:16px">Where do people live?</div><div class="options" id="l-urb"></div>
        <div class="caps muted" style="margin-top:16px">Where does the money come from?</div><div class="options two" id="l-wealth"></div>`;
      const check = () => { btn.disabled = !(d.population && d.ethnic && d.religion && d.urban && d.wealth); };
      const groupsUI = () => {
        if (!d.ethnic) { $('#l-groups').innerHTML = ''; return; }
        const shares = groupShares(d.ethnic);
        $('#l-groups').innerHTML = `<div class="card flat" style="margin-top:10px"><div class="small" style="font-weight:600">Name your peoples, and tap the one the ruler comes from</div>
          <div class="stack" style="margin-top:8px">${shares.map((sh, i) => `<div class="row" style="gap:8px"><button type="button" class="grp ${d.rulerGroup === i ? 'on' : ''}" data-g="${i}" title="The ruler’s people" style="background:${GROUP_COLOURS[i]}">${d.rulerGroup === i ? '★' : ''}</button><input type="text" data-n="${i}" maxlength="20" value="${esc(d.groups[i])}" class="grow"><span class="small muted" style="width:44px;text-align:right">${sh}%</span></div>`).join('')}</div>
          <div class="tiny muted" style="margin-top:6px">★ marks the ruler’s own people.</div></div>`;
        $('#l-groups').onclick = (e) => { const b = e.target.closest('[data-g]'); if (b) { d.rulerGroup = +b.dataset.g; groupsUI(); } };
        $('#l-groups').oninput = (e) => { const i = e.target.dataset.n; if (i !== undefined) d.groups[+i] = e.target.value; };
      };
      optionCards($('#l-pop'), POPULATION.map((x) => ({ value: String(x.value), title: x.label, detail: esc(x.text) })), d.population ? String(d.population) : null, (v) => { d.population = +v; check(); });
      optionCards($('#l-eth'), ETHNIC.map((x) => ({ value: x.value, title: x.label, detail: esc(x.text) })), d.ethnic, (v) => {
        d.ethnic = v;
        if (v === 'minority' && d.rulerGroup === 0) d.rulerGroup = 1;
        if (d.rulerGroup >= groupShares(v).length) d.rulerGroup = 0;
        groupsUI(); check();
      });
      groupsUI();
      optionCards($('#l-rel'), RELIGION.map((x) => ({ value: x.value, title: x.label, detail: esc(x.text) })), d.religion, (v) => { d.religion = v; check(); });
      optionCards($('#l-urb'), URBAN.map((x) => ({ value: x.value, title: x.label, detail: esc(x.text) })), d.urban, (v) => { d.urban = v; check(); });
      optionCards($('#l-wealth'), WEALTH.map((x) => ({ value: x.value, title: `${iconSVG(x.icon, 18)} ${x.label}`, raw: true, detail: esc(x.text) })), d.wealth, (v) => { d.wealth = v; check(); });
      const btn = footButton(foot, 'Describe our state', () => submit('land', d));
      check();
    },
    after: (main, foot, t) => { main.innerHTML = landSummary(t) + '<p class="muted" style="margin-top:12px">Sent. Waiting for the other states.</p>'; },
    reveal: (main, foot, t) => { main.innerHTML = landSummary(t); },
  },

  rulers: {
    form: (main, foot) => {
      const d = (draft.rulers ||= { claim: [], chooser: null, remove: null, careers: null, elections: null, just: {} });
      main.innerHTML = `<h2>Who rules?</h2>
        <div id="r-quiz"></div>
        <p class="muted" style="margin-top:14px">What kind of regime do you say you run? Pick one, or combine two (for example, personal rule that also holds elections).</p>
        <div class="options" id="r-claim"></div>
        <h3 style="margin-top:20px">Now four questions about how it really works</h3>
        ${RULER_QUESTIONS.map((q) => `<p style="margin:14px 0 6px;font-weight:600">${esc(q.text)}</p><div class="options ${q.options.length === 4 && q.id !== 'elections' ? 'two' : ''}" id="r-${q.id}"></div>`).join('')}
        <h3 style="margin-top:22px">Explain your regime</h3>
        <p class="small muted">${esc(JUSTIFY_HINT)}</p>
        ${JUSTIFY.map((j) => `<label class="field" style="margin-top:12px"><span>${esc(j.q)}</span><textarea id="j-${j.id}" maxlength="200" placeholder="${esc(j.starter)}"></textarea></label>`).join('')}`;
      const drawClaim = () => {
        $('#r-claim').innerHTML = CLAIM_OPTIONS.map((k) => `<button type="button" class="opt ${d.claim.includes(k) ? 'on' : ''}" data-v="${k}"><span class="opt-title">${esc(REGIME_TYPES[k].label)}${d.claim.includes(k) && d.claim.length > 1 ? ` <span class="tiny">(${d.claim.indexOf(k) + 1} of 2)</span>` : ''}</span><span class="opt-detail">${esc(REGIME_TYPES[k].claim)}</span></button>`).join('');
      };
      drawClaim();
      $('#r-claim').onclick = (e) => {
        const b = e.target.closest('[data-v]'); if (!b) return;
        const k = b.dataset.v;
        if (d.claim.includes(k)) d.claim = d.claim.filter((x) => x !== k);
        else d.claim = [...d.claim, k].slice(-MAX_CLAIMS);
        drawClaim(); check();
      };
      for (const q of RULER_QUESTIONS) optionCards($(`#r-${q.id}`), q.options.map((o) => ({ value: o.value, title: o.label })), d[q.id], (v) => { d[q.id] = v; check(); });
      const quizDone = quizBox($('#r-quiz'), 'rulers', 'before', me(), () => check());
      const check = () => { btn.disabled = !(quizDone() && d.claim.length && d.chooser && d.remove && d.careers && d.elections && JUSTIFY.every((j) => (d.just[j.id] || '').trim().length >= 8)); };
      d._check = check;
      for (const j of JUSTIFY) bindText($(`#j-${j.id}`), d.just, j.id);
      d.just._check = check;
      const btn = footButton(foot, 'Declare our regime', () => submit('rulers', d));
      check();
    },
    after: (main, foot, t) => {
      main.innerHTML = `<div class="waiting" style="padding-bottom:0"><div class="seal">SENT</div><h2>Your regime is declared</h2><p class="muted">While you wait for the reveal: one question about your own regime.</p></div><div id="r-after"></div>`;
      quizBox($('#r-after'), 'rulers', 'after', t);
      if (state.phase === 'open') footButton(foot, 'Change our answer', () => { editing = true; lastKey = ''; render(); }, { cls: '' });
    },
    reveal: (main, foot, t) => {
      const r = t.rulers;
      if (!r) { main.innerHTML = '<p class="muted">You did not answer this step.</p>'; return; }
      const c = compareClaim(r);
      const T = REGIME_TYPES[c.type];
      const ex = CLASSIFY_EXPLANATIONS[r.classified.reason];
      const layer = ELECTORAL_LAYERS[r.classified.elections] || ELECTORAL_LAYERS.none;
      main.innerHTML = `${heroHTML(c.type, { kicker: 'By Geddes’s test, your regime is', sub: `${esc(ex.text)} ${citeHTML(ex.cite)}` })}
        <div class="verdict ${c.ok ? 'ok' : c.exact ? 'part' : 'no'}">${c.ok ? '✓ Your label matches' : c.exact ? (c.hasElect ? '◐ Right type, but you missed the elections' : '◐ Right type, but there are no real multiparty elections') : '✗ Your label does not match'}</div>
        <div class="card stack">
          <div>You said ${claimPills(c.claim, c)}</div>
          <div>Geddes would say ${resultPills(r.classified)}</div>
          ${!c.exact ? `<p class="small">${esc(MISMATCH_NOTE.text)} ${citeHTML(MISMATCH_NOTE.cite)}</p>` : ''}
          ${!c.electoralOk ? `<p class="small">${esc(ELECTORAL_MISMATCH[c.hasElect ? 'missed' : 'claimedWithout'].text)} ${citeHTML(ELECTORAL_MISMATCH[c.hasElect ? 'missed' : 'claimedWithout'].cite)}</p>` : ''}
        </div>
        <div class="card stack" style="margin-top:12px">
          <h3>${esc(T.label)}</h3>
          <p class="small">${esc(T.definition)} ${citeHTML(T.cite)}</p>
          ${T.years ? `<p class="small">Regimes like yours lasted <b>${T.years} years</b> on average ${citeHTML(T.yearsCite)}, and ${T.surviving} were still in power in 1998 ${citeHTML(T.survivingCite)}.</p>` : ''}
          <p class="small"><b>What holds it together.</b> ${esc(T.strength)} ${citeHTML(T.strengthCite)}</p>
          <p class="small"><b>Where it is weak.</b> ${esc(T.weakness)} ${citeHTML(T.weaknessCite)}</p>
        </div>
        <div class="card stack" style="margin-top:12px">
          <h3>Elections: ${esc(layer.label || 'none')}</h3>
          <p class="small">${esc(layer.text)} ${citeHTML(layer.cite)}</p>
          ${c.hasElect ? `<p class="small"><b>Why hold them?</b> ${esc(REGIME_TYPES.electoral.strength)} ${citeHTML(REGIME_TYPES.electoral.strengthCite)}</p><p class="small"><b>The risk.</b> ${esc(REGIME_TYPES.electoral.weakness)} ${citeHTML(REGIME_TYPES.electoral.weaknessCite)}</p>` : ''}
        </div><div id="r-after"></div>`;
      quizBox($('#r-after'), 'rulers', 'after', t);
    },
  },

  selectorate: {
    form: (main, foot, t) => {
      const ctx = selectorateContext(t);
      const rg = selectorateRanges(ctx);
      const d = (draft.sel ||= { quiz: [-1, -1, -1], v: [500, 500, 500], stacked: null });
      const T = REGIME_TYPES[ctx.type];
      const layer = ELECTORAL_LAYERS[ctx.elections];
      const keys = ['nominal', 'real', 'coalition'];
      const qon = quizzesOn(state);
      const qd = (i) => !qon || d.quiz[i] >= 0;
      const allq = () => [0, 1, 2].every(qd);
      const val = (i) => {
        const [lo, hi] = keys.map((k) => rg[k])[i];
        let n = lo * Math.pow(hi / lo, d.v[i] / 1000);
        if (i > 0) n = Math.min(n, cur(i - 1));
        return nice(n);
      };
      const cur = (i) => val(i);
      main.innerHTML = `<h2>Who counts?</h2>
        <p class="muted">No one rules alone. Work out who has a say in choosing your leader, in three steps.${qon ? ' Each step starts with a question on the theory.' : ''}</p>
        <div class="card flat small" style="background:var(--paper)">So far: <b>${esc(t.country?.name || t.name)}</b> has ${fmt(ctx.adults)} adults (${ctx.pop} million people). By Geddes’s test it is <b>${esc(T.label.toLowerCase())}</b>, and it holds <b>${esc(ELECTIONS_PHRASE[ctx.elections] || 'no national elections')}</b>. Those choices set the range of each answer below.</div>
        <div id="s-stages"></div>
        <div id="s-stack"></div>
        <div id="s-result"></div>`;
      const stageHTML = (i) => {
        const term = SELECTORATE.terms[i];
        const q = term.quiz;
        const answered = qd(i);
        const [lo, hi, why] = rg[keys[i]];
        const reason = i === 0 && rg.voting ? `${esc(ELECTION_NOMINAL.text)} ${citeHTML(ELECTION_NOMINAL.cite)}` : `As ${articleType(T.label)}, your ${esc(term.label.toLowerCase())} is ${esc(why)}: between ${fmt(lo)} and ${fmt(hi)} people.${i === 1 ? ` ${esc(rg.example)} ${citeHTML(rg.cite)}` : ''}`;
        return `<div class="card" style="margin-top:12px" id="stage-${i}">
          <div class="caps muted">Step ${i + 1} of 3 · the “${esc(term.nick)}”</div>
          <h3 style="margin:4px 0 8px">${esc(term.label)}</h3>
          ${qon ? `<p style="font-weight:600;margin:0 0 6px">${esc(q.q)}</p>
          <div class="options" id="q-${i}"></div>` : `<p class="small" style="margin:0 0 6px">${esc(term.gloss)} ${citeHTML(term.cite)}</p>`}
          ${answered ? `${qon ? `<p class="small" style="margin-top:8px">${d.quiz[i] === q.answer ? '<b style="color:var(--ok)">Right.</b>' : `<b style="color:var(--warn)">Not quite.</b> The answer is: ${esc(q.options[q.answer].toLowerCase())}.`} ${esc(q.explain)} ${citeHTML(q.cite)}</p>` : ''}
            <div class="small" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)">${reason}</div>
            <div class="row spread" style="margin-top:10px"><b>How many?</b><b id="v-${i}"></b></div>
            <input type="range" min="0" max="1000" step="1" id="s-${i}" value="${d.v[i]}">
            <div class="small" id="m-${i}" style="margin-top:4px"></div>` : ''}
        </div>`;
      };
      const drawStages = () => {
        const n = qon ? Math.min(3, d.quiz.filter((x) => x >= 0).length + 1) : 3;
        $('#s-stages').innerHTML = [0, 1, 2].slice(0, n).map(stageHTML).join('');
        [0, 1, 2].slice(0, n).forEach((i) => {
          const q = SELECTORATE.terms[i].quiz;
          const box = $(`#q-${i}`);
          if (!box) { /* quizzes off */ } else if (d.quiz[i] >= 0) {
            box.innerHTML = q.options.map((o, j) => `<div class="opt ${j === q.answer ? 'right' : j === d.quiz[i] ? 'wrong' : ''}"><span class="opt-title">${esc(o)}</span></div>`).join('');
          } else {
            optionCards(box, q.options.map((o, j) => ({ value: String(j), title: o })), null, (v) => { d.quiz[i] = +v; drawStages(); drawRest(); });
          }
          const sl = $(`#s-${i}`);
          if (sl) sl.oninput = () => { d.v[i] = +sl.value; update(); };
        });
        update();
      };
      const drawRest = () => {
        const done = allq();
        if (done && t.land) {
          const g = t.land.groups[t.land.rulerGroup];
          $('#s-stack').innerHTML = `<div class="card" style="margin-top:12px"><h3 style="margin:0 0 8px">Where do the essentials come from?</h3><div class="options" id="s-st"></div></div>`;
          optionCards($('#s-st'), [{ value: 'yes', title: `Mostly the ruler’s own people, the ${g}` }, { value: 'no', title: 'From several of the country’s peoples' }], d.stacked === null ? null : d.stacked ? 'yes' : 'no', (v) => { d.stacked = v === 'yes'; update(); });
        } else $('#s-stack').innerHTML = '';
        check();
      };
      const update = () => {
        const n = [0, 1, 2].map((i) => val(i));
        [0, 1, 2].forEach((i) => {
          if (!$(`#v-${i}`)) return;
          $(`#v-${i}`).textContent = fmt(n[i]);
          const R = rung(n[i], ctx.adults);
          $(`#m-${i}`).innerHTML = `<b>${esc(R.label)}.</b> ${esc(R.text)}${i > 0 && n[i] >= n[i - 1] ? ' <span style="color:var(--warn)">(It cannot be larger than the circle before.)</span>' : ''}`;
        });
        const done = allq();
        if (!done) { $('#s-result').innerHTML = ''; check(); return; }
        const r = selectorateModel({ nominal: n[0], real: n[1], coalition: n[2], stacked: !!d.stacked }, ctx);
        const nc = nestedCircles(r, ctx.adults, 170, t.land);
        const an = selectorateAnalysis(r, ctx, t);
        $('#s-result').innerHTML = `<div class="card" style="margin-top:14px">
          <h3 style="margin:0 0 6px">Your state, in circles</h3>
          <div class="row wrap" style="align-items:center;justify-content:center;gap:18px"><div>${nc.svg}</div><div class="grow small" style="min-width:210px">${nc.legend}</div></div>
          <p class="tiny muted" style="text-align:center;margin:6px 0 0">Drawn to scale: area is people. Small circles are enlarged so you can see them.</p>
          <h3 style="margin:16px 0 4px">What the numbers mean</h3>${ladderSVG(r, ctx.adults)}
          <h3 style="margin:16px 0 4px">Loyal or shaky?</h3>
          <div class="stack">${an.map((a) => `<div class="small"><b>${esc(a.head)}${/[?.!]$/.test(a.head) ? "" : "."}</b> ${esc(a.text)} ${citeHTML(a.cite)}</div>`).join('')}</div>
          <p class="tiny muted" style="margin:10px 0 0">${esc(SELECTORATE.modelNote)}</p></div>`;
        check();
      };
      const check = () => { if (btn) btn.disabled = !(allq() && (!t.land || d.stacked !== null)); };
      let btn = null;
      drawStages(); drawRest();
      btn = footButton(foot, 'Set the coalition', () => {
        const n = [0, 1, 2].map((i) => val(i));
        submit('selectorate', { nominal: n[0], real: n[1], coalition: n[2], stacked: !!d.stacked, quiz: d.quiz });
      });
      check();
    },
    reveal: (main, foot, t) => {
      const sel = t.selectorate;
      if (!sel) { main.innerHTML = '<p class="muted">You did not answer this step.</p>'; return; }
      const r = sel.result, ctx = sel.ctx;
      const nc = nestedCircles(r, ctx.adults, 200, t.land);
      main.innerHTML = `<h2>Who counts in ${esc(t.country?.name || t.name)}</h2>
        ${quizzesOn(state) ? `<p class="small muted">Theory questions: ${sel.quizCorrect} of 3 right.</p>` : ''}
        <div class="big-figure" style="margin-bottom:12px"><b>${esc(rung(r.coalition, ctx.adults).label)}</b><span>hold power: ${esc(rung(r.coalition, ctx.adults).text.toLowerCase())}</span></div>
        <div class="card"><div class="row wrap" style="align-items:center;justify-content:center;gap:18px"><div>${nc.svg}</div><div class="grow small" style="min-width:210px">${nc.legend}</div></div></div>
        <div class="card" style="margin-top:12px"><h3 style="margin:0 0 4px">What the numbers mean</h3>${ladderSVG(r, ctx.adults)}</div>
        <div class="card stack" style="margin-top:12px"><h3 style="margin:0">Loyal or shaky?</h3>${selectorateAnalysis(r, ctx, t).map((a) => `<div class="small"><b>${esc(a.head)}${/[?.!]$/.test(a.head) ? "" : "."}</b> ${esc(a.text)} ${citeHTML(a.cite)}</div>`).join('')}</div>
        <div class="stack" style="margin-top:12px">${SELECTORATE.rules.map((x) => `<div class="small"><b>Rule ${x.n}.</b> ${esc(x.text)} ${citeHTML(x.cite)}</div>`).join('')}</div>`;
    },
  },

  oldorder: {
    form: (main, foot, t) => {
      const d = (draft.oldorder ||= { order: null, memory: '' });
      main.innerHTML = `<h2>What came before?</h2>
        <div id="o-quiz"></div>
        <p class="muted" style="margin-top:14px">${esc(OLD_ORDER_INTRO)}</p>
        <div class="options" id="o-opts"></div>
        <label class="field" style="margin-top:14px"><span>One thing people still remember about it (optional)</span><textarea id="o-mem" maxlength="160" placeholder="e.g. The old king’s statue still stands in the square."></textarea></label>`;
      optionCards($('#o-opts'), Object.entries(OLD_ORDERS).map(([k, o]) => ({ value: k, title: o.label })), d.order, (v) => { d.order = v; check(); });
      bindText($('#o-mem'), d, 'memory');
      const quizDone = quizBox($('#o-quiz'), 'oldorder', 'before', t, () => check());
      const check = () => { btn.disabled = !(d.order && quizDone()); };
      const btn = footButton(foot, 'This is our past', () => submit('oldorder', d));
      check();
    },
    after: (main, foot, t) => {
      const O = OLD_ORDERS[t.oldOrder?.order];
      main.innerHTML = `<h2>What came before</h2>${O ? `<div class="card"><h3 style="margin:0 0 4px">${esc(O.label)}</h3><p class="small" style="margin:0">${esc(O.text)} ${citeHTML(O.cite)}</p></div>` : ''}
        ${storyHTML(storyFor('oldorder', t))}
        ${t.oldOrder?.memory ? `<div class="quote" style="margin-top:12px">${esc(t.oldOrder.memory)}</div>` : ''}
        <p class="small muted" style="margin-top:12px">Next week you work out how your rulers got from there to here.</p>`;
      if (state.phase === 'open') footButton(foot, 'Change our answer', () => { editing = true; lastKey = ''; render(); }, { cls: '' });
    },
  },

  dilemma: {
    form: (main, foot, t) => {
      if (!t.decree) dilemmaLevers(main, foot, t);
      else dilemmaDispatches(main, foot, t);
    },
    after: (main, foot, t) => {
      const d = t.decree;
      main.innerHTML = `<div class="waiting"><div class="seal">SENT</div><h2>${d && d.inspected !== null ? `Your inspector is in ${esc(d.provinces[d.inspected].name)}` : 'You trusted the reports'}</h2><p class="muted">Wait for the reveal to see what was really happening.</p></div>`;
    },
    reveal: (main, foot, t) => {
      const d = t.decree;
      if (!d || d.detected === null) { main.innerHTML = '<p class="muted">You did not finish the decree.</p>'; return; }
      main.innerHTML = `<h2>What was really happening</h2>
        <div class="verdict ${d.detected ? 'ok' : 'no'}">${d.detected ? '✓ The plot was caught in time' : '✗ The plot struck the palace'}</div>
        <div class="big-figure"><b>${d.information}%</b><span>of what reached the palace was true ${citeHTML(DECREE.cites.mobutu)}</span></div>
        ${deltaHTML({ stability: d.stabilityChange, treasury: -d.cost })}
        <div class="stack" style="margin-top:12px">${d.provinces.map((p, i) => `<div class="dispatch"><div class="from">${esc(p.name)}${p.plot ? ' · <span style="color:var(--accent)">PLOT</span>' : ''}${d.inspected === i ? ' · inspector' : ''}</div>
          <div class="small">Reported: ${esc(DECREE.moodText[p.reported])}</div><div class="small"><b>Truth: ${esc(DECREE.moodText[p.mood])}</b></div></div>`).join('')}</div>
        <div class="card" style="margin-top:12px">${d.notes.map((n) => `<p class="small">${esc(n.text)}</p>`).join('')}
          <h3 style="margin:12px 0 4px">What each choice did</h3>${decreeDetail(d, { table: false })}</div>
        <div style="margin-top:12px">${meters(t.meters)}</div>
        <h2 style="margin-top:20px">What Wintrobe says</h2>
        ${DILEMMA.lessons.map((l, i) => `<div class="lesson"><div class="n">${i + 1}</div><div><b>${esc(l.head)}${/[?.!]$/.test(l.head) ? "" : "."}</b> ${esc(l.text)} ${citeHTML(l.cite)}</div></div>`).join('')}
        <div id="dl-q3"></div>`;
      quizList($('#dl-q3'), DILEMMA.quiz.filter((q) => q.part === 'reveal'), t);
    },
  },

  charter: {
    form: (main, foot, t) => {
      const d = (draft.charter ||= { puzzle: null, text: '' });
      const withPuzzle = quizzesOn(state);
      main.innerHTML = `${charterHTML(t)}
        <div class="row" style="margin-top:12px"><button class="btn" id="c-png">Download image</button><button class="btn" id="c-print">Print or save PDF</button></div>
        ${withPuzzle ? `<div class="card" style="margin-top:18px">
          <h3 style="margin:0 0 6px">Before you sign: solve one puzzle</h3>
          <p class="small muted">Each puzzle has an answer in the readings. Pick one as a team.</p>
          <div class="options" id="c-puz"></div>
          <div id="c-hint"></div>
          <label class="field" style="margin-top:12px"><span>Your answer, in one or two sentences</span><textarea id="c-text" maxlength="320" placeholder="Because …, as … argue(s) on p. …"></textarea></label>
        </div>
        ${researchHTML(t, 1)}` : ''}`;
      if (withPuzzle) {
        optionCards($('#c-puz'), PUZZLES.week1.map((p) => ({ value: p.value, title: p.label, detail: esc(p.q) })), d.puzzle, (v) => { d.puzzle = v; hint(); check(); });
        const hint = () => { const P = PUZZLES.week1.find((p) => p.value === d.puzzle); $('#c-hint').innerHTML = P ? `<p class="small" style="margin-top:10px"><b>A clue.</b> ${esc(P.hint)} ${citeHTML(P.cite)} ${citeHTML(P.cite2)}</p>` : ''; };
        hint();
        bindText($('#c-text'), d, 'text');
      }
      $('#c-png').onclick = () => downloadCharterPNG(t, teamList(state));
      $('#c-print').onclick = () => window.print();
      const check = () => { btn.disabled = withPuzzle && !(d.puzzle && d.text.trim().length >= 12); };
      d._check = check;
      const btn = footButton(foot, 'Sign the charter', () => submit('charter', d));
      check();
    },
    after: (main, foot, t) => {
      const P = PUZZLES.week1.find((p) => p.value === t.puzzle1?.id);
      const revealed = state.phase === 'reveal';
      main.innerHTML = `${charterHTML(t)}
        <div class="row" style="margin-top:12px"><button class="btn" id="c-png">Download image</button><button class="btn" id="c-print">Print or save PDF</button></div>
        ${P && t.puzzle1.text ? `<div class="card" style="margin-top:14px"><div class="caps muted">Your puzzle: ${esc(P.label)}</div><p class="small" style="font-weight:600">${esc(P.q)}</p><div class="quote">${esc(t.puzzle1.text)}</div>
          ${revealed ? `<p class="small" style="margin-top:10px"><b>What the readings suggest.</b> ${esc(P.answer)} ${citeHTML(P.cite)} ${citeHTML(P.cite2)}</p>` : ''}</div>` : ''}
        <p class="muted" style="margin-top:12px">Signed. Keep this charter: next week you rebuild this regime from the moment power was seized, and see whether you end up in the same place.</p>
        <h2 style="margin-top:22px">Your state, Year One</h2>
        ${profileHTML(t)}
        ${revealed ? `<h2 style="margin-top:22px">Three lessons from Week 1</h2>${LESSONS.map((l, i) => `<div class="lesson"><div class="n">${i + 1}</div><div><b>${esc(l.head)}${/[?.!]$/.test(l.head) ? "" : "."}</b> ${esc(l.text)} ${citeHTML(l.cite)}</div></div>`).join('')}` : ''}
        ${!quizzesOn(state) ? researchHTML(t, 1) : ''}`;
      $('#c-png').onclick = () => downloadCharterPNG(t, teamList(state));
      $('#c-print').onclick = () => window.print();
    },
  },
};
STEPS.charter.reveal = STEPS.charter.after;
const changeAnswer = (foot) => { if (state.phase === 'open') footButton(foot, 'Change our answer', () => { editing = true; lastKey = ''; render(); }, { cls: '' }); };
Object.assign(STEPS, week2Steps({ $, draft, submit, footButton, optionCards, bindText, quizBox, researchHTML, getState: () => state, changeAnswer }));
for (const id of ['crisis', 'seizure', 'organisation', 'route', 'morning', 'become', 'whatif', 'dossier', 'oldorder']) if (STEPS[id].after && !STEPS[id].reveal) STEPS[id].reveal = STEPS[id].after;
STEPS.rejoin.after = (main, foot, t) => { STEPS.rejoin.form(main, foot, t); foot.innerHTML = '<div class="inner"><p class="muted small" style="margin:0">Ready. Waiting for the main screen.</p></div>'; };
STEPS.lobby.after = STEPS.lobby.form;
