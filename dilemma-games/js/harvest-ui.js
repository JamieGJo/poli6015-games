// The Harvest Report: projector, phone and leader-sheet screens. All text is a draft for Jamie.
import * as E from './harvest.js';
import { esc } from './ui.js';

export { E };
export const TITLE = 'The Harvest Report';
export const newState = (code) => E.newGame(code);

const word = (k) => ({ 2: 'two', 3: 'three' }[k] || k);
const cap = (x) => String(x).charAt(0).toUpperCase() + String(x).slice(1);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const list = (ns) => (ns && ns.length ? ns.map((n) => `<span class="chip">${n}</span>`).join(' ') : '<span class="muted">none</span>');
const script = (t) => `<div class="script"><div class="caps">The Chairman</div><p>“${t}”</p></div>`;
const big = (label, value, cls = '') => `<div class="stat ${cls}"><div class="caps">${label}</div><div class="num">${value}</div></div>`;

const NEXT = {
  lobby: 'Start: deal the harvest', r1: 'Close reports', r1_done: 'Announce the quota', r2_brief: 'Open reports',
  r2: 'Close reports and apply the quota', r2_done: 'Procurement', r3_done: 'Round 4: the inspectors', r4_brief: 'Open reports',
  r4a: 'Close reports', r4a_check: 'Close checks and reveal', r4a_done: 'Round 4b: the premium', r4b_poll: 'Close the poll and open reports',
  r4b: 'Close reports', r4b_check: 'Close checks', r4b_chair: 'Reveal', r4b_done: 'Final grain',
};
const ROUND = (ph) => (ph === 'lobby' ? 'Set-up' : ph.startsWith('r1') ? 'Round 1: the honest year' : ph.startsWith('r2') ? 'Round 2: the quota'
  : ph.startsWith('r3') ? 'Round 3: procurement' : ph === 'r4_brief' || ph.startsWith('r4a') ? 'Round 4a: rival inspectors'
    : ph.startsWith('r4b') ? 'Round 4b: the premium' : 'The end');

