// The Petition Box: game engine. Pure functions, no screen code, so the same file runs on
// the projector and in the Node checks (tools/check-petition.mjs).
// Rules: module/2026-11-25_petition-box_dictators-dilemma-game.md (rebalanced 2026-11-25).
// Interpretations of unclear rules are marked "Interpretation" and listed in the build note.

export const PROVS = ['north', 'south', 'east', 'west'];
export const SEATS = ['palace', ...PROVS, 'chief'];
// Display names (2026-11-25 redesign): the fictional country of Valmora. Keys and rules are unchanged.
export const SEAT_NAME = { palace: 'The Palace', north: 'Copper Hills', south: 'Wheat Plains', east: 'Harbour Coast', west: 'Western Valleys', chief: 'Police Chief' };
export const EVENTS = {
  1: { name: 'Drought', d: 2 }, 2: { name: 'Prices rise', d: 1 }, 3: { name: 'A local official is caught stealing', d: 1 },
  4: { name: 'Quiet year', d: 0 }, 5: { name: 'Good harvest', d: -1 }, 6: { name: 'A new road', d: -1 },
};
export const BAND = (g) => (g <= 3 ? 'L' : g <= 6 ? 'M' : 'H');
export const BAND_NAME = { L: 'Calm (0–3)', M: 'Restless (4–6)', H: 'Angry (7–10)' };
export const BAND_WORD = { L: 'calm', M: 'restless', H: 'angry' };
const clamp = (g) => Math.max(0, Math.min(10, g));
export const TOKENS = 8, STAB0 = 12, COUP_FROM = 6, COUP_NEEDS = 11, SIMMER = 8, GIFT_MAX = 3, RIVAL_COST = 3;
export const NEGLECT_FROM = 7; // an angry province (7+) given neither aid nor an answer this year costs 1 Stability
export const STEPS = ['palace', 'event', 'signals', 'resolve', 'chief', 'ear'];

export const DEFAULT_SETTINGS = {
  years: 4,
  boxCost: 2,            // design: 2. Open option: 1.
  event3: 'none',        // design: no rule. Option 'answer3': answering a petition made in an Event 3 year removes 3.
  coordNeedsPetition: false, // design: no link. Option: coordination counts only if a petition was read aloud this year or last.
  neglect: true,         // added 2026-11-26: ignored anger costs Stability. Off reproduces the earlier rules (and the Python simulation).
};

const clone = (s) => JSON.parse(JSON.stringify(s));

export function newGame(room, settings = {}, rand = Math.random) {
  const starts = shuffle([2, 4, 6, 8], rand);
  const prov = {};
  PROVS.forEach((k, i) => { prov[k] = { g: starts[i], pts: 0, box: false, police: false, pending: null, gifts: 0, answered: 0, protests: 0, crushed: 0, event: null, eventYear: 0, notes: [] }; });
  return {
    game: 'petition', v: 3, room, settings: { ...DEFAULT_SETTINGS, ...settings },
    seats: {}, players: {}, year: 0, step: 'lobby', stab: STAB0, strength: 0, prov,
    palace: { saved: 0, rival: false, rivalYear: 0, paid: 0, whisper: null, est: {}, plan: null, spent: null },
    chiefs: [{ score: 0, from: 1 }], chiefPurged: false,
    signals: {}, revealed: null, readAloud: { [0]: false }, log: [], history: [], end: null, start: { ...Object.fromEntries(PROVS.map((k) => [k, prov[k].g])) },
    chiefChoice: null, coupRoll: null,
  };
}

export function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const d6 = (rand) => 1 + Math.floor(rand() * 6);

export const seatOf = (s, pid) => s.players[pid]?.seat || null;
// Police places are secret from the provinces (and the projector) until the signals are read;
// only the number placed is public. Rebalanced 2026-11-25: plans/2026-11-25_petition-secret-police.md.
export const policeHidden = (s) => s.step === 'event' || s.step === 'signals';
export const policeCount = (s) => PROVS.filter((k) => s.prov[k].police).length;

