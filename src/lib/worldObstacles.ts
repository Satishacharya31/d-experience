// Shared obstacle list for collision + rendering (trees, rocks).
// Cylindrical colliders: {x, z, r}.

export type Obstacle = { x: number; z: number; r: number };

// Deterministic pseudo-random (mulberry32) so server/client agree.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BUILDING_SPOTS: [number, number, number][] = [
  [-22, -22, 9], [22, -22, 9], [22, 22, 9], [-22, 22, 9],
];

function farFromBuildings(x: number, z: number, pad: number) {
  return BUILDING_SPOTS.every(([bx, bz, br]) => Math.hypot(x - bx, z - bz) > br + pad);
}

export const TREES: { x: number; z: number; scale: number; tilt: number; kind: 0 | 1 | 2 }[] = (() => {
  const rng = mulberry32(1337);
  const out: { x: number; z: number; scale: number; tilt: number; kind: 0 | 1 | 2 }[] = [];
  let safety = 0;
  while (out.length < 60 && safety < 2000) {
    safety++;
    const x = (rng() - 0.5) * 100;
    const z = (rng() - 0.5) * 100;
    if (Math.hypot(x, z) < 8) continue;
    if (!farFromBuildings(x, z, 3)) continue;
    if (out.some((t) => Math.hypot(t.x - x, t.z - z) < 3.5)) continue;
    out.push({
      x, z,
      scale: 0.8 + rng() * 0.9,
      tilt: (rng() - 0.5) * 0.15,
      kind: Math.floor(rng() * 3) as 0 | 1 | 2,
    });
  }
  return out;
})();

export const ROCKS: { x: number; z: number; scale: number; rot: number }[] = (() => {
  const rng = mulberry32(7331);
  const out: { x: number; z: number; scale: number; rot: number }[] = [];
  let safety = 0;
  while (out.length < 28 && safety < 1500) {
    safety++;
    const x = (rng() - 0.5) * 100;
    const z = (rng() - 0.5) * 100;
    if (Math.hypot(x, z) < 6) continue;
    if (!farFromBuildings(x, z, 2)) continue;
    if (out.some((r) => Math.hypot(r.x - x, r.z - z) < 3)) continue;
    out.push({ x, z, scale: 0.6 + rng() * 1.2, rot: rng() * Math.PI });
  }
  return out;
})();

// Combined cylindrical obstacles for collision.
export const OBSTACLES: Obstacle[] = [
  ...TREES.map((t) => ({ x: t.x, z: t.z, r: 0.5 * t.scale })),
  ...ROCKS.map((r) => ({ x: r.x, z: r.z, r: 0.9 * r.scale })),
  // Building cores (smaller than zone trigger radius so E-prompt still works).
  ...BUILDING_SPOTS.map(([x, z]) => ({ x, z, r: 3.2 })),
];

export const WORLD_HALF = 52;
