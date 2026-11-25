// Small rendering helpers shared by the main screen and team devices.
import { cite as citeText } from './content/sources.js';
import { REGIME_TYPES, ROUTES, ELECTORAL_LAYERS, LADDER, DECREE } from './content/week1.js';
import { GROUP_COLOURS, groupShares } from './content/land.js';
import { TERRITORIES } from './territories.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function citeHTML(c) {
  if (!c) return '';
  return `<span class="cite" title="Source">${esc(citeText(c))}</span>`;
}

export function typePill(type, { strike = false } = {}) {
  const t = REGIME_TYPES[type];
  if (!t) return '<span class="muted">Not chosen</span>';
  return `<span class="type-pill${strike ? ' strike' : ''}" style="background:${t.colour}">${esc(t.label)}</span>`;
}

// What a team claimed: one or two types.
// cmp (from compareClaim) strikes through only the parts of the claim that are wrong.
export function claimPills(claim, cmp = null) {
  const list = Array.isArray(claim) ? claim : [claim].filter(Boolean);
  if (!list.length) return '<span class="muted">Not chosen</span>';
  const wrong = (k) => cmp && (k === 'electoral' ? !cmp.electoralOk : !(cmp.baseOk && (k === cmp.type || cmp.type === 'amalgam')));
  return list.map((k) => typePill(k, { strike: wrong(k) })).join(' + ');
}

// Geddes's type, plus the elections layer when there are multiparty elections.
export function resultPills(classified) {
  if (!classified) return '<span class="muted">Not classified</span>';
  const layer = ELECTORAL_LAYERS[classified.elections];
  const elect = classified.elections === 'rigged' || classified.elections === 'competitive';
  return typePill(classified.type) + (elect ? ` + <span class="type-pill" style="background:${REGIME_TYPES.electoral.colour}">${esc(layer.label)}</span>` : '');
}

export function routeLabel(id) {
  return ROUTES[id] ? ROUTES[id].label : 'Not chosen';
}

export const accent = (slot) => TERRITORIES[slot]?.accent || '#1d2433';

export function fmt(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} million`;
  if (n >= 1e4) return `${Math.round(n / 1e3)},000`;
  return Math.round(n).toLocaleString('en-GB');
}

export function money(n) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} bn`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} m`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return `${Math.round(n)}`;
}

// Nested circles: area proportional to the number of people.
// Nested circles, drawn to scale (area = people). With a land profile, the outer
// circle shows the peoples of the state and the coalition takes the colour of the
// group it is drawn from.
export function nestedCircles(r, adults, size = 220, land = null) {
  const R = size / 2 - 4;
  const rad = (k) => Math.max(2.2, R * Math.sqrt(Math.min(k, adults) / adults));
  const cx = size / 2, cy = size / 2;
  const shares = land ? groupShares(land.ethnic) : null;
  const coalFill = land && r.stacked ? GROUP_COLOURS[land.rulerGroup] : '#b3261e';
  const rows = [
    { k: adults, fill: '#efe7d6', stroke: '#c9bda6', label: 'All adults' },
    { k: r.nominal, fill: '#d9cdb5', stroke: '#a99a7c', label: 'Nominal selectorate' },
    { k: r.real, fill: '#8d8597', stroke: '#5e566b', label: 'Real selectorate' },
    { k: r.coalition, fill: coalFill, stroke: '#7a1712', label: 'Winning coalition' },
  ];
  let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Nested circles">`;
  rows.forEach((row, i) => {
    const rr = rad(row.k);
    const y = cy + R - rr;
    if (i === 0 && shares) {
      // The peoples of the state, as slices of the outer circle.
      let a0 = -Math.PI / 2;
      shares.forEach((sh, g) => {
        const a1 = a0 + (sh / 100) * Math.PI * 2;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        svg += `<path d="M${cx},${y} L${(cx + rr * Math.cos(a0)).toFixed(1)},${(y + rr * Math.sin(a0)).toFixed(1)} A${rr},${rr} 0 ${large},1 ${(cx + rr * Math.cos(a1)).toFixed(1)},${(y + rr * Math.sin(a1)).toFixed(1)}Z" fill="${GROUP_COLOURS[g]}" opacity=".6"/>`;
        a0 = a1;
      });
      svg += `<circle cx="${cx}" cy="${y}" r="${rr.toFixed(1)}" fill="none" stroke="${row.stroke}" stroke-width="1"/>`;
    } else {
      svg += `<circle cx="${cx}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${row.fill}" stroke="${row.stroke}" stroke-width="1" ${i === 1 && shares ? 'fill-opacity=".45"' : ''}/>`;
    }
  });
  svg += '</svg>';
  const legend = rows.map((row) => `<div class="row small"><i style="width:12px;height:12px;border-radius:50%;background:${row.fill};border:1px solid ${row.stroke};display:inline-block"></i><span class="grow">${row.label}</span><b>${fmt(Math.min(row.k, adults))}</b></div>`).join('')
    + (shares ? `<div class="tiny muted" style="margin-top:6px">${shares.map((sh, g) => `<span style="white-space:nowrap"><i style="width:9px;height:9px;border-radius:2px;background:${GROUP_COLOURS[g]};display:inline-block"></i> ${esc(land.groups[g])} ${sh}%${g === land.rulerGroup ? ' ★' : ''}</span>`).join(' &nbsp;')}</div>` : '');
  return { svg, legend };
}