// ---------- the Palace's plan: validation and cost ----------
export function planCost(s, plan) {
  let c = 0;
  for (const k of PROVS) {
    c += (plan.gifts?.[k] || 0) + (plan.police?.[k] ? 1 : 0) + (plan.open?.[k] ? s.settings.boxCost : 0) + (plan.answer?.[k] ? 1 : 0);
  }
  return c + (plan.pay || 0) + (plan.rival ? RIVAL_COST : 0) + (plan.save || 0);
}

export function planProblems(s, plan) {
  const out = [];
  for (const k of PROVS) {
    const g = plan.gifts?.[k] || 0;
    if (!Number.isInteger(g) || g < 0 || g > GIFT_MAX) out.push(`Gifts to ${SEAT_NAME[k]} must be 0 to ${GIFT_MAX}.`);
    if (plan.open?.[k] && s.prov[k].box) out.push(`${SEAT_NAME[k]}'s box is already open.`);
    if (plan.answer?.[k] && !s.prov[k].pending) out.push(`${SEAT_NAME[k]} has no petition to answer.`);
  }
  if (plan.rival && s.palace.rival) out.push('The rival agency can be bought only once.');
  for (const f of ['pay', 'save']) if (!Number.isInteger(plan[f] || 0) || (plan[f] || 0) < 0) out.push('Token counts must be whole numbers.');
  const c = planCost(s, plan);
  if (c > TOKENS) out.push(`The plan costs ${c} tokens; the Palace has ${TOKENS}.`);
  return out;
}

function normPlan(p) {
  const o = { gifts: {}, police: {}, open: {}, answer: {}, pay: Math.max(0, Math.round(p.pay || 0)), save: Math.max(0, Math.round(p.save || 0)), rival: !!p.rival };
  for (const k of PROVS) {
    o.gifts[k] = Math.max(0, Math.round(p.gifts?.[k] || 0)); o.police[k] = !!p.police?.[k]; o.open[k] = !!p.open?.[k]; o.answer[k] = !!p.answer?.[k];
  }
  return o;
}

// ---------- actions from phones ----------
export function applyAction(s0, a) {
  const s = clone(s0);
  if (a.type === 'join') {
    const p = s.players[a.pid];
    if (p) return s0;
    if (!SEATS.includes(a.seat) || s.seats[a.seat]) return s0;
    s.players[a.pid] = { seat: a.seat, key: a.key };
    s.seats[a.seat] = a.pid;
    return s;
  }
  const p = s.players[a.pid];
  if (!p || p.key !== a.key || s.end) return s0;
  const seat = p.seat;
  if (seat === 'palace' && s.step === 'palace') {
    if (a.type === 'whisper' && s.palace.rival && s.palace.rivalYear < s.year && !s.palace.whisper && PROVS.includes(a.prov)) {
      s.palace.whisper = { prov: a.prov, band: BAND(s.prov[a.prov].g) };
      return s;
    }
    if (a.type === 'plan') {
      const plan = normPlan(a.plan || {});
      if (planProblems(s, plan).length) return s0;
      s.palace.plan = plan;
      return s;
    }
  }
  if (seat === 'palace' && s.step === 'ear' && a.type === 'estimate') {
    const est = {};
    for (const k of PROVS) est[k] = ['L', 'M', 'H'].includes(a.est?.[k]) ? a.est[k] : null;
    s.palace.est = est; s.palace.estYear = s.year;
    return s;
  }
  if (PROVS.includes(seat) && s.step === 'signals' && a.type === 'signal') {
    const ok = ['praise', 'silence', 'protest'].includes(a.signal) || (a.signal === 'petition' && s.prov[seat].box);
    if (!ok) return s0;
    s.signals[seat] = a.signal;
    return s;
  }
  if (seat === 'chief' && s.step === 'chief' && a.type === 'coup' && s.chiefChoice === null && s.strength >= COUP_FROM) {
    s.chiefChoice = a.strike ? 'strike' : 'wait';
    return s;
  }
  return s0;
}

export function freeSeat(s0, seat) {
  const s = clone(s0); const pid = s.seats[seat];
  if (pid) { delete s.players[pid]; delete s.seats[seat]; }
  return s;
}

export const coupNeed = (s) => COUP_NEEDS - (s.strength - s.palace.paid); // the die roll needed