function grid(v, round) {
  const inn = new Set(round === 'check' ? (v.phase === 'r4a_check' ? v.checksIn.r4a : v.checksIn.r4b) : v.submitted[round] || []);
  const cells = v.provinces.map((p) => {
    const auto = p.inspector && round && round.startsWith('r4');
    const cls = round === 'check' ? (p.inspector ? (inn.has(p.n) ? 'in' : 'wait') : 'idle') : auto ? 'insp' : inn.has(p.n) ? 'in' : 'wait';
    return `<div class="prov ${cls}" title="${p.paper ? 'paper' : 'phone'}">${p.n}${p.inspector ? '<small>insp.</small>' : ''}${p.paper ? '<small>paper</small>' : ''}</div>`;
  }).join('');
  return `<div class="provgrid">${cells}</div><p class="status">${waiting(v, round)}</p>`;
}

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
    <div class="card bad"><div class="caps">Re-educated (−2 grain)</div><div class="chips">${list(r.low)}</div>${r.caught && r.caught.length ? `<p class="small">Caught by an inspector: ${r.caught.join(', ')}</p>` : ''}${tie(r.tieLow, 'lowest')}</div>
    <div class="card good"><div class="caps">Promoted (+2 grain)</div><div class="chips">${list(r.high)}</div>${tie(r.tieHigh, 'highest')}</div>
  </div><p class="muted small">${cap(word(k))} each way with ${k === 3 ? '14 or more' : 'fewer than 14'} provinces${r.caught && r.caught.length > k ? '; every caught liar is re-educated, even beyond that' : ''}.</p>`;
}

function bars(rows) {
  const max = Math.max(...rows.flatMap((r) => [r.rep, r.tru]), 1);
  return `<div class="bars">${rows.map((r) => `<div class="barrow"><div class="lab">${esc(r.label)}</div>
    <div class="barpair"><div class="bar rep" style="width:${(100 * r.rep) / max}%"><span>${r.rep} reported</span></div>
    ${r.tru == null ? '' : `<div class="bar tru" style="width:${(100 * r.tru) / max}%"><span>${r.tru} true</span></div>`}</div></div>`).join('')}</div>`;
}

export function hostView(v, ctx) {
  const ph = v.phase;
  let main = '';
  if (ph === 'lobby') {
    main = `<div class="split"><div>${ctx.joinPanel}</div><div>
      <h2>Provinces joined: ${v.n}</h2>
      <p class="muted">Each phone becomes a numbered province. Never use names: no student is singled out.</p>
      <div class="provgrid">${v.provinces.map((p) => `<button class="prov in rm" data-cmd="remove" data-n="${p.n}" title="Remove province ${p.n}">${p.n}${p.paper ? '<small>paper</small>' : ''}<b>×</b></button>`).join('') || '<p class="muted">Waiting for phones…</p>'}</div>
      <div class="card flat"><div class="caps">No phone? Paper provinces</div>
        <p class="small">Add provinces that play on paper. Their cards appear in the leader's sheet (Menu → Leader's sheet), where you type their reports from slips. Inspectors are drawn from phones only.</p>
        <div class="rowc"><button class="btn" data-cmd="paper" data-count="1">Add 1</button><button class="btn" data-cmd="paper" data-count="5">Add 5</button></div></div>
      <p class="muted small">At least ${E.MIN_PROVINCES} provinces. With 14 or more, three are re-educated and three promoted each round; below 14, two.</p></div></div>`;
  } else if (ph === 'r1') {
    main = script('Comrades, the Plan needs to know the harvest. Enter your harvest on your phone. Nothing depends on it.') + grid(v, 'r1');
  } else if (ph === 'r1_done') {
    main = `<div class="stats">${big('Reported total', v.r1.total)}${big('Provinces', v.r1.count)}${big('Average report', (v.r1.total / Math.max(1, v.r1.count)).toFixed(1))}</div>
      <p class="muted">The true harvest stays hidden for now.</p>`;
  } else if (ph === 'r2_brief') {
    main = script(`The new methods make bumper harvests possible. The Plan sets a target of ${E.TARGET} per province. Fields can now produce up to 12. This year the ${word(v.k)} provinces reporting the lowest harvest will be sent for re-education and lose 2 grain. The ${word(v.k)} reporting the highest will be promoted and gain 2 grain.`)
      + '<p class="muted">Ties on the line are broken by lot, in public.</p>';
  } else if (ph === 'r2') {
    main = script('Enter your harvest.') + grid(v, 'r2');
  } else if (ph === 'r2_done') {
    main = `<div class="stats">${big('Reported total', v.r2.total)}${big('Average report', (v.r2.total / Math.max(1, v.r2.count)).toFixed(1))}${big('Round 1 total', v.r1.total, 'dim')}</div>${quotaBlock(v.r2, v.k)}`;
  } else if (ph === 'r3_done') {
    const r = v.r3;
    main = script('The harvest is magnificent. The state will now collect its share: half of what each province reported, rounded up.')
      + `<div class="stats">${big('True harvest', r.trueTotal)}${big('Reported', r.reportedTotal, 'warn')}${big('Gap', `+${r.reportedTotal - r.trueTotal}`, 'warn')}${big('Grain taken', r.taken)}${big('Famine provinces', r.famine.length, r.famine.length ? 'bad' : '')}</div>
      <div class="cards">${r.rows.map((x) => `<div class="pcard ${x.famine ? 'famine' : ''}"><div class="pn">${x.n}</div><div class="small">true <b>${x.card}</b> · reported <b>${x.r2 ?? '—'}</b></div><div class="small">took ${x.paid}${x.famine ? ' · <b>famine</b>' : ''}</div>${x.low ? '<div class="tag bad">re-educated</div>' : x.high ? '<div class="tag good">promoted</div>' : ''}</div>`).join('')}</div>
      <p class="small">Honest provinces (reported exactly their harvest) among those re-educated in Round 2: ${list(r.honestReeducated)}</p>`;
  } else if (ph === 'r4_brief') {
    main = script('From now on, two inspectors will check provinces. Each reports to me alone.')
      + `<div class="card"><div class="caps">Inspectors, drawn by lot</div><div class="chips big">${list(v.inspectors)}</div>
      <p class="small">A new harvest has been dealt: check your phone. Inspectors' provinces report the truth automatically. Each inspector checks ${v.checksEach} provinces. A province that misreports by 2 or more, either way, is caught and re-educated in place of the lowest reporter. Inspectors gain 1 grain for each liar they catch. The quota stays in force.</p></div>`;
  } else if (ph === 'r4a' || ph === 'r4b') {
    main = script('Enter your harvest.') + grid(v, ph);
  } else if (ph === 'r4a_check' || ph === 'r4b_check') {
    main = `<div class="card"><h2>The inspectors are choosing which provinces to check</h2><p>Inspectors ${v.inspectors.join(' and ')}: choose ${v.checksEach} provinces on your phone.</p></div>` + grid(v, 'check');
  } else if (ph === 'r4a_done') {
    main = roundReveal(v.r4a, v, '4a') + '<p><b>Did the gap shrink? Was it the provinces that were checked, or everyone?</b></p>';
  } else if (ph === 'r4b_poll') {
    main = script('The Plan rewards honesty. Any province whose report an inspector confirms as honest receives a premium of 2 grain. You have my word.')
      + `<div class="card"><h2>Before you write: do you believe the promise?</h2><p>Answer on your phone. A new harvest has been dealt.</p><div class="stats">${big('Answered on phones', `${v.pollIn} of ${v.provinces.filter((p) => !p.paper).length}`)}</div>${v.provinces.some((p) => p.paper) ? '<p class="small">Paper provinces: a show of hands.</p>' : ''}</div>`;
  } else if (ph === 'r4b_chair') {
    main = `<div class="card"><h2>The Chairman considers the Plan</h2><p class="muted">Leader: decide whether to honour the premium. The leader's sheet shows the reported and true totals.</p>
      <div class="rowc"><button class="btn primary" data-cmd="chair" data-honour="1">Honour the premium</button><button class="btn" data-cmd="chair" data-honour="0">“The Plan has been reconsidered”</button></div>
      <p class="small">Believed the promise: ${v.poll.yes} · did not: ${v.poll.no}</p></div>`;
  } else if (ph === 'r4b_done') {
    main = roundReveal(v.r4b, v, '4b')
      + `<div class="card ${v.premium ? 'good' : 'bad'}"><h2>${v.premium ? 'The premium is paid' : '“The Plan has been reconsidered.” No premium is paid.'}</h2>
      <p>On phones, ${plural(v.poll.yes, 'province', 'provinces')} believed the promise and ${v.poll.no} did not. Were they right?</p></div>`;
  } else if (ph === 'end') {
    main = endView(v);
  }
  return { round: ROUND(ph), main, next: NEXT[ph] };
}