// The ladder: what a number of people means in practice, on a log scale.
export function ladderSVG(r, adults, { width = 320, active = null } = {}) {
  const rungs = LADDER.filter((x) => x.max !== Infinity || true);
  const H = rungs.length * 34 + 10;
  const top = Math.log10(Math.max(adults, 10));
  const y = (n) => 8 + (1 - Math.log10(Math.max(1, Math.min(n, adults))) / top) * (H - 16);
  let s = `<svg viewBox="0 0 ${width} ${H}" width="100%" style="max-width:${width}px" role="img" aria-label="What the numbers mean">`;
  s += `<line x1="70" y1="8" x2="70" y2="${H - 8}" stroke="var(--line)" stroke-width="2"/>`;
  // Rungs stop at half the adults: above that, it is "the people".
  const half = Math.round(adults * 0.5);
  let lo = 1, lastLabelY = Infinity;
  for (const x of rungs) {
    const last = x.max === Infinity;
    const hi = last ? adults : Math.min(x.max, half - 1);
    if (lo > hi) continue;
    const yy = (y(lo) + y(hi)) / 2;
    const on = active !== null && active >= lo && active <= hi;
    s += `<line x1="64" y1="${y(hi).toFixed(1)}" x2="76" y2="${y(hi).toFixed(1)}" stroke="var(--ink-soft)" stroke-width="1"/>`;
    if (lastLabelY - y(hi) > 12) { s += `<text x="58" y="${(y(hi) + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--ink-soft)">${fmt(hi)}</text>`; lastLabelY = y(hi); }
    s += `<text x="86" y="${(yy + 4).toFixed(1)}" font-size="11.5" ${on ? 'font-weight="700" fill="var(--ink)"' : 'fill="var(--ink-soft)"'}>${esc(x.label)}</text>`;
    lo = hi + 1;
  }
  const marks = [['nominal', '#a99a7c', 'Nominal'], ['real', '#5e566b', 'Real'], ['coalition', '#b3261e', 'Coalition']];
  marks.forEach(([k, col, lab], i) => {
    if (!r || !r[k]) return;
    const yy = y(r[k]);
    s += `<circle cx="70" cy="${yy.toFixed(1)}" r="6" fill="${col}" stroke="#fff" stroke-width="1.5"/>`;
    s += `<text x="${width - 4}" y="${(yy + 4).toFixed(1)}" text-anchor="end" font-size="10.5" font-weight="700" fill="${col}">${lab} ${fmt(r[k])}</text>`;
  });
  return s + '</svg>';
}

