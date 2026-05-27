import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";

// ── Constants ───────────────────────────────────────────────────────────────────
const CELL_SIZE = 16;      // larger = fewer cells = better perf
const GRID_RADIUS = 4;     // 4 cells each direction = 9×9 grid max

// Seeded pseudo-random using cell coordinates
function cellRng(cx: number, cz: number, seed: number): number {
  const h = Math.sin(cx * 127.1 + cz * 311.7 + seed * 74.3) * 43758.5453;
  return h - Math.floor(h);
}

// Skip cells too close to portfolio buildings
const EXCLUDE: [number, number][] = [[-38, -55], [62, -34], [44, 58], [-58, 38]];
function okPos(wx: number, wz: number): boolean {
  return EXCLUDE.every(([ex, ez]) => Math.hypot(wx - ex, wz - ez) > 14);
}

// ── Cell data type ──────────────────────────────────────────────────────────────
type Cell = { cx: number; cz: number; wx: number; wz: number; type: number; seed: number };

function buildCells(pcx: number, pcz: number): Cell[] {
  const result: Cell[] = [];
  for (let dz = -GRID_RADIUS; dz <= GRID_RADIUS; dz++) {
    for (let dx = -GRID_RADIUS; dx <= GRID_RADIUS; dx++) {
      const cx = pcx + dx;
      const cz = pcz + dz;
      const offsetX = (cellRng(cx, cz, 0) - 0.5) * CELL_SIZE * 0.55;
      const offsetZ = (cellRng(cx, cz, 1) - 0.5) * CELL_SIZE * 0.55;
      const wx = cx * CELL_SIZE + offsetX;
      const wz = cz * CELL_SIZE + offsetZ;
      if (!okPos(wx, wz)) continue;
      const rnd = cellRng(cx, cz, 99);
      const type = rnd < 0.28 ? -1 : Math.floor(cellRng(cx, cz, 50) * 5);
      result.push({ cx, cz, wx, wz, type, seed: Math.floor(cellRng(cx, cz, 77) * 9999) + 1 });
    }
  }
  return result;
}

// ── Props — NO pointLights (they are very expensive in WebGL) ─────────────────

