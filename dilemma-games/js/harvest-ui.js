// The Harvest Report: projector, phone and leader-sheet screens (redesign, 2026-11-25).
// All text is a draft for Jamie. Rules and numbers are unchanged: see js/harvest.js.
import * as E from './harvest.js';
import { esc, stepper, explain, plural } from './ui.js';
import { icon, villageTile, chairmanScene } from './art.js';

export { E };
export const TITLE = 'The Harvest Report';
export const newState = (code) => E.newGame(code);

const word = (k) => ({ 2: 'two', 3: 'three' }[k] || k);
const cap = (x) => String(x).charAt(0).toUpperCase() + String(x).slice(1);
const list = (ns) => (ns && ns.length ? ns.map((n) => `<span class="chip">${n}</span>`).join(' ') : '<span class="muted">none</span>');
const big = (label, value, cls = '') => `<div class="stat ${cls}"><div class="caps">${label}</div><div class="num">${value}</div></div>`;
const chairman = (t, more = '') => `<div class="explain"><div class="exart">${chairmanScene()}</div><div><div class="caps">The Chairman announces</div><p class="say">“${t}”</p>${more}</div></div>`;

const ROUNDS = [
  { key: 'r1', label: 'The first harvest' }, { key: 'r2', label: 'The quota' }, { key: 'r3', label: 'Procurement' },
  { key: 'r4a', label: 'Inspectors' }, { key: 'r4b', label: 'The premium' }, { key: 'end', label: 'Who kept what' },
];
const roundOf = (ph) => (ph === 'lobby' ? null : ph.startsWith('r1') ? 'r1' : ph.startsWith('r2') ? 'r2' : ph.startsWith('r3') ? 'r3'
  : ph === 'r4_brief' || ph.startsWith('r4a') ? 'r4a' : ph.startsWith('r4b') ? 'r4b' : 'end');
const ROUND = (ph) => {
  const r = roundOf(ph);
  if (!r) return 'Set-up';
  if (r === 'end') return 'The end';
  return `Round ${r.slice(1)}: ${ROUNDS.find((x) => x.key === r).label}`;
};
// Later rounds stay hidden: the class must not see procurement or inspectors coming.
const roundSteps = (rd) => { const i = ROUNDS.findIndex((x) => x.key === rd); return ROUNDS.map((x, j) => (j > i ? { ...x, label: '?' } : x)); };

const NEXT = {
  lobby: 'Start: deal the harvest', r1: 'Close reports', r1_done: 'Announce the quota', r2_brief: 'Open reports',
  r2: 'Close reports and apply the quota', r2_done: 'Next round', r3_done: 'Next round', r4_brief: 'Open reports',
  r4a: 'Close reports', r4a_check: 'Close checks and reveal', r4a_done: 'Round 4b: the premium', r4b_poll: 'Close the poll and open reports',
  r4b: 'Close reports', r4b_check: 'Close checks', r4b_chair: 'Reveal', r4b_done: 'Final grain',
};

export const GLOSS = [
  ['Your harvest', 'The grain your province really grew this year, from 1 to 9 sacks. Only you can see it.'],
  ['Your report', 'The number you tell the Chairman. It can be true or not. The Chairman sees only reports.'],
  ['The Plan', 'The state\'s targets. Provinces that fall short are punished; those that beat them are rewarded.'],
  ['Re-education', 'Punishment for the provinces reporting least: you lose 2 sacks.'],
  ['Promotion', 'Reward for the provinces reporting most: you gain 2 sacks.'],
  ['Your score', 'The grain you keep, over all the harvests. Most grain wins.'],
];