function roundReveal(r, v, label) {
  const checked = r.checked.length, unchecked = r.count - checked;
  return `<div class="stats">${big('True harvest', r.trueTotal)}${big('Reported', r.reportedTotal, r.reportedTotal > r.trueTotal ? 'warn' : '')}${big('Gap', `${r.reportedTotal - r.trueTotal >= 0 ? '+' : ''}${r.reportedTotal - r.trueTotal}`)}${big('Liars caught', r.caught.length)}</div>
    <p class="small">Average padding per province: checked ${checked ? (r.checkedGap / checked).toFixed(1) : '—'} · not checked ${unchecked ? (r.uncheckedGap / unchecked).toFixed(1) : '—'}</p>
    ${quotaBlock(r, v.k)}`;
}

function endView(v) {
  const rows = [
    { label: 'Round 1', rep: v.r1.total, tru: v.r3.trueTotal },
    { label: 'Round 2 (quota)', rep: v.r2.total, tru: v.r3.trueTotal },
    { label: 'Round 4a (inspectors)', rep: v.r4a.reportedTotal, tru: v.r4a.trueTotal },
    { label: 'Round 4b (premium)', rep: v.r4b.reportedTotal, tru: v.r4b.trueTotal },
  ];
  const top = v.final.slice(0, 3);
  const honest = v.final.filter((x) => x.honestReeducated).map((x) => x.n).sort((a, b) => a - b);
  const famine = v.final.filter((x) => x.famine).map((x) => x.n).sort((a, b) => a - b);
  return `<div class="split"><div><h2>Reports and the truth</h2>${bars(rows)}</div><div>
    <div class="card"><div class="caps">Most grain kept</div>${top.map((x) => `<div class="rowb"><span class="chip">${x.n}</span><b>${x.total}</b></div>`).join('')}<p class="small">How did you do it?</p></div>
    <div class="card bad"><div class="caps">Who paid?</div><p class="small">Honest provinces re-educated in Round 2: ${list(honest)}</p><p class="small">Famine provinces in Round 3: ${list(famine)}</p></div>
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
  if (!paper.length) return html + '<p>No paper provinces in this game.</p>';
  html += `<table class="sheet"><tr><th>Province</th><th>Card (${s.deals[deal] ? 'this harvest' : 'not dealt'})</th>${round ? '<th>Report from the slip</th>' : ''}</tr>`;
  for (const q of paper) {
    const card = s.deals[deal]?.[q];
    const insp = s.inspectors.includes(q);
    const cur = round ? s.reports[round][q] : null;
    html += `<tr><td><b>${s.players[q].n}</b></td><td>${card ?? '—'}</td>${round ? `<td>${insp && round.startsWith('r4') ? 'inspector: truth' : `<input type="number" min="0" max="${E.maxReport(s.phase)}" value="${cur ?? ''}" data-paper="${q}"> ${cur != null ? '✓' : ''}`}</td>` : ''}</tr>`;
  }
  html += '</table><p class="small muted">Deal a card face down to each paper province from this list. Reports save as you type.</p>';
  if (pv.phase === 'end') html += '<p>Game over.</p>';
  return html;
}

// ---------- phones ----------
export function phoneJoin(v) {
  if (v.phase !== 'lobby') return `<div class="card"><h2>This game has started</h2><p>New provinces can join only before the first harvest. Ask the leader.</p></div>`;
  return `<div class="card"><h2>${TITLE}</h2><p>You will be a numbered province. Your harvest is secret.</p><button class="btn primary wide" data-act="join">Join as a province</button></div>`;
}

let draft = { phase: null, value: null };
export function phoneView(v, me) {
  const ph = v.phase;
  if (draft.phase !== ph) draft = { phase: ph, value: null };
  const head = `<div class="phead"><div><div class="caps">Province</div><div class="pnum">${me.n}</div></div>${me.card != null ? `<div class="harvest"><div class="caps">Your true harvest</div><div class="pnum">${me.card}</div></div>` : ''}</div>`;
  let body = '';
  const fateLine = (f, caught) => (caught ? '<p class="bad">An inspector caught you misreporting. You are re-educated: −2 grain.</p>'
    : f === 'low' ? '<p class="bad">You are among the lowest. You are sent for re-education: −2 grain.</p>'
      : f === 'high' ? '<p class="good">You are among the highest. You are promoted: +2 grain.</p>' : '<p>You are neither re-educated nor promoted.</p>');
  if (ph === 'lobby') body = '<p>You are in. Wait for the Chairman.</p><p class="muted small">Your number is your name in this game.</p>';
  else if (E.REPORT_PHASES[ph]) {
    if (me.inspector && ph.startsWith('r4')) body = `<p><b>You are an inspector.</b> Your province reports the truth automatically (${me.card}).</p><p class="muted">Wait while the provinces report.</p>`;
    else {
      const max = E.maxReport(ph);
      const val = draft.value ?? me.myReport;
      body = `<p>${ph === 'r1' ? 'Report your harvest. Nothing depends on it.' : `Report your harvest (0 to ${max}).`}</p>
        <div class="keypad">${[...Array(max + 1).keys()].map((n) => `<button class="key ${val === n ? 'on' : ''}" data-act="pick" data-v="${n}">${n}</button>`).join('')}</div>
        <button class="btn primary wide" data-act="report" ${val == null ? 'disabled' : ''}>${me.myReport == null ? 'Send report' : val === me.myReport ? `Sent: ${me.myReport}` : `Change report to ${val}`}</button>
        <p class="muted small">${me.myReport == null ? 'Not sent yet.' : 'You can change it until the Chairman closes reports.'}</p>`;
    }
  } else if (ph === 'r1_done') body = `<p>Reported total: <b>${v.r1.total}</b> from ${v.r1.count} provinces.</p>`;
  else if (ph === 'r2_brief') body = `<p><b>The quota.</b> Target ${E.TARGET} per province. Fields can now produce up to 12. The ${word(v.k)} lowest reports are re-educated (−2 grain); the ${word(v.k)} highest are promoted (+2 grain).</p><p class="muted">Reporting opens in a moment.</p>`;
  else if (ph === 'r2_done') body = fateLine(me.fate.r2) + `<p class="muted small">Reported total ${v.r2.total}.</p>`;
  else if (ph === 'r3_done') body = me.r3.famine ? `<p class="bad"><b>Famine.</b> The state wanted ${me.r3.take}. You had ${me.card}, and handed over everything.</p>` : `<p>The state took <b>${me.r3.take}</b> of your ${me.card}. You keep ${me.card - me.r3.paid}${me.fate.r2 === 'low' ? ', minus 2 for re-education' : me.fate.r2 === 'high' ? ', plus 2 for promotion' : ''}.</p>`;
  else if (ph === 'r4_brief') body = me.inspector ? `<p><b>You are an inspector.</b> You will check ${v.checksEach} provinces. You gain 1 grain for each liar you catch. Your own province reports the truth automatically.</p>` : `<p>Two inspectors will check about one province in three. A misreport of 2 or more, either way, is caught. A new harvest has been dealt.</p>`;
  else if (ph === 'r4a_check' || ph === 'r4b_check') {
    if (!me.inspector) body = '<p>The inspectors are choosing. Wait.</p>';
    else {
      const chosen = new Set(draft.checks ?? me.checks ?? []);
      draft.checks = [...chosen];
      body = `<p>Choose <b>${v.checksEach}</b> provinces to check. You will see their true harvests.</p>
        <div class="keypad">${me.options.map((n) => `<button class="key ${chosen.has(n) ? 'on' : ''}" data-act="toggle" data-v="${n}">${n}</button>`).join('')}</div>
        <button class="btn primary wide" data-act="check" ${chosen.size === Math.min(v.checksEach, me.options.length) ? '' : 'disabled'}>${me.checks && me.checks.length ? 'Checks sent (change and resend)' : `Send ${chosen.size} of ${v.checksEach}`}</button>`;
    }
  } else if (ph === 'r4a_done' || ph === 'r4b_done') {
    const r = ph === 'r4a_done' ? '4a' : '4b';
    body = fateLine(me.fate[`r${r}`], me.fate[`caught${r}`]);
    if (me.seen) { const c = me.seen.filter((x) => x.caught).length; body += `<p>${c ? `You caught ${plural(c, 'liar', 'liars')}: +${c} grain.` : 'You caught nobody.'}</p>`; }
    if (me.seen) body += `<div class="card flat"><div class="caps">What you saw</div>${me.seen.map((x) => `<div class="rowb"><span>Province ${x.n}: true ${x.card}, reported ${x.report ?? '—'}</span><b class="${x.caught ? 'bad' : 'good'}">${x.caught ? 'caught' : 'honest'}</b></div>`).join('')}</div>`;
    if (r === '4b') body += `<p>${v.premium ? (me.ledger.premium ? 'The premium is paid: +2 grain for you.' : 'The premium is paid, but not to you: no inspector confirmed your report.') : '“The Plan has been reconsidered.” No premium.'}</p>`;
  } else if (ph === 'r4b_poll') {
    body = `<p>The Chairman promises a premium of 2 grain to any province an inspector confirms as honest.</p><h3>Do you believe the promise?</h3>
      <div class="rowc"><button class="btn ${me.believe === true ? 'primary' : ''}" data-act="believe" data-v="1">Yes</button><button class="btn ${me.believe === false ? 'primary' : ''}" data-act="believe" data-v="0">No</button></div>`;
  } else if (ph === 'r4b_chair') body = '<p>The Chairman considers the Plan.</p>';
  else if (ph === 'end') body = `<p>You kept <b>${me.ledger.total}</b> grain in all: ${me.ledger.A} in the first year, ${me.ledger.B} in Round 4a and ${me.ledger.C} in Round 4b.</p><p>You finished <b>${ordinal(me.rank)}</b> of ${me.of}.</p>`;
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
