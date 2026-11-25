// Game engine: pure functions over a plain state object.
// The main screen (host) is the only writer; team devices send actions.
// In solo play (sync.js) the same functions run inside the player's own page.
import {
  WEEK1, classifyRegime, selectorateModel, DECREE, CLAIM_OPTIONS, MAX_CLAIMS, JUSTIFY, compareClaim,
  SELECTORATE, selectorateContext,
} from './content/week1.js';
import { POPULATION, ETHNIC, DEFAULT_GROUPS, RELIGION, URBAN, WEALTH } from './content/land.js';
import { TERRITORIES } from './territories.js';
import {
  WEEK2, OLD_ORDERS, CRISES, dealCrisis, nextCrisis, dealOldOrder, PROMISE, SEIZURE_GROUPS, ORGANISATION, routeCheck,
  MORNING, morningEffects, startingAutonomy, startingReach, startingCoalition, deriveRegime, dealFlip, nextFlip, flipOutcome, validFlips,
  DIFFERENCE_REASONS, DOSSIER_Q,
} from './content/week2.js';
import { DILEMMA } from './content/wintrobe.js';
import { QUIZ, quizFor, CAPITAL_PER_RIGHT } from './content/quizzes.js';
import { PUZZLES } from './content/puzzles.js';
import { rngFrom } from './rng.js';
// Province names are written as titles ('The mines', 'River towns'); this gives the form used mid-sentence ('the mines', 'the river towns').
const inSentence = (name) => 'the ' + String(name).replace(/^the /i, '').replace(/^./, (c) => c.toLowerCase());

export { rngFrom };

export const MAX_TEAMS = 5;
export const DEFAULT_SETTINGS = { quizzes: true, wintrobe: false, solo: false, quick: false };
// Quick start (solo only): found the state, describe it and choose the old order, then go to Week 2.
const QUICK_STEPS = ['lobby', 'found', 'land', 'oldorder'];

export function newRoomCode(rng = Math.random) {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
  let s = '';
  for (let i = 0; i < 4; i++) s += letters[Math.floor(rng() * letters.length)];
  return s;
}

export function newGame(room, settings = {}) {
  return {
    v: 2,
    room,
    week: 1,
    step: 0,
    phase: 'open', // 'open' while teams decide, 'reveal' once the main screen shows results
    stepStartedAt: Date.now(),
    settings: { ...DEFAULT_SETTINGS, ...settings },
    teams: {},
    log: [],
  };
}

export const WEEKS = { 1: WEEK1, 2: WEEK2 };
export const settingsOf = (state) => ({ ...DEFAULT_SETTINGS, ...(state && state.settings) });
// The week's steps, leaving out optional extras that are switched off.
export function weekDef(state) {
  const W = WEEKS[state.week] || WEEK1;
  const set = settingsOf(state);
  let steps = W.steps.filter((s) => !s.optional || set[s.optional]);
  if (W.id === 1 && set.quick) steps = steps.filter((s) => QUICK_STEPS.includes(s.id));
  return { ...W, steps };
}
export function currentStep(state) {
  const steps = weekDef(state).steps;
  return steps[Math.min(state.step, steps.length - 1)];
}
export const quizzesOn = (state) => settingsOf(state).quizzes && !settingsOf(state).solo;

export function teamList(state) {
  return Object.values(state.teams).sort((a, b) => a.slot - b.slot);
}

function blankTeam(id, slot, name) {
  return {
    id,
    slot,
    name: name || TERRITORIES[slot].defaultTeam,
    joinedAt: Date.now(),
    country: null,
    land: null,
    oldOrder: null,
    rulers: null,
    selectorate: null,
    decree: null,
    quiz: {},
    submitted: {},
    meters: { stability: 10, treasury: DECREE.treasuryStart, capital: 0, information: null, security: 0 },
  };
}

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

