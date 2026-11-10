// Deterministic world generation by rings. Coordinates are integers: world units x100.

export const RING_WIDTH = 40;
export const SCALE = 100;

export type SiteKind = 'city' | 'native';
export interface GenSite { kind: SiteKind; slot: number; x: number; y: number }
export interface GenLandmass { ring: number; index: number; x: number; y: number; radius: number; sites: GenSite[] }

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(...parts: number[]): number {
  let h = 2166136261;
  for (const p of parts) {
    h ^= p | 0;
    h = Math.imul(h, 16777619);
    h ^= h >>> 13;
  }
  return h >>> 0;
}

const q = (v: number) => Math.round(v * SCALE);

export function landmassCount(ring: number): number {
  return ring === 0 ? 3 : Math.floor((2 * Math.PI * ring * RING_WIDTH) / 26);
}

/** All landmasses of one ring. Same seed and ring always give the same result. */
export function generateRing(seed: number, ring: number): GenLandmass[] {
  const count = landmassCount(ring);
  const baseRadius = ring === 0 ? 14 : ring * RING_WIDTH;
  const ringRng = mulberry32(hash(seed, ring, 0x51ed));
  const phase = ringRng() * Math.PI * 2;
  const out: GenLandmass[] = [];
  for (let i = 0; i < count; i++) {
    const rng = mulberry32(hash(seed, ring, i + 1));
    const angle = phase + (i / count) * Math.PI * 2 + (rng() - 0.5) * (3 / baseRadius);
    const r = baseRadius + (ring === 0 ? 0 : (rng() - 0.5) * 12);
    const cx = Math.cos(angle) * r;
    const cy = Math.sin(angle) * r;
    const citySites = 6 + Math.floor(rng() * 5); // 6..10
    const sites: GenSite[] = [];
    const cityPhase = rng() * Math.PI * 2;
    for (let s = 0; s < citySites; s++) {
      const a = cityPhase + (s / citySites) * Math.PI * 2 + (rng() - 0.5) * 0.08;
      const d = 5 + (rng() - 0.5) * 0.5;
      sites.push({ kind: 'city', slot: s, x: q(cx + Math.cos(a) * d), y: q(cy + Math.sin(a) * d) });
    }
    const nativePhase = rng() * Math.PI * 2;
    for (let s = 0; s < 3; s++) {
      const a = nativePhase + (s / 3) * Math.PI * 2;
      sites.push({ kind: 'native', slot: s, x: q(cx + Math.cos(a) * 2), y: q(cy + Math.sin(a) * 2) });
    }
    out.push({ ring, index: i, x: q(cx), y: q(cy), radius: q(7), sites });
  }
  return out;
}

/** Euclidean distance in world units between two stored (x100) points. */
export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y) / SCALE;
}