// ---------- village tiles ----------
function tiles(v, mode) {
  const set = (arr) => new Set(arr || []);
  let low, high, famine, caught, checked;
  const R = mode === 'r2' ? v.r2 : mode === 'r4a' ? v.r4a : mode === 'r4b' ? v.r4b : null;
  if (R) { low = set(R.low); high = set(R.high); caught = set(R.caught); checked = set(R.checked); }
  if (mode === 'r3') { low = set(v.r2.low); high = set(v.r2.high); famine = set(v.r3.famine); }
  const inn = mode && mode.startsWith('sub:') ? set(v.submitted[mode.slice(4)]) : null;
  const chk = mode === 'check' ? set(v.phase === 'r4a_check' ? v.checksIn.r4a : v.checksIn.r4b) : null;
  return `<div class="vgrid">${v.provinces.map((p) => {
    const n = p.n; let st = '', note = p.paper ? 'paper' : '';
    if (inn) {
      const auto = p.inspector && mode.slice(4).startsWith('r4');
      st = auto ? 'insp' : inn.has(n) ? 'in' : 'wait'; note = auto ? 'inspector' : inn.has(n) ? 'reported' : p.paper ? 'paper' : 'waiting';
    } else if (chk) { st = p.inspector ? (chk.has(n) ? 'in' : 'insp') : 'wait'; note = p.inspector ? (chk.has(n) ? 'chosen' : 'choosing') : ''; }
    else if (famine && famine.has(n)) { st = 'famine'; note = 'famine'; }
    else if (caught && caught.has(n)) { st = 'caught'; note = 'caught lying'; }
    else if (low && low.has(n)) { st = 'low'; note = 're-educated'; }
    else if (high && high.has(n)) { st = 'high'; note = 'promoted'; }
    else if (mode === 'r4b' && v.premium && checked.has(n)) { st = 'premium'; note = 'premium'; }
    else if (p.inspector && (mode === 'r4a' || mode === 'r4b')) { st = 'insp'; note = 'inspector'; }
    return villageTile(n, st, note);
  }).join('')}</div>`;
}
const tileKey = (items) => `<div class="vkey">${items.map(([c, t]) => `<span><i style="border-color:${c}"></i>${t}</span>`).join('')}</div>`;
const KEY = { low: ['var(--accent)', 're-educated (−2)'], high: ['var(--gold)', 'promoted (+2)'], famine: ['var(--ink)', 'famine: could not pay'], insp: ['#2f6690', 'inspector'], caught: ['var(--accent)', 'caught lying'], premium: ['var(--ok)', 'premium paid'] };

function waiting(v, round) {
  if (round === 'check') {
    const n = (v.phase === 'r4a_check' ? v.checksIn.r4a : v.checksIn.r4b).length;
    return `${n} of ${v.inspectors.length} inspectors have chosen`;
  }
  const eligible = v.provinces.filter((p) => !(p.inspector && round.startsWith('r4'))).length;
  const got = (v.submitted[round] || []).filter((n) => !(round.startsWith('r4') && v.inspectors.includes(n))).length;
  return `${got} of ${eligible} reports in`;
}

function quotaBlock(r, k) {
  const tie = (t, what) => (t ? `<p class="small">Provinces ${t.tied.join(', ')} tied at ${t.value} on the ${what} line. The lot fell on ${t.chosen.join(', ')}. <em>“The Plan does not distinguish between you. Fate will.”</em></p>` : '');
  return `<div class="row2">
    <div class="card bad"><div class="caps">${icon('down')} Re-educated: lose 2 sacks</div><div class="chips">${list(r.low)}</div>${r.caught && r.caught.length ? `<p class="small">Caught lying by an inspector: ${r.caught.join(', ')}</p>` : ''}${tie(r.tieLow, 'lowest')}</div>
    <div class="card good"><div class="caps">${icon('up')} Promoted: gain 2 sacks</div><div class="chips">${list(r.high)}</div>${tie(r.tieHigh, 'highest')}</div>
  </div><p class="muted small">${cap(word(k))} each way with ${k === 3 ? '14 or more' : 'fewer than 14'} provinces${r.caught && r.caught.length > k ? '; every caught liar is re-educated, even beyond that' : ''}.</p>`;
}

function bars(rows) {
  const max = Math.max(...rows.flatMap((r) => [r.rep, r.tru]), 1);
  return `<div class="bars">${rows.map((r) => `<div class="barrow"><div class="lab">${esc(r.label)}</div>
    <div class="barpair"><div class="bar rep" style="width:${(100 * r.rep) / max}%"><span>${r.rep} reported</span></div>
    ${r.tru == null ? '' : `<div class="bar tru" style="width:${(100 * r.tru) / max}%"><span>${r.tru} really grown</span></div>`}</div></div>`).join('')}</div>`;
}

