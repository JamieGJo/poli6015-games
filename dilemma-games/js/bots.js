// Computer players for "Play against the computer" (solo.html) and the bot check
// (tools/check-bots.mjs). Pure functions: no page, no network. Rules live in the engines.
// Strategies follow the earlier engine checks (tools/check-harvest.mjs, tools/check-petition.mjs).
import * as H from './harvest.js';
import * as P from './petition.js';

export const ME = 'me';
const pick = (mix, rand) => { const r = rand(); let acc = 0; return Object.keys(mix).find((t) => (acc += mix[t]) >= r) || Object.keys(mix)[0]; };

// ================= The Harvest Report =================
// You are one village among 19 computer villages. Their mix is the one simulated for the
// design (30% honest, 40% "safe": report at least 7, 20% "nudge": add 2, 10% "max": always 9).
export const HARVEST_MIX = { honest: 0.3, safe: 0.4, nudge: 0.2, max: 0.1 };
export const HARVEST_TYPE_NAME = { honest: 'reports the truth', safe: 'reports at least 7 to stay safe', nudge: 'adds 2', max: 'always reports the most it can' };

export function harvestSetup(rand, n = 20) {
  let s = H.newGame('SOLO');
  s = H.applyAction(s, { type: 'join', pid: ME, key: ME });
  const kinds = {};
  for (let i = 1; i < n; i++) {
    const pid = `bot${i}`;
    s = H.applyAction(s, { type: 'join', pid, key: pid });
    kinds[pid] = pick(HARVEST_MIX, rand);
  }
  // Shuffle the village numbers so the human is not always village 1.
  const nums = H.shuffle(Object.keys(s.players).map((q) => s.players[q].n), rand);
  Object.keys(s.players).forEach((q, i) => { s.players[q].n = nums[i]; });
  return { s: H.advance(s, rand), mem: { kinds } };
}

// What a computer village reports. In Round 4 the types adapt to the inspectors: liars
// shade their report to 1 above the truth, which no inspector can catch; "max" keeps
// gambling. In Round 4b, villages that believed the premium report the truth.
function botReport(kind, card, phase, believed) {
  if (phase === 'r1') return card;
  if (phase === 'r2') return Math.min(12, { honest: card, safe: Math.max(card, 7), nudge: card + 2, max: 9 }[kind]);
  if (phase === 'r4b' && believed) return card;
  return Math.min(12, { honest: card, safe: card + 1, nudge: card + 1, max: 9 }[kind]);
}

export function harvestBots(s, mem, rand) {
  let t = s;
  const act = (a) => { t = H.applyAction(t, { ...a, key: a.pid }); };
  const bots = Object.keys(t.players).filter((q) => q !== ME);
  if (H.REPORT_PHASES[t.phase]) {
    for (const q of bots) {
      if (t.reports[t.phase][q] != null) continue;
      if (t.inspectors.includes(q) && t.phase.startsWith('r4')) continue;
      const card = H.privateView(t, q).card;
      act({ type: 'report', pid: q, value: botReport(mem.kinds[q], card, t.phase, t.poll[q]) });
    }
  }
  if (t.phase === 'r4a_check' || t.phase === 'r4b_check') {
    const r = t.phase.slice(0, 3);
    for (const q of t.inspectors) {
      if (q === ME || t.checks[r][q]) continue;
      const opts = H.privateView(t, q).options;
      act({ type: 'check', pid: q, list: H.shuffle(opts, rand).slice(0, H.checksEach(t)) });
    }
  }
  if (t.phase === 'r4b_poll') {
    for (const q of bots) if (t.poll[q] == null) act({ type: 'believe', pid: q, yes: rand() < (mem.kinds[q] === 'honest' ? 0.8 : 0.5) });
  }
  if (t.phase === 'r4b_chair') t = H.chair(t, chairmanHonours(t));
  return t;
}

// The computer Chairman: honours the premium unless the reports still run well above the
// true harvest (more than 10% over), in which case "the Plan has been reconsidered".
export function chairmanHonours(s) {
  const rep = Object.values(s.reports.r4b).reduce((a, b) => a + b, 0);
  const tru = Object.values(s.deals.C).reduce((a, b) => a + b, 0);
  return rep <= tru * 1.1;
}

