// Small resource icons for the map, charter and profile. Same unit box as the flag emblems.
import { EMBLEMS, emblemMarkup } from './flag.js';

const OWN = {
  oil: { d: 'M0,-1 C0.45,-0.35 0.7,0.05 0.7,0.35 A0.7,0.62 0 1,1 -0.7,0.35 C-0.7,0.05 -0.45,-0.35 0,-1Z' },
  minerals: { d: 'M-0.85,-0.3 L-0.45,-0.8 L0.45,-0.8 L0.85,-0.3 L0,0.9Z M-0.45,-0.3 L0.45,-0.3 L0,0.55Z' },
  aid: { d: 'M-0.8,-0.35 L0.8,-0.35 L0.8,0.85 L-0.8,0.85Z M-0.12,-0.35 L0.12,-0.35 L0.12,0.85 L-0.12,0.85Z M-0.12,-0.35 Q-0.6,-1 -0.7,-0.62 Q-0.6,-0.4 -0.12,-0.35Z M0.12,-0.35 Q0.6,-1 0.7,-0.62 Q0.6,-0.4 0.12,-0.35Z' },
};

export function resourceIcon(name) {
  return OWN[name] || EMBLEMS[name] || null;
}

// An icon as SVG markup centred at (x, y) with half-size s.
export function iconAt(name, x, y, s, colour = 'var(--ink)') {
  const em = resourceIcon(name);
  return em ? emblemMarkup(em, `translate(${x} ${y}) scale(${s})`, colour) : '';
}

export function iconSVG(name, size = 22, colour = '#1d2433') {
  return `<svg viewBox="-1.1 -1.1 2.2 2.2" width="${size}" height="${size}" aria-hidden="true">${iconAt(name, 0, 0, 1, colour)}</svg>`;
}