// ---------- projector ----------
export function hostView(v, ctx) {
  const ph = v.phase, rd = roundOf(ph);
  const top = rd ? stepper(roundSteps(rd), rd) : '';
  let main = '';
  if (ph === 'lobby') {
    main = `<div class="split"><div>
      ${explain({ title: 'A people\'s republic, and its Plan', what: 'Every student is a numbered village. Each one has a secret harvest. The Chairman needs to know how much grain the country has grown, so he asks. What you report, and what happens next, depends on what is at stake.', art: chairmanScene() })}
      <dl class="glossary">${GLOSS.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
    </div><div>${ctx.joinPanel || ''}
      <h2>Villages joined: ${v.n}</h2>
      <p class="muted">Each phone becomes a numbered village. Never use names: no student is singled out.</p>
      <div class="vgrid">${v.provinces.map((p) => `<button class="vbtn" data-cmd="remove" data-n="${p.n}" title="Remove village ${p.n}">${villageTile(p.n, 'in', p.paper ? 'paper' : 'joined')}</button>`).join('') || '<p class="muted">Waiting for phones…</p>'}</div>
      ${ctx.joinPanel ? `<div class="card flat"><div class="caps">No phone? Paper villages</div>
        <p class="small">Add villages that play on paper. Their cards appear in the leader's sheet (Menu → Leader's sheet), where you type their reports from slips. Inspectors are drawn from phones only.</p>
        <div class="rowc"><button class="btn" data-cmd="paper" data-count="1">Add 1</button><button class="btn" data-cmd="paper" data-count="5">Add 5</button></div></div>` : ''}
      <p class="muted small">At least ${E.MIN_PROVINCES} villages. With 14 or more, three are re-educated and three promoted each round; below 14, two.</p></div></div>`;
  } else if (ph === 'r1') {
    main = chairman('Comrades, the Plan needs to know the harvest. Enter your harvest on your phone. Nothing depends on it.', `<p class="small">Each village has been dealt a secret harvest of 1 to 9 sacks. Report it however you like.</p>`) + tiles(v, 'sub:r1') + `<p class="status">${waiting(v, 'r1')}</p>`;
  } else if (ph === 'r1_done') {
    main = explain({ title: 'Round 1: what the villages reported', what: 'Nothing depended on these reports. Usually the total is close to the truth: 5 sacks a village on average.' })
      + `<div class="stats">${big('Reported total', v.r1.total)}${big('Villages', v.r1.count)}${big('Average report', (v.r1.total / Math.max(1, v.r1.count)).toFixed(1))}</div>
      <p class="muted">The true harvest stays hidden for now.</p>`;
  } else if (ph === 'r2_brief') {
    main = chairman(`The new methods make bumper harvests possible. The Plan sets a target of ${E.TARGET} per village. Fields can now produce up to 12. This year the ${word(v.k)} villages reporting the lowest harvest will be sent for re-education and lose 2 grain. The ${word(v.k)} reporting the highest will be promoted and gain 2 grain.`)
      + `<div class="stakes"><div class="lo">${icon('down')} <b>Lowest ${v.k} reports:</b> re-educated, −2 sacks.</div><div class="hi">${icon('up')} <b>Highest ${v.k} reports:</b> promoted, +2 sacks.</div></div>
      <p class="muted">A new harvest card has <b>not</b> been dealt: your harvest is the same as in Round 1. Ties on the line are broken by lot, in public.</p>`;
  } else if (ph === 'r2') {
    main = chairman('Enter your harvest.', `<p class="small">Remember: the lowest ${v.k} are re-educated (−2), the highest ${v.k} promoted (+2). Reports can go up to 12.</p>`) + tiles(v, 'sub:r2') + `<p class="status">${waiting(v, 'r2')}</p>`;
  } else if (ph === 'r2_done') {
    main = explain({ title: 'Round 2: the quota', what: `The reported harvest jumped from ${v.r1.total} to ${v.r2.total}. Nobody's real harvest changed.` })
      + `<div class="stats">${big('Reported total', v.r2.total, 'warn')}${big('Average report', (v.r2.total / Math.max(1, v.r2.count)).toFixed(1))}${big('Round 1 total', v.r1.total, 'dim')}</div>${tiles(v, 'r2')}${tileKey([KEY.low, KEY.high])}${quotaBlock(v.r2, v.k)}`;
  } else if (ph === 'r3_done') {
    const r = v.r3;
    main = chairman('The harvest is magnificent. The state will now collect its share: half of what each village reported, rounded up.', '<p class="small">Each village pays out of the grain it really grew. A village that cannot pay hands over everything: famine.</p>')
      + `<div class="stats">${big('Really grown', r.trueTotal)}${big('Reported', r.reportedTotal, 'warn')}${big('Gap', `+${r.reportedTotal - r.trueTotal}`, 'warn')}${big('Grain taken', r.taken)}${big('Famine villages', r.famine.length, r.famine.length ? 'bad' : '')}</div>
      ${tiles(v, 'r3')}${tileKey([KEY.famine, KEY.low, KEY.high])}
      <div class="cards">${r.rows.map((x) => `<div class="pcard ${x.famine ? 'famine' : ''}"><div class="pn">${x.n}</div><div class="small">grew <b>${x.card}</b> · reported <b>${x.r2 ?? '—'}</b></div><div class="small">state took ${x.paid}${x.famine ? ' · <b>famine</b>' : ''}</div>${x.low ? '<div class="tag bad">re-educated</div>' : x.high ? '<div class="tag good">promoted</div>' : ''}</div>`).join('')}</div>
      <p class="small">Honest villages (reported exactly what they grew) among those re-educated in Round 2: ${list(r.honestReeducated)}</p>`;
  } else if (ph === 'r4_brief') {
    main = chairman('From now on, two inspectors will check villages. Each reports to me alone.')
      + `<div class="card"><div class="caps">${icon('inspect')} Inspectors, drawn by lot</div><div class="chips big">${list(v.inspectors)}</div>
      <ul class="small"><li>A <b>new harvest</b> has been dealt: check your phone.</li><li>Each inspector checks ${v.checksEach} villages and sees their true harvest.</li><li>A village whose report is off by 2 or more, either way, is <b>caught</b>, and re-educated in place of the lowest reporter.</li><li>Inspectors gain 1 sack for each liar they catch. Their own villages report the truth automatically.</li><li>The quota still applies: lowest re-educated, highest promoted.</li></ul></div>`;
  } else if (ph === 'r4a' || ph === 'r4b') {
    main = chairman('Enter your harvest.', `<p class="small">Inspectors will check about one village in three. Off by 2 or more, and you are caught.${ph === 'r4b' ? ' A village an inspector confirms as honest receives a premium of 2.' : ''}</p>`) + tiles(v, `sub:${ph}`) + `<p class="status">${waiting(v, ph)}</p>`;
  } else if (ph === 'r4a_check' || ph === 'r4b_check') {
    main = explain({ title: 'The inspectors are choosing which villages to check', what: `Inspectors ${v.inspectors.join(' and ')}: choose ${v.checksEach} villages each on your phone. You will see their true harvests.` }) + tiles(v, 'check') + `<p class="status">${waiting(v, 'check')}</p>`;
  } else if (ph === 'r4a_done') {
    main = roundReveal(v.r4a, v, 'r4a') + '<p><b>Did the gap shrink? Was it the villages that were checked, or everyone?</b></p>';
  } else if (ph === 'r4b_poll') {
    main = chairman('The Plan rewards honesty. Any village whose report an inspector confirms as honest receives a premium of 2 grain. You have my word.')
      + `<div class="card"><h2>Before you write: do you believe the promise?</h2><p>Answer on your phone. A new harvest has been dealt.</p><div class="stats">${big('Answered on phones', `${v.pollIn} of ${v.provinces.filter((p) => !p.paper).length}`)}</div>${v.provinces.some((p) => p.paper) ? '<p class="small">Paper villages: a show of hands.</p>' : ''}</div>`;
  } else if (ph === 'r4b_chair') {
    main = ctx.joinPanel
      ? `<div class="card"><h2>The Chairman considers the Plan</h2><p class="muted">Leader: decide whether to honour the premium. The leader's sheet shows the reported and true totals.</p>
      <div class="rowc"><button class="btn primary" data-cmd="chair" data-honour="1">Honour the premium</button><button class="btn" data-cmd="chair" data-honour="0">“The Plan has been reconsidered”</button></div>
      <p class="small">Believed the promise: ${v.poll.yes} · did not: ${v.poll.no}</p></div>`
      : chairman('The Plan is being considered.', `<p class="small">The computer Chairman has seen the reports and has decided whether to pay the premium. Continue to find out. Believed the promise: ${v.poll.yes} · did not: ${v.poll.no}.</p>`);
  } else if (ph === 'r4b_done') {
    main = roundReveal(v.r4b, v, 'r4b')
      + `<div class="card ${v.premium ? 'good' : 'bad'}"><h2>${v.premium ? 'The premium is paid' : '“The Plan has been reconsidered.” No premium is paid.'}</h2>
      <p>On phones, ${plural(v.poll.yes, 'village', 'villages')} believed the promise and ${v.poll.no} did not. Were they right?</p></div>`;
  } else if (ph === 'end') {
    main = endView(v);
  }
  return { round: ROUND(ph), main: top + main, next: NEXT[ph] };
}