// Change a setting, staying on the same step where possible.
export function setSetting(state, key, value) {
  const s = structuredClone(state);
  const id = currentStep(s)?.id;
  s.settings = { ...settingsOf(s), [key]: value };
  const steps = weekDef(s).steps;
  const i = steps.findIndex((x) => x.id === id);
  if (i >= 0) s.step = i;
  else s.step = clamp(s.step, 0, steps.length - 1);
  return s;
}

// ---------- The dictator's dilemma (Wintrobe 1998), optional extra ----------
// Each province has a true mood from -3 to +3. One province hides a plot.
// Repression inflates the reports that reach the palace (pp. 22, 24) but makes
// it harder for plotters to organise (p. 34). Rival agencies correct part of the
// bias (pp. 34–35). Rents raise loyalty where they are spent (pp. 31–32).
// Accepting limits makes people less afraid to speak (p. 38).
export function resolveDecree(room, team, choice) {
  const rng = rngFrom(`${room}:${team.id}:decree`);
  const names = DECREE.provinceNames;
  const plotAt = 1 + Math.floor(rng() * (names.length - 1)); // never the capital district
  const coalitionProvinces = new Set([0, (plotAt % (names.length - 1)) + 1]);
  const rep = clamp(choice.repression | 0, 0, 3);
  const loy = clamp(choice.loyalty | 0, 0, 2);
  const watch = DILEMMA.watch.some((x) => x.value === choice.watch) ? choice.watch : (choice.agencies ? 'rival' : 'one');
  const insure = DILEMMA.insure.some((x) => x.value === choice.insure) ? choice.insure : 'none';
  const agencies = watch === 'rival';

  const plotSeverity = rep >= 3 ? 1 : rep === 2 ? 2 : 3;
  // Bias grows faster than repression: 0, 2, 3, 5 points of false cheer.
  const bias = Math.max(0, Math.round(rep * 1.5) - (agencies ? 1 : 0) - (insure === 'limits' ? 1 : 0));

  const provinces = names.map((name, i) => {
    let mood = i === plotAt ? -3 : Math.round(rng() * 4) - 2; // -2..+2 elsewhere
    if (i === 0) mood = Math.max(mood, 1);
    if (loy === 1 && coalitionProvinces.has(i)) mood += 1;
    if (loy === 2) mood += 1;
    if (i === plotAt) mood = -3; // the plotters are not bought off
    mood = clamp(mood, -3, 3);
    const reported = clamp(mood + bias, -3, 3);
    return { name, mood, reported, plot: i === plotAt, coalition: coalitionProvinces.has(i) };
  });

  const err = provinces.reduce((s, p) => s + Math.abs(p.reported - p.mood), 0) / provinces.length;
  const information = clamp(Math.round(100 * (1 - err / 4)), 0, 100);
  const plot = provinces[plotAt];
  const cost = DECREE.loyalty[loy].cost + (DILEMMA.watch.find((x) => x.value === watch).cost || 0) + (DILEMMA.insure.find((x) => x.value === insure).cost || 0);
  // Discontented provinces organise more easily when repression is light (p. 34).
  const unrest = provinces.filter((p) => !p.plot && p.mood <= -1).length;
  const unrestPenalty = rep === 0 ? Math.ceil(unrest / 2) : rep === 1 ? (unrest >= 3 ? 1 : 0) : 0;
  return {
    choice: { repression: rep, loyalty: loy, watch, insure, agencies },
    provinces, information, plotAt, plotSeverity, cost, security: rep, bias, err: Math.round(err * 10) / 10, unrest, unrestPenalty,
    bought: provinces.filter((p, i) => !p.plot && (loy === 2 || (loy === 1 && coalitionProvinces.has(i)))).length,
    inspected: null, detected: null, stabilityChange: 0, notes: [],
  };
}

