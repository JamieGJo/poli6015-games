// Quiz questions inside each step, linked to the readings. Teams answer them as they go;
// the answer and its explanation show at once, so the class learns while it plays.
// They are switched off in solo play and by the main screen's "Quizzes" setting.
// Some questions are built from the team's own choices (ctx = { team, draft }).
// DRAFT: wording awaits Jamie's approval.
import { REGIME_TYPES, ROUTES, classifyRegime } from './week1.js';
import {
  OLD_ORDERS, SEIZURE_GROUPS, ROUTE_FOLLOWS, routeCheck, predictType, deriveRegime, flipOutcome, flipInfo, startingAutonomy, AUTONOMY_LABELS, G, EF, BDM, SV, LW,
} from './week2.js';
import { rngFrom } from '../rng.js';

const W = (page) => ({ src: 'wintrobe1998', page });
const GE = (page) => ({ src: 'geddes1999', page });
const TYPES4 = ['military', 'party', 'personalist', 'monarchy', 'amalgam'];
const typeLabel = (k) => REGIME_TYPES[k]?.label || k;
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

// Shuffle options deterministically, keeping track of the right answer.
function shuffled(seed, correct, wrong) {
  const opts = [correct, ...wrong];
  const rng = rngFrom(seed);
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return { options: opts, answer: opts.indexOf(correct) };
}

