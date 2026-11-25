// Small shared helpers for the projector and phone screens.
export const esc = (x) => String(x ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I or O
export function newCode(rand) {
  let s = '';
  for (let i = 0; i < 4; i++) s += LETTERS[Math.floor(rand() * LETTERS.length)];
  return s;
}
export const cleanCode = (x) => String(x || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
export const syncRoom = (code) => `DG${code}`;

export function store(kind) {
  const s = kind === 'session' ? window.sessionStorage : window.localStorage;
  return {
    get(k) { try { return JSON.parse(s.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { s.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
    del(k) { try { s.removeItem(k); } catch (e) { /* storage blocked */ } },
  };
}

export function qrSVG(text) {
  if (!window.qrcode) return '';
  try {
    const q = window.qrcode(0, 'M');
    q.addData(text); q.make();
    return q.createSvgTag({ cellSize: 5, margin: 2, scalable: true });
  } catch (e) { return ''; }
}

export function fileWarning() {
  if (location.protocol !== 'file:') return false;
  document.body.innerHTML = `<div class="wrap"><div class="card"><h2>Open this through the local server</h2>
    <p>Browsers block these pages when they are opened straight from Finder. From the POLI6015 folder, run
    <code>python3 week-01-dilemma-games/dev/serve.py</code> and open <code>http://127.0.0.1:8643</code>.</p></div></div>`;
  return true;
}

export function meter(value, max, { mark = null, cls = '' } = {}) {
  let cells = '';
  for (let i = 1; i <= max; i++) cells += `<span class="cell ${i <= value ? 'on' : ''} ${mark && i === mark ? 'mark' : ''}"></span>`;
  return `<div class="meter ${cls}">${cells}</div>`;
}