// The team sends one inspector to one province (or none), then the decree is settled.
export function settleDecree(d, inspect) {
  const out = { ...d, notes: [] };
  const plot = d.provinces[d.plotAt];
  const insp = Number.isInteger(inspect) && inspect >= 0 && inspect < d.provinces.length ? inspect : null;
  out.inspected = insp;
  const reportedBad = plot.reported <= -1;
  const found = insp === d.plotAt;
  out.detected = reportedBad || found;
  let st = 0;
  if (reportedBad) { st += 1; out.notes.push({ key: 'foiled', text: `The reports from ${inSentence(plot.name)} warned of trouble, and the plot was broken up in time.` }); }
  else if (found) { st += 1; out.notes.push({ key: 'inspector', text: `The reports from ${inSentence(plot.name)} said all was well, but your inspector went to look in person and found the plotters.` }); }
  else { st -= d.plotSeverity; out.notes.push({ key: 'missed', text: `The reports from ${inSentence(plot.name)} said all was well. They were wrong: a plot struck the palace.${insp !== null ? ` Your inspector was in ${inSentence(d.provinces[insp].name)}.` : ''}` }); }
  if (d.unrestPenalty > 0) { st -= d.unrestPenalty; out.notes.push({ key: 'unrest', text: `With little to fear, the discontented in ${d.unrest} province${d.unrest > 1 ? 's' : ''} organised openly against you.` }); }
  if (d.choice.repression >= 2) {
    if (d.choice.watch === 'one') { st -= 1; out.notes.push({ key: 'watchers', text: 'Your security chief now commands a powerful political police, and nobody watches the chief. Their loyalty is uncertain, and they know it.' }); }
    else out.notes.push({ key: 'watched', text: d.choice.watch === 'rival' ? 'The political police is powerful, but a rival agency reports on it to you.' : 'The political police is powerful, but its chief knows they will be replaced before growing too strong.' });
  }
  if (d.choice.insure === 'exit') out.notes.push({ key: 'exit', text: 'If you fall, you will fall softly: the account is full and the plane is fuelled. You are no more powerful for it.' });
  if (d.choice.insure === 'limits') { out.notes.push({ key: 'limits', text: 'Because your power has limits, people are a little less afraid to tell you the truth.' }); }
  if (d.cost > 0) out.notes.push({ key: 'cost', text: `The decree cost ${d.cost} from the Treasury.` });
  out.stabilityChange = st;
  return out;
}

// ---------- Actions ----------

const pickV = (list, v) => (list.some((x) => x.value === v) ? v : null);

// The questions a team can answer on a step, built for that team.
export function stepQuestions(stepId, team) {
  const qs = [...quizFor(stepId, 'before', { team }), ...quizFor(stepId, 'after', { team })];
  return stepId === 'dilemma' ? qs.concat(DILEMMA.quiz) : qs;
}
// Record a quiz answer the first time it is given; a right answer earns Capital at once.
function recordQuiz(t, stepId, qid, answer) {
  if (!t.quiz) t.quiz = {};
  if (t.quiz[qid] !== undefined || !Number.isInteger(answer) || answer < 0 || answer > 7) return;
  const q = stepQuestions(stepId, t).find((x) => x.id === qid);
  if (!q) return;
  t.quiz[qid] = answer;
  if (answer === q.answer) t.meters.capital += CAPITAL_PER_RIGHT;
}

