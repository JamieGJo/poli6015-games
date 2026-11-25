// "Meridia after the seizures": the closing map of Week 2. Every state is drawn with its
// peoples (provinces shaded by group, the ruling group starred), a second faith where the
// country is divided, its regime as a picture, and signs for what happened on the morning
// after. Below the map, one card per state spells it all out.
import { mapSVG, buildMap, provincesFor } from './map.js';
import { TERRITORIES } from './territories.js';
import { REGIME_TYPES, ROUTES } from './content/week1.js';
import { ETHNIC, GROUP_COLOURS, RELIGION, WEALTH, groupShares } from './content/land.js';
import { OLD_ORDERS, SEIZURE_GROUPS, ORGANISATION, MORNING, AUTONOMY_LABELS, REACH_LABELS, COALITION_LABELS, deriveRegime, startingCoalition } from './content/week2.js';
import { regimeAt, signAt, regimeArt, choiceArt } from './art.js';
import { flagSVG } from './flag.js';
import { esc, accent } from './ui.js';

const lc = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '');
const f1 = (x) => Number(x).toFixed(1);
const PROVINCES = 8;

// The regime type a state ends Week 2 with (or Week 1's, if it never got that far).
export function finalType(t) {
  const w = t.w2;
  if (w?.regime?.type) return { type: w.regime.type, week: 2 };
  if (w?.group && w?.org && w?.route) { const r = deriveRegime(w); if (r.type) return { type: r.type, week: 2 }; }
  if (t.rulers?.classified?.type) return { type: t.rulers.classified.type, week: 1 };
  return { type: null, week: null };
}

// Which group lives in each province: the ruling group holds the capital, the others
// share the rest in proportion to their size.
function peopleOf(t) {
  const L = t.land;
  if (!L) return null;
  const shares = groupShares(L.ethnic);
  const order = [L.rulerGroup, ...shares.map((_, i) => i).filter((i) => i !== L.rulerGroup)];
  const raw = order.map((g) => (shares[g] / 100) * PROVINCES);
  const n = raw.map((x) => Math.max(1, Math.floor(x)));
  while (n.reduce((a, b) => a + b, 0) > PROVINCES) n[n.indexOf(Math.max(...n))] -= 1;
  while (n.reduce((a, b) => a + b, 0) < PROVINCES) { let best = 0, bd = -1; raw.forEach((x, i) => { const d = x - n[i]; if (d > bd) { bd = d; best = i; } }); n[best] += 1; }
  const byProvince = [];
  order.forEach((g, k) => { for (let i = 0; i < n[k]; i++) byProvince.push(g); });
  return byProvince.slice(0, PROVINCES);
}

function signsFor(w) {
  const c = w?.morning?.choices;
  if (!c) return [];
  return [c.plotters === 'purge' ? (w.morning.purged === false ? 'share' : 'purge') : 'share', c.army === 'guard' ? 'guard' : 'pay', c.crowd, c.civil];
}

export function finalMapSVG(teams, { uid = 'fm' } = {}) {
  const m = buildMap();
  const provinces = [];
  const extra = [];
  extra.push(`<defs><pattern id="${uid}-faith" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><line x1="0" y1="0" x2="0" y2="7" stroke="rgba(29,36,51,.32)" stroke-width="2"/></pattern></defs>`);
  for (const t of teams) {
    const T = TERRITORIES[t.slot];
    const pe = peopleOf(t);
    if (!pe) continue;
    const provs = provincesFor(t.slot, t.country?.capitalAt, PROVINCES);
    provs.forEach((p, i) => provinces.push({ cells: p.cells, fill: GROUP_COLOURS[pe[i] ?? 0] }));
    // A second faith follows the ethnic lines where the country is divided.
    if (t.land.religion === 'divided') provs.forEach((p, i) => { if (pe[i] !== t.land.rulerGroup) provinces.push({ cells: p.cells, fill: `url(#${uid}-faith)` }); });
    // The ruling group's star, on the capital's province.
    const c0 = provs[0]?.centre;
    if (c0 && !t.country?.capitalAt) extra.push(`<text x="${f1(c0[0])}" y="${f1(c0[1])}" text-anchor="middle" font-size="16" fill="${GROUP_COLOURS[t.land.rulerGroup]}" stroke="#1d2433" stroke-width=".7">★</text>`);
    const ft = finalType(t);
    const [cx, cy] = m.centroids[t.slot];
    if (ft.type) {
      const R = REGIME_TYPES[ft.type];
      extra.push(regimeAt(ft.type, R.colour, cx, cy - 34, 58));
      extra.push(`<text x="${f1(cx)}" y="${f1(cy + 8)}" text-anchor="middle" class="map-regime" fill="${R.colour}">${esc(R.label.toUpperCase())}${ft.week === 1 ? ' (WEEK 1)' : ''}</text>`);
    }
    const sg = signsFor(t.w2);
    sg.forEach((name, i) => extra.push(`<g opacity=".92"><circle cx="${f1(cx - 33 + i * 22)}" cy="${f1(cy + 66)}" r="10.5" fill="#fffdf8" stroke="${T.accent}" stroke-width="1.4"/>${signAt(name, cx - 33 + i * 22, cy + 66, 15)}</g>`));
  }
  let svg = mapSVG({ teams, provinces: { list: provinces }, uid, labels: true });
  // Mark the ruling group's home province with a star beside each capital.
  for (const t of teams) {
    const cap = t.country?.capitalAt;
    if (cap && t.land) extra.push(`<text x="${f1(cap[0] - 16)}" y="${f1(cap[1] + 20)}" text-anchor="middle" font-size="15" fill="${GROUP_COLOURS[t.land.rulerGroup]}" stroke="#1d2433" stroke-width=".7">★</text>`);
  }
  svg = svg.replace(/<\/svg>$/, `${extra.join('')}</svg>`);
  return svg;
}

