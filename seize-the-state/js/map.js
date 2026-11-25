// The continent of Meridia, generated from a fixed seed so every device draws the same map.
import { Delaunay } from 'https://cdn.jsdelivr.net/npm/d3-delaunay@6.0.4/+esm';
import { rngFrom, makeNoise } from './rng.js';
import { TERRITORIES, CONTINENT_NAME } from './territories.js';
import { flagInner } from './flag.js';
import { iconAt } from './icons.js';
import { WEALTH } from './content/land.js';

export { TERRITORIES };
export const MAP_W = 1000;
export const MAP_H = 640;
const SEED = 'meridia-v1';

let cached = null;

export function buildMap() {
  if (cached) return cached;
  const rng = rngFrom(SEED);
  const fbm = makeNoise(SEED);
  const fbm2 = makeNoise(SEED + ':b');

  // Jittered grid of points.
  const pts = [];
  const step = 19;
  for (let y = step / 2; y < MAP_H; y += step) {
    for (let x = step / 2; x < MAP_W; x += step) {
      pts.push([x + (rng() - 0.5) * step * 0.9, y + (rng() - 0.5) * step * 0.9]);
    }
  }
  const delaunay = Delaunay.from(pts);
  const voronoi = delaunay.voronoi([0, 0, MAP_W, MAP_H]);

  const landValue = (x, y) => {
    const nx = (x - 490) / 450, ny = (y - 330) / 280;
    let v = 1 - Math.sqrt(nx * nx + ny * ny)
      + 0.85 * (fbm(x * 0.0075, y * 0.0075) - 0.5)
      + 0.22 * (fbm(x * 0.03 + 40, y * 0.03) - 0.5);
    for (const t of TERRITORIES) {
      const d = Math.hypot(x - t.seed[0], y - t.seed[1]);
      v = Math.max(v, 0.32 - d / 260);
    }
    // Keep a margin of sea at the edges.
    const edge = Math.min(x, y, MAP_W - x, MAP_H - y);
    if (edge < 40) v -= (40 - edge) / 40;
    return v;
  };

  const n = pts.length;
  const land = new Uint8Array(n);
  const terr = new Int8Array(n).fill(-1);
  const h = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    const v = landValue(x, y);
    h[i] = 0.55 * v + 0.35 * fbm2(x * 0.012, y * 0.012);
    if (v > 0.06) {
      land[i] = 1;
      let best = -1, bd = Infinity;
      TERRITORIES.forEach((t, k) => {
        const warp = 1 + 0.5 * (fbm2(x * 0.01 + k * 13, y * 0.01 - k * 7) - 0.5);
        const d = Math.hypot(x - t.seed[0], y - t.seed[1]) * warp;
        if (d < bd) { bd = d; best = k; }
      });
      terr[i] = best;
    }
  }
  // Northern Highlands sit higher.
  for (let i = 0; i < n; i++) {
    if (terr[i] === 0) h[i] += 0.22;
    if (terr[i] === 1) h[i] -= 0.05; // the plains
    if (terr[i] === 4) h[i] -= 0.1; // the delta
  }

  const polys = [];
  for (let i = 0; i < n; i++) polys.push(voronoi.cellPolygon(i));

  // Shared edges between neighbouring cells.
  const key = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  const sharedEdge = (i, j) => {
    const a = polys[i], b = polys[j];
    if (!a || !b) return null;
    const bk = new Set(b.map(key));
    const common = [];
    for (let k = 0; k < a.length - 1; k++) if (bk.has(key(a[k]))) common.push(a[k]);
    return common.length >= 2 ? [common[0], common[1]] : null;
  };
  const coast = [], borders = [];
  for (let i = 0; i < n; i++) {
    for (const j of delaunay.neighbors(i)) {
      if (j <= i) continue;
      if (land[i] !== land[j]) {
        const e = sharedEdge(i, j); if (e) coast.push(e);
      } else if (land[i] && terr[i] !== terr[j]) {
        const e = sharedEdge(i, j); if (e) borders.push({ e, a: terr[i], b: terr[j] });
      }
    }
  }

  // Rivers: walk downhill from high ground to the sea.
  const rivers = [];
  const used = new Set();
  const sources = [...Array(n).keys()].filter((i) => land[i]).sort((a, b) => h[b] - h[a]);
  for (const src of sources) {
    if (rivers.length >= 5) break;
    if ([...used].some((u) => Math.hypot(pts[u][0] - pts[src][0], pts[u][1] - pts[src][1]) < 140)) continue;
    const path = [src];
    const seen = new Set(path);
    let cur = src;
    for (let k = 0; k < 90; k++) {
      let next = -1, nh = Infinity;
      for (const j of delaunay.neighbors(cur)) {
        if (seen.has(j)) continue;
        if (h[j] < nh) { nh = h[j]; next = j; }
      }
      if (next < 0) break;
      path.push(next); seen.add(next); cur = next;
      if (!land[next]) break;
    }
    if (!land[cur] && path.length > 8) {
      rivers.push(path.map((i) => pts[i]));
      path.forEach((i) => used.add(i));
    }
  }

  // Mountains and forests.
  const landIdx = [...Array(n).keys()].filter((i) => land[i]);
  const hs = landIdx.map((i) => h[i]).sort((a, b) => a - b);
  const hiCut = hs[Math.floor(hs.length * 0.86)];
  const mountains = landIdx.filter((i) => h[i] > hiCut && rng() < 0.75).map((i) => pts[i]);
  const forests = landIdx.filter((i) => h[i] < hiCut && fbm(pts[i][0] * 0.02 + 99, pts[i][1] * 0.02) > 0.62 && rng() < 0.7).map((i) => pts[i]);

  // Territory centroids for labels.
  const centroids = TERRITORIES.map((t, k) => {
    const cells = landIdx.filter((i) => terr[i] === k);
    const cx = cells.reduce((s, i) => s + pts[i][0], 0) / cells.length;
    const cy = cells.reduce((s, i) => s + pts[i][1], 0) / cells.length;
    return [cx, cy];
  });
  const bboxes = TERRITORIES.map((t, k) => {
    const cells = landIdx.filter((i) => terr[i] === k);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const i of cells) for (const p of polys[i]) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    return [x0, y0, x1, y1];
  });

  cached = { pts, delaunay, polys, land, terr, h, coast, borders, rivers, mountains, forests, centroids, bboxes, landIdx };
  return cached;
}