export const QUIZ = [
  // ---------- Week 1 ----------
  {
    id: 'w1-before', step: 'oldorder', when: 'before',
    q: 'Picture a dictatorship founded after 1945. What did it most likely replace?',
    options: ['A democracy, overthrown by soldiers, as in Chile in 1973', 'Another dictatorship, or foreign rule', 'A monarchy'],
    answer: 1,
    explain: 'Less than a third of post-war dictatorships replaced a democracy, and the Chilean kind, a violent overthrow of democracy, started only 20 per cent. Most replaced another dictatorship or foreign rule.',
    cite: G('25–26'),
  },
  {
    id: 'w1-peron', step: 'rulers', when: 'before',
    q: 'A leader founds a party that wins every election, but the leader alone hires and fires its officials. What does Geddes call this regime?',
    options: ['A single-party regime: the party organises the leader’s support', 'Personal rule: office depends on the leader alone', 'A military regime, if the leader was once a general', 'Mixed rule: the party and the leader share power'],
    answer: 1,
    explain: 'Classify by who controls access to power, not by the labels. Perón founded a party but kept policy and personnel decisions for himself, so Geddes calls his regime personalist.',
    cite: GE('124'),
  },
  {
    // The one main-body question on Wintrobe, about the team's own regime.
    id: 'w1-calm', step: 'rulers', when: 'after',
    build: ({ team, draft }) => {
      const cls = draft ? classifyRegime(draft) : team?.rulers?.classified;
      const type = cls?.type;
      const leader = team?.country?.leader || 'your leader';
      const extra = type === 'monarchy'
        ? ' Your regime has one advantage: a known heir. There is no point killing the ruler if you only get the heir instead.'
        : type === 'personalist'
          ? ' And as a personal ruler, with no legal way for anyone to remove you, you have every reason to be suspicious.'
          : type === 'military'
            ? ' In a junta the problem runs both ways: your fellow officers have the same reason to hide what they think of you.'
            : ' A party, and the elections it runs, give you a second channel of information on how local officials perform.';
      return {
        q: `Every report reaching ${leader} from the provinces says “situation is calm”. Should ${leader} believe it?`,
        options: ['Yes: a calm report means a calm country', 'No: officials who fear the ruler avoid bringing bad news, so calm reports may hide trouble', 'Only if the army sends the same report'],
        answer: 1,
        explain: `This is Wintrobe’s dictator’s dilemma. Mobutu’s officials kept reporting that the situation was calm, even after 24 prisoners had escaped. The more people fear the ruler, the less the ruler can know what they think.${extra}`,
        cite: W('22, 24'),
        cite2: type === 'monarchy' ? W('22') : type === 'personalist' ? W('39') : type === 'party' || type === 'amalgam' ? { src: 'gwf2018elections', page: '141–42' } : null,
        more: 'The optional extra, “The dictator’s dilemma”, takes this further.',
      };
    },
  },

  // ---------- Week 2 ----------
  {
    id: 'w2-crisis', step: 'crisis', when: 'before',
    q: 'Why is a crisis such a good moment to seize power?',
    options: ['People always welcome a new government', 'A ruler who cannot pay supporters, or who has been discredited, loses the people who would defend the regime', 'Crises make the army stronger'],
    answer: 1,
    explain: 'Ousters usually come when incumbents are discredited by economic failure, disorder or brutality. And loyalty is bought: when the money stops, the coalition that would put down a challenge has less reason to.',
    cite: G('30'), cite2: BDM('11, 19'),
  },
  {
    id: 'w2-coup', step: 'seizure', when: 'before',
    q: 'Two of the readings define a coup differently. Which is right?',
    options: [
      'Geddes, Wright and Frantz count only ousters by the military; Svolik counts the removal of a leader by the inner circle, civilian or military',
      'Both count only ousters by the military',
      'Both count any insider, civilian or military',
      'Both count anything that removes a ruler, including crowds in the street',
    ],
    answer: 0,
    explain: 'Geddes, Wright and Frantz define coups as “ousters carried out by members of the military of the government being overthrown”. Svolik defines a coup as “the removal of an authoritarian leader by his inner circle”, which can mean ministers, party barons or security chiefs as well as generals. This game follows Svolik, so insiders can stage a coup too; in Geddes, Wright and Frantz’s data a civilian palace ouster would not count as one. Crowds topple rulers by uprising, not by coup.',
    cite: G('27'), cite2: SV('74'),
  },
  {
    id: 'w2-half', step: 'seizure', when: 'before',
    q: 'In the post-war data, which kind of group has led about half of all seizures of power?',
    options: ['Political parties', 'Military officers', 'Popular movements with no party', 'Royal families'],
    answer: 1,
    explain: 'Officers led about half of all seizures and parties about 40 per cent (some had both). Coups are the easiest and cheapest road, because officers command men and weapons.',
    cite: G('31'), cite2: G('33'),
  },
  {
    id: 'w2-loose', step: 'organisation', when: 'before',
    q: 'A loose coalition seizes power: students, a few colonels and an exiled politician, united only against the old ruler. Ten years later, who is most likely to be running the country?',
    options: ['A council with a seat for every group', 'One leader, ruling personally', 'The army as an institution', 'An elected parliament'],
    answer: 1,
    explain: 'Weakly organised groups tend to produce personal rule. Nobody in a loose coalition has the unity or the organisation to stop the leader taking more and more power, and bargaining power shifts in the leader’s favour once power is won.',
    cite: EF('7'), cite2: G('41–42'),
  },
  {
    id: 'w2-closed', step: 'route', when: 'before',
    build: ({ team }) => {
      const w = team?.w2 || {};
      const group = w.group, order = w.order, org = w.org;
      const pref = ['authoritarianization', 'coup', 'uprising', 'insurgency', 'eliteRuleChange', 'foreign'];
      const closed = pref.filter((r) => !routeCheck(r, group, order, org).ok);
      const open = pref.filter((r) => routeCheck(r, group, order, org).ok);
      const gl = lc(SEIZURE_GROUPS[group]?.label || 'your group');
      const ol = lc(OLD_ORDERS[order]?.label || 'the old order');
      if (!closed.length || open.length < 2) {
        const sh = shuffled(`${team?.id}:closed`, ROUTES.coup.label, [ROUTES.insurgency.label, ROUTES.uprising.label]);
        return { q: 'Which road to power has started the most dictatorships since 1946?', ...sh, explain: 'Coups started 45 per cent, more than any other road.', cite: G('28') };
      }
      const c = closed[0];
      const rc = routeCheck(c, group, order, org);
      const sh = shuffled(`${team?.id}:closed`, ROUTES[c].label, open.slice(0, 2).map((r) => ROUTES[r].label));
      return {
        q: `Your group is ${gl}, and it is replacing ${ol}. Which of these roads is closed to you?`,
        ...sh,
        explain: `${ROUTES[c].label} is closed. ${rc.reason}`,
        cite: rc.cite, cite2: rc.cite2,
      };
    },
  },
  {
    id: 'w2-follows', step: 'route', when: 'after',
    build: ({ team, draft }) => {
      const route = draft?.route || team?.w2?.route;
      if (!route || !ROUTE_FOLLOWS[route]) return null;
      const others = Object.keys(ROUTE_FOLLOWS).filter((k) => k !== route);
      const rng = rngFrom(`${team?.id}:follows:${route}`);
      const pick = others.sort(() => rng() - 0.5).slice(0, 2).map((k) => ROUTE_FOLLOWS[k].text);
      const sh = shuffled(`${team?.id}:follows2:${route}`, ROUTE_FOLLOWS[route].text, pick);
      return {
        q: `You chose: ${lc(ROUTES[route].label)}. What do the readings say tends to follow this road?`,
        ...sh,
        explain: ROUTE_FOLLOWS[route].text,
        cite: ROUTE_FOLLOWS[route].cite, cite2: ROUTE_FOLLOWS[route].cite2 || null,
      };
    },
  },
  {
    id: 'w2-purge', step: 'morning', when: 'before',
    q: 'Why do so many new rulers turn on the very people who helped them seize power?',
    options: ['The co-plotters know how to take power, because they just did; removing them also means not having to share power with them', 'Purges are popular with ordinary citizens', 'The old constitution requires it'],
    answer: 0,
    explain: 'The people who put a leader in power are the people best placed to remove them. After secret trials, Samuel Doe had no fewer than fifty of his original collaborators executed. Once power is won, followers who could have restrained the leader before often cannot.',
    cite: BDM('2'), cite2: G('41–42'),
  },
  {
    id: 'w2-become', step: 'become', when: 'before',
    build: ({ team }) => {
      const w = team?.w2 || {};
      const d = deriveRegime(w);
      if (!d.type) return null;
      return {
        q: 'Before you look: from everything you chose this week, what kind of regime has your state become?',
        options: TYPES4.map(typeLabel),
        answer: TYPES4.indexOf(d.type),
        explain: d.chain.map((c) => c.text).join(' '),
        cite: d.chain[0]?.cite, cite2: d.chain[1]?.cite || null,
      };
    },
  },
  {
    id: 'w2-whatif-type', step: 'whatif', when: 'before',
    build: ({ team }) => {
      const w = team?.w2 || {};
      const out = flipOutcome(w, w.flip);
      if (!out || !out.pred.type) return null;
      return {
        q: 'If that had been so, what kind of regime would the readings expect?',
        options: TYPES4.map(typeLabel),
        answer: TYPES4.indexOf(out.pred.type),
        explain: out.pred.why,
        cite: out.pred.cite, cite2: flipInfo(w, w.flip)?.cite || null,
      };
    },
  },
  {
    id: 'w2-whatif-hand', step: 'whatif', when: 'before',
    build: ({ team }) => {
      const w = team?.w2 || {};
      const out = flipOutcome(w, w.flip);
      if (!out || !out.regime?.type) return null;
      const now = deriveRegime(w).autonomy, then = out.regime.autonomy;
      const answer = then > now ? 0 : then < now ? 1 : 2;
      const sa = startingAutonomy(out.w);
      return {
        q: 'And the leader’s free hand on the morning after: would it have been greater, smaller, or the same?',
        options: ['Greater', 'Smaller', 'About the same'],
        answer,
        explain: `${['Greater', 'Smaller', 'About the same'][answer]}: ${AUTONOMY_LABELS[then].toLowerCase()}, against ${AUTONOMY_LABELS[now].toLowerCase()} in your real seizure. ${sa.why}`,
        cite: sa.cite, cite2: sa.cite2 || null,
      };
    },
  },
];

// The questions for a step, built for this team. when: 'before' | 'after'.
export function quizFor(stepId, when, ctx = {}) {
  return QUIZ.filter((q) => q.step === stepId && q.when === when)
    .map((q) => {
      const b = q.build ? q.build(ctx) : q;
      return b ? { id: q.id, step: q.step, when: q.when, q: b.q, options: b.options, answer: b.answer, explain: b.explain, cite: b.cite, cite2: b.cite2 || null, more: b.more || null } : null;
    })
    .filter(Boolean);
}

// How many of a step's questions the team got right.
export function quizScore(team, stepId) {
  const answers = team?.quiz || {};
  const qs = [...quizFor(stepId, 'before', { team }), ...quizFor(stepId, 'after', { team })];
  return { right: qs.filter((q) => answers[q.id] === q.answer).length, of: qs.filter((q) => answers[q.id] !== undefined).length };
}
export const CAPITAL_PER_RIGHT = 1;