const SIGN_NAMES = {
  purge: 'Purged the plotters', share: 'Shared power (or a purge failed)', guard: 'Built a personal guard', pay: 'Raised the army’s pay',
  reward: 'Rewarded the crowds', shut: 'Shut the crowds out', fire: 'Fired the old officials', keep: 'Kept the old officials',
};
export function legendHTML(teams) {
  const types = [...new Set(teams.map((t) => finalType(t).type).filter(Boolean))];
  const anyDivided = teams.some((t) => t.land?.religion === 'divided');
  return `<div class="legend">
    <div><div class="caps muted">Regimes</div><div class="legend-row">${types.map((k) => `<span>${regimeArt(k, REGIME_TYPES[k].colour, { size: 30 })}${esc(REGIME_TYPES[k].label)}</span>`).join('')}</div></div>
    <div><div class="caps muted">Peoples</div><div class="legend-row"><span><i class="sw" style="background:${GROUP_COLOURS[0]}"></i><i class="sw" style="background:${GROUP_COLOURS[1]}"></i><i class="sw" style="background:${GROUP_COLOURS[2]}"></i><i class="sw" style="background:${GROUP_COLOURS[3]}"></i>Each colour is one people (named in the card below)</span><span><b style="font-size:18px">★</b> The ruling group’s home, by the capital</span>${anyDivided ? '<span><i class="sw hatch"></i>A second faith</span>' : ''}</div></div>
    <div><div class="caps muted">The morning after</div><div class="legend-row">${Object.entries(SIGN_NAMES).map(([k, v]) => `<span>${choiceArt(k, { size: 24 })}${esc(v)}</span>`).join('')}</div></div>
  </div>`;
}

export function stateCardHTML(t) {
  const L = t.land, w = t.w2 || {}, M = w.morning;
  const ft = finalType(t);
  const R = REGIME_TYPES[ft.type];
  const shares = L ? groupShares(L.ethnic) : [];
  const peoples = L ? L.groups.map((g, i) => `<span class="pp"><i class="sw" style="background:${GROUP_COLOURS[i]}"></i>${esc(g)} ${shares[i]}%${i === L.rulerGroup ? ' ★' : ''}</span>`).join('') : '';
  const row = (k, v) => (v ? `<div class="sc-row"><span>${esc(k)}</span><b>${v}</b></div>` : '');
  const coal = M ? M.coalition ?? null : (w.group ? startingCoalition(w) : null);
  return `<div class="state-card" style="--tc:${accent(t.slot)}">
    <div class="row" style="gap:10px;align-items:center">${flagSVG(t.country?.flag, { width: 46 })}<div><div class="sc-name">${esc(t.country?.name || t.name)}</div><div class="tiny muted">${esc(TERRITORIES[t.slot].region)} · ${esc(t.country?.leader || '')}</div></div></div>
    ${R ? `<div class="row" style="gap:10px;align-items:center;margin-top:8px">${regimeArt(ft.type, R.colour, { size: 54 })}<div><div class="sc-type" style="color:${R.colour}">${esc(R.label)}</div>${ft.week === 1 ? '<div class="tiny muted">Week 1 answer: Week 2 not finished</div>' : ''}</div></div>` : ''}
    ${row('People', L ? `${L.population} million` : '')}
    ${L ? `<div class="sc-row"><span>Peoples</span><b class="pps">${peoples}</b></div>` : ''}
    ${row('Faith', L ? esc(RELIGION.find((x) => x.value === L.religion)?.label || '') : '')}
    ${row('Wealth', L ? esc(WEALTH.find((x) => x.value === L.wealth)?.label || '') : '')}
    ${row('Replaced', w.order ? esc(OLD_ORDERS[w.order]?.label) : '')}
    ${row('Seized by', w.group ? esc(`${SEIZURE_GROUPS[w.group].label}${w.org ? `, ${lc(ORGANISATION[w.org].label)}` : ''}`) : '')}
    ${row('Road', w.route ? esc(ROUTES[w.route].label) : '')}
    ${M ? `<div class="sc-row"><span>Morning after</span><b class="sc-signs">${MORNING.map((mm) => { const side = M.choices[mm.id] === mm.a.value ? mm.a : mm.b; return `<span title="${esc(side.label)}">${choiceArt(side.value, { size: 26 })}</span>`; }).join('')}</b></div>` : ''}
    ${row('Free hand', M ? esc(AUTONOMY_LABELS[M.autonomy]) : '')}
    ${row('Reach', M ? esc(REACH_LABELS[M.reach]) : '')}
    ${row('Coalition', coal ? esc(COALITION_LABELS[coal]) : '')}
  </div>`;
}

export function finalMapHTML(teams, { uid = 'fm', cards = true } = {}) {
  return `<div class="final-map"><div class="map-wrap" style="aspect-ratio:1000/640">${finalMapSVG(teams, { uid })}</div>
    ${legendHTML(teams)}
    ${cards ? `<div class="state-cards">${teams.map(stateCardHTML).join('')}</div>` : ''}</div>`;
}