export function territoryAt(x, y) {
  const m = buildMap();
  const i = m.delaunay.find(x, y);
  return m.land[i] ? m.terr[i] : -1;
}

// Six provinces inside one territory, by farthest-point sampling from the capital.
export function provincesFor(slot, capitalAt, count = 6) {
  const m = buildMap();
  const cells = m.landIdx.filter((i) => m.terr[i] === slot);
  const start = capitalAt ? m.delaunay.find(capitalAt[0], capitalAt[1]) : cells[0];
  const seeds = [cells.includes(start) ? start : cells[Math.floor(cells.length / 2)]];
  while (seeds.length < count) {
    let best = -1, bd = -1;
    for (const c of cells) {
      const d = Math.min(...seeds.map((s) => Math.hypot(m.pts[c][0] - m.pts[s][0], m.pts[c][1] - m.pts[s][1])));
      if (d > bd) { bd = d; best = c; }
    }
    seeds.push(best);
  }
  const groups = seeds.map(() => []);
  for (const c of cells) {
    let best = 0, bd = Infinity;
    seeds.forEach((s, k) => {
      const d = Math.hypot(m.pts[c][0] - m.pts[s][0], m.pts[c][1] - m.pts[s][1]);
      if (d < bd) { bd = d; best = k; }
    });
    groups[best].push(c);
  }
  return groups.map((g) => {
    // Label at the cell nearest the province's centroid, so it sits inside it.
    const cx = g.reduce((a, c) => a + m.pts[c][0], 0) / g.length;
    const cy = g.reduce((a, c) => a + m.pts[c][1], 0) / g.length;
    let best = g[0], bd = Infinity;
    for (const c of g) { const d = Math.hypot(m.pts[c][0] - cx, m.pts[c][1] - cy); if (d < bd) { bd = d; best = c; } }
    return { cells: g, centre: m.pts[best] };
  });
}

