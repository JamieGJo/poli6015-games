// The Founding Charter: an on-screen card and a downloadable image.
import { REGIME_TYPES, RULER_QUESTIONS, ELECTORAL_LAYERS, compareClaim, DECREE } from './content/week1.js';
import { OLD_ORDERS } from './content/week2.js';
import { cite } from './content/sources.js';
import { flagSVG, flagInner } from './flag.js';
import { mapSVG, territoryViewBox, provincesFor } from './map.js';
import { stateProfile } from './profile.js';
import { WEALTH } from './content/land.js';
import { reflectionText } from './engine.js';
import { TERRITORIES } from './territories.js';
import { esc, typePill, fmt, claimPills, resultPills } from './ui.js';

function facts(team) {
  const c = team.country || {};
  const r = team.rulers || {};
  const cls = r.classified ? r.classified.type : null;
  const sel = team.selectorate ? team.selectorate.result : null;
  const chooserQ = RULER_QUESTIONS[0].options.find((o) => o.value === r.answers?.chooser);
  return {
    name: c.name || 'An unnamed state',
    capital: c.capital || '–',
    leader: c.leader || '–',
    motto: c.motto || '',
    flag: c.flag,
    claim: Array.isArray(r.claim) ? r.claim : [r.claim].filter(Boolean),
    type: cls,
    classified: r.classified || null,
    cmp: r.classified ? compareClaim(r) : null,
    typeText: cls ? REGIME_TYPES[cls].label + (r.classified && ELECTORAL_LAYERS[r.classified.elections]?.label && ['rigged', 'competitive'].includes(r.classified.elections) ? `, ${ELECTORAL_LAYERS[r.classified.elections].label.toLowerCase()}` : '') : '',
    claimText: (Array.isArray(r.claim) ? r.claim : [r.claim].filter(Boolean)).map((k) => REGIME_TYPES[k]?.label).filter(Boolean).join(' + '),
    chooser: chooserQ ? chooserQ.label : '–',
    justification: r.justification || '',
    coalition: sel ? sel.coalition : null,
    real: sel ? sel.real : null,
    nominal: sel ? sel.nominal : null,
    oldOrder: team.oldOrder ? (OLD_ORDERS[team.oldOrder.order]?.label || '–') : '–',
    memory: team.oldOrder?.memory || '',
    info: team.meters.information,
    m: team.meters,
    reflection: team.puzzle1?.text || team.reflectionText || reflectionText(team.reflection) || '',
  };
}

export function charterHTML(team, { compact = false, sealed = false } = {}) {
  const f = facts(team);
  const t = TERRITORIES[team.slot];
  const mismatch = f.cmp && !f.cmp.ok;
  return `<div class="charter" style="--tc:${t.accent}">
    <div class="row" style="align-items:flex-start">
      ${flagSVG(f.flag, { width: compact ? 72 : 120 })}
      <div class="grow">
        <div class="caps muted">Founding Charter · ${esc(t.region)}</div>
        <h2 style="margin:2px 0 2px">${esc(f.name)}</h2>
        <div class="small">Capital: <b>${esc(f.capital)}</b> · Ruler: <b>${esc(f.leader)}</b></div>
        ${f.motto ? `<div class="small" style="font-family:var(--display);font-style:italic;margin-top:4px">“${esc(f.motto)}”</div>` : ''}
      </div>
    </div>
    <div style="margin-top:12px;display:grid;grid-template-columns:${compact ? '1fr' : '1fr 1fr'};gap:10px 18px">
      ${f.classified ? `<div><div class="caps muted">Regime, by Geddes’s test</div>${sealed ? '<span class="small muted">Sealed until the end of Week 2</span>' : `${resultPills(f.classified)} ${mismatch ? `<span class="small muted">claimed: ${esc(f.claimText)}</span>` : ''}`}</div>
      <div><div class="caps muted">Who picks the leader</div><span class="small">${esc(f.chooser)}</span></div>` : ''}
      ${f.coalition ? `<div><div class="caps muted">Winning coalition</div><span class="small"><b>${fmt(f.coalition)}</b> of ${fmt(f.real)} with real influence</span></div>` : ''}
      <div><div class="caps muted">What came before</div><span class="small">${esc(f.oldOrder)}</span></div>
    </div>
    ${!compact && f.justification ? `<p class="small" style="margin-top:10px"><b>How it works:</b> ${esc(f.justification)}</p>` : ''}
    ${!compact && f.memory ? `<p class="small"><b>What people remember:</b> ${esc(f.memory)}</p>` : ''}
    <div class="row wrap small" style="margin-top:10px;gap:14px">
      <span>Stability <b>${f.m.stability}</b></span><span>Treasury <b>${f.m.treasury}</b></span><span>Capital <b>${f.m.capital}</b></span>${f.info === null ? '' : `<span>Information <b>${f.info}%</b></span>`}
    </div>
  </div>`;
}