function roundReveal(r, v, mode) {
  const checked = r.checked.length, unchecked = r.count - checked;
  return explain({ title: mode === 'r4a' ? 'Round 4a: the inspectors report' : 'Round 4b: the premium round', what: `The villages reported ${r.reportedTotal}; they really grew ${r.trueTotal}.` })
    + `<div class="stats">${big('Really grown', r.trueTotal)}${big('Reported', r.reportedTotal, r.reportedTotal > r.trueTotal ? 'warn' : '')}${big('Gap', `${r.reportedTotal - r.trueTotal >= 0 ? '+' : ''}${r.reportedTotal - r.trueTotal}`)}${big('Liars caught', r.caught.length)}</div>
    ${tiles(v, mode)}${tileKey([KEY.caught, KEY.low, KEY.high, KEY.insp].concat(mode === 'r4b' && v.premium ? [KEY.premium] : []))}
    <p class="small">Average overstatement per village: checked ${checked ? (r.checkedGap / checked).toFixed(1) : '—'} · not checked ${unchecked ? (r.uncheckedGap / unchecked).toFixed(1) : '—'}</p>
    ${quotaBlock(r, v.k)}`;
}

function endView(v) {
  const rows = [
    { label: 'Round 1 (nothing at stake)', rep: v.r1.total, tru: v.r3.trueTotal },
    { label: 'Round 2 (the quota)', rep: v.r2.total, tru: v.r3.trueTotal },
    { label: 'Round 4a (inspectors)', rep: v.r4a.reportedTotal, tru: v.r4a.trueTotal },
    { label: 'Round 4b (the premium)', rep: v.r4b.reportedTotal, tru: v.r4b.trueTotal },
  ];
  const top = v.final.slice(0, 3);
  const honest = v.final.filter((x) => x.honestReeducated).map((x) => x.n).sort((a, b) => a - b);
  const famine = v.final.filter((x) => x.famine).map((x) => x.n).sort((a, b) => a - b);
  const fam = new Set(famine), hon = new Set(honest);
  return `<div class="split"><div><h2>Reports and the truth</h2>${bars(rows)}
      <h3 style="margin-top:16px">Who paid?</h3><div class="vgrid">${v.final.slice().sort((a, b) => a.n - b.n).map((x) => villageTile(x.n, fam.has(x.n) ? 'famine' : hon.has(x.n) ? 'low' : '', fam.has(x.n) ? 'famine' : hon.has(x.n) ? 'honest, punished' : `${x.total} kept`)).join('')}</div>
      ${tileKey([KEY.famine, ['var(--accent)', 'honest but re-educated']])}</div><div>
    <div class="card"><div class="caps">${icon('sack')} Most grain kept</div>${top.map((x) => `<div class="rowb"><span class="chip">${x.n}</span><b>${x.total} sacks</b></div>`).join('')}<p class="small">How did you do it?</p></div>
    <div class="card bad"><div class="caps">Who paid the cost?</div><p class="small">Honest villages re-educated in Round 2: ${list(honest)}</p><p class="small">Famine villages in Round 3: ${list(famine)}</p></div>
  </div></div>`;
}

