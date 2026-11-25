// Outcome cards: make each result obvious at a glance. A big headline with a picture,
// "how you got here" as numbered steps, gauges for the leader's free hand, reach and
// coalition, and meter changes as large plus and minus figures.
import { REGIME_TYPES, ROUTES } from './content/week1.js';
import { SEIZURE_GROUPS, ORGANISATION, AUTONOMY_LABELS, REACH_LABELS, COALITION_LABELS, startingAutonomy, startingReach, startingCoalition } from './content/week2.js';
import { regimeArt, choiceArt } from './art.js';
import { esc, citeHTML } from './ui.js';

const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const cites = (...c) => c.filter(Boolean).map(citeHTML).join(' ');

// The big result: a picture of the regime type and its name in large type.
export function heroHTML(type, { kicker = '', sub = '', size = 120 } = {}) {
  const T = REGIME_TYPES[type];
  if (!T) return '';
  return `<div class="hero" style="--tc:${T.colour}">
    <div class="hero-art">${regimeArt(type, T.colour, { size, title: T.label })}</div>
    <div class="hero-text">${kicker ? `<div class="caps">${esc(kicker)}</div>` : ''}<div class="hero-title">${esc(T.label)}</div>${sub ? `<p>${sub}</p>` : ''}</div>
  </div>`;
}

// Two regimes side by side: before and after, or real and what-if.
export function versusHTML(a, b, { aLabel = 'Before', bLabel = 'After', size = 84 } = {}) {
  const fig = (type, label) => {
    const T = REGIME_TYPES[type];
    return `<div class="vs-fig" style="--tc:${T?.colour || '#999'}"><div class="caps muted">${esc(label)}</div>${T ? regimeArt(type, T.colour, { size, title: T.label }) : ''}<div class="vs-name">${esc(T?.label || 'Not declared')}</div></div>`;
  };
  return `<div class="versus">${fig(a, aLabel)}<div class="vs-arrow" aria-hidden="true">→</div>${fig(b, bLabel)}</div>`;
}

// "How you got here": the seizure, the road, the morning after, the result.
export function howHTML(w, reg) {
  if (!w || !reg?.type) return '';
  const items = [];
  const G = SEIZURE_GROUPS[w.group], O = ORGANISATION[w.org], R = ROUTES[w.route];
  const seize = reg.chain.find((c) => c.step === 'seizure') || reg.chain[0];
  if (G) items.push({ head: `${G.label}${O ? `, ${lc(O.label)}` : ''}`, text: seize?.text || '', cites: [seize?.cite, seize?.cite2] });
  if (R) items.push({ head: `Took power by ${lc(R.label)}`, text: '', cites: [] });
  const morning = reg.chain.filter((c) => c.step === 'morning');
  if (w.morning) {
    const p = w.morning.choices?.plotters;
    items.push({
      head: `The morning after: ${p === 'purge' ? (w.morning.purged === false ? 'a purge that failed' : 'you purged the plotters') : 'you shared power'}`,
      text: morning.map((c) => c.text).join(' ') || (p === 'share' ? 'Every group kept a seat at the table, so nobody could take all the power.' : ''),
      cites: morning.flatMap((c) => [c.cite, c.cite2]),
    });
  }
  const T = REGIME_TYPES[reg.type];
  return `<ol class="how">${items.map((x) => `<li><div><b>${esc(x.head)}</b>${x.text ? `<div class="small">${esc(x.text)} ${cites(...x.cites)}</div>` : ''}</div></li>`).join('')}
    <li class="how-result" style="--tc:${T.colour}"><div><b>So: ${esc(T.label.toLowerCase())}</b></div></li></ol>`;
}

// A segmented gauge, e.g. the free hand (1–4), with where it started.
export function gaugeHTML(label, value, max, labels, { from = null, note = '' } = {}) {
  const segs = Array.from({ length: max }, (_, i) => `<i class="${i < value ? 'on' : ''}${from !== null && i < from && i >= value ? ' lost' : ''}${from !== null && i >= from && i < value ? ' won' : ''}"></i>`).join('');
  const change = from !== null && from !== value ? `<span class="g-from">${esc(labels[from])} → </span>` : '';
  return `<div class="gauge"><div class="g-head"><span>${esc(label)}</span><b>${change}${esc(labels[value] || '')}</b></div><div class="g-bar">${segs}</div>${note ? `<div class="tiny muted">${note}</div>` : ''}</div>`;
}

// The three Week 2 gauges for a team, before and after the morning.
export function powerGauges(w) {
  if (!w?.group || !w?.org) return '';
  const M = w.morning;
  const a0 = startingAutonomy(w).autonomy, r0 = startingReach(w).reach, c0 = startingCoalition(w);
  return `<div class="gauges">
    ${gaugeHTML('Leader’s free hand', M ? M.autonomy : a0, 4, AUTONOMY_LABELS, { from: M ? a0 : null })}
    ${gaugeHTML('Reach into society', M ? M.reach : r0, 3, REACH_LABELS, { from: M ? r0 : null })}
    ${gaugeHTML('Winning coalition', M ? (M.coalition ?? c0) : c0, 3, COALITION_LABELS, { from: M ? c0 : null })}
  </div>`;
}

// Meter changes as large signed figures.
export function deltaHTML(fx, keys = ['stability', 'treasury']) {
  const name = { stability: 'Stability', treasury: 'Treasury', capital: 'Capital', autonomy: 'Free hand', reach: 'Reach', coalition: 'Coalition' };
  return `<div class="deltas">${keys.map((k) => {
    const v = fx?.[k] || 0;
    return `<div class="delta ${v > 0 ? 'up' : v < 0 ? 'down' : 'flat'}"><b>${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v)}</b><span>${name[k] || k}</span></div>`;
  }).join('')}</div>`;
}

// The four morning-after choices as pictures.
export function choicesHTML(MORNING, choices, { stories = null } = {}) {
  return `<div class="choice-grid">${MORNING.map((m) => {
    const side = choices[m.id] === m.a.value ? m.a : m.b;
    const P = stories?.[m.id]?.[side.value];
    return `<div class="choice-card"><div class="choice-art">${choiceArt(side.value, { size: 52 })}</div><div><div class="caps muted">${esc(m.q)}</div><b>${esc(side.label)}</b>${P ? `<p class="tiny parallel" style="margin:4px 0 0"><b>In real life.</b> ${esc(P.parallel)} ${cites(P.cite, P.cite2)}</p>` : ''}</div></div>`;
  }).join('')}</div>`;
}
