// The Harvest Report: game engine. Pure functions, no screen code, so the same file
// runs on the projector and in the Node checks (tools/check-harvest.mjs).
// Rules: module/2026-11-25_harvest-report_rules.md. Interpretations of unclear rules
// are marked "Interpretation" and listed in the build note.
// 2026-11-25 (plan quality_reports/plans/2026-11-25_harvest-jeopardy-and-regime-mode.md):
// the regime's granary and stability, purge on a second re-education, the hunger line,
// the signed honesty pledge, and the regime's choices (fixed in class, open in solo).

export const BASE_DECK = [1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 9];
export const TARGET = 7;
export const MIN_PROVINCES = 6;
// The regime's stakes
export const STAB0 = 10;          // Regime Stability at the start; at 0 the villages rise
export const NEED_PER = 3;        // sacks the cities need per village
export const SHORT_BLOCK = 5;     // Stability −1 for every 5 sacks the granary is short
export const INSPECTOR_COST = 3;  // sacks from the granary per inspector (only the Chairman mode chooses)
export const PREMIUM = 2;         // sacks paid to each confirmed signer, from the granary
export const RENEGE_PER = 3;      // Stability −1 for every 3 signers, rounded up, if the Chairman reneges
export const HUNGRY_BELOW = 2;    // a village left with fewer sacks after the collection is hungry
// Chairman mode only: a quota mobilises the villages, raising each real Round 2 harvest.
export const QUOTA_BOOST = { 0: 0, 2: 1, 3: 2 };
export const FAMINE_COST = 2;     // Stability lost per famine village
export const HUNGRY_PER = 5;      // Stability −1 for every 5 hungry villages not in famine
export const RATES = [0.25, 0.5, 0.75];
export const DEFAULT_POLICY = { k: null, rate: 0.5, inspectors: 2, premium: true }; // the class script
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
export const quotaK = (s) => (s.policy?.k ?? groupSize(provinceCount(s)));

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

export function newGame(room, policy = {}) {
  return {
    game: 'harvest', v: 4, room, phase: 'lobby', players: {}, nextN: 1,
    deals: {}, reports: { r1: {}, r2: {}, r4a: {}, r4b: {} }, res: {}, inspectors: [],
    checks: { r4a: {}, r4b: {} }, poll: {}, premium: null,
    policy: { ...DEFAULT_POLICY, ...policy },
    regime: { stab: STAB0, granary: 0, need: 0, charged: 0, events: [], fell: null },
  };
}

