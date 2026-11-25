// Drawn illustrations: one picture per regime type, and one per morning-after choice.
// Plain SVG on a 100 × 100 box, so they scale from a phone to the projector.

const INK = '#1d2433';
const GOLD = '#c9a227';
const PAPER = '#fffdf8';

function star(cx, cy, r, fill) {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.42 : r;
    p.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `<polygon points="${p.join(' ')}" fill="${fill}"/>`;
}

// The regime types (colour is the type's own colour).
const REGIME = {
  military: (c) => `
    <path d="M16,50 Q20,24 50,22 Q80,24 86,44 L84,54 Q50,46 18,56Z" fill="${c}"/>
    <rect x="20" y="52" width="62" height="11" rx="2" fill="${INK}"/>
    <path d="M18,62 Q50,80 84,62 L80,59 Q50,70 22,59Z" fill="${INK}"/>
    ${star(51, 38, 8, GOLD)}
    <path d="M30,66 L26,84 M72,66 L76,84" stroke="${GOLD}" stroke-width="3"/>`,
  party: (c) => `
    <rect x="29" y="12" width="3.5" height="62" fill="${INK}"/>
    <path d="M32.5,14 L80,18 Q72,29 80,40 L32.5,37Z" fill="${c}"/>
    ${star(50, 26.5, 6, PAPER)}
    <rect x="16" y="66" width="68" height="7" rx="1.5" fill="${INK}"/>
    <path d="M22,73 L78,73 L72,90 L28,90Z" fill="${INK}"/>
    <rect x="44" y="78" width="12" height="6" fill="${c}"/>`,
  personalist: (c) => `
    <path d="M20,22 L32,30 M80,22 L68,30 M50,6 L50,14" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="50" cy="24" r="8.5" fill="${c}"/>
    <path d="M37,37 Q50,32 63,37 L61,64 L39,64Z" fill="${c}"/>
    <path d="M61,39 L75,20 L80,23 L66,45Z" fill="${c}"/>
    <rect x="34" y="65" width="32" height="8" fill="${INK}"/>
    <rect x="26" y="73" width="48" height="13" fill="${INK}"/>
    <rect x="40" y="76" width="20" height="3" fill="${GOLD}"/>`,
  monarchy: (c) => `
    <path d="M18,70 L16,32 L34,50 L50,22 L66,50 L84,32 L82,70Z" fill="${c}"/>
    <circle cx="16" cy="30" r="4.5" fill="${GOLD}"/><circle cx="50" cy="20" r="4.5" fill="${GOLD}"/><circle cx="84" cy="30" r="4.5" fill="${GOLD}"/>
    <rect x="16" y="70" width="68" height="12" rx="2" fill="${INK}"/>
    <circle cx="34" cy="76" r="3.2" fill="${GOLD}"/><circle cx="50" cy="76" r="3.2" fill="#c0392b"/><circle cx="66" cy="76" r="3.2" fill="${GOLD}"/>`,
  amalgam: (c) => `
    <g transform="translate(-4 4) scale(.62)">${'' /* the officer's cap */}
      <path d="M16,50 Q20,24 50,22 Q80,24 86,44 L84,54 Q50,46 18,56Z" fill="${c}"/>
      <rect x="20" y="52" width="62" height="11" rx="2" fill="${INK}"/>
      <path d="M18,62 Q50,80 84,62 L80,59 Q50,70 22,59Z" fill="${INK}"/>${star(51, 38, 8, GOLD)}</g>
    <g transform="translate(44 26) scale(.6)">
      <rect x="29" y="12" width="3.5" height="62" fill="${INK}"/>
      <path d="M32.5,14 L80,18 Q72,29 80,40 L32.5,37Z" fill="${c}"/>${star(50, 26.5, 6, PAPER)}
      <rect x="16" y="66" width="68" height="7" rx="1.5" fill="${INK}"/><path d="M22,73 L78,73 L72,90 L28,90Z" fill="${INK}"/></g>
    <path d="M38,84 Q50,92 62,84" stroke="${GOLD}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  electoral: (c) => `
    <path d="M40,14 L64,14 L64,52 L40,52Z" fill="${PAPER}" stroke="${INK}" stroke-width="2.5"/>
    <path d="M45,32 L50,38 L59,24" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="20" y="48" width="60" height="38" rx="3" fill="${c}"/>
    <rect x="36" y="46" width="28" height="5" rx="1" fill="${INK}"/>
    <rect x="34" y="62" width="32" height="5" rx="1" fill="${PAPER}" opacity=".7"/>`,
};

export function regimeArt(type, colour, { size = 96, title = '' } = {}) {
  const f = REGIME[type];
  if (!f) return '';
  return `<svg class="art" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${title || type}"><circle cx="50" cy="52" r="47" fill="${colour}" opacity=".13"/>${f(colour)}</svg>`;
}