// ---------- the leader's commands ----------
export function hostCommand(s, d) {
  if (d.cmd === 'paper') return E.addPaper(s, Number(d.count) || 1);
  if (d.cmd === 'remove') {
    const pid = Object.keys(s.players).find((q) => s.players[q].n === Number(d.n));
    return pid ? E.removeProvince(s, pid) : s;
  }
  if (d.cmd === 'chair') return E.chair(s, d.honour === '1');
  return null;
}

// ---------- the leader's sheet (a separate window, not for the projector) ----------
export function sheetView(s) {
  const pv = E.publicView(s);
  const paper = E.pidsByN(s).filter((q) => s.players[q].paper);
  const deal = E.PHASES.indexOf(s.phase) < E.PHASES.indexOf('r4_brief') ? 'A' : E.PHASES.indexOf(s.phase) < E.PHASES.indexOf('r4b_poll') ? 'B' : 'C';
  const round = E.REPORT_PHASES[s.phase];
  let html = `<h1>Leader's sheet</h1><p class="muted">Keep this window off the projector. Phase: ${esc(ROUND(s.phase))}.</p>`;
  if (s.phase === 'r4b_chair') {
    const rep = Object.values(s.reports.r4b).reduce((a, b) => a + b, 0), tru = Object.values(s.deals.C).reduce((a, b) => a + b, 0);
    html += `<div class="card"><h2>For the Chairman</h2><p>Reported total ${rep}, true total ${tru}. The rules suggest: honour the premium, unless the reported total still runs well above the true total.</p></div>`;
  }
  if (!paper.length) return html + '<p>No paper villages in this game.</p>';
  html += `<table class="sheet"><tr><th>Village</th><th>Card (${s.deals[deal] ? 'this harvest' : 'not dealt'})</th>${round ? '<th>Report from the slip</th>' : ''}</tr>`;
  for (const q of paper) {
    const card = s.deals[deal]?.[q];
    const insp = s.inspectors.includes(q);
    const cur = round ? s.reports[round][q] : null;
    html += `<tr><td><b>${s.players[q].n}</b></td><td>${card ?? '—'}</td>${round ? `<td>${insp && round.startsWith('r4') ? 'inspector: truth' : `<input type="number" min="0" max="${E.maxReport(s.phase)}" value="${cur ?? ''}" data-paper="${q}"> ${cur != null ? '✓' : ''}`}</td>` : ''}</tr>`;
  }
  html += '</table><p class="small muted">Deal a card face down to each paper village from this list. Reports save as you type.</p>';
  if (pv.phase === 'end') html += '<p>Game over.</p>';
  return html;
}