export function meters(m) {
  const info = m.information === null || m.information === undefined ? '–' : `${m.information}%`;
  return `<div class="meters">
    <div class="meter"><span>Stability</span><b>${m.stability}</b></div>
    <div class="meter"><span>Treasury</span><b>${m.treasury}</b></div>
    <div class="meter"><span>Capital</span><b>${m.capital}</b></div>
    <div class="meter"><span>Information</span><b>${info}</b></div>
    ${m.autonomy ? `<div class="meter"><span>Free hand</span><b>${m.autonomy}/4</b></div>` : ''}
  </div>`;
}

export function moodColour(v) {
  const scale = { '-3': '#8f1d16', '-2': '#c8553d', '-1': '#e8a87c', 0: '#efe3c2', 1: '#c6dba6', 2: '#86b97a', 3: '#4c8c4a' };
  return scale[String(v)] || '#ddd';
}

export function timerText(ms) {
  const neg = ms < 0;
  const s = Math.floor(Math.abs(ms) / 1000);
  return `${neg ? '+' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// The province table and what each lever did.
export function decreeDetail(d, { table = true } = {}) {
  const bias = d.bias ?? Math.max(0, Math.round(d.choice.repression * 1.5) - (d.choice.agencies ? 1 : 0));
  const chip = (v) => `<span class="moodchip" style="background:${moodColour(v)}">${esc(DECREE.moodShort[String(v)])}</span>`;
  const rows = d.provinces.map((p) => {
    const gap = p.reported - p.mood;
    return `<tr${p.plot ? ' class="plotrow"' : ''}><td>${esc(p.name)}${p.plot ? ' <b>(plot)</b>' : ''}</td><td>${chip(p.reported)}</td><td>${chip(p.mood)}</td><td class="num">${gap > 0 ? '+' + gap : gap === 0 ? '·' : gap}</td></tr>`;
  }).join('');
  const rep = DECREE.repression[d.choice.repression];
  const loy = DECREE.loyalty[d.choice.loyalty];
  const levers = [
    `<b>${esc(rep.label)} repression</b> ${bias > 0 ? `added ${bias} step${bias > 1 ? 's' : ''} of false cheer to every report` : 'left the reports honest'}${d.choice.agencies ? ', after the rival agencies corrected one step' : ''}${d.choice.repression <= 1 && d.unrestPenalty ? `, but let ${d.unrest} discontented province${d.unrest > 1 ? 's' : ''} organise` : ''}. ${citeHTML(DECREE.cites.mobutu)}`,
    `<b>${esc(loy.label)}</b> ${d.choice.loyalty ? `lifted the true mood in ${d.bought ?? '–'} province${d.bought === 1 ? '' : 's'}, though never the plotters’` : 'bought no one'}. ${citeHTML(DECREE.cites.rents)}`,
  ];
  if (d.choice.agencies) levers.push(`<b>Rival agencies</b> checked each other’s reports. ${citeHTML(DECREE.cites.agencies)}`);
  levers.push(`<b>Information ${d.information}%</b>: the reports were on average ${d.err ?? '–'} step${d.err === 1 ? '' : 's'} away from the truth.`);
  const tbl = `<table class="dtable"><thead><tr><th>Province</th><th>Palace heard</th><th>Truth</th><th>Gap</th></tr></thead><tbody>${rows}</tbody></table>`;
  return `${table ? tbl : ''}
    <div class="stack" style="gap:3px;margin-top:6px">${levers.map((l) => `<div class="tiny">${l}</div>`).join('')}</div>`;
}


// A scene from the story so far, with its real-world parallel.
export function storyHTML(st) {
  if (!st || (!st.text && !st.parallel)) return '';
  return `<div class="story">${st.text ? `<p>${esc(st.text)}</p>` : ''}${st.parallel ? `<p class="small parallel"><b>In real life.</b> ${esc(st.parallel)} ${citeHTML(st.cite)}${st.cite2 ? ' ' + citeHTML(st.cite2) : ''}</p>` : ''}</div>`;
}
