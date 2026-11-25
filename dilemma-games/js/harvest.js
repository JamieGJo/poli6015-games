// The Harvest Report: game engine. Pure functions, no screen code, so the same file
// runs on the projector and in the Node checks (tools/check-harvest.mjs).
// Rules: module/2026-11-25_harvest-report_rules.md. Interpretations of unclear rules
// are marked "Interpretation" and listed in the build note.

export const BASE_DECK = [1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
export const TARGET = 7;
export const MIN_PROVINCES = 6;
const PAIRS = [[5, 5], [4, 6], [3, 7], [2, 8], [4, 6], [1, 9], [3, 7], [2, 8], [4, 6]];

// Cards for n provinces. The rules: take out pairs that average 5 (two 5s, then a 4 and a 6,
// then a 3 and a 7), and a single 5 for an odd number, so the total stays 5n.
// Interpretation: past 20 provinces, add a second deck built the same way.
export function deckFor(n) {
  if (n > 20) return BASE_DECK.concat(deckFor(n - 20));
  const d = BASE_DECK.slice();
  const take = (v) => { const i = d.indexOf(v); if (i >= 0) d.splice(i, 1); return i >= 0; };
  const has = (a, b) => (a === b ? d.filter((x) => x === a).length >= 2 : d.includes(a) && d.includes(b));
  let need = 20 - n;
  if (need % 2 === 1) { take(5); need -= 1; }
  for (const [a, b] of PAIRS) { if (need <= 0) break; if (has(a, b)) { take(a); take(b); need -= 2; } }
  while (need > 0) { d.sort((x, y) => x - y); d.shift(); d.pop(); need -= 2; }
  return d;
}

export const groupSize = (n) => (n >= 14 ? 3 : 2);

export function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const PHASES = ['lobby', 'r1', 'r1_done', 'r2_brief', 'r2', 'r2_done', 'r3_done', 'r4_brief', 'r4a', 'r4a_check',
  'r4a_done', 'r4b_poll', 'r4b', 'r4b_check', 'r4b_chair', 'r4b_done', 'end'];
export const REPORT_PHASES = { r1: 'r1', r2: 'r2', r4a: 'r4a', r4b: 'r4b' };
const DEAL_OF = (ph) => (PHASES.indexOf(ph) < PHASES.indexOf('r4_brief') ? 'A' : PHASES.indexOf(ph) < PHASES.indexOf('r4b_poll') ? 'B' : 'C');
export const maxReport = (ph) => (ph === 'r1' ? 9 : 12);

export function newGame(room) {
  return {
    game: 'harvest', v: 1, room, phase: 'lobby', players: {}, nextN: 1,
    deals: {}, reports: { r1: {}, r2: {}, r4a: {}, r4b: {} }, res: {}, inspectors: [],
    checks: { r4a: {}, r4b: {} }, poll: {}, premium: null,
  };
}

const clone = (s) => JSON.parse(JSON.stringify(s));
export const pidsByN = (s) => Object.keys(s.players).sort((a, b) => s.players[a].n - s.players[b].n);
export const nOf = (s, pid) => s.players[pid]?.n;
export const provinceCount = (s) => Object.keys(s.players).length;

// ---------- actions from phones (and from the leader's sheet for paper provinces) ----------
export function applyAction(s0, a) {
  const s = clone(s0);
  const p = s.players[a.pid];
  if (a.type === 'join') {
    if (p) return p.key === a.key ? s0 : s0;           // already in; a different key is refused
    if (s.phase !== 'lobby') return s0;                  // Interpretation: no new provinces once the game starts
    s.players[a.pid] = { n: s.nextN++, key: a.key, paper: false };
    return s;
  }
  if (!p) return s0;
  if (!a.trusted && p.key !== a.key) return s0;
  if (a.type === 'report' && REPORT_PHASES[s.phase]) {
    if (s.inspectors.includes(a.pid) && s.phase.startsWith('r4')) return s0; // inspectors report the truth automatically
    const v = Math.round(Number(a.value));
    if (!(v >= 0 && v <= maxReport(s.phase))) return s0;
    s.reports[s.phase][a.pid] = v;
    return s;
  }
  if (a.type === 'check' && (s.phase === 'r4a_check' || s.phase === 'r4b_check') && s.inspectors.includes(a.pid)) {
    const k = checksEach(s);
    const want = [...new Set((a.list || []).map(Number))];
    const pids = want.map((n) => Object.keys(s.players).find((q) => s.players[q].n === n)).filter((q) => q && q !== a.pid);
    if (pids.length !== Math.min(k, provinceCount(s) - 1)) return s0;
    s.checks[s.phase.slice(0, 3)][a.pid] = pids;
    return s;
  }
  if (a.type === 'believe' && s.phase === 'r4b_poll') { s.poll[a.pid] = !!a.yes; return s; }
  return s0;
}

// Each inspector checks about one province in three: 6 of 20, 4 of 12.
export const checksEach = (s) => Math.max(1, Math.floor(provinceCount(s) / 3));

// ---------- the leader's commands ----------
export function addPaper(s0, count) {
  if (s0.phase !== 'lobby') return s0;
  const s = clone(s0);
  for (let i = 0; i < count; i++) { const n = s.nextN++; s.players[`paper-${n}`] = { n, key: null, paper: true }; }
  return s;
}

export function removeProvince(s0, pid) {
  if (s0.phase !== 'lobby' || !s0.players[pid]) return s0;
  const s = clone(s0); delete s.players[pid];
  pidsByN(s).forEach((q, i) => { s.players[q].n = i + 1; });  // renumber so there are no gaps
  s.nextN = provinceCount(s) + 1;
  return s;
}

export function canAdvance(s) {
  const n = provinceCount(s);
  if (s.phase === 'lobby' && n < MIN_PROVINCES) return { ok: false, why: `At least ${MIN_PROVINCES} provinces are needed (${n} so far).` };
  if (s.phase === 'r4b_chair' && s.premium === null) return { ok: false, why: 'The Chairman must decide first.' };
  if (s.phase === 'end') return { ok: false, why: 'The game is over.' };
  return { ok: true };
}

function deal(s, which, rand) {
  const order = shuffle(deckFor(provinceCount(s)), rand);
  s.deals[which] = {};
  pidsByN(s).forEach((pid, i) => { s.deals[which][pid] = order[i]; });
}

// Pick m provinces with the lowest (dir = 1) or highest (dir = -1) report. Ties on the line are drawn by lot.
function pick(cands, rep, m, dir, rand) {
  if (m <= 0 || !cands.length) return { chosen: [], tie: null };
  if (m >= cands.length) return { chosen: cands.slice(), tie: null };
  const sorted = cands.slice().sort((a, b) => dir * (rep[a] - rep[b]));
  const v = rep[sorted[m - 1]];
  const better = sorted.filter((q) => dir * (rep[q] - v) < 0);
  const tied = sorted.filter((q) => rep[q] === v);
  const need = m - better.length;
  if (tied.length === need) return { chosen: better.concat(tied), tie: null };
  const won = shuffle(tied, rand).slice(0, need);
  return { chosen: better.concat(won), tie: { value: v, tied, chosen: won } };
}

// The quota rule: the k lowest reports are re-educated (-2), the k highest promoted (+2).
// Round 4: a caught liar is re-educated in place of the lowest reporter, and cannot be promoted.
export function quota(rep, k, rand, caught = []) {
  const reported = Object.keys(rep);
  const caughtIn = caught.filter((q) => q in rep);
  const pool = reported.filter((q) => !caughtIn.includes(q));
  const lo = pick(pool, rep, k - caughtIn.length, 1, rand);
  const low = caughtIn.concat(lo.chosen);
  const hi = pick(pool.filter((q) => !low.includes(q)), rep, k, -1, rand);
  return { low, high: hi.chosen, tieLow: lo.tie, tieHigh: hi.tie, caught: caughtIn };
}

function inspect(s, round) {
  const card = s.deals[round === 'r4a' ? 'B' : 'C'];
  const rep = s.reports[round];
  const caught = [], caughtBy = {}, seen = {};
  for (const ins of s.inspectors) {
    seen[ins] = [];
    for (const q of s.checks[round][ins] || []) {
      const lie = q in rep && Math.abs(rep[q] - card[q]) >= 2;
      seen[ins].push({ pid: q, card: card[q], report: rep[q] ?? null, caught: lie });
      if (lie) { if (!caught.includes(q)) caught.push(q); (caughtBy[ins] = caughtBy[ins] || []).push(q); }
    }
  }
  const checked = [...new Set(Object.values(s.checks[round]).flat())];
  return { caught, caughtBy, seen, checked };
}

export function advance(s0, rand) {
  if (!canAdvance(s0).ok) return s0;
  const s = clone(s0);
  const next = PHASES[PHASES.indexOf(s.phase) + 1];
  const k = groupSize(provinceCount(s));
  if (s.phase === 'lobby') deal(s, 'A', rand);
  if (s.phase === 'r2') s.res.r2 = quota(s.reports.r2, k, rand);
  if (s.phase === 'r2_done') {
    // Round 3: the state takes half of each Round 2 report, rounded up, out of the true harvest.
    // Interpretation: a province that sent no report is assessed at the target of 7.
    const take = {}, paid = {}, famine = [];
    for (const pid of pidsByN(s)) {
      const r = s.reports.r2[pid] ?? TARGET;
      take[pid] = Math.ceil(r / 2);
      paid[pid] = Math.min(take[pid], s.deals.A[pid]);
      if (take[pid] > s.deals.A[pid]) famine.push(pid);
    }
    s.res.r3 = { take, paid, famine };
  }
  if (s.phase === 'r3_done') {
    // Two inspectors by lot, from provinces on phones (an inspector needs a screen to choose).
    const phones = pidsByN(s).filter((q) => !s.players[q].paper);
    s.inspectors = shuffle(phones, rand).slice(0, 2);
    deal(s, 'B', rand);
  }
  if (s.phase === 'r4_brief') s.inspectors.forEach((q) => { s.reports.r4a[q] = s.deals.B[q]; });
  if (s.phase === 'r4a_check') { const I = inspect(s, 'r4a'); s.res.r4a = { ...quota(s.reports.r4a, k, rand, I.caught), ...I }; }
  if (s.phase === 'r4a_done') deal(s, 'C', rand);
  if (s.phase === 'r4b_poll') s.inspectors.forEach((q) => { s.reports.r4b[q] = s.deals.C[q]; });
  if (s.phase === 'r4b_check') { const I = inspect(s, 'r4b'); s.res.r4b = { ...quota(s.reports.r4b, k, rand, I.caught), ...I }; }
  s.phase = next;
  return s;
}

export function chair(s0, honour) {
  if (s0.phase !== 'r4b_chair') return s0;
  const s = clone(s0); s.premium = !!honour; return s;
}

// ---------- grain kept ----------
// Interpretation: each year's grain is the true card, minus what the state took, plus or minus 2
// for re-education or promotion, floored at 0. Inspectors gain 1 per liar they caught.
export function ledger(s) {
  const out = {};
  for (const pid of pidsByN(s)) {
    const L = { A: null, B: null, C: null, notes: [] };
    const adj = (res) => (res?.low.includes(pid) ? -2 : res?.high.includes(pid) ? 2 : 0);
    if (s.res.r3) {
      L.A = Math.max(0, s.deals.A[pid] - s.res.r3.paid[pid] + adj(s.res.r2));
    } else if (s.res.r2) L.A = Math.max(0, s.deals.A[pid] + adj(s.res.r2));
    if (s.res.r4a) L.B = Math.max(0, s.deals.B[pid] + adj(s.res.r4a) + (s.res.r4a.caughtBy[pid]?.length || 0));
    if (s.res.r4b && s.phase !== 'r4b_chair') {
      const confirmed = s.premium && s.res.r4b.checked.includes(pid) && !s.res.r4b.caught.includes(pid);
      L.C = Math.max(0, s.deals.C[pid] + adj(s.res.r4b) + (s.res.r4b.caughtBy[pid]?.length || 0) + (confirmed ? 2 : 0));
      L.premium = !!confirmed;
    }
    L.total = (L.A || 0) + (L.B || 0) + (L.C || 0);
    out[pid] = L;
  }
  return out;
}

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const ns = (s, list) => (list || []).map((q) => nOf(s, q)).sort((a, b) => a - b);
const after = (s, ph) => PHASES.indexOf(s.phase) >= PHASES.indexOf(ph);

// ---------- what the projector may show: public information only ----------
export function publicView(s) {
  const pids = pidsByN(s);
  const v = {
    game: 'harvest', room: s.room, phase: s.phase, n: pids.length, k: groupSize(pids.length), checksEach: checksEach(s),
    provinces: pids.map((q) => ({ n: nOf(s, q), paper: s.players[q].paper, inspector: s.inspectors.includes(q) })),
    inspectors: ns(s, s.inspectors),
    submitted: {},
  };
  for (const r of Object.keys(REPORT_PHASES)) v.submitted[r] = ns(s, Object.keys(s.reports[r]));
  v.checksIn = { r4a: ns(s, Object.keys(s.checks.r4a)), r4b: ns(s, Object.keys(s.checks.r4b)) };
  v.pollIn = Object.keys(s.poll).length;
  const qv = (r) => r && ({ low: ns(s, r.low), high: ns(s, r.high), caught: ns(s, r.caught),
    tieLow: r.tieLow && { value: r.tieLow.value, tied: ns(s, r.tieLow.tied), chosen: ns(s, r.tieLow.chosen) },
    tieHigh: r.tieHigh && { value: r.tieHigh.value, tied: ns(s, r.tieHigh.tied), chosen: ns(s, r.tieHigh.chosen) } });
  if (after(s, 'r1_done')) v.r1 = { total: sum(s.reports.r1), count: Object.keys(s.reports.r1).length };
  if (after(s, 'r2_done')) v.r2 = { total: sum(s.reports.r2), count: Object.keys(s.reports.r2).length, ...qv(s.res.r2) };
  if (after(s, 'r3_done')) {
    const A = s.deals.A, r3 = s.res.r3;
    v.r3 = {
      trueTotal: sum(A), reportedTotal: sum(s.reports.r2), taken: sum(r3.paid), famine: ns(s, r3.famine),
      rows: pids.map((q) => ({ n: nOf(s, q), card: A[q], r1: s.reports.r1[q] ?? null, r2: s.reports.r2[q] ?? null,
        take: r3.take[q], paid: r3.paid[q], famine: r3.famine.includes(q),
        low: s.res.r2.low.includes(q), high: s.res.r2.high.includes(q) })),
      honestReeducated: ns(s, s.res.r2.low.filter((q) => s.reports.r2[q] === A[q])),
    };
  }
  const roundView = (r, deal) => {
    const R = s.res[r];
    return { reportedTotal: sum(s.reports[r]), trueTotal: sum(s.deals[deal]), count: Object.keys(s.reports[r]).length,
      checked: ns(s, R.checked), ...qv(R),
      checkedGap: R.checked.reduce((a, q) => a + ((s.reports[r][q] ?? 0) - s.deals[deal][q]), 0),
      uncheckedGap: pids.filter((q) => !R.checked.includes(q) && q in s.reports[r]).reduce((a, q) => a + (s.reports[r][q] - s.deals[deal][q]), 0) };
  };
  if (after(s, 'r4a_done')) v.r4a = roundView('r4a', 'B');
  if (after(s, 'r4b_poll')) v.poll = { yes: Object.values(s.poll).filter(Boolean).length, no: Object.values(s.poll).filter((x) => !x).length };
  if (after(s, 'r4b_chair')) v.r4b = roundView('r4b', 'C');
  if (after(s, 'r4b_done')) v.premium = s.premium;
  if (s.phase === 'end') {
    const L = ledger(s);
    v.final = pids.map((q) => ({ n: nOf(s, q), total: L[q].total, A: L[q].A, B: L[q].B, C: L[q].C,
      famine: s.res.r3.famine.includes(q), honestReeducated: s.res.r2.low.includes(q) && s.reports.r2[q] === s.deals.A[q] }))
      .sort((a, b) => b.total - a.total);
  }
  return v;
}

// ---------- what one phone may see ----------
export function privateView(s, pid) {
  const p = s.players[pid];
  if (!p) return null;
  const d = DEAL_OF(s.phase);
  const out = { n: p.n, inspector: s.inspectors.includes(pid), card: s.phase === 'lobby' ? null : s.deals[d]?.[pid] ?? null };
  if (REPORT_PHASES[s.phase]) out.myReport = s.reports[s.phase][pid] ?? null;
  const round = s.phase.startsWith('r4a') ? 'r4a' : s.phase.startsWith('r4b') ? 'r4b' : null;
  if (out.inspector && round) {
    out.checks = (s.checks[round][pid] || []).map((q) => nOf(s, q));
    out.options = pidsByN(s).filter((q) => q !== pid).map((q) => nOf(s, q));
    if (s.res[round]) out.seen = s.res[round].seen[pid].map((x) => ({ n: nOf(s, x.pid), card: x.card, report: x.report, caught: x.caught }));
  }
  if (s.phase === 'r4b_poll') out.believe = s.poll[pid] ?? null;
  const L = ledger(s)[pid];
  out.ledger = L;
  const fate = (r) => (s.res[r]?.low.includes(pid) ? 'low' : s.res[r]?.high.includes(pid) ? 'high' : null);
  out.fate = { r2: fate('r2'), r4a: fate('r4a'), r4b: fate('r4b'),
    caught4a: !!s.res.r4a?.caught.includes(pid), caught4b: !!s.res.r4b?.caught.includes(pid) };
  if (s.res.r3) out.r3 = { take: s.res.r3.take[pid], paid: s.res.r3.paid[pid], famine: s.res.r3.famine.includes(pid) };
  if (s.phase === 'end') {
    const all = Object.values(ledger(s)).map((x) => x.total).sort((a, b) => b - a);
    out.rank = 1 + all.filter((t) => t > L.total).length;
    out.of = all.length;
  }
  return out;
}
