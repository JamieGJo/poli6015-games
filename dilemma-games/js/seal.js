// Private views. The shared state is readable by every phone in the room, so each
// phone's secrets (its harvest card, its grievance, what an inspector saw) are
// sealed with AES-GCM under a key that only that phone and the projector know.
// The phone sends its key once, in its join message; in live mode only the
// projector can read join messages (see the database rules in simulation/SETUP.md).
const te = new TextEncoder(), td = new TextDecoder();
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const unhex = (h) => new Uint8Array(h.match(/../g).map((x) => parseInt(x, 16)));
const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function newId(bytes = 16) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a); return hex(a);
}

const cache = new Map();
async function keyFor(h) {
  if (!cache.has(h)) cache.set(h, await crypto.subtle.importKey('raw', unhex(h), 'AES-GCM', false, ['encrypt', 'decrypt']));
  return cache.get(h);
}

export async function seal(keyHex, obj) {
  const iv = new Uint8Array(12); crypto.getRandomValues(iv);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyFor(keyHex), te.encode(JSON.stringify(obj)));
  return `${b64(iv)}.${b64(ct)}`;
}

export async function unseal(keyHex, s) {
  const [iv, ct] = s.split('.');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, await keyFor(keyHex), unb64(ct));
  return JSON.parse(td.decode(pt));
}

// Fair random numbers for the projector (dice, lots, deals).
export function fairRandom() {
  const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296;
}
