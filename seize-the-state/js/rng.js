// Seeded random numbers and value noise, so every device draws the same world.
export function rngFrom(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoise(seedStr) {
  const rng = rngFrom(seedStr);
  const perm = new Uint8Array(512);
  const p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const val = new Float32Array(256).map(() => rng());
  const lerp = (a, b, t) => a + (b - a) * t;
  const fade = (t) => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const h = (i, j) => val[perm[(perm[(xi + i) & 255] + yi + j) & 255]];
    const u = fade(xf), v = fade(yf);
    return lerp(lerp(h(0, 0), h(1, 0), u), lerp(h(0, 1), h(1, 1), u), v);
  }
  return function fbm(x, y, oct = 4) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let o = 0; o < oct; o++) {
      sum += amp * noise(x * f, y * f);
      norm += amp; amp *= 0.5; f *= 2;
    }
    return sum / norm;
  };
}
