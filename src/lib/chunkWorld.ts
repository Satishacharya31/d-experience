// Chunk-based infinite world generation.
// Each chunk is CHUNK_SIZE x CHUNK_SIZE world units. Contents are deterministic
// from chunk coordinates, so the same chunk always regenerates identically.

export const CHUNK_SIZE = 40;
export const VIEW_RADIUS = 3; // chunks around player to keep loaded

export type TreeInstance = { x: number; z: number; scale: number; tilt: number; kind: 0 | 1 | 2; rot: number };
export type RockInstance = { x: number; z: number; scale: number; rot: number };
export type Obstacle = { x: number; z: number; r: number };

export type ChunkData = {
  key: string;
  cx: number;
  cz: number;
  trees: TreeInstance[];
  rocks: RockInstance[];
  patches: { x: number; z: number; r: number }[];
  obstacles: Obstacle[];
};

// Central building footprints (kept clear in every chunk).
const BUILDING_SPOTS: [number, number, number][] = [
  [-22, -22, 9],
  [22, -22, 9],
  [22, 22, 9],
  [-22, 22, 9],
];

// Mulberry32 deterministic RNG.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chunkSeed(cx: number, cz: number) {
  // Stable hash from chunk coords.
  const a = (cx * 374761393 + cz * 668265263) | 0;
  return (a ^ (a >>> 13)) >>> 0;
}

const isBlocked = (x: number, z: number, pad: number) =>
  // Keep spawn clear
  (Math.hypot(x, z) < 8 + pad) ||
  BUILDING_SPOTS.some(([bx, bz, br]) => Math.hypot(x - bx, z - bz) < br + pad);

const cache = new Map<string, ChunkData>();

export function getChunk(cx: number, cz: number): ChunkData {
  const key = `${cx},${cz}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const r = rng(chunkSeed(cx, cz));
  const baseX = cx * CHUNK_SIZE;
  const baseZ = cz * CHUNK_SIZE;

  const trees: TreeInstance[] = [];
  const rocks: RockInstance[] = [];
  const patches: { x: number; z: number; r: number }[] = [];

  const treeCount = 7 + Math.floor(r() * 7);
  let safety = 0;
  while (trees.length < treeCount && safety < 80) {
    safety++;
    const x = baseX + r() * CHUNK_SIZE;
    const z = baseZ + r() * CHUNK_SIZE;
    if (isBlocked(x, z, 3)) continue;
    if (trees.some((t) => Math.hypot(t.x - x, t.z - z) < 3.2)) continue;
    trees.push({
      x, z,
      scale: 0.8 + r() * 0.9,
      tilt: (r() - 0.5) * 0.15,
      kind: Math.floor(r() * 3) as 0 | 1 | 2,
      rot: r() * Math.PI * 2,
    });
  }

  const rockCount = 2 + Math.floor(r() * 4);
  safety = 0;
  while (rocks.length < rockCount && safety < 60) {
    safety++;
    const x = baseX + r() * CHUNK_SIZE;
    const z = baseZ + r() * CHUNK_SIZE;
    if (isBlocked(x, z, 2)) continue;
    if (rocks.some((q) => Math.hypot(q.x - x, q.z - z) < 2.5)) continue;
    rocks.push({ x, z, scale: 0.6 + r() * 1.2, rot: r() * Math.PI });
  }

  const patchCount = 1 + Math.floor(r() * 3);
  for (let i = 0; i < patchCount; i++) {
    patches.push({
      x: baseX + r() * CHUNK_SIZE,
      z: baseZ + r() * CHUNK_SIZE,
      r: 2 + r() * 3,
    });
  }

  const obstacles: Obstacle[] = [
    ...trees.map((t) => ({ x: t.x, z: t.z, r: 0.5 * t.scale })),
    ...rocks.map((q) => ({ x: q.x, z: q.z, r: 0.9 * q.scale })),
  ];

  const data: ChunkData = { key, cx, cz, trees, rocks, patches, obstacles };
  cache.set(key, data);
  return data;
}

export function worldToChunk(x: number, z: number): [number, number] {
  return [Math.floor(x / CHUNK_SIZE), Math.floor(z / CHUNK_SIZE)];
}

export function visibleChunks(px: number, pz: number): ChunkData[] {
  const [pcx, pcz] = worldToChunk(px, pz);
  const out: ChunkData[] = [];
  for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
      out.push(getChunk(pcx + dx, pcz + dz));
    }
  }
  return out;
}

// Static obstacles for fixed buildings (always-on collision regardless of chunk).
export const BUILDING_OBSTACLES: Obstacle[] = BUILDING_SPOTS.map(([x, z]) => ({
  x, z, r: 3.2,
}));