// ---------- the leader's "Next" ----------
export function canAdvance(s) {
  // A fall to the street is shown on "What happened" first; Next then opens the reveal.
  if (s.end) return s.step === 'end' ? { ok: false, why: 'The game is over.' } : { ok: true };
  if (s.step === 'lobby') {
    const missing = SEATS.filter((k) => !s.seats[k]);
    return missing.length ? { ok: false, soft: true, why: `Not yet joined: ${missing.map((k) => SEAT_NAME[k]).join(', ')}.` } : { ok: true };
  }
  if (s.step === 'palace' && !s.palace.plan) return { ok: false, soft: true, why: 'The Palace has not sent its plan.' };
  if (s.step === 'signals') {
    const missing = PROVS.filter((k) => !s.signals[k]);
    if (missing.length) return { ok: false, soft: true, why: `No signal yet from ${missing.map((k) => SEAT_NAME[k]).join(', ')}.` };
  }
  if (s.step === 'chief' && s.chiefChoice === null) return { ok: false, soft: true, why: 'The Police Chief has not decided.' };
  if (s.step === 'ear' && s.palace.estYear !== s.year) return { ok: false, soft: true, why: 'The Palace has not written its estimates.' };
  return { ok: true };
}

const say = (s, text, kind = '') => s.log.push({ year: s.year, text, kind });

// force: the leader moves on anyway. Missing choices default to: the Palace spends nothing
// (and saves nothing), a province stays silent, the Chief waits, estimates stay as they were.
export function advance(s0, rand, force = false) {
  const chk = canAdvance(s0);
  if (!chk.ok && !(force && chk.soft)) return s0;
  const s = clone(s0);
  if (s.step === 'lobby') return startYear(s);
  if (s.step === 'palace') { applyPlan(s); s.step = 'event'; rollEvents(s, rand); return s; }
  if (s.step === 'event') { s.step = 'signals'; return s; }
  if (s.step === 'signals') { resolve(s); s.step = 'resolve'; return s; }
  if (s.step === 'resolve') {
    if (s.end) { s.step = 'end'; return s; }
    if (s.strength >= COUP_FROM) { s.step = 'chief'; s.chiefChoice = null; s.coupRoll = null; return s; }
    s.step = 'ear'; return s;
  }
  if (s.step === 'chief') {
    if (s.chiefChoice === 'strike') {
      const r = d6(rand), total = r + s.strength - s.palace.paid;
      s.coupRoll = { roll: r, strength: s.strength, paid: s.palace.paid, total, success: total >= COUP_NEEDS };
      if (total >= COUP_NEEDS) {
        say(s, `The Police Chief strikes: rolls ${r} + Strength ${s.strength} − ${s.palace.paid} paid = ${total}. The coup succeeds.`, 'bad');
        s.chiefs[s.chiefs.length - 1].score += 10;
        return finish(s, 'coup');
      }
      say(s, `The Police Chief strikes: rolls ${r} + Strength ${s.strength} − ${s.palace.paid} paid = ${total}. The coup fails; the Chief is purged and Police Strength falls to 0.`, 'warn');
      s.strength = 0; s.chiefs.push({ score: 0, from: s.year + 1 }); s.chiefPurged = true;
    } else {
      s.chiefChoice = 'wait'; say(s, 'The Police Chief waits.');
    }
    s.step = 'ear'; return s;
  }
  if (s.step === 'ear') {
    s.history.push({ year: s.year, g: Object.fromEntries(PROVS.map((k) => [k, s.prov[k].g])), est: { ...s.palace.est }, signals: { ...s.signals } });
    if (s.year >= s.settings.years) return finish(s, 'survived');
    return startYear(s);
  }
  return s0;
}

function startYear(s) {
  s.year += 1; s.step = 'palace';
  s.palace.plan = null; s.palace.spent = null; s.palace.paid = 0; s.palace.whisper = null;
  s.signals = {}; s.revealed = null; s.chiefChoice = null; s.coupRoll = null; s.chiefPurged = false;
  for (const k of PROVS) { s.prov[k].police = false; s.prov[k].notes = []; }
  s.lastPlan = null; s.lastResolve = null;
  return s;
}