// ---------- phones ----------
export function phoneJoin(v) {
  if (v.phase !== 'lobby') return `<div class="card"><h2>This game has started</h2><p>New villages can join only before the first harvest. Ask the leader.</p></div>`;
  return `<div class="card">${chairmanScene()}<h2>${TITLE}</h2><p>You will be a numbered village with a secret harvest.</p><button class="btn primary wide" data-act="join">Join as a village</button></div>`;
}

const sacks = (n, gone = 0) => `<div class="sacks">${[...Array(Math.max(0, n)).keys()].map((i) => icon('sack', i >= n - gone ? 'gone' : '')).join('')}</div>`;
const harvestCard = (me, label = 'Your true harvest') => (me.card == null ? '' : `<div class="bigcard"><div class="num">${me.card}</div><div><div class="caps">${label}</div><p>sacks of grain. Only you can see this.</p>${sacks(me.card)}</div></div>`);

let draft = { phase: null, value: null };
export function phoneView(v, me) {
  const ph = v.phase, rd = roundOf(ph);
  if (draft.phase !== ph) draft = { phase: ph, value: null };
  const head = `<div class="phead"><div><div class="caps">${rd ? ROUND(ph) : 'Waiting to start'}</div><div class="pseat">Village ${me.n}</div></div>${me.inspector ? `<div class="mini">${icon('inspect')} inspector</div>` : ''}</div>`;
  let body = '';
  const fateLine = (f, caught) => (caught ? `<div class="story bad">${icon('inspect')}<p><span class="st">An inspector caught you misreporting.</span> You are re-educated: −2 sacks.</p></div>`
    : f === 'low' ? `<div class="story bad">${icon('down')}<p><span class="st">Yours was among the lowest reports.</span> You are sent for re-education: −2 sacks.</p></div>`
      : f === 'high' ? `<div class="story good">${icon('up')}<p><span class="st">Yours was among the highest reports.</span> You are promoted: +2 sacks.</p></div>`
        : `<div class="story">${icon('village')}<p>You are neither re-educated nor promoted.</p></div>`);
  if (ph === 'lobby') {
    body = `<p>You are in. Wait for the Chairman.</p><p class="muted small">Your number is your name in this game.</p><dl class="glossary">${GLOSS.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
  } else if (E.REPORT_PHASES[ph]) {
    if (me.inspector && ph.startsWith('r4')) body = harvestCard(me) + `<div class="story">${icon('inspect')}<p><span class="st">You are an inspector.</span> Your village reports the truth automatically (${me.card}). Wait while the villages report.</p></div>`;
    else {
      const max = E.maxReport(ph);
      const val = draft.value ?? me.myReport;
      const stake = ph === 'r1' ? 'Nothing depends on it.'
        : ph === 'r2' ? `The lowest ${v.k} reports are re-educated (−2 sacks); the highest ${v.k} are promoted (+2). You may report up to 12.`
          : `Inspectors check about one village in three. If your report is off by 2 or more, either way, you are caught and re-educated. The quota still applies.${ph === 'r4b' ? ' If an inspector confirms you are honest, the Chairman has promised a premium of 2.' : ''}`;
      body = harvestCard(me) + `<h3>What do you tell the Chairman?</h3><p class="small">${stake}</p>
        <div class="keypad">${[...Array(max + 1).keys()].map((n) => `<button class="key ${val === n ? 'on' : ''}" data-act="pick" data-v="${n}">${n}</button>`).join('')}</div>
        ${val != null && me.card != null ? `<p class="small">${val === me.card ? 'That is the truth.' : val > me.card ? `That is ${val - me.card} more than you grew.` : `That is ${me.card - val} less than you grew.`}</p>` : ''}
        <button class="btn primary wide" data-act="report" ${val == null ? 'disabled' : ''}>${me.myReport == null ? 'Send report' : val === me.myReport ? `Sent: ${me.myReport}` : `Change report to ${val}`}</button>
        <p class="muted small">${me.myReport == null ? 'Not sent yet.' : 'You can change it until the Chairman closes reports.'}</p>`;
    }
  } else if (ph === 'r1_done') body = harvestCard(me) + `<p>The villages reported <b>${v.r1.total}</b> sacks in all, from ${v.r1.count} villages.</p><p class="muted">Look at the projector.</p>`;
  else if (ph === 'r2_brief') body = harvestCard(me, 'Your harvest (unchanged)') + `<div class="story warn">${icon('megaphone')}<p><span class="st">The quota.</span> Target ${E.TARGET} sacks per village. Fields can now produce up to 12. The ${word(v.k)} lowest reports are re-educated (−2 sacks); the ${word(v.k)} highest are promoted (+2).</p></div><p class="muted">Reporting opens in a moment.</p>`;
  else if (ph === 'r2_done') body = harvestCard(me) + fateLine(me.fate.r2) + `<p class="muted small">Reported total ${v.r2.total}.</p>`;
  else if (ph === 'r3_done') {
    const R = me.r3, adj = me.fate.r2 === 'low' ? -2 : me.fate.r2 === 'high' ? 2 : 0;
    body = harvestCard(me, 'You grew')
      + `<div class="story ${R.famine ? 'bad' : 'warn'}">${icon(R.famine ? 'famine' : 'sack')}<p><span class="st">The state takes half of your report, rounded up: ${R.take} ${R.take === 1 ? 'sack' : 'sacks'}.</span> ${R.famine ? `You grew only ${me.card}. You hand over everything. <b>Famine.</b>` : `You hand over ${R.paid}.`}</p></div>
      ${sacks(me.card, R.paid)}
      <div class="chg"><span class="chl">Your grain this year</span><span class="chv">${me.card} grown − ${R.paid} taken${adj ? ` ${adj > 0 ? '+' : '−'} 2 (${adj > 0 ? 'promoted' : 're-educated'})` : ''} = <b>${me.ledger.A}</b></span></div>`;
  } else if (ph === 'r4_brief') body = harvestCard(me, 'Your new harvest') + (me.inspector ? `<div class="story good">${icon('inspect')}<p><span class="st">You are an inspector.</span> You will check ${v.checksEach} villages and see their true harvests. You gain 1 sack for each liar you catch. Your own village reports the truth automatically.</p></div>` : `<div class="story warn">${icon('inspect')}<p><span class="st">Two inspectors will check about one village in three.</span> A report off by 2 or more, either way, is caught and re-educated (−2). A new harvest has been dealt.</p></div>`);
  else if (ph === 'r4a_check' || ph === 'r4b_check') {
    if (!me.inspector) body = harvestCard(me) + '<p>The inspectors are choosing which villages to check. Wait.</p>';
    else {
      const chosen = new Set(draft.checks ?? me.checks ?? []);
      draft.checks = [...chosen];
      body = `<h3>Choose ${v.checksEach} villages to check</h3><p class="small">You will see their true harvest beside their report. Off by 2 or more, and they are caught. You gain 1 sack for each.</p>
        <div class="keypad">${me.options.map((n) => `<button class="key ${chosen.has(n) ? 'on' : ''}" data-act="toggle" data-v="${n}">${n}</button>`).join('')}</div>
        <button class="btn primary wide" data-act="check" ${chosen.size === Math.min(v.checksEach, me.options.length) ? '' : 'disabled'}>${me.checks && me.checks.length ? 'Checks sent (change and resend)' : `Send ${chosen.size} of ${v.checksEach}`}</button>`;
    }
  } else if (ph === 'r4a_done' || ph === 'r4b_done') {
    const r = ph === 'r4a_done' ? '4a' : '4b';
    body = harvestCard(me, 'You grew') + fateLine(me.fate[`r${r}`], me.fate[`caught${r}`]);
    if (me.seen) { const c = me.seen.filter((x) => x.caught).length; body += `<p>${c ? `You caught ${plural(c, 'liar', 'liars')}: +${c} ${c === 1 ? 'sack' : 'sacks'}.` : 'You caught nobody.'}</p>`; }
    if (me.seen) body += `<div class="card flat"><div class="caps">What you saw</div>${me.seen.map((x) => `<div class="rowb"><span>Village ${x.n}: grew ${x.card}, reported ${x.report ?? '—'}</span><b class="${x.caught ? 'bad' : 'good'}">${x.caught ? 'caught' : 'honest'}</b></div>`).join('')}</div>`;
    if (r === '4b') body += `<p>${v.premium ? (me.ledger.premium ? 'The premium is paid: +2 sacks for you.' : 'The premium is paid, but not to you: no inspector confirmed your report.') : '“The Plan has been reconsidered.” No premium.'}</p>`;
    const L = r === '4a' ? me.ledger.B : me.ledger.C;
    if (L != null) body += `<div class="chg"><span class="chl">Your grain this harvest</span><span class="chv"><b>${L}</b> sacks</span></div>`;
  } else if (ph === 'r4b_poll') {
    body = harvestCard(me, 'Your new harvest') + `<div class="story warn">${icon('medal')}<p>The Chairman promises a premium of 2 sacks to any village an inspector confirms as honest.</p></div><h3>Do you believe the promise?</h3>
      <div class="rowc"><button class="btn ${me.believe === true ? 'primary' : ''}" data-act="believe" data-v="1">Yes</button><button class="btn ${me.believe === false ? 'primary' : ''}" data-act="believe" data-v="0">No</button></div>`;
  } else if (ph === 'r4b_chair') body = harvestCard(me) + '<p>The Chairman considers the Plan.</p>';
  else if (ph === 'end') body = `<div class="bigcard"><div class="num">${me.ledger.total}</div><div><div class="caps">Sacks kept in all</div><p>${me.ledger.A} from the first harvest, ${me.ledger.B} in Round 4a and ${me.ledger.C} in Round 4b.</p></div></div><p>You finished <b>${ordinal(me.rank)}</b> of ${me.of}.</p>`;
  return head + `<div class="pbody">${body}</div>`;
}
const ordinal = (n) => `${n}${[11, 12, 13].includes(n % 100) ? 'th' : { 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th'}`;

export function phoneAction(d, v, me) {
  if (d.act === 'join') return { type: 'join' };
  if (d.act === 'pick') { draft.value = Number(d.v); return 'render'; }
  if (d.act === 'report') { const val = draft.value ?? me.myReport; return val == null ? null : { type: 'report', value: val }; }
  if (d.act === 'toggle') {
    const set = new Set(draft.checks || []); const n = Number(d.v);
    if (set.has(n)) set.delete(n); else if (set.size < v.checksEach) set.add(n);
    draft.checks = [...set]; return 'render';
  }
  if (d.act === 'check') return { type: 'check', list: draft.checks };
  if (d.act === 'believe') return { type: 'believe', yes: d.v === '1' };
  return null;
}