function CyberTree({ wx, wz, seed }: { wx: number; wz: number; seed: number }) {
  const h = 1.5 + cellRng(seed, seed + 1, 3) * 2.5;
  const colors = ["#00ff88", "#00ffaa", "#88ffcc", "#00cc66"];
  const color = colors[Math.floor(cellRng(seed, seed, 2) * 4)];
  const leafSize = 1.1 + cellRng(seed, seed + 2, 5) * 1.2;
  const leafY = h + leafSize * 0.45;
  const layers = 2 + Math.floor(cellRng(seed, seed + 3, 7) * 2);

  return (
    <group position={[wx, 0, wz]}>
      <mesh position={[0, h / 2, 0]} castShadow>
        <boxGeometry args={[0.2, h, 0.2]} />
        <meshStandardMaterial color="#0a1a10" emissive={color} emissiveIntensity={0.12} />
      </mesh>
      {Array.from({ length: layers }).map((_, i) => {
        const ly = leafY - i * leafSize * 0.5;
        const ls = leafSize * (1 - i * 0.25);
        return (
          <mesh key={i} position={[0, ly, 0]} castShadow>
            <coneGeometry args={[ls, ls * 0.9, 5]} />
            <meshStandardMaterial color="#091508" emissive={color} emissiveIntensity={0.35} transparent opacity={0.9} />
          </mesh>
        );
      })}
      {/* Glowing tip — emissive only, no pointLight */}
      <mesh position={[0, leafY + leafSize * 0.5, 0]}>
        <sphereGeometry args={[0.1, 5, 5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RockCluster({ wx, wz, seed }: { wx: number; wz: number; seed: number }) {
  const count = 2 + Math.floor(cellRng(seed, seed + 1, 0) * 2);
  const baseColors = ["#1a2a2a", "#141f1f", "#1f2a1a", "#1a1a2a"];
  const glowColors = ["#00ffff", "#00ff88", "#ffb800", "#ff44aa"];
  const color = baseColors[Math.floor(cellRng(seed, seed, 1) * 4)];
  const glowColor = glowColors[Math.floor(cellRng(seed, seed + 5, 1) * 4)];

  return (
    <group position={[wx, 0, wz]}>
      {Array.from({ length: count }).map((_, i) => {
        const rx = (cellRng(seed + i, seed, i * 3) - 0.5) * 2.0;
        const rz = (cellRng(seed, seed + i, i * 3 + 1) - 0.5) * 2.0;
        const rh = 0.4 + cellRng(seed + i, seed + i, i * 2) * 1.0;
        const rw = 0.5 + cellRng(seed + i, seed - i, i * 2 + 1) * 0.7;
        const ry = cellRng(seed + i, seed + i, i) * 1.4;
        return (
          <mesh key={i} position={[rx, rh / 2, rz]} castShadow receiveShadow rotation={[ry, ry * 2, ry * 0.5]}>
            <dodecahedronGeometry args={[rw * 0.55, 0]} />
            <meshStandardMaterial color={color} emissive={glowColor} emissiveIntensity={0.1} metalness={0.5} roughness={0.5} />
          </mesh>
        );
      })}
    </group>
  );
}

function EnergyCrystal({ wx, wz, seed }: { wx: number; wz: number; seed: number }) {
  const ref = useRef<THREE.Group>(null!);
  const h = 1.0 + cellRng(seed, seed, 0) * 1.8;
  const crystalColors = ["#00ffff", "#ff44aa", "#ffb800", "#8844ff", "#00ff88"];
  const color = crystalColors[Math.floor(cellRng(seed, seed + 1, 1) * 5)];
  const phase = cellRng(seed, seed + 2, 2) * Math.PI * 2;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 1.2 + phase) * 0.07;
    ref.current.rotation.y += 0.01;
  });

  return (
    <group position={[wx, 0, wz]}>
      <group ref={ref}>
        <mesh castShadow position={[0, h / 2, 0]}>
          <coneGeometry args={[0.22, h, 5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.85} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.18, 0]} rotation-x={Math.PI}>
          <coneGeometry args={[0.22, 0.36, 5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function RuinPillar({ wx, wz, seed }: { wx: number; wz: number; seed: number }) {
  const h = 1.5 + cellRng(seed, seed, 0) * 3.5;
  const tilt = (cellRng(seed, seed + 1, 1) - 0.5) * 0.25;
  const accentColors = ["#00ff88", "#00d4ff", "#ffb800", "#ff4477"];
  const accentColor = accentColors[Math.floor(cellRng(seed, seed + 2, 2) * 4)];
  const broken = cellRng(seed, seed + 3, 3) > 0.4;
  return (
    <group position={[wx, 0, wz]} rotation={[tilt * 0.3, 0, tilt]}>
      <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
        <cylinderGeometry args={[0.28, 0.36, h, 6]} />
        <meshStandardMaterial color="#0d1a12" emissive={accentColor} emissiveIntensity={0.1} metalness={0.4} roughness={0.6} />
      </mesh>
      {!broken && (
        <mesh position={[0, h + 0.08, 0]}>
          <boxGeometry args={[0.7, 0.12, 0.7]} />
          <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function NeonMushroom({ wx, wz, seed }: { wx: number; wz: number; seed: number }) {
  const capRef = useRef<THREE.Mesh>(null!);
  const phase = cellRng(seed, seed + 2, 2) * Math.PI * 2;
  const mushroomColors = ["#ff44aa", "#8844ff", "#00ffaa", "#ff8800"];
  const color = mushroomColors[Math.floor(cellRng(seed, seed, 0) * 4)];
  const scale = 0.5 + cellRng(seed, seed + 1, 1) * 1.0;

  useFrame((state) => {
    if (!capRef.current) return;
    (capRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
      0.45 + Math.sin(state.clock.elapsedTime * 1.8 + phase) * 0.25;
  });

  return (
    <group position={[wx, 0, wz]} scale={[scale, scale, scale]}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.09, 0.13, 1, 6]} />
        <meshStandardMaterial color="#0a100a" emissive={color} emissiveIntensity={0.12} />
      </mesh>
      <mesh ref={capRef} position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.55, 7, 5, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a100a" emissive={color} emissiveIntensity={0.45} transparent opacity={0.95} />
      </mesh>
    </group>
  );
}

// ── Main InfiniteProps component ────────────────────────────────────────────────
export function InfiniteProps({
  playerPos,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const [cells, setCells] = useState<Cell[]>(() => buildCells(0, 0));
  const lastCX = useRef<number>(9999);
  const lastCZ = useRef<number>(9999);
  const pendingUpdate = useRef(false);

  useFrame(() => {
    if (pendingUpdate.current) return;
    const pcx = Math.round(playerPos.current.x / CELL_SIZE);
    const pcz = Math.round(playerPos.current.z / CELL_SIZE);
    if (pcx !== lastCX.current || pcz !== lastCZ.current) {
      lastCX.current = pcx;
      lastCZ.current = pcz;
      pendingUpdate.current = true;
      setTimeout(() => {
        setCells(buildCells(pcx, pcz));
        pendingUpdate.current = false;
      }, 0);
    }
  });

  return (
    <>
      {cells.map((cell) => {
        if (cell.type === -1) return null;
        const key = `${cell.cx}_${cell.cz}`;
        if (cell.type === 0) return <CyberTree key={key} wx={cell.wx} wz={cell.wz} seed={cell.seed} />;
        if (cell.type === 1) return <RockCluster key={key} wx={cell.wx} wz={cell.wz} seed={cell.seed} />;
        if (cell.type === 2) return <EnergyCrystal key={key} wx={cell.wx} wz={cell.wz} seed={cell.seed} />;
        if (cell.type === 3) return <RuinPillar key={key} wx={cell.wx} wz={cell.wz} seed={cell.seed} />;
        if (cell.type === 4) return <NeonMushroom key={key} wx={cell.wx} wz={cell.wz} seed={cell.seed} />;
        return null;
      })}
    </>
  );
}