const f1 = (x) => x.toFixed(1);
function cellsPath(m, cells) {
  let d = '';
  for (const i of cells) {
    const p = m.polys[i];
    if (!p) continue;
    d += `M${f1(p[0][0])},${f1(p[0][1])}`;
    for (let k = 1; k < p.length - 1; k++) d += `L${f1(p[k][0])},${f1(p[k][1])}`;
    d += 'Z';
  }
  return d;
}
function segPath(segs) {
  return segs.map(([a, b]) => `M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`).join('');
}
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M${f1(points[0][0])},${f1(points[0][1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d;
}
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Draws the map into an <svg> element.
// opts: teams [{slot, country}], highlight (slot), dim (bool: grey out others),
// provinces {slot, list:[{cells, fill}]}, viewBox [x,y,w,h], labels (bool), compact (bool)
export function mapSVG(opts = {}) {
  const m = buildMap();
  const teams = opts.teams || [];
  const bySlot = Object.fromEntries(teams.map((t) => [t.slot, t]));
  const vb = opts.viewBox || [0, 0, MAP_W, MAP_H];
  const uid = opts.uid || 'm';
  let s = `<svg class="map" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Map of the continent of ${CONTINENT_NAME}">`;
  s += `<defs>
    <pattern id="${uid}-waves" width="28" height="14" patternUnits="userSpaceOnUse"><path d="M0 9 Q7 5 14 9 T28 9" fill="none" stroke="var(--sea-line)" stroke-width="0.8"/></pattern>
    <pattern id="${uid}-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,.12)" stroke-width="2"/></pattern>
    <filter id="${uid}-paper"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .05 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  </defs>`;
  s += `<rect x="-600" y="-600" width="${MAP_W + 1200}" height="${MAP_H + 1200}" fill="var(--sea)"/>`;
  s += `<rect x="-600" y="-600" width="${MAP_W + 1200}" height="${MAP_H + 1200}" fill="url(#${uid}-waves)" opacity=".7"/>`;
  const coastD = segPath(m.coast);
  s += `<path d="${coastD}" stroke="var(--shore2)" stroke-width="26" stroke-linecap="round" fill="none"/>`;
  s += `<path d="${coastD}" stroke="var(--shore1)" stroke-width="12" stroke-linecap="round" fill="none"/>`;

  TERRITORIES.forEach((t, k) => {
    const cells = m.landIdx.filter((i) => m.terr[i] === k);
    const d = cellsPath(m, cells);
    let fill = t.land;
    if (opts.dim && opts.highlight !== undefined && opts.highlight !== k) fill = 'var(--land-dim)';
    s += `<path class="terr" data-slot="${k}" d="${d}" fill="${fill}" stroke="${fill}" stroke-width="1.2"/>`;
  });
  if (opts.provinces) {
    for (const p of opts.provinces.list) {
      s += `<path d="${cellsPath(m, p.cells)}" fill="${p.fill}" stroke="${p.fill}" stroke-width="1.2" opacity=".92"/>`;
    }
  }
  s += `<path d="${coastD}" stroke="#fff" stroke-opacity=".35" stroke-width="1" fill="none" filter="url(#${uid}-paper)"/>`;

  // Forests and mountains.
  let fd = '';
  for (const [x, y] of m.forests) fd += `M${f1(x - 3)},${f1(y + 2)}a3,3 0 1,1 6,0a3,3 0 1,1 -6,0`;
  s += `<path d="${fd}" fill="rgba(60,80,40,.22)"/>`;
  let md = '', ms = '';
  for (const [x, y] of m.mountains) {
    md += `M${f1(x - 8)},${f1(y + 5)}L${f1(x)},${f1(y - 7)}L${f1(x + 8)},${f1(y + 5)}`;
    ms += `M${f1(x)},${f1(y - 7)}L${f1(x + 2)},${f1(y + 5)}L${f1(x + 8)},${f1(y + 5)}Z`;
  }
  s += `<path d="${ms}" fill="rgba(0,0,0,.10)"/><path d="${md}" fill="none" stroke="var(--ink-soft)" stroke-width="1.1" stroke-linejoin="round"/>`;
  for (const r of m.rivers) s += `<path d="${smoothPath(r)}" fill="none" stroke="var(--river)" stroke-width="2.2" stroke-linecap="round"/>`;

  // Borders and coast.
  s += `<path d="${segPath(m.borders.map((b) => b.e))}" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="5 3" fill="none" opacity=".75"/>`;
  s += `<path d="${coastD}" stroke="var(--ink)" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;

  if (opts.highlight !== undefined && opts.highlight >= 0 && !opts.dim) {
    const cells = m.landIdx.filter((i) => m.terr[i] === opts.highlight);
    s += `<path d="${cellsPath(m, cells)}" fill="url(#${uid}-hatch)" stroke="none"/>`;
  }

  // Labels.
  if (opts.labels !== false) {
    TERRITORIES.forEach((t, k) => {
      const team = bySlot[k];
      let [cx, cy] = m.centroids[k];
      const country = team && team.country ? team.country.name : null;
      // Keep the label clear of the capital and its flag.
      const cap = team && team.country && team.country.capitalAt;
      if (cap && Math.abs(cap[0] - cx) < 110 && cap[1] - 50 < cy + 42 && cap[1] + 20 > cy) cy = cap[1] + 4;
      if (country) {
        s += `<text x="${f1(cx)}" y="${f1(cy + 26)}" class="map-country" text-anchor="middle">${esc(country)}</text>`;
        const L = team.land;
        const sub = L ? `${L.population} MILLION PEOPLE` : t.region;
        s += `<text x="${f1(cx)}" y="${f1(cy + 42)}" class="map-region" text-anchor="middle">${esc(sub)}</text>`;
        const w = L && WEALTH.find((x) => x.value === L.wealth);
        if (w) s += `<g opacity=".85">${iconAt(w.icon, f1(cx - sub.length * 4.6 - 10), f1(cy + 38.5), 6.5, 'var(--ink)')}</g>`;
      } else {
        s += `<text x="${f1(cx)}" y="${f1(cy + 6)}" class="map-region big" text-anchor="middle">${esc(t.region)}</text>`;
        if (team) s += `<text x="${f1(cx)}" y="${f1(cy + 24)}" class="map-team" text-anchor="middle" fill="${t.accent}">${esc(team.name)}</text>`;
      }
    });
  }

  // Capitals and flags.
  for (const team of teams) {
    const c = team.country;
    if (!c || !c.capitalAt) continue;
    const [x, y] = c.capitalAt;
    s += `<g class="capital"><path d="M${f1(x)},${f1(y - 7)}L${f1(x + 2.2)},${f1(y - 2.2)}L${f1(x + 7)},${f1(y - 2)}L${f1(x + 3.3)},${f1(y + 1.4)}L${f1(x + 4.5)},${f1(y + 6.5)}L${f1(x)},${f1(y + 3.6)}L${f1(x - 4.5)},${f1(y + 6.5)}L${f1(x - 3.3)},${f1(y + 1.4)}L${f1(x - 7)},${f1(y - 2)}L${f1(x - 2.2)},${f1(y - 2.2)}Z" fill="var(--ink)" stroke="#fff" stroke-width="1"/>`;
    s += `<text x="${f1(x + 10)}" y="${f1(y + 4)}" class="map-capital">${esc(c.capital)}</text>`;
    if (c.flag && opts.flags !== false) {
      s += `<line x1="${f1(x)}" y1="${f1(y - 7)}" x2="${f1(x)}" y2="${f1(y - 36)}" stroke="var(--ink)" stroke-width="1.2"/>`;
      s += `<g transform="translate(${f1(x)} ${f1(y - 36)}) scale(.45)"><g>${flagInner(c.flag)}</g><rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.35)" stroke-width="1"/></g>`;
    }
    s += '</g>';
  }

  if (opts.pending) {
    const [x, y] = opts.pending;
    s += `<circle cx="${f1(x)}" cy="${f1(y)}" r="9" fill="none" stroke="var(--accent)" stroke-width="2.5"><animate attributeName="r" values="7;13;7" dur="1.4s" repeatCount="indefinite"/></circle><circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="var(--accent)"/>`;
  }

  if (opts.provinceLabels) {
    for (const p of opts.provinceLabels) {
      s += `<text x="${f1(p.at[0])}" y="${f1(p.at[1])}" class="map-prov" text-anchor="middle">${esc(p.text)}</text>`;
    }
  }

  if (!opts.compact) {
    // Cartouche and compass.
    s += `<g transform="translate(40 40)"><rect width="190" height="58" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2"/><rect x="4" y="4" width="182" height="50" fill="none" stroke="var(--ink)" stroke-width=".6"/><text x="95" y="32" class="map-title" text-anchor="middle">${CONTINENT_NAME.toUpperCase()}</text><text x="95" y="47" class="map-sub" text-anchor="middle">Five new states</text></g>`;
    s += `<g transform="translate(${MAP_W - 70} ${MAP_H - 80})" class="compass"><circle r="24" fill="var(--paper)" stroke="var(--ink)" stroke-width="1"/><path d="M0,-30 L5,0 L0,30 L-5,0Z" fill="var(--ink)"/><path d="M-30,0 L0,4 L30,0 L0,-4Z" fill="var(--ink-soft)"/><text y="-34" text-anchor="middle" class="map-sub">N</text></g>`;
  }
  s += '</svg>';
  return s;
}

// Converts a click on a rendered map into map coordinates.
export function svgPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX; pt.y = evt.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [Math.round(p.x), Math.round(p.y)];
}

export function territoryViewBox(slot, pad = 30) {
  const b = buildMap().bboxes[slot];
  return [b[0] - pad, b[1] - pad, b[2] - b[0] + pad * 2, b[3] - b[1] + pad * 2].map((v) => Math.round(v));
}