function applyPlan(s) {
  const plan = s.palace.plan || normPlan({});
  const notes = [];
  const strengthFrom = s.strength;
  const note = (k, kind, from, extra = {}) => s.prov[k].notes.push({ kind, from, to: s.prov[k].g, ...extra });
  if (plan.rival) {
    const before = s.strength;
    s.strength = Math.floor(s.strength / 2);
    s.palace.rival = true; s.palace.rivalYear = s.year;
    notes.push(`buys a rival agency (Police Strength ${before} → ${s.strength})`);
  }
  for (const k of PROVS) {
    const P = s.prov[k];
    if (plan.gifts[k]) { const f = P.g; P.g = clamp(P.g - plan.gifts[k]); P.pts += plan.gifts[k]; P.gifts += plan.gifts[k]; note(k, 'aid', f, { n: plan.gifts[k] }); }
    if (plan.answer[k] && P.pending) {
      const cut = s.settings.event3 === 'answer3' && P.pending.event3 ? 3 : 2;
      const f = P.g; P.g = clamp(P.g - cut); P.pts += 2; P.answered += 1; P.pending = null; note(k, 'answered', f);
    }
    if (plan.open[k]) note(k, 'opened', P.g);
    if (plan.police[k]) note(k, 'police', P.g);
    if (plan.open[k]) P.box = true;
    if (plan.police[k]) P.police = true;
  }
  s.palace.paid = plan.pay; s.chiefs[s.chiefs.length - 1].score += plan.pay;
  s.palace.saved += plan.save;
  // Automatic effects (step 1): +1 Strength per police token; an unanswered petition from last year, +1 Grievance.
  const police = PROVS.filter((k) => s.prov[k].police).length;
  s.strength += police;
  const ignored = [];
  for (const k of PROVS) if (s.prov[k].pending) { const f = s.prov[k].g; s.prov[k].g = clamp(s.prov[k].g + 1); s.prov[k].pending = null; s.prov[k].ignored = (s.prov[k].ignored || 0) + 1; note(k, 'ignored', f); ignored.push(k); }
  s.lastPlan = { strengthFrom, strengthTo: s.strength, rival: plan.rival, rivalFrom: plan.rival ? strengthFrom : null, police, ignored };
  const parts = [];
  const gifts = PROVS.filter((k) => plan.gifts[k]).map((k) => `${plan.gifts[k]} to ${SEAT_NAME[k]}`);
  if (gifts.length) parts.push(`gives gifts (${gifts.join(', ')})`);
  const pol = PROVS.filter((k) => plan.police[k]).length;
  if (pol) parts.push(`stations police in ${pol === 1 ? 'one province' : `${pol} provinces`} (where stays secret until the signals are read)`);
  const op = PROVS.filter((k) => plan.open[k]).map((k) => SEAT_NAME[k]);
  if (op.length) parts.push(`opens the box in ${op.join(', ')}`);
  const an = PROVS.filter((k) => plan.answer[k]).map((k) => SEAT_NAME[k]);
  if (an.length) parts.push(`answers ${an.join(', ')}`);
  s.palace.spent = { gifts: plan.gifts, police: plan.police, open: plan.open, answer: plan.answer, rival: plan.rival, unspent: TOKENS - planCost(s, plan) };
  say(s, `The Palace ${[...notes, ...parts].join('; ') || 'does nothing visible'}. Police Strength is now ${s.strength}.`);
}

function rollEvents(s, rand) {
  for (const k of PROVS) {
    const r = d6(rand), P = s.prov[k];
    const f = P.g; P.event = r; P.eventYear = s.year; P.g = clamp(P.g + EVENTS[r].d);
    P.notes.push({ kind: 'event', roll: r, from: f, to: P.g });
  }
}

