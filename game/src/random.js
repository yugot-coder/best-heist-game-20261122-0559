// Velvet Vault: a tiny deterministic random-number source.
// One job: seeded randomness for particles and sparkle, so a level looks
// the same every time it is played from the same seed.

/** mulberry32: a small, fast, seedable PRNG. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A helper that hands out deterministic values in [min, max). */
export function range(rng, min, max) {
  return min + rng() * (max - min);
}

/** Pick one element of an array with the seeded rng. */
export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}