export function applyAction(state, action) {
  const s = structuredClone(state);
  const step = currentStep(s);
  const t = action.teamId ? s.teams[action.teamId] : null;

  switch (action.type) {
    case 'join': {
      if (s.teams[action.teamId]) {
        if (action.name) s.teams[action.teamId].name = action.name.slice(0, 32);
        return s;
      }
      const taken = new Set(Object.values(s.teams).map((x) => x.slot));
      if (taken.size >= MAX_TEAMS) return s;
      let slot = Number.isInteger(action.slot) && !taken.has(action.slot) ? action.slot : null;
      if (slot === null) slot = [0, 1, 2, 3, 4].find((i) => !taken.has(i));
      s.teams[action.teamId] = blankTeam(action.teamId, slot, (action.name || '').slice(0, 32));
      s.teams[action.teamId].submitted.lobby = true;
      if (s.week === 2) dealWeek2(s, [action.teamId]);
      return s;
    }
    case 'submit': {
      if (!t || s.phase !== 'open' || action.stepId !== step.id) return s;
      const d = action.data || {};
      if (!t.quiz) t.quiz = {};
      if (s.week === 2 && !t.w2) dealWeek2(s, [t.id]);
      if (d.quiz && typeof d.quiz === 'object' && !Array.isArray(d.quiz)) for (const [k, v] of Object.entries(d.quiz)) recordQuiz(t, step.id, k, v);
      switch (step.id) {
        case 'found':
          t.country = {
            name: str(d.name, 40) || 'Unnamed Republic',
            capital: str(d.capital, 32) || 'The Capital',
            motto: str(d.motto, 60),
            capitalAt: Array.isArray(d.capitalAt) ? d.capitalAt.slice(0, 2).map(Number) : null,
            flag: sanitizeFlag(d.flag),
            leader: str(d.leader, 40) || 'The Leader',
          };
          break;
        case 'land': {
          const pick = (list, v, dflt) => (list.some((x) => x.value === v) ? v : dflt);
          const ethnic = pick(ETHNIC, d.ethnic, 'one');
          const n = ETHNIC.find((x) => x.value === ethnic).shares.length;
          const groups = Array.from({ length: n }, (_, i) => str(Array.isArray(d.groups) ? d.groups[i] : '', 20) || DEFAULT_GROUPS[i]);
          t.land = {
            population: POPULATION.some((x) => x.value === Number(d.population)) ? Number(d.population) : 10,
            ethnic,
            groups,
            rulerGroup: clamp(Math.round(Number(d.rulerGroup) || 0), 0, n - 1),
            religion: pick(RELIGION, d.religion, 'one'),
            urban: pick(URBAN, d.urban, 'mixed'),
            wealth: pick(WEALTH, d.wealth, 'farmland'),
          };
          break;
        }
        case 'oldorder': {
          const order = OLD_ORDERS[d.order] ? d.order : null;
          if (!order) return s;
          t.oldOrder = { order, memory: str(d.memory, 160) };
          break;
        }
        case 'rulers': {
          const answers = { chooser: d.chooser, remove: d.remove, careers: d.careers, elections: d.elections || 'none' };
          const claim = [...new Set((Array.isArray(d.claim) ? d.claim : [d.claim]).filter((k) => CLAIM_OPTIONS.includes(k)))].slice(0, MAX_CLAIMS);
          const just = {};
          for (const j of JUSTIFY) just[j.id] = str(d.just && d.just[j.id], 200);
          t.rulers = {
            claim,
            answers,
            classified: classifyRegime(answers),
            just,
            justification: JUSTIFY.map((j) => just[j.id]).filter(Boolean).join(' '),
          };
          break;
        }
        case 'selectorate': {
          const ctx = selectorateContext(t);
          const input = {
            nominal: clamp(Number(d.nominal) || 1, 1, ctx.adults),
            real: clamp(Number(d.real) || 1, 1, ctx.adults),
            coalition: clamp(Number(d.coalition) || 1, 1, ctx.adults),
            stacked: !!d.stacked,
          };
          const quiz = SELECTORATE.terms.map((term, i) => (Array.isArray(d.quiz) ? Number(d.quiz[i]) : -1));
          t.selectorate = { input, ctx, result: selectorateModel(input, ctx), quiz, quizCorrect: quiz.filter((a, i) => a === SELECTORATE.terms[i].quiz.answer).length };
          if (!t.selectorateScored) { t.meters.capital += t.selectorate.quizCorrect * CAPITAL_PER_RIGHT; t.selectorateScored = true; }
          break;
        }
        case 'dilemma':
          // Two stages: the decree, then (after reading the dispatches) the inspector.
          if (d.stage === 'decree') { t.decree = resolveDecree(s.room, t, d); return s; }
          if (!t.decree) return s;
          t.decree = settleDecree(t.decree, d.inspect === null || d.inspect === undefined ? null : Number(d.inspect));
          break;
        case 'charter': {
          const P = PUZZLES.week1;
          t.puzzle1 = { id: pickV(P, d.puzzle) || P[0].value, text: str(d.text, 320) };
          break;
        }
        // ---------- Week 2 ----------
        case 'rejoin':
          break;
        case 'crisis':
          t.w2.promise = { value: pickV(PROMISE.options, d.value), text: str(d.text, 160) };
          break;
        case 'seizure':
          if (!SEIZURE_GROUPS[d.group]) return s;
          t.w2.group = d.group;
          if (t.w2.route && !routeCheck(t.w2.route, t.w2.group, t.w2.order, t.w2.org).ok) t.w2.route = null;
          break;
        case 'organisation':
          if (!ORGANISATION[d.org]) return s;
          t.w2.org = d.org;
          if (t.w2.route && !routeCheck(t.w2.route, t.w2.group, t.w2.order, t.w2.org).ok) t.w2.route = null;
          break;
        case 'route':
          if (!routeCheck(d.route, t.w2.group, t.w2.order, t.w2.org).ok) return s;
          t.w2.route = d.route;
          t.w2.night = str(d.night, 240);
          break;
        case 'morning': {
          const choices = {};
          for (const m of MORNING) choices[m.id] = [m.a.value, m.b.value].includes(d[m.id]) ? d[m.id] : null;
          if (Object.values(choices).some((v) => !v)) return s;
          const base = { autonomy: startingAutonomy(t.w2), reach: startingReach(t.w2), coalition: startingCoalition(t.w2) };
          // A purge against a disciplined organisation is a gamble, seeded so it can be replayed.
          const roll = rngFrom(`${s.room}:${t.id}:purge`)();
          const eff = morningEffects(t.w2, choices, roll);
          t.w2.morning = {
            choices, fx: eff.fx, notes: eff.notes, base, roll, purged: eff.purged,
            autonomy: clamp(base.autonomy.autonomy + eff.fx.autonomy, 1, 4),
            reach: clamp(base.reach.reach + eff.fx.reach, 1, 3),
            coalition: clamp(base.coalition + eff.fx.coalition, 1, 3),
          };
          break;
        }
        case 'become': {
          const reg = deriveRegime(t.w2);
          t.w2.regime = reg;
          t.w2.become = {
            week1Type: t.rulers?.classified?.type || null,
            reason: pickV(DIFFERENCE_REASONS, d.reason),
            text: str(d.text, 280),
          };
          break;
        }
        case 'whatif':
          if (!validFlips(t.w2).includes(t.w2.flip)) t.w2.flip = dealFlip(s.room, t.id, t.w2);
          t.w2.cf = { flip: t.w2.flip, out: t.w2.flip ? flipOutcome(t.w2, t.w2.flip) : null, failed: str(d.failed, 240) };
          break;
        case 'dossier':
          t.w2.dossier = {
            factor: pickV(DOSSIER_Q.options, d.factor), text: str(d.text, 280),
            puzzle: pickV(PUZZLES.week2, d.puzzle) || PUZZLES.week2[0].value, puzzleText: str(d.puzzleText, 320),
          };
          break;
        default:
          return s;
      }
      t.submitted[step.id] = true;
      return s;
    }
    case 'quiz': {
      if (!t) return s;
      recordQuiz(t, step.id, String(action.qid || ''), Number(action.answer));
      return s;
    }
    default:
      return s;
  }
}