function resolve(s) {
  const unpoliced = [], lines = [];
  const sig = {};
  const RS = { stabFrom: s.stab, strengthFrom: s.strength, items: [] };
  for (const k of PROVS) sig[k] = s.signals[k] || 'silence';
  s.signals = sig;
  const revealed = {};
  for (const k of PROVS) {
    const P = s.prov[k];
    if (sig[k] === 'petition') {
      revealed[k] = { signal: 'petition', band: BAND(P.g) };
      P.pending = { event3: P.event === 3 };
    } else if (sig[k] === 'protest') {
      const large = P.g >= 6;
      revealed[k] = { signal: 'protest', size: large ? 'large' : 'small' };
      P.pts -= 1; P.protests += 1;
      if (P.police) {
        const f = P.g; P.pts -= 2; P.g = clamp(P.g + 1); s.strength += 1; P.crushed += 1;
        P.notes.push({ kind: 'crushed', from: f, to: P.g }); RS.items.push({ kind: 'crushed', prov: k, size: large ? 'large' : 'small' });
        revealed[k].crushed = true;
        lines.push(`${SEAT_NAME[k]}'s ${large ? 'large' : 'small'} protest is crushed by the police. Police Strength +1.`);
      } else {
        const d = large ? 2 : 1; s.stab -= d; unpoliced.push(k); RS.items.push({ kind: 'protest', prov: k, size: large ? 'large' : 'small', d });
        lines.push(`${SEAT_NAME[k]} protests (${large ? 'large' : 'small'}) with no police there: Stability −${d}.`);
      }
    } else revealed[k] = { signal: sig[k] };
  }
  const placed = PROVS.filter((k) => s.prov[k].police).map((k) => SEAT_NAME[k]);
  if (placed.length) lines.unshift(`The police stood in ${placed.join(', ')}.`);
  const readNow = PROVS.some((k) => sig[k] === 'petition');
  s.readAloud[s.year] = readNow;
  if (unpoliced.length >= 2) {
    const linked = !s.settings.coordNeedsPetition || readNow || s.readAloud[s.year - 1];
    if (linked) { s.stab -= 1; RS.items.push({ kind: 'coord', n: unpoliced.length, d: 1 }); lines.push(`${unpoliced.length} provinces protest at once: coordination, Stability −1.`); }
    else lines.push(`${unpoliced.length} provinces protest at once, but no petition has been read aloud, so they have not seen each other: no coordination penalty.`);
  }
  // The leader does not say where the anger is: that would tell the Palace a province's grievance.
  const simmer = PROVS.filter((k) => s.prov[k].g >= SIMMER).length;
  if (simmer) { s.stab -= simmer; RS.items.push({ kind: 'simmer', n: simmer, d: simmer }); lines.push(`Simmering anger in ${simmer === 1 ? 'one province' : `${simmer} provinces`} (which, the Palace does not know): Stability −${simmer}.`); }
  // Ignored anger: an angry province that got neither aid nor an answer this year. Announced as a count only.
  if (s.settings.neglect !== false) {
    const pl = s.palace.plan || normPlan({});
    const ignored = PROVS.filter((k) => s.prov[k].g >= NEGLECT_FROM && !pl.gifts[k] && !pl.answer[k]).length;
    if (ignored) { s.stab -= ignored; RS.items.push({ kind: 'neglect', n: ignored, d: ignored }); lines.push(`${ignored === 1 ? 'One angry province was' : `${ignored} angry provinces were`} given nothing this year (which, the Palace does not know): Stability −${ignored}.`); }
  }
  s.revealed = revealed;
  RS.stabTo = Math.max(0, s.stab); RS.strengthTo = s.strength; s.lastResolve = RS;
  for (const l of lines) say(s, l, l.includes('crushed') ? 'warn' : '');
  say(s, `Stability is ${Math.max(s.stab, 0)}. Police Strength is ${s.strength}.`);
  if (s.stab <= 0) {
    for (const k of PROVS) if (sig[k] === 'protest') s.prov[k].pts += 3;
    say(s, 'Stability has reached 0. The regime falls to the street.', 'bad');
    finish(s, 'street');
  }
}

function finish(s, reason) {
  s.end = { reason, year: s.year };
  s.step = 'end';
  if (reason !== 'survived' && !s.history.find((h) => h.year === s.year)) {
    s.history.push({ year: s.year, g: Object.fromEntries(PROVS.map((k) => [k, s.prov[k].g])), est: null, signals: { ...s.signals } });
  }
  return s;
}

