// Flag builder: layouts, colours and emblems, drawn as SVG on a 60 x 40 grid.
export const FLAG_COLOURS = [
  { hex: '#b3261e', name: 'Red' },
  { hex: '#6e1a1a', name: 'Maroon' },
  { hex: '#e0a526', name: 'Gold' },
  { hex: '#f3ecd9', name: 'Cream' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#1b2232', name: 'Black' },
  { hex: '#1f4e8c', name: 'Blue' },
  { hex: '#5fa8d3', name: 'Sky' },
  { hex: '#2c7a4b', name: 'Green' },
  { hex: '#5a2d82', name: 'Purple' },
  { hex: '#e06a1b', name: 'Orange' },
  { hex: '#8a6a3a', name: 'Brown' },
];

export const FLAG_LAYOUTS = [
  { id: 'tricolour-h', name: 'Three bands' },
  { id: 'tricolour-v', name: 'Three pales' },
  { id: 'bicolour-h', name: 'Two bands' },
  { id: 'canton', name: 'Canton' },
  { id: 'cross', name: 'Cross' },
  { id: 'triangle', name: 'Hoist triangle' },
  { id: 'disc', name: 'Disc' },
  { id: 'diagonal', name: 'Diagonal' },
  { id: 'border', name: 'Border' },
];

// Emblem paths on a unit box from -1 to 1.
function starPts(cx, cy, r, n = 5, inner = 0.42) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r * inner : r;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(3)},${(cy + rr * Math.sin(a)).toFixed(3)}`);
  }
  return `M${pts.join('L')}Z`;
}
function gearPath() {
  const teeth = 10, r1 = 1, r2 = 0.74, pts = [];
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2;
    const r = Math.floor(i / 2) % 2 ? r2 : r1;
    pts.push(`${(r * Math.cos(a)).toFixed(3)},${(r * Math.sin(a)).toFixed(3)}`);
  }
  return `M${pts.join('L')}Z M0.36,0 A0.36,0.36 0 1,0 -0.36,0 A0.36,0.36 0 1,0 0.36,0Z`;
}
function sunPath() {
  let d = 'M0.5,0 A0.5,0.5 0 1,0 -0.5,0 A0.5,0.5 0 1,0 0.5,0Z';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, b = a + 0.13, c = a - 0.13;
    d += `M${(0.62 * Math.cos(c)).toFixed(3)},${(0.62 * Math.sin(c)).toFixed(3)}L${Math.cos(a).toFixed(3)},${Math.sin(a).toFixed(3)}L${(0.62 * Math.cos(b)).toFixed(3)},${(0.62 * Math.sin(b)).toFixed(3)}Z`;
  }
  return d;
}

// Point helpers for the composed emblems below.
function rot([x, y], a) { return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; }
function poly(pts) { return `M${pts.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join('L')}Z`; }
function ellipse(cx, cy, rx, ry, a = 0, n = 16, ccw = false) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = ((ccw ? -i : i) / n) * Math.PI * 2;
    const [x, y] = rot([rx * Math.cos(t), ry * Math.sin(t)], a);
    pts.push([cx + x, cy + y]);
  }
  return poly(pts);
}
function circle(cx, cy, r, ccw = false) { return ellipse(cx, cy, r, r, 0, 24, ccw); }
// An ear of wheat from (x, y), leaning by angle a (radians from upright), of length len.
function ear(x, y, a, len) {
  const up = (d, side = 0) => { const [dx, dy] = rot([side, -d], a); return [x + dx, y + dy]; };
  let d = poly([up(0, -0.035), up(0, 0.035), up(len * 0.55, 0.03), up(len * 0.55, -0.03)]);
  for (let i = 0; i < 4; i++) {
    const t = len * (0.55 + i * 0.11);
    for (const side of [-1, 1]) {
      const [cx, cy] = up(t, side * 0.07);
      d += ellipse(cx, cy, 0.06, 0.12, a + side * 0.45, 12);
    }
  }
  const [tx, ty] = up(len * 1.0);
  d += ellipse(tx, ty, 0.05, 0.11, a, 12);
  return d;
}
function wreathSide(sign) {
  let d = '';
  for (let i = 0; i < 7; i++) {
    const t = Math.PI * (0.62 + i * 0.105);
    d += ellipse(sign * 0.78 * Math.cos(t), 0.78 * -Math.sin(t) * -1, 0.09, 0.2, sign * (t - Math.PI / 2) + (sign > 0 ? 0.5 : -0.5), 12);
  }
  return d;
}

export const EMBLEMS = {
  none: { name: 'None', d: '' },
  star: { name: 'Star', d: starPts(0, 0, 1) },
  stars: { name: 'Three stars', d: starPts(-0.66, 0, 0.36) + starPts(0, 0, 0.36) + starPts(0.66, 0, 0.36) },
  sun: { name: 'Sun', d: sunPath() },
  crescent: { name: 'Crescent', d: 'M0.18,-0.92 A0.93,0.93 0 1,0 0.18,0.92 A0.74,0.74 0 1,1 0.18,-0.92Z' + starPts(0.45, 0, 0.32) },
  gear: { name: 'Gear', d: gearPath() },
  crown: { name: 'Crown', d: 'M-0.9,0.55 L-0.9,-0.45 L-0.45,0.05 L0,-0.75 L0.45,0.05 L0.9,-0.45 L0.9,0.55Z M-0.9,0.68 L0.9,0.68 L0.9,0.86 L-0.9,0.86Z' },
  eye: { name: 'Eye', d: 'M-1,0 Q0,-0.85 1,0 Q0,0.85 -1,0Z M0.32,0 A0.32,0.32 0 1,0 -0.32,0 A0.32,0.32 0 1,0 0.32,0Z' },
  torch: { name: 'Torch', d: 'M0,-0.95 C0.38,-0.55 0.36,-0.25 0.2,-0.08 C0.28,-0.38 0.06,-0.5 0,-0.62 C-0.06,-0.5 -0.28,-0.38 -0.2,-0.08 C-0.36,-0.25 -0.38,-0.55 0,-0.95Z M-0.3,0 L0.3,0 L0.14,0.95 L-0.14,0.95Z' },
  mountain: { name: 'Mountain', d: 'M-1,0.7 L-0.35,-0.45 L-0.05,0.05 L0.35,-0.75 L1,0.7Z' },
  eagle: { name: 'Eagle', d: 'M0,-0.9 L0.15,-0.66 L0.1,-0.46 L0.95,-0.66 L0.62,-0.24 L0.88,-0.18 L0.42,0.08 L0.24,0.34 L0.42,0.86 L0,0.6 L-0.42,0.86 L-0.24,0.34 L-0.42,0.08 L-0.88,-0.18 L-0.62,-0.24 L-0.95,-0.66 L-0.1,-0.46 L-0.15,-0.66Z' },
  wheat: { name: 'Wheat sheaf', rule: 'nonzero', d: ear(0, 0.95, 0, 1.75) + ear(-0.05, 0.95, -0.38, 1.6) + ear(0.05, 0.95, 0.38, 1.6) + poly([[-0.3, 0.42], [0.3, 0.42], [0.3, 0.54], [-0.3, 0.54]]) },
  cogwheat: { name: 'Cog and wheat', parts: [{ d: gearPath(), t: 'translate(0 -0.2) scale(0.5)' }, { d: ear(-0.55, 0.95, -0.25, 1.5) + ear(0.55, 0.95, 0.25, 1.5), rule: 'nonzero' }] },
  sword: { name: 'Sword', rule: 'nonzero', d: poly([[0, -1], [0.1, -0.8], [0.1, 0.35], [-0.1, 0.35], [-0.1, -0.8]]) + poly([[-0.45, 0.35], [0.45, 0.35], [0.45, 0.47], [-0.45, 0.47]]) + poly([[-0.06, 0.47], [0.06, 0.47], [0.06, 0.82], [-0.06, 0.82]]) + circle(0, 0.88, 0.11) },
  shield: { name: 'Shield', d: 'M-0.75,-0.88 L0.75,-0.88 L0.75,-0.05 Q0.75,0.6 0,0.98 Q-0.75,0.6 -0.75,-0.05Z M-0.52,-0.32 L0.52,-0.32 L0.52,-0.12 L-0.52,-0.12Z' },
  wreath: { name: 'Laurel wreath', rule: 'nonzero', d: wreathSide(1) + wreathSide(-1) },
  book: { name: 'Open book', d: 'M0,-0.5 Q-0.5,-0.78 -0.95,-0.62 L-0.95,0.6 Q-0.5,0.45 0,0.72 Q0.5,0.45 0.95,0.6 L0.95,-0.62 Q0.5,-0.78 0,-0.5Z M-0.035,-0.44 L0.035,-0.44 L0.035,0.6 L-0.035,0.6Z' },
  tower: { name: 'Tower', d: 'M-0.55,0.95 L-0.45,-0.45 L-0.6,-0.45 L-0.6,-0.95 L-0.36,-0.95 L-0.36,-0.75 L-0.12,-0.75 L-0.12,-0.95 L0.12,-0.95 L0.12,-0.75 L0.36,-0.75 L0.36,-0.95 L0.6,-0.95 L0.6,-0.45 L0.45,-0.45 L0.55,0.95Z M-0.16,0.9 L-0.16,0.52 A0.16,0.16 0 0,1 0.16,0.52 L0.16,0.9Z' },
  lightning: { name: 'Lightning', d: 'M0.2,-1 L-0.5,0.12 L-0.02,0.12 L-0.3,1 L0.55,-0.22 L0.06,-0.22 L0.45,-1Z' },
  anchor: { name: 'Anchor', parts: [{ d: circle(0, -0.76, 0.19) + circle(0, -0.76, 0.09, true), rule: 'nonzero' }, { d: poly([[-0.06, -0.58], [0.06, -0.58], [0.06, 0.88], [-0.06, 0.88]]) + poly([[-0.42, -0.48], [0.42, -0.48], [0.42, -0.37], [-0.42, -0.37]]) + 'M-0.82,0.22 Q-0.72,0.96 0,0.96 Q0.72,0.96 0.82,0.22 L0.64,0.32 Q0.56,0.8 0,0.82 Q-0.56,0.8 -0.64,0.32Z', rule: 'nonzero' }] },
  key: { name: 'Key', parts: [{ d: circle(0, -0.58, 0.36) + circle(0, -0.58, 0.18, true), rule: 'nonzero' }, { d: poly([[-0.07, -0.24], [0.07, -0.24], [0.07, 0.95], [-0.07, 0.95]]) + poly([[0.07, 0.5], [0.34, 0.5], [0.34, 0.62], [0.07, 0.62]]) + poly([[0.07, 0.76], [0.28, 0.76], [0.28, 0.88], [0.07, 0.88]]), rule: 'nonzero' }] },
  dove: { name: 'Dove', d: 'M-0.95,0.05 Q-0.6,-0.15 -0.25,-0.05 L0.2,-0.7 Q0.35,-0.85 0.55,-0.75 L0.25,-0.05 Q0.55,-0.1 0.7,-0.3 Q0.9,-0.36 0.97,-0.25 L0.76,-0.14 Q0.65,0.35 0.1,0.4 L-0.3,0.66 L-0.25,0.35 Q-0.65,0.3 -0.95,0.05Z' },
};

function bands(f) {
  const { layout, c1, c2, c3 } = f;
  switch (layout) {
    case 'tricolour-h': return `<rect width="60" height="40" fill="${c1}"/><rect y="13.33" width="60" height="13.34" fill="${c2}"/><rect y="26.67" width="60" height="13.33" fill="${c3}"/>`;
    case 'tricolour-v': return `<rect width="60" height="40" fill="${c1}"/><rect x="20" width="20" height="40" fill="${c2}"/><rect x="40" width="20" height="40" fill="${c3}"/>`;
    case 'bicolour-h': return `<rect width="60" height="40" fill="${c1}"/><rect y="20" width="60" height="20" fill="${c2}"/>`;
    case 'canton': return `<rect width="60" height="40" fill="${c1}"/><rect y="20" width="60" height="20" fill="${c3}"/><rect width="27" height="20" fill="${c2}"/>`;
    case 'cross': return `<rect width="60" height="40" fill="${c1}"/><rect x="16" width="10" height="40" fill="${c2}"/><rect y="15" width="60" height="10" fill="${c2}"/><rect x="19" width="4" height="40" fill="${c3}"/><rect y="18" width="60" height="4" fill="${c3}"/>`;
    case 'triangle': return `<rect width="60" height="40" fill="${c1}"/><rect y="20" width="60" height="20" fill="${c2}"/><path d="M0,0 L26,20 L0,40Z" fill="${c3}"/>`;
    case 'disc': return `<rect width="60" height="40" fill="${c1}"/><circle cx="30" cy="20" r="12" fill="${c2}"/>`;
    case 'diagonal': return `<rect width="60" height="40" fill="${c1}"/><path d="M60,0 L60,40 L0,40Z" fill="${c2}"/><path d="M0,40 L0,33 L50,0 L60,0 L60,7 L10,40Z" fill="${c3}"/>`;
    case 'border': return `<rect width="60" height="40" fill="${c1}"/><rect x="5" y="5" width="50" height="30" fill="${c2}"/>`;
    default: return `<rect width="60" height="40" fill="${c1}"/>`;
  }
}

function emblemPlace(layout) {
  switch (layout) {
    case 'canton': return [13.5, 10, 6.5];
    case 'triangle': return [9, 20, 5.5];
    case 'disc': return [30, 20, 8];
    case 'cross': return [21, 20, 0]; // no emblem on the cross
    default: return [30, 20, 9];
  }
}

// Emblem markup inside a transform. An emblem is one path, or several parts with their own fill rules.
export function emblemMarkup(em, transform, colour) {
  if (!em || (!em.d && !em.parts)) return '';
  const parts = em.parts || [{ d: em.d, rule: em.rule }];
  return `<g transform="${transform}">${parts.map((p) => `<path d="${p.d}"${p.t ? ` transform="${p.t}"` : ''} fill="${colour}" fill-rule="${p.rule || 'evenodd'}"/>`).join('')}</g>`;
}

// Returns the inner SVG markup (no <svg> wrapper) for a 60 x 40 flag.
export function flagInner(f) {
  if (!f) return '<rect width="60" height="40" fill="#ddd"/>';
  const em = EMBLEMS[f.emblem] || EMBLEMS.none;
  const [cx, cy, s] = emblemPlace(f.layout);
  return bands(f) + (s ? emblemMarkup(em, `translate(${cx} ${cy}) scale(${s})`, f.ec) : '');
}

export function flagSVG(f, { width = 60, cls = 'flag' } = {}) {
  const h = (width * 2) / 3;
  return `<svg class="${cls}" viewBox="0 0 60 40" width="${width}" height="${h}" role="img" aria-label="Flag"><g>${flagInner(f)}</g><rect width="60" height="40" fill="none" stroke="rgba(0,0,0,.25)" stroke-width=".6"/></svg>`;
}

export function randomFlag(rng = Math.random) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  const cols = FLAG_COLOURS.map((c) => c.hex);
  const c1 = pick(cols);
  let c2 = pick(cols); while (c2 === c1) c2 = pick(cols);
  let c3 = pick(cols); while (c3 === c2) c3 = pick(cols);
  return {
    layout: pick(FLAG_LAYOUTS).id,
    c1, c2, c3,
    emblem: pick(Object.keys(EMBLEMS)),
    ec: pick(['#e0a526', '#ffffff', '#1b2232', '#b3261e']),
  };
}