// ================= The Petition Box =================
// You play the Palace or one province. The computer plays everyone else.
// Computer Palace, two styles (both from the engine check):
//   balanced: answers petitions, polices last year's protests, opens two boxes in Year 1,
//             sends aid elsewhere, buys the rival agency once Strength reaches 3;
//   harsh:    police in every province every year, the rest paid to the Chief ("repressor").
export const PALACE_STYLES = {
  balanced: 'Balanced: answers petitions, polices protests, sends aid, and buys a rival agency when the police grow strong.',
  harsh: 'Harsh: police in every province every year, and the rest of the budget paid to the Police Chief.',
};
// Computer provinces: each is
// either sincere (signals its real mood) or mixed (protests 35% of the time regardless).
// Computer Chief: strikes when the chance of success is at least one in three.
export function petitionSetup(rand, mySeat, palaceStyle = 'balanced') {
  let s = P.newGame('SOLO', {}, rand);
  for (const seat of P.SEATS) {
    const pid = seat === mySeat ? ME : `bot-${seat}`;
    s = P.applyAction(s, { type: 'join', pid, key: pid, seat });
  }
  const kinds = Object.fromEntries(P.PROVS.map((k) => [k, rand() < 0.5 ? 'sincere' : 'mixed']));
  return { s: P.advance(s, rand), mem: { kinds, last: {}, known: {}, mySeat, lastYear: 0, palaceStyle: PALACE_STYLES[palaceStyle] ? palaceStyle : 'balanced' } };
}

function palacePlan(pub, last, style = 'balanced') {
  let tok = P.TOKENS; const plan = { gifts: {}, police: {}, open: {}, answer: {}, pay: 0, save: 0, rival: false };
  const spend = (c) => (tok >= c ? ((tok -= c), true) : false);
  const K = P.PROVS;
  if (style === 'harsh') {
    K.forEach((k) => { if (spend(1)) plan.police[k] = true; });
    while (spend(1)) plan.pay += 1;
    return plan;
  }
  let strength = pub.strength;
  if (strength >= 3 && !pub.rival && spend(P.RIVAL_COST)) { plan.rival = true; strength = Math.floor(strength / 2); }
  K.forEach((k) => { if (pub.pending[k] && spend(1)) plan.answer[k] = true; });
  K.forEach((k) => { if (last[k] === 'protest' && spend(1)) plan.police[k] = true; });
  if (pub.year === 1) {
    for (const k of K) {
      if (!pub.boxes[k] && spend(pub.settings.boxCost)) plan.open[k] = true;
      if (K.filter((q) => pub.boxes[q] || plan.open[q]).length >= 2) break;
    }
  }
  K.forEach((k) => { if ([undefined, 'silence', 'praise'].includes(last[k]) && spend(1)) plan.gifts[k] = (plan.gifts[k] || 0) + 1; });
  if (strength >= 4 && spend(1)) plan.pay += 1;
  while (spend(1)) plan.save += 1;
  return plan;
}

function provinceSignal(kind, v, rand) {
  const sincere = () => (v.police ? (v.g >= 4 ? 'praise' : 'silence') : v.g >= 7 ? 'protest' : v.g >= 4 ? (v.box ? 'petition' : 'silence') : 'praise');
  const aggressive = () => (v.police ? 'praise' : 'protest');
  return kind === 'sincere' ? sincere() : rand() < 0.35 ? aggressive() : sincere();
}

export function petitionBots(s, mem, rand) {
  let t = s;
  const pidOf = (seat) => t.seats[seat];
  const act = (seat, a) => { const pid = pidOf(seat); t = P.applyAction(t, { ...a, pid, key: pid }); };
  const bot = (seat) => pidOf(seat) && pidOf(seat) !== ME;
  // Remember last year's signals (the Palace's evidence for its next plan).
  if (t.step === 'resolve' && mem.lastYear !== t.year) { mem.last = { ...t.signals }; mem.lastYear = t.year; }
  if (t.end) return t;
  if (t.step === 'palace' && bot('palace') && !t.palace.plan) {
    const priv = P.privateView(t, pidOf('palace'));
    if (priv.canWhisper && !priv.whisper) {
      act('palace', { type: 'whisper', prov: P.PROVS[Math.floor(rand() * 4)] });
      const w = P.privateView(t, pidOf('palace')).whisper; if (w) mem.known[w.prov] = w.band;
    }
    act('palace', { type: 'plan', plan: palacePlan(P.publicView(t), mem.last, mem.palaceStyle) });
  }
  if (t.step === 'signals') {
    for (const k of P.PROVS) if (bot(k) && !t.signals[k]) act(k, { type: 'signal', signal: provinceSignal(mem.kinds[k], P.privateView(t, pidOf(k)), rand) });
  }
  if (t.step === 'chief' && bot('chief') && t.chiefChoice === null) {
    const v = P.privateView(t, pidOf('chief'));
    const pw = Math.max(0, Math.min(6, 7 - v.need)) / 6;
    act('chief', { type: 'coup', strike: pw > 0 && pw >= 1 / 3 });
  }
  if (t.step === 'ear' && bot('palace') && t.palace.estYear !== t.year) {
    const pub = P.publicView(t);
    for (const k of P.PROVS) {
      const r = pub.revealed?.[k];
      mem.known[k] = r?.signal === 'petition' ? r.band : r?.signal === 'protest' ? (r.size === 'large' ? 'H' : 'M') : mem.known[k] || 'M';
    }
    act('palace', { type: 'estimate', est: { ...mem.known } });
  }
  return t;
}