// ---------- scores ----------
export function scores(s) {
  const fell = s.end && s.end.reason !== 'survived';
  const years = !s.end ? s.year - 1 : fell ? s.end.year - 1 : s.settings.years;
  const lastEst = [...s.history].reverse().find((h) => h.est)?.est || {};
  const correct = PROVS.filter((k) => lastEst[k] && lastEst[k] === BAND(s.prov[k].g)).length;
  const keepSaved = !fell || s.palace.saved >= 5;
  const palace = { years, yearsPts: 3 * years, saved: s.palace.saved, savedPts: keepSaved ? s.palace.saved : 0, keepSaved, correct, total: 3 * years + (keepSaved ? s.palace.saved : 0) + correct };
  const prov = {};
  for (const k of PROVS) { const P = s.prov[k]; prov[k] = { pts: P.pts, g: P.g, total: P.pts - P.g }; }
  const order = PROVS.slice().sort((a, b) => prov[b].total - prov[a].total);
  order.forEach((k) => { prov[k].rank = 1 + PROVS.filter((q) => prov[q].total > prov[k].total).length; });
  return { palace, chiefs: s.chiefs, prov, order };
}

// ---------- what the projector may show ----------
export function publicView(s) {
  const v = {
    game: 'petition', room: s.room, settings: s.settings, year: s.year, step: s.step, stab: Math.max(0, s.stab), strength: s.strength,
    seats: Object.fromEntries(SEATS.map((k) => [k, !!s.seats[k]])),
    boxes: Object.fromEntries(PROVS.map((k) => [k, s.prov[k].box])),
    police: Object.fromEntries(PROVS.map((k) => [k, !policeHidden(s) && s.prov[k].police])), policeCount: policeCount(s), policeHidden: policeHidden(s),
    pending: Object.fromEntries(PROVS.map((k) => [k, !!s.prov[k].pending])),
    rival: s.palace.rival, planIn: !!s.palace.plan, estIn: s.palace.estYear === s.year,
    signalsIn: PROVS.filter((k) => s.signals[k]).length,
    chiefDecided: s.chiefChoice !== null, chiefChoice: s.step === 'chief' ? null : s.chiefChoice,
    coupRoll: s.coupRoll, revealed: s.revealed, lastPlan: s.lastPlan || null, lastResolve: s.lastResolve || null, spent: s.palace.spent && { ...s.palace.spent, unspent: undefined, police: policeHidden(s) ? {} : s.palace.spent.police },
    log: s.log.slice(-40), end: s.end, coupLine: COUP_FROM,
  };
  if (s.end) {
    v.history = s.history.map((h) => ({ year: h.year, bands: Object.fromEntries(PROVS.map((k) => [k, BAND(h.g[k])])), g: h.g, est: h.est, signals: h.signals }));
    v.start = s.start; v.scores = scores(s); v.final = Object.fromEntries(PROVS.map((k) => [k, { ...s.prov[k] }]));
    v.saved = s.palace.saved; v.paidTotal = s.chiefs.reduce((a, c) => a + c.score, 0);
  }
  return v;
}

export function privateView(s, pid) {
  const seat = seatOf(s, pid);
  if (!seat) return null;
  const out = { seat };
  if (PROVS.includes(seat)) {
    const P = s.prov[seat];
    const hid = policeHidden(s);
    out.g = P.g; out.band = BAND(P.g); out.pts = P.pts; out.box = P.box; out.police = !hid && P.police; out.pending = !!P.pending;
    out.policeCount = policeCount(s); out.policeHidden = hid;
    out.event = P.eventYear === s.year ? { roll: P.event, ...EVENTS[P.event] } : null;
    out.signal = s.signals[seat] || null;
    out.notes = (P.notes || []).filter((n) => !(hid && n.kind === 'police'));
  }
  if (seat === 'palace') {
    out.plan = s.palace.plan; out.saved = s.palace.saved; out.whisper = s.palace.whisper;
    out.canWhisper = s.palace.rival && s.palace.rivalYear < s.year;
    out.est = s.palace.est; out.estYear = s.palace.estYear; out.paid = s.palace.paid;
    out.history = s.history.map((h) => ({ year: h.year, est: h.est, signals: h.signals }));
  }
  if (seat === 'chief') {
    out.score = s.chiefs[s.chiefs.length - 1].score; out.paid = s.palace.paid; out.need = coupNeed(s);
    out.choice = s.chiefChoice; out.purged = s.chiefPurged; out.chiefNo = s.chiefs.length;
  }
  return out;
}
