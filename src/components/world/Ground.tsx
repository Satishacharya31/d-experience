import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import {
  CHUNK_SIZE,
  visibleChunks,
  type ChunkData,
  type TreeInstance,
  type RockInstance,
} from "@/lib/chunkWorld";

// ── Atoms ────────────────────────────────────────────────────────────────────
function Tree({ t }: { t: TreeInstance }) {
  const trunkColor = t.kind === 2 ? "#d8d2c0" : "#3a2a18";
  const leafA = t.kind === 0 ? "#1d6b3a" : t.kind === 1 ? "#2f8a4a" : "#4ea05a";
  const leafB = t.kind === 0 ? "#16542c" : t.kind === 1 ? "#246e3a" : "#3d8a48";

  return (
    <group position={[t.x, 0, t.z]} rotation={[t.tilt, t.rot, t.tilt * 0.6]} scale={t.scale}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.8, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.95} />
      </mesh>
      {t.kind === 0 && (
        <>
          <mesh position={[0, 2.3, 0]} castShadow>
            <coneGeometry args={[1.1, 1.6, 8]} />
            <meshStandardMaterial color={leafA} roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.1, 0]} castShadow>
            <coneGeometry args={[0.85, 1.3, 8]} />
            <meshStandardMaterial color={leafB} roughness={0.8} />
          </mesh>
          <mesh position={[0, 3.85, 0]} castShadow>
            <coneGeometry args={[0.6, 1.0, 8]} />
            <meshStandardMaterial color={leafA} roughness={0.8} />
          </mesh>
        </>
      )}
      {t.kind === 1 && (
        <>
          <mesh position={[0, 2.6, 0]} castShadow>
            <icosahedronGeometry args={[1.25, 0]} />
            <meshStandardMaterial color={leafA} roughness={0.85} flatShading />
          </mesh>
          <mesh position={[0.4, 3.2, -0.2]} castShadow>
            <icosahedronGeometry args={[0.7, 0]} />
            <meshStandardMaterial color={leafB} roughness={0.85} flatShading />
          </mesh>
        </>
      )}
      {t.kind === 2 && (
        <mesh position={[0, 2.4, 0]} castShadow>
          <icosahedronGeometry args={[1.0, 0]} />
          <meshStandardMaterial color={leafA} roughness={0.85} flatShading />
        </mesh>
      )}
    </group>
  );
}

function Rock({ r }: { r: RockInstance }) {
  return (
    <mesh position={[r.x, 0.3 * r.scale, r.z]} rotation={[0, r.rot, 0]} scale={r.scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial color="#5a5d63" roughness={0.95} flatShading />
    </mesh>
  );
}

function Chunk({ data }: { data: ChunkData }) {
  return (
    <group>
      {data.patches.map((p, i) => (
        <mesh key={`p${i}`} rotation-x={-Math.PI / 2} position={[p.x, 0.005, p.z]}>
          <circleGeometry args={[p.r, 20]} />
          <meshStandardMaterial color="#243d22" roughness={1} transparent opacity={0.8} />
        </mesh>
      ))}
      {data.trees.map((t, i) => <Tree key={`t${i}`} t={t} />)}
      {data.rocks.map((r, i) => <Rock key={`r${i}`} r={r} />)}
    </group>
  );
}

// ── Main Ground (follows player, streams chunks) ─────────────────────────────
export function Ground({
  playerPos,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const groundRef = useRef<THREE.Mesh>(null!);
  const [chunks, setChunks] = useState<ChunkData[]>(() => visibleChunks(0, 0));
  const lastChunkKey = useRef("0,0");

  // Stream chunks as player moves.
  useFrame(() => {
    const px = playerPos.current.x;
    const pz = playerPos.current.z;
    // Move the grass plane to follow the player so it appears infinite.
    if (groundRef.current) {
      groundRef.current.position.x = Math.round(px / CHUNK_SIZE) * CHUNK_SIZE;
      groundRef.current.position.z = Math.round(pz / CHUNK_SIZE) * CHUNK_SIZE;
    }
    const cx = Math.floor(px / CHUNK_SIZE);
    const cz = Math.floor(pz / CHUNK_SIZE);
    const key = `${cx},${cz}`;
    if (key !== lastChunkKey.current) {
      lastChunkKey.current = key;
      setChunks(visibleChunks(px, pz));
    }
  });

  // Stone path tiles around spawn (fixed landmarks).
  const pathTiles = useMemo(() => {
    const tiles: { x: number; z: number }[] = [];
    for (let i = -20; i <= 20; i += 2) {
      tiles.push({ x: i, z: 0 });
      tiles.push({ x: 0, z: i });
    }
    return tiles;
  }, []);

  return (
    <>
      {/* Infinite-looking grass: large plane that follows the player */}
      <mesh ref={groundRef} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[400, 400, 1, 1]} />
        <meshStandardMaterial color="#2d4a2a" roughness={1} />
      </mesh>

      {/* Spawn-area path tiles */}
      {pathTiles.map((p, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[p.x, 0.012, p.z]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshStandardMaterial color="#5d5b52" roughness={0.95} />
        </mesh>
      ))}

      {/* Streamed chunks (trees, rocks, dirt patches) */}
      {chunks.map((c) => <Chunk key={c.key} data={c} />)}
    </>
  );
}