// ---------- Image export ----------

function wrap(text, max) {
  const words = String(text || '').split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max) { if (cur) lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
const x = (s) => esc(s);

export function charterSVG(team, allTeams = [team]) {
  const f = facts(team);
  const t = TERRITORIES[team.slot];
  const W = 1400, H = 900;
  const vb = territoryViewBox(team.slot, 40);
  let mapStr = mapSVG({ teams: allTeams, highlight: team.slot, dim: true, compact: true, uid: 'cx' });
  mapStr = mapStr.replace(/^<svg class="map" viewBox="[^"]*"/, `<svg x="760" y="210" width="580" height="440" viewBox="${vb.join(' ')}"`);
  const type = REGIME_TYPES[f.type];
  const lines = [];
  let y = 372;
  // Left column: about 44 characters a line at this size, so long values wrap.
  const row = (label, value, sub = '') => {
    lines.push(`<text x="70" y="${y}" class="lab">${x(label.toUpperCase())}</text>`);
    wrap(value, 44).slice(0, 2).forEach((l, i) => { lines.push(`<text x="70" y="${y + 30 + i * 30}" class="val">${x(l)}</text>`); if (i) y += 30; });
    if (sub) { lines.push(`<text x="70" y="${y + 56}" class="sub">${x(sub)}</text>`); y += 24; }
    y += 74;
  };
  row('Regime, by Geddes’s test', type ? f.typeText : '–', f.cmp && !f.cmp.ok ? `The founders claimed: ${f.claimText}` : '');
  row('Who picks the leader', f.chooser);
  row('Winning coalition', f.coalition ? `${fmt(f.coalition)} people, of ${fmt(f.real)} with real influence` : '–');
  if (team.land) row('People and wealth', `${team.land.population} million people · ${(WEALTH.find((w) => w.value === team.land.wealth) || {}).label || ''}`);
  row('What came before', f.oldOrder);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>
    svg { --sea:#dce8eb; --sea-line:#bcd1d7; --shore1:#c9dde2; --shore2:#d3e3e7; --river:#6f9fb3; --land-dim:#e4dfd5; --ink:#1d2433; --ink-soft:#4a5263; --paper:#f5f0e6; --accent:#b3261e; }
    text { font-family: Georgia, 'Times New Roman', serif; fill:#1d2433; }
    .lab { font-family: Helvetica, Arial, sans-serif; font-size:15px; letter-spacing:2.5px; fill:#7b7f8a; font-weight:700; }
    .val { font-size:25px; }
    .quote { font-size:21px; font-style:italic; fill:#4a5263; }
    .sub { font-size:18px; font-style:italic; fill:#4a5263; }
    .map-region { font-size:11px; letter-spacing:2px; fill:#4a5263; }
    .map-country { font-size:21px; font-weight:700; }
    .map-capital { font-family: Helvetica, Arial, sans-serif; font-size:12px; font-weight:700; paint-order:stroke; stroke:rgba(255,255,255,.8); stroke-width:3px; }
    .map-team { font-size:13px; }
  </style>
  <rect width="${W}" height="${H}" fill="#fbf7ee"/>
  <rect x="18" y="18" width="${W - 36}" height="${H - 36}" fill="none" stroke="#1d2433" stroke-width="2"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#1d2433" stroke-width=".8"/>
  <rect x="28" y="28" width="${W - 56}" height="10" fill="${t.accent}"/>
  <g transform="translate(70 80) scale(3.2)">${flagInner(f.flag)}<rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.3)" stroke-width=".5"/></g>
  <text x="300" y="100" class="lab">FOUNDING CHARTER · ${x(t.region.toUpperCase())}</text>
  <text x="300" y="160" style="font-size:54px;font-weight:700">${x(f.name)}</text>
  <text x="300" y="200" style="font-size:22px">Capital: ${x(f.capital)}   ·   Ruler: ${x(f.leader)}</text>
  ${f.motto ? `<text x="300" y="240" style="font-size:22px;font-style:italic;fill:#4a5263">“${x(f.motto)}”</text>` : ''}
  <line x1="70" y1="330" x2="700" y2="330" stroke="#d8cdb9"/>
  ${lines.join('\n')}
  <rect x="760" y="210" width="580" height="440" fill="none" stroke="#1d2433" stroke-width="1.2"/>
  ${mapStr}
  <g transform="translate(760 690)">
    ${[['Stability', f.m.stability], ['Treasury', f.m.treasury], ['Capital', f.m.capital], ['Information', f.info === null ? '–' : f.info + '%']].map(([k, v], i) => `<g transform="translate(${i * 147} 0)"><rect width="135" height="80" rx="8" fill="#f1eadb"/><text x="14" y="28" class="lab" style="font-size:12px">${k.toUpperCase()}</text><text x="14" y="64" style="font-size:32px;font-weight:700">${x(v)}</text></g>`).join('')}
  </g>
  <text x="70" y="${H - 60}" style="font-family:Helvetica,Arial,sans-serif;font-size:14px;fill:#7b7f8a">Regime type after ${x(cite({ src: 'geddes1999', page: '121–124' }))}. Seize the State · POLI6015 Dictatorships · Week 1 · Draft</text>
</svg>`;
  return svg;
}

export async function downloadCharterPNG(team, allTeams) {
  const svg = charterSVG(team, allTeams);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = 1400 * scale; canvas.height = 900 * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.drawImage(img, 0, 0);
  URL.revokeObjectURL(url);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const a = document.createElement('a');
  const safe = (team.country?.name || 'charter').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  a.href = URL.createObjectURL(blob);
  a.download = `founding-charter_${safe}.png`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ---------- "Your state, Year One" ----------

const PROVINCE_SHADES = [0.0, 0.14, 0.26, 0.08, 0.2, 0.32];
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.round(v * (1 - k));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

export function profileMap(team, uid = 'pf') {
  const T = TERRITORIES[team.slot];
  const vb = territoryViewBox(team.slot, 24);
  const provs = provincesFor(team.slot, team.country?.capitalAt);
  const svg = mapSVG({
    teams: [team], highlight: team.slot, dim: true, compact: true, viewBox: vb, uid,
    provinces: { list: provs.map((p, i) => ({ cells: p.cells, fill: shade(T.land.startsWith('#') ? T.land : '#c9b38a', PROVINCE_SHADES[i % 6]) })) },
  });
  return { svg, vb };
}

export function profileHTML(team, { wide = false, uid = 'pf' } = {}) {
  const { svg, vb } = profileMap(team, uid);
  const parts = stateProfile(team);
  return `<div class="profile ${wide ? 'wide' : ''}">
    <div class="p-map map-wrap" style="aspect-ratio:${vb[2]}/${vb[3]};max-height:${wide ? '62vh' : '50vh'}">${svg}</div>
    <div class="p-text">${parts.map((p) => `<h4>${esc(p.head)}</h4><p>${esc(p.text)}</p>`).join('')}</div>
  </div>`;
}