// The morning-after choices.
const head = (x, y, r = 7, fill = INK) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/><path d="M${x - r * 1.5},${y + r * 3.2} Q${x},${y + r * 0.9} ${x + r * 1.5},${y + r * 3.2}Z" fill="${fill}"/>`;
const case_ = `<rect x="18" y="38" width="64" height="42" rx="5" fill="${INK}"/><path d="M38,38 L38,30 Q38,26 42,26 L58,26 Q62,26 62,30 L62,38" stroke="${INK}" stroke-width="5" fill="none"/><rect x="18" y="54" width="64" height="4" fill="${PAPER}" opacity=".5"/>`;
const table = (seats) => `<circle cx="50" cy="52" r="17" fill="${INK}"/>${[[50, 18], [84, 52], [50, 86], [16, 52]].map(([x, y], i) => (seats[i] ? `<circle cx="${x}" cy="${y}" r="9" fill="${INK}"/>` : `<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="${INK}" stroke-width="2.5" stroke-dasharray="4 3"/>`)).join('')}`;
const CHOICE = {
  keep: () => `${case_}<path d="M40,66 L48,73 L62,60" stroke="#2c7a4b" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  fire: () => `${case_}<path d="M26,20 L76,86 M76,20 L26,86" stroke="#b3261e" stroke-width="7" stroke-linecap="round"/>`,
  share: () => table([1, 1, 1, 1]),
  purge: () => `${table([1, 0, 0, 0])}<path d="M70,30 L92,8 M92,30 L70,8" stroke="#b3261e" stroke-width="5" stroke-linecap="round" opacity=".9"/>`,
  pay: () => [0, 1, 2, 3].map((i) => `<ellipse cx="50" cy="${76 - i * 12}" rx="26" ry="8" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/>`).join('') + `<path d="M24,${76 - 36} L24,76 M76,${76 - 36} L76,76" stroke="${INK}" stroke-width="2.5"/>`,
  guard: () => `<path d="M50,10 L84,22 L84,48 Q84,76 50,92 Q16,76 16,48 L16,22Z" fill="${INK}"/>${star(50, 48, 15, GOLD)}`,
  reward: () => `${head(28, 40, 7)}${head(50, 34, 8)}${head(72, 40, 7)}<path d="M14,86 L86,86" stroke="${INK}" stroke-width="3"/><circle cx="80" cy="16" r="10" fill="${GOLD}" stroke="${INK}" stroke-width="2.5"/>`,
  shut: () => `${head(28, 40, 7, '#7b7f8a')}${head(50, 34, 8, '#7b7f8a')}${head(72, 40, 7, '#7b7f8a')}<rect x="8" y="58" width="84" height="9" rx="2" fill="${INK}"/><rect x="14" y="67" width="6" height="22" fill="${INK}"/><rect x="80" y="67" width="6" height="22" fill="${INK}"/>`,
};
export function choiceArt(value, { size = 44 } = {}) {
  const f = CHOICE[value];
  return f ? `<svg class="art" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${f()}</svg>` : '';
}

// Small signs for the final map.
export const SIGNS = {
  guard: CHOICE.guard, purge: CHOICE.purge, share: CHOICE.share, shut: CHOICE.shut, reward: CHOICE.reward, fire: CHOICE.fire, keep: CHOICE.keep, pay: CHOICE.pay,
};
export function signAt(name, x, y, size) {
  const f = SIGNS[name];
  return f ? `<g transform="translate(${(x - size / 2).toFixed(1)} ${(y - size / 2).toFixed(1)}) scale(${(size / 100).toFixed(3)})">${f()}</g>` : '';
}
export function regimeAt(type, colour, x, y, size) {
  const f = REGIME[type];
  return f ? `<g transform="translate(${(x - size / 2).toFixed(1)} ${(y - size / 2).toFixed(1)}) scale(${(size / 100).toFixed(3)})"><circle cx="50" cy="52" r="49" fill="${PAPER}" stroke="${colour}" stroke-width="4"/>${f(colour)}</g>` : '';
}
