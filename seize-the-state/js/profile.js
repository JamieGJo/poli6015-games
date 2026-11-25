// "Your state, Year One": a written profile assembled from the team's choices.
// Template text only, no AI. AI_HOOK: an AI game master could write this as a
// newspaper feature or a foreign ministry briefing (see AI-HOOKS.md).
import { REGIME_TYPES, RULER_QUESTIONS, ELECTIONS_PHRASE, rung, DECREE } from './content/week1.js';
import { OLD_ORDERS } from './content/week2.js';
import { ETHNIC, RELIGION, URBAN, WEALTH, groupShares, find } from './content/land.js';
import { TERRITORIES } from './territories.js';

const GEOGRAPHY = [
  'high, cold country: mountain valleys, mining towns and passes that are easy to defend and hard to govern',
  'wide grasslands with long roads between scattered towns, where an army can move fast',
  'a long coast of bays and fishing ports, open to the sea and to foreign ships',
  'the fertile heart of the continent, where rivers meet and most of Meridia’s food is grown',
  'a low, wet delta of channels and islands, with a busy port at the river mouth',
];

const n = (x) => Math.round(x).toLocaleString('en-GB');
const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');

export function stateProfile(team) {
  const c = team.country || {};
  const name = c.name || team.name;
  const T = TERRITORIES[team.slot];
  const L = team.land;
  const r = team.rulers;
  const sel = team.selectorate;
  const m = team.meters;
  const out = [];

  out.push({ head: 'The land', text: `${name} lies ${['in', 'on', 'on', 'in', 'in'][team.slot]} ${T.region.replace(/^The /, 'the ')} of Meridia: ${GEOGRAPHY[team.slot]}. Its capital is ${c.capital || 'unnamed'}.` });

  if (L) {
    const shares = groupShares(L.ethnic);
    const others = L.groups.filter((g, i) => i !== L.rulerGroup);
    out.push({
      head: 'The people',
      text: `${L.population} million people. ${find(ETHNIC, L.ethnic).text} The ruler is one of the ${L.groups[L.rulerGroup]}, who make up ${shares[L.rulerGroup]}% of the population; the rest are ${others.join(' and ')}. ${find(RELIGION, L.religion).text} ${find(URBAN, L.urban).text}`,
    });
    const w = find(WEALTH, L.wealth);
    out.push({ head: 'The economy', text: `${w.economy} The treasury stands at ${m.treasury}${m.treasury < 6 ? ', already running low' : ''}.` });
  }

  if (r && r.classified) {
    const type = REGIME_TYPES[r.classified.type];
    const chooser = RULER_QUESTIONS[0].options.find((o) => o.value === r.answers.chooser);
    let text = `${c.leader || 'The leader'} heads ${type.label === 'Personal rule' ? 'a regime of personal rule' : `a ${lc(type.label)}`}, with ${ELECTIONS_PHRASE[r.classified.elections] || 'no national elections'}. When the top job falls vacant, ${lc(chooser ? chooser.label : 'someone')} decides who gets it.`;
    if (sel && sel.result) {
      const R = sel.result;
      const ru = rung(R.coalition, sel.ctx ? sel.ctx.adults : Infinity);
      text += ` Power rests on ${n(R.coalition)} essential supporters (${lc(ru.label)}), chosen from ${n(R.real)} people with real influence${R.stacked && L ? `, most of them ${L.groups[L.rulerGroup]}` : ''}.`;
    }
    if (r.just && r.just.remove) text += ` Asked who could remove the leader, its founders said: “${r.just.remove}”`;
    out.push({ head: 'Who rules', text });
  }

  if (team.oldOrder && OLD_ORDERS[team.oldOrder.order]) {
    const O = OLD_ORDERS[team.oldOrder.order];
    out.push({ head: 'What came before', text: `The new regime replaced ${lc(O.label)}.${team.oldOrder.memory ? ` ${team.oldOrder.memory}` : ''} How the new rulers got from there to here is next week’s question.` });
  }

  const d = team.decree;
  if (d && d.detected !== null && d.detected !== undefined) {
    const plot = d.provinces.find((p) => p.plot);
    const rep = DECREE.repression[d.choice.repression].label.toLowerCase();
    out.push({
      head: 'The situation now',
      text: `After a first decree of ${rep} repression, ${d.detected ? `the plot in ${plot.name} was caught in time` : `a plot in ${plot.name} went unreported until it struck`}. Only ${d.information}% of what reaches the palace is accurate${d.information < 50 ? ', so the leader may not know how angry the provinces are' : ''}. Stability stands at ${m.stability}, and the state has ${m.capital} Capital to spend.${d.choice.repression >= 2 ? ' A powerful political police now answers to the security chief.' : ''}`,
    });
  } else {
    out.push({ head: 'The situation now', text: `Stability stands at ${m.stability}, the treasury at ${m.treasury}, and the state has ${m.capital} Capital to spend.` });
  }
  return out;
}