const clone = (s) => JSON.parse(JSON.stringify(s));
export const pidsByN = (s) => Object.keys(s.players).sort((a, b) => s.players[a].n - s.players[b].n);
export const nOf = (s, pid) => s.players[pid]?.n;
export const provinceCount = (s) => Object.keys(s.players).length;
const at = (s, ph) => PHASES.indexOf(s.phase) - PHASES.indexOf(ph);   // <0 before, 0 at, >0 after
export const signed = (s, pid) => s.poll[pid] === true;

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
  if (s.regime.fell) return s0;
  if (a.type === 'report' && REPORT_PHASES[s.phase]) {
    if (s.inspectors.includes(a.pid) && s.phase.startsWith('r4')) return s0; // inspectors report the truth automatically
    if (s.phase === 'r4b' && signed(s, a.pid)) return s0;                      // a signed pledge locks the report to the truth
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
  // The honesty pledge. Inspectors cannot sign: nobody checks them.
  if ((a.type === 'pledge' || a.type === 'believe') && s.phase === 'r4b_poll' && !s.inspectors.includes(a.pid)) {
    s.poll[a.pid] = !!a.yes; return s;
  }
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

// The regime's choices. In class they stay as the script sets them (DEFAULT_POLICY); in
// "play as the Chairman" the player makes each one before the step that uses it.
export const POLICY_UNTIL = { k: 'r2_brief', rate: 'r2_brief', inspectors: 'r3_done', premium: 'r4a_done' };
export function setPolicy(s0, key, value) {
  if (!(key in POLICY_UNTIL) || at(s0, POLICY_UNTIL[key]) > 0) return s0;
  const ok = { k: [0, 2, 3], rate: RATES, inspectors: [0, 1, 2], premium: [true, false] }[key].includes(value);
  if (!ok) return s0;
  const s = clone(s0); s.policy[key] = value; return s;
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

// ---------- the regime's meters ----------
function stab(s, d, ev) {
  const R = s.regime, from = R.stab;
  R.stab = Math.max(0, R.stab + d);
  R.events.push({ ...ev, stabFrom: from, stabTo: R.stab });
  if (R.stab <= 0 && !R.fell) R.fell = { phase: s.phase, round: ev.round };
}
// The granary changes; Stability falls by 1 for every further 5 sacks it is short of the cities' need.
function granary(s, d, ev) {
  const R = s.regime, from = R.granary;
  R.granary = Math.max(0, R.granary + d);
  const blocks = Math.ceil(Math.max(0, R.need - R.granary) / SHORT_BLOCK);
  const extra = blocks - R.charged;
  R.charged = Math.max(R.charged, blocks);
  if (extra > 0) stab(s, -extra, { ...ev, granaryFrom: from, granaryTo: R.granary, short: R.need - R.granary });
  else R.events.push({ ...ev, granaryFrom: from, granaryTo: R.granary, short: Math.max(0, R.need - R.granary), stabFrom: R.stab, stabTo: R.stab });
}
const autoReport = (s, round, deal) => s.inspectors.forEach((q) => { s.reports[round][q] = s.deals[deal][q]; });

export function advance(s0, rand) {
  if (!canAdvance(s0).ok) return s0;
  const s = clone(s0);
  if (s.regime.fell) { s.phase = 'end'; return s; }   // after the fall has been shown, the reveal
  let next = PHASES[PHASES.indexOf(s.phase) + 1];
  const k = quotaK(s);
  const P = s.policy;
  if (s.phase === 'lobby') { deal(s, 'A', rand); s.regime.need = NEED_PER * provinceCount(s); }
  // Chairman mode: the quota's mobilisation raises each real harvest from Round 2 (Round 1's is kept).
  if (s.phase === 'r1_done' && P.boost && QUOTA_BOOST[k]) {
    s.deals.A0 = { ...s.deals.A };
    for (const q of Object.keys(s.deals.A)) s.deals.A[q] += QUOTA_BOOST[k];
  }
  if (s.phase === 'r2') s.res.r2 = quota(s.reports.r2, k, rand);
  if (s.phase === 'r2_done') {
    // Round 3: the state takes its share of each Round 2 report (half in class), rounded up, out of the true harvest.
    // Interpretation: a province that sent no report is assessed at the target of 7.
    const take = {}, paid = {}, famine = [];
    for (const pid of pidsByN(s)) {
      const r = s.reports.r2[pid] ?? TARGET;
      take[pid] = Math.ceil(r * P.rate);
      paid[pid] = Math.min(take[pid], s.deals.A[pid]);
      if (take[pid] > s.deals.A[pid]) famine.push(pid);
    }
    s.res.r3 = { take, paid, famine, rate: P.rate };
    granary(s, Object.values(paid).reduce((a, b) => a + b, 0), { round: 'r3', kind: 'collect' });
    if (famine.length) stab(s, -FAMINE_COST * famine.length, { round: 'r3', kind: 'famine', n: famine.length });
    // Hunger: villages left under 2 sacks (after the ±2) that are not in famine; −1 for every 5.
    const adj = (q) => (s.res.r2.low.includes(q) ? -2 : s.res.r2.high.includes(q) ? 2 : 0);
    const hungry = pidsByN(s).filter((q) => !famine.includes(q) && Math.max(0, s.deals.A[q] - paid[q] + adj(q)) < HUNGRY_BELOW);
    const hc = Math.floor(hungry.length / HUNGRY_PER);
    if (hc) stab(s, -hc, { round: 'r3', kind: 'hunger', n: hungry.length });
  }
  if (s.phase === 'r3_done') {
    // Inspectors by lot, from provinces on phones (an inspector needs a screen to choose).
    const phones = pidsByN(s).filter((q) => !s.players[q].paper);
    s.inspectors = shuffle(phones, rand).slice(0, P.inspectors);
    // Interpretation: the class script's inspectors cost nothing; only the Chairman mode pays for them.
    if (s.policy.payInspectors && P.inspectors) granary(s, -INSPECTOR_COST * P.inspectors, { round: 'r4a', kind: 'inspectors', n: P.inspectors });
    deal(s, 'B', rand);
  }
  if (s.phase === 'r4_brief') autoReport(s, 'r4a', 'B');
  if (s.phase === 'r4a' && !s.inspectors.length) { s.res.r4a = { ...quota(s.reports.r4a, k, rand, []), caught: [], caughtBy: {}, seen: {}, checked: [] }; next = 'r4a_done'; }
  if (s.phase === 'r4a_check') { const I = inspect(s, 'r4a'); s.res.r4a = { ...quota(s.reports.r4a, k, rand, I.caught), ...I }; }
  if (s.phase === 'r4a_done') {
    deal(s, 'C', rand);
    if (!P.premium) { autoReport(s, 'r4b', 'C'); next = 'r4b'; }   // no offer: no pledge
  }
  if (s.phase === 'r4b_poll') {
    autoReport(s, 'r4b', 'C');
    for (const q of pidsByN(s)) if (signed(s, q)) s.reports.r4b[q] = s.deals.C[q];
  }
  const after4b = () => (P.premium ? 'r4b_chair' : 'r4b_done');
  if (s.phase === 'r4b' && !s.inspectors.length) { s.res.r4b = { ...quota(s.reports.r4b, k, rand, []), caught: [], caughtBy: {}, seen: {}, checked: [] }; next = after4b(); }
  if (s.phase === 'r4b_check') { const I = inspect(s, 'r4b'); s.res.r4b = { ...quota(s.reports.r4b, k, rand, I.caught), ...I }; next = after4b(); }
  if (s.phase === 'r4b_chair') {
    const signers = pidsByN(s).filter((q) => signed(s, q));
    if (s.premium) {
      const paid = confirmedSigners(s);
      s.res.r4b.paid = paid;
      granary(s, -PREMIUM * paid.length, { round: 'r4b', kind: 'premium', n: paid.length });
    } else {
      s.res.r4b.paid = [];
      if (signers.length) stab(s, -Math.ceil(signers.length / RENEGE_PER), { round: 'r4b', kind: 'renege', n: signers.length });
    }
  }
  s.phase = next;
  return s;
}

const confirmedSigners = (s) => (s.res.r4b ? s.res.r4b.checked.filter((q) => signed(s, q) && !s.res.r4b.caught.includes(q)) : []);

// What each choice would cost the regime, shown before the Chairman decides.
export function chairPreview(s) {
  if (!s.res.r4b) return null;
  const R = s.regime, paid = confirmedSigners(s), signers = pidsByN(s).filter((q) => signed(s, q));
  const gTo = Math.max(0, R.granary - PREMIUM * paid.length);
  const blocks = Math.ceil(Math.max(0, R.need - gTo) / SHORT_BLOCK);
  return {
    confirmed: paid.length, signers: signers.length, granaryFrom: R.granary, granaryTo: gTo, need: R.need,
    payStab: Math.max(0, blocks - R.charged), renegeStab: signers.length ? Math.ceil(signers.length / RENEGE_PER) : 0, stab: R.stab,
  };
}

export function chair(s0, honour) {
  if (s0.phase !== 'r4b_chair') return s0;
  const s = clone(s0); s.premium = !!honour; return s;
}

// ---------- grain kept ----------
// Interpretation: each year's grain is the true card, minus what the state took, plus or minus 2
// for re-education or promotion, floored at 0. Inspectors gain 1 per liar they caught.
// A village re-educated a second time is purged: all the grain it has kept so far, this
// harvest included, is lost. A village left with fewer than 2 sacks after the collection is hungry.
export function ledger(s) {
  const out = {};
  for (const pid of pidsByN(s)) {
    const L = { A: null, B: null, C: null, purged: null, hungry: false, premium: false };
    const adj = (res) => (res?.low.includes(pid) ? -2 : res?.high.includes(pid) ? 2 : 0);
    if (s.res.r3) {
      L.A = Math.max(0, s.deals.A[pid] - s.res.r3.paid[pid] + adj(s.res.r2));
      L.hungry = L.A < HUNGRY_BELOW;
    } else if (s.res.r2) L.A = Math.max(0, s.deals.A[pid] + adj(s.res.r2));
    if (s.res.r4a) L.B = Math.max(0, s.deals.B[pid] + adj(s.res.r4a) + (s.res.r4a.caughtBy[pid]?.length || 0));
    if (s.res.r4b && s.phase !== 'r4b_chair') {
      const confirmed = !!s.premium && (s.res.r4b.paid || []).includes(pid);
      L.C = Math.max(0, s.deals.C[pid] + adj(s.res.r4b) + (s.res.r4b.caughtBy[pid]?.length || 0) + (confirmed ? PREMIUM : 0));
      L.premium = confirmed;
    }
    // The purge: the second re-education wipes out everything kept so far, this harvest included.
    const order = [['A', 'r2'], ['B', 'r4a'], ['C', 'r4b']];
    let lows = 0;
    order.forEach(([key, r], i) => {
      if (L[key] == null || !s.res[r]?.low.includes(pid)) return;
      lows += 1;
      if (lows < 2) return;
      const keys = order.slice(0, i + 1).map((o) => o[0]).filter((x) => L[x] != null);
      L.lost = (L.lost || 0) + keys.reduce((a, x) => a + L[x], 0);
      keys.forEach((x) => { L[x] = 0; });
      L.purged = L.purged || r;
    });
    L.total = (L.A || 0) + (L.B || 0) + (L.C || 0);
    out[pid] = L;
  }
  return out;
}

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
const ns = (s, list) => (list || []).map((q) => nOf(s, q)).sort((a, b) => a - b);

// ---------- what the projector may show: public information only ----------
export function publicView(s) {
  const pids = pidsByN(s);
  const v = {
    game: 'harvest', room: s.room, phase: s.phase, n: pids.length, k: quotaK(s), checksEach: checksEach(s),
    provinces: pids.map((q) => ({ n: nOf(s, q), paper: s.players[q].paper, inspector: s.inspectors.includes(q) })),
    inspectors: ns(s, s.inspectors),
    submitted: {},
    policy: s.policy,
    regime: { stab: s.regime.stab, stab0: STAB0, granary: s.regime.granary, need: s.regime.need, fell: s.regime.fell, events: s.regime.events },
  };
  for (const r of Object.keys(REPORT_PHASES)) v.submitted[r] = ns(s, Object.keys(s.reports[r]));
  v.checksIn = { r4a: ns(s, Object.keys(s.checks.r4a)), r4b: ns(s, Object.keys(s.checks.r4b)) };
  v.pollIn = Object.keys(s.poll).length;
  const qv = (r) => r && ({ low: ns(s, r.low), high: ns(s, r.high), caught: ns(s, r.caught),
    tieLow: r.tieLow && { value: r.tieLow.value, tied: ns(s, r.tieLow.tied), chosen: ns(s, r.tieLow.chosen) },
    tieHigh: r.tieHigh && { value: r.tieHigh.value, tied: ns(s, r.tieHigh.tied), chosen: ns(s, r.tieHigh.chosen) } });
  const L = s.res.r2 ? ledger(s) : null;
  if (s.reports.r1 && at(s, 'r1_done') >= 0) v.r1 = { total: sum(s.reports.r1), count: Object.keys(s.reports.r1).length };
  if (s.res.r2) v.r2 = { total: sum(s.reports.r2), count: Object.keys(s.reports.r2).length, ...qv(s.res.r2) };
  if (s.res.r3) {
    const A = s.deals.A, r3 = s.res.r3;
    v.r3 = {
      trueTotal: sum(A), r1True: sum(s.deals.A0 || A), boost: s.deals.A0 ? sum(A) - sum(s.deals.A0) : 0, reportedTotal: sum(s.reports.r2), taken: sum(r3.paid), famine: ns(s, r3.famine), rate: r3.rate,
      hungry: ns(s, pids.filter((q) => L[q].hungry)),
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
      purged: ns(s, pids.filter((q) => L[q].purged === r)),
      checkedGap: R.checked.reduce((a, q) => a + ((s.reports[r][q] ?? 0) - s.deals[deal][q]), 0),
      uncheckedGap: pids.filter((q) => !R.checked.includes(q) && q in s.reports[r]).reduce((a, q) => a + (s.reports[r][q] - s.deals[deal][q]), 0) };
  };
  if (s.res.r2) v.r2.purged = [];
  if (s.res.r4a && at(s, 'r4a_done') >= 0) v.r4a = roundView('r4a', 'B');
  if (at(s, 'r4b') >= 0 && s.policy.premium && s.deals.C) {
    const signers = pids.filter((q) => signed(s, q));
    v.poll = { yes: signers.length, no: Object.values(s.poll).filter((x) => !x).length, signed: ns(s, signers) };
  }
  if (s.res.r4b && at(s, 'r4b_chair') >= 0) v.r4b = roundView('r4b', 'C');
  if (s.res.r4b && at(s, 'r4b_done') >= 0) { v.premium = s.premium; v.r4b.paid = ns(s, s.res.r4b.paid || []); }
  if (s.phase === 'r4b_chair') v.chairPreview = chairPreview(s);
  if (s.phase === 'end') {
    v.final = pids.map((q) => ({ n: nOf(s, q), total: L ? L[q].total : 0, A: L?.[q].A, B: L?.[q].B, C: L?.[q].C,
      famine: !!s.res.r3?.famine.includes(q), hungry: !!L?.[q].hungry, purged: L?.[q].purged || null,
      honestReeducated: !!s.res.r2 && s.res.r2.low.includes(q) && s.reports.r2[q] === s.deals.A[q] }))
      .sort((a, b) => b.total - a.total);
  }
  return v;
}

// What the Chairman sees in "play as the Chairman": each village's reports once a round closes,
// and nothing about true harvests until the projector reveals them.
export function chairView(s) {
  const out = {};
  for (const r of Object.keys(REPORT_PHASES)) {
    if (at(s, r) <= 0) continue;
    out[r] = Object.fromEntries(pidsByN(s).filter((q) => q in s.reports[r]).map((q) => [nOf(s, q), s.reports[r][q]]));
  }
  return out;
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
    if (s.res[round] && s.res[round].seen[pid]) out.seen = s.res[round].seen[pid].map((x) => ({ n: nOf(s, x.pid), card: x.card, report: x.report, caught: x.caught }));
  }
  out.pledged = s.poll[pid] ?? null;
  out.believe = out.pledged;
  const L = ledger(s)[pid];
  out.ledger = L;
  const fate = (r) => (s.res[r]?.low.includes(pid) ? 'low' : s.res[r]?.high.includes(pid) ? 'high' : null);
  out.fate = { r2: fate('r2'), r4a: fate('r4a'), r4b: fate('r4b'),
    caught4a: !!s.res.r4a?.caught.includes(pid), caught4b: !!s.res.r4b?.caught.includes(pid) };
  out.reeducated = ['r2', 'r4a', 'r4b'].filter((r) => s.res[r]?.low.includes(pid)).length;
  if (s.res.r3) out.r3 = { take: s.res.r3.take[pid], paid: s.res.r3.paid[pid], famine: s.res.r3.famine.includes(pid) };
  if (s.phase === 'end') {
    const all = Object.values(ledger(s)).map((x) => x.total).sort((a, b) => b - a);
    out.rank = 1 + all.filter((t) => t > L.total).length;
    out.of = all.length;
  }
  return out;
}