// Host-only transitions.
export function reveal(state) {
  const s = structuredClone(state);
  if (s.phase === 'reveal') return s;
  s.phase = 'reveal';
  const step = currentStep(s);
  for (const t of Object.values(s.teams)) {
    if (!t.quiz) t.quiz = {};
    if (step.id === 'dilemma' && t.decree && t.decree.detected !== null && !t.decree.applied) {
      t.meters.treasury -= t.decree.cost;
      t.meters.stability += t.decree.stabilityChange;
      t.meters.information = t.decree.information;
      t.meters.security = t.decree.security;
      t.decree.applied = true;
    }
    const w = t.w2;
    if (w && step.id === 'morning' && w.morning && !w.morning.applied) {
      t.meters.stability += w.morning.fx.stability;
      t.meters.treasury += w.morning.fx.treasury;
      t.meters.autonomy = w.morning.autonomy;
      w.morning.applied = true;
    }
  }
  s.log.push({ at: Date.now(), event: 'reveal', step: step.id });
  return s;
}

export function goTo(state, stepIndex) {
  const s = structuredClone(state);
  const steps = weekDef(s).steps;
  s.step = clamp(stepIndex, 0, steps.length - 1);
  const id = steps[s.step].id;
  // A step is open again unless every joined team has already submitted it.
  const teams = Object.values(s.teams);
  const done = teams.length > 0 && teams.every((t) => t.submitted[id]);
  s.phase = (done && id !== 'lobby' && id !== 'rejoin') || id === 'meridia' ? 'reveal' : 'open';
  s.stepStartedAt = Date.now();
  // The what-if is dealt once the seizure is complete, so that it always changes the result.
  if (id === 'whatif') {
    for (const t of teams) {
      if (t.w2 && !t.w2.cf && !validFlips(t.w2).includes(t.w2.flip)) t.w2.flip = dealFlip(s.room, t.id, t.w2);
    }
  }
  return s;
}

