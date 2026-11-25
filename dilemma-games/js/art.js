// Original drawings for both games: line icons, the map of Valmora (the Petition Box),
// village tiles (the Harvest Report) and two scene illustrations. All drawn here as SVG;
// no images are downloaded. Colours come from css/style.css through currentColor and classes.

const svg = (body, { vb = '0 0 24 24', cls = 'ic', label = '' } = {}) =>
  `<svg class="${cls}" viewBox="${vb}" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;

// ---------- line icons (24 x 24) ----------
const P = {
  aid: '<path d="M4 9h16v11H4z"/><path d="M4 9l2-4h12l2 4"/><path d="M12 9v11"/><path d="M9 13h6"/>',
  police: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M12 8v5"/><path d="M9.5 10.5h5"/>',
  box: '<path d="M4 10h16v10H4z"/><path d="M8 10V6h8v4"/><path d="M9 14h6"/><path d="M10 6l2-3 2 3"/>',
  answer: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 9h6M9 12h6M9 15h3"/><circle cx="16" cy="17" r="2"/>',
  coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10c0-1 1-2 2.5-2s2.5.8 2.5 2-1 1.6-2.5 2-2.5 1-2.5 2 1 2 2.5 2 2.5-1 2.5-2"/>',
  plane: '<path d="M3 13l18-7-5 14-4-5-5 3 1-5z"/><path d="M12 15l9-9"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  praise: '<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/>',
  silence: '<circle cx="12" cy="12" r="9"/><path d="M8 14h8"/><path d="M9 9h.01M15 9h.01"/>',
  petition: '<path d="M6 3h12v18H6z"/><path d="M9 7h6M9 11h6M9 15h4"/><path d="M14 18l1.5 1.5L19 16"/>',
  protest: '<path d="M7 21V11"/><path d="M3 4h12v7H3z"/><path d="M6 7.5h6"/><path d="M17 21v-6l2-3 2 3v6"/>',
  crushed: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 9l6 6M15 9l-6 6"/>',
  stability: '<path d="M3 21h18"/><path d="M5 21V10M9 21V10M15 21V10M19 21V10"/><path d="M3 10l9-6 9 6z"/>',
  palace: '<path d="M3 21h18"/><path d="M5 21v-9h14v9"/><path d="M9 21v-5h6v5"/><path d="M8 12a4 4 0 018 0"/><path d="M12 8V3l3 1-3 1"/>',
  chief: '<path d="M5 10h14l-2-5H7z"/><path d="M4 10h16"/><path d="M8 14a4 4 0 008 0"/><path d="M12 6.5h.01"/>',
  coup: '<path d="M4 20l7-7"/><path d="M13 11l7-7"/><path d="M15 4h5v5"/><path d="M3 15l6 6"/>',
  ear: '<path d="M8 10a4 4 0 118 0c0 3-3 3.5-3 6a2.5 2.5 0 01-5 0"/><path d="M11 10a1 1 0 112 0"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01"/>',
  // events
  drought: '<circle cx="12" cy="8" r="3.5"/><path d="M12 1.5v1.5M5.5 8H4M20 8h-1.5M7.4 3.4l1 1M16.6 3.4l-1 1"/><path d="M3 21l4-5 3 3 4-6 3 4 4-3"/>',
  prices: '<path d="M4 20h16"/><path d="M6 16l4-4 3 3 6-7"/><path d="M15 8h4v4"/>',
  theft: '<path d="M7 11V6a2 2 0 014 0v4"/><path d="M11 9a2 2 0 014 0v2"/><path d="M15 10a2 2 0 014 0v4a7 7 0 01-7 7h-1a6 6 0 01-5-3l-2-4a1.8 1.8 0 013-2l1 2"/>',
  quiet: '<path d="M3 17c3 0 3-2 6-2s3 2 6 2 3-2 6-2"/><path d="M3 12c3 0 3-2 6-2s3 2 6 2 3-2 6-2"/>',
  harvest: '<path d="M12 21V8"/><path d="M12 12c-3 0-5-2-5-5 3 0 5 2 5 5zM12 12c3 0 5-2 5-5-3 0-5 2-5 5zM12 17c-3 0-5-2-5-5 3 0 5 2 5 5zM12 17c3 0 5-2 5-5-3 0-5 2-5 5z"/>',
  road: '<path d="M8 3L4 21M16 3l4 18"/><path d="M12 4v2M12 10v3M12 17v3"/>',
  // harvest game
  sack: '<path d="M8 6h8"/><path d="M9 6c-4 3-5 7-5 10 0 3 2 5 8 5s8-2 8-5c0-3-1-7-5-10"/><path d="M10 3h4l-1 3h-2z"/><path d="M9 14h6"/>',
  village: '<path d="M3 21h18"/><path d="M5 21v-8l5-4 5 4v8"/><path d="M9 21v-4h2v4"/><path d="M15 13l3-2 3 2v8"/>',
  famine: '<path d="M3 12h18"/><path d="M4 12a8 8 0 0016 0"/><path d="M9 7c0-1.5 1-2 1-3.5M14 7c0-1.5 1-2 1-3.5"/>',
  inspect: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L20 20"/><path d="M8 10h4"/>',
  medal: '<circle cx="12" cy="15" r="5"/><path d="M8.5 11.5L6 3h4l2 5 2-5h4l-2.5 8.5"/><path d="M12 13v4"/>',
  down: '<path d="M12 4v15"/><path d="M6 13l6 6 6-6"/>',
  up: '<path d="M12 20V5"/><path d="M6 11l6-6 6 6"/>',
  megaphone: '<path d="M3 10v4h4l9 5V5L7 10z"/><path d="M19 9a4 4 0 010 6"/><path d="M7 14l1 6h2l-1-6"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  arrow: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
  computer: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  projector: '<rect x="3" y="8" width="18" height="9" rx="2"/><circle cx="15" cy="12.5" r="2.5"/><path d="M6 11h4M7 17v3M17 17v3"/>',
};
export const icon = (name, cls = '') => svg(P[name] || P.info, { cls: `ic ${cls}` });

// ---------- the map of Valmora (Petition Box) ----------
// Province keys stay north/south/east/west, as in the engine.
const REGION = {
  north: 'M24 44 C80 16 150 26 200 20 C252 14 318 24 372 48 L330 112 C290 102 250 108 200 110 C150 110 110 102 72 112 Z',
  west: 'M24 44 L72 112 C82 150 76 190 86 228 L34 262 C12 208 8 122 24 44 Z',
  east: 'M372 48 C388 122 384 198 364 258 L316 230 C324 190 320 150 330 112 Z',
  south: 'M86 228 C150 222 250 226 316 230 L364 258 C296 290 124 292 34 262 Z',
  centre: 'M72 112 C110 102 150 110 200 110 C250 108 290 102 330 112 C320 150 324 190 316 230 C250 226 150 222 86 228 C76 190 82 150 72 112 Z',
};
const ANCHOR = { north: [200, 64], west: [50, 160], east: [350, 158], south: [200, 258] };
const LABEL = { north: 'Copper Hills', west: 'Western Valleys', east: 'Harbour Coast', south: 'Wheat Plains' };
const DECOR = {
  north: '<path d="M120 86l14-22 14 22M150 86l12-18 12 18M232 84l14-24 14 24M262 84l10-16 10 16" class="decor"/>',
  west: '<path d="M40 110c8-6 16-6 24 0M38 210c8-6 16-6 24 0M44 132l6-10 6 10" class="decor"/>',
  east: '<path d="M352 210h20l-4 6h-12z M362 210v-10l6 5" class="decor"/>',
  south: '<path d="M120 276v-12M126 276v-14M132 276v-12M268 278v-12M274 278v-14M280 278v-12" class="decor"/>',
};

// st: { you, highlight, prov: { north: { police, box, pending, aid, signal, crushed, mood } } }
export function valmoraMap(st = {}) {
  const prov = st.prov || {};
  const regions = ['north', 'west', 'east', 'south'].map((k) => {
    const p = prov[k] || {};
    const fill = p.mood ? `mood-${p.mood}` : p.crushed ? 'crushed' : p.signal === 'protest' ? 'protest' : p.signal === 'petition' ? 'petition' : '';
    const dim = st.you && st.you !== k ? 'dim' : '';
    const [x, y] = ANCHOR[k];
    const badges = [];
    if (p.police) badges.push(['police', 'b-police']);
    if (p.box) badges.push(['box', 'b-box']);
    if (p.pending) badges.push(['answer', 'b-pending']);
    if (p.aid) badges.push(['aid', 'b-aid']);
    if (p.signal) badges.push([p.crushed ? 'crushed' : p.signal, `b-sig b-${p.signal}`]);
    const bw = 22, start = x - (badges.length * bw) / 2;
    const bhtml = badges.map(([n, c], i) => `<g class="badge ${c}" transform="translate(${start + i * bw} ${y + 4})"><rect width="20" height="20" rx="5"/><g transform="translate(2 2) scale(.67)">${P[n]}</g></g>`).join('');
    const lx = k === 'west' ? x + 2 : k === 'east' ? x - 2 : x;
    return `<g class="region r-${k} ${fill} ${dim} ${st.you === k ? 'you' : ''}"><path d="${REGION[k]}"/>${DECOR[k]}
      <text x="${lx}" y="${y - 6}" class="rname" text-anchor="middle">${LABEL[k]}</text>${p.aid ? `<text x="${x}" y="${y + 38}" class="rnote" text-anchor="middle">aid ×${p.aid}</text>` : ''}${bhtml}</g>`;
  }).join('');
  return `<svg class="map" viewBox="0 0 400 300" role="img" aria-label="Map of Valmora and its four provinces">
    <rect x="370" y="0" width="30" height="300" class="sea"/><path d="M380 70c4-3 8-3 12 0M378 120c4-3 8-3 12 0M382 180c4-3 8-3 12 0M378 240c4-3 8-3 12 0" class="wave"/>
    <g class="region centre"><path d="${REGION.centre}"/></g>
    ${regions}
    <g class="capital" transform="translate(186 150)"><g class="capicon">${P.palace}</g><text x="12" y="40" text-anchor="middle" class="cname">The capital</text></g>
  </svg>`;
}
export const PROVINCE_LABEL = LABEL;

// ---------- the Harvest Report: one village tile per province ----------
// state: '', 'in', 'wait', 'low', 'high', 'famine', 'insp', 'caught', 'premium'
export function villageTile(n, state = '', note = '') {
  return `<div class="vt ${state}"><svg viewBox="0 0 60 44" aria-hidden="true"><path d="M2 42h56" class="vground"/><path d="M8 42V26l10-8 10 8v16" class="vhouse"/><path d="M15 42v-7h6v7" class="vdoor"/>
    <path d="M36 42V30M41 42V28M46 42V30M51 42V28" class="vwheat"/><path d="M34 30l2-4 2 4M39 28l2-4 2 4M44 30l2-4 2 4M49 28l2-4 2 4" class="vwheat"/></svg>
    <b>${n}</b>${note ? `<small>${note}</small>` : ''}</div>`;
}

// ---------- scene illustrations ----------
export function chairmanScene() {
  return `<svg class="scene" viewBox="0 0 220 150" aria-hidden="true">
    <circle cx="160" cy="58" r="34" class="sun"/>
    <path d="M160 10v10M160 96v10M112 58h10M198 58h10M126 24l7 7M187 85l7 7M126 92l7-7M187 31l7-7" class="rays"/>
    <path d="M40 140V36" class="pole"/><path d="M40 40l26-10v24z" class="horn"/><path d="M40 62l22-8v18z" class="horn"/>
    <rect x="70" y="102" width="130" height="30" rx="3" class="banner"/><text x="135" y="122" text-anchor="middle" class="bantext">THE PLAN</text>
    <path d="M10 140h200" class="ground"/>
    <path d="M150 140v-22M156 140v-26M162 140v-22M182 140v-22M188 140v-26M194 140v-22" class="wheat"/>
  </svg>`;
}
export function palaceScene() {
  return `<svg class="scene" viewBox="0 0 220 150" aria-hidden="true">
    <path d="M10 140h200" class="ground"/>
    <path d="M40 140V84h140v56" class="wall"/><path d="M30 84h160l-80-20z" class="roof"/>
    <path d="M86 64a24 24 0 0148 0" class="dome"/><path d="M110 40V16l18 6-18 6" class="flag"/>
    <path d="M58 140v-38M82 140v-38M138 140v-38M162 140v-38" class="col"/><path d="M100 140v-26h20v26" class="door"/>
    <path d="M18 140v-20l6-6 6 6v20M190 140v-20l6-6 6 6v20" class="guard"/>
  </svg>`;
}