// ---------- Week 2 ----------

function dealWeek2(s, ids) {
  for (const id of ids) {
    const t = s.teams[id];
    if (!t) continue;
    const order = t.oldOrder?.order || dealOldOrder(s.room, id);
    t.w2 = { order, orderDealt: !t.oldOrder, crisis: dealCrisis(s.room, id, order), flip: null, group: null, org: null, route: null };
  }
}

export function startWeek2(state) {
  const s = structuredClone(state);
  if (s.week === 2) return s;
  s.week = 2;
  s.step = 0;
  s.phase = 'open';
  s.stepStartedAt = Date.now();
  dealWeek2(s, Object.keys(s.teams));
  s.log.push({ at: Date.now(), event: 'week2' });
  return s;
}

// The main screen can change what the game dealt: the crisis or the flip.
export function cycleDeal(state, teamId, field) {
  const s = structuredClone(state);
  const t = s.teams[teamId];
  if (!t || !t.w2) return s;
  if (field === 'crisis') t.w2.crisis = nextCrisis(t.w2.order, t.w2.crisis);
  if (field === 'flip' && !t.w2.cf) t.w2.flip = nextFlip(t.w2, t.w2.flip);
  return s;
}

export function removeTeam(state, teamId) {
  const s = structuredClone(state);
  delete s.teams[teamId];
  return s;
}

function str(x, n) {
  return typeof x === 'string' ? x.replace(/[<>]/g, '').trim().slice(0, n) : '';
}

const FLAG_LAYOUTS = ['tricolour-h', 'tricolour-v', 'bicolour-h', 'canton', 'cross', 'triangle', 'disc', 'diagonal', 'border'];
export function sanitizeFlag(f) {
  const ok = (c) => (typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c) ? c : '#888888');
  f = f || {};
  return {
    layout: FLAG_LAYOUTS.includes(f.layout) ? f.layout : 'tricolour-h',
    c1: ok(f.c1), c2: ok(f.c2), c3: ok(f.c3),
    emblem: typeof f.emblem === 'string' ? f.emblem.slice(0, 16) : 'none',
    ec: ok(f.ec),
  };
}

// Kept for older save files and the charter, which may still carry a reflection.
export function reflectionText(r) {
  if (!r) return '';
  if (typeof r === 'string') return r;
  return r.text || '';
}

// Summary for the class debrief.
export function classSummary(state) {
  const teams = teamList(state);
  return {
    teams: teams.length,
    mismatches: teams.filter((t) => t.rulers && t.rulers.classified && !compareClaim(t.rulers).ok).length,
  };
}
