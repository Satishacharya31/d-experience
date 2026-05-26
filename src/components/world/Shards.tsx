import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { gameStore } from "@/lib/gameStore";
import { audio } from "@/lib/audio";

// 8 shard positions scattered across the map (avoiding buildings and spawn)
const SHARD_POSITIONS: [number, number, number][] = [
  [0, 1.8, 0],         // center spawn (above)
  [-22, 3.5, 0],       // west side
  [22, 3.5, 0],        // east side
  [0, 1.8, -22],       // north side
  [0, 1.8, 22],        // south side
  [-35, 1.8, -10],     // NW wilderness
  [35, 1.8, 10],       // SE wilderness
  [0, 1.8, -40],       // far north near boundary
];

const SHARD_COLORS = [
  "#00ffff", "#00ff88", "#ffb800", "#ff4477",
  "#00d4ff", "#ff88ff", "#88ffaa", "#ffff00",
];

const COLLECT_RADIUS = 1.8;

function Shard({
  index,
  position,
  color,
  playerPos,
}: {
  index: number;
  position: [number, number, number];
  color: string;
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  const [collected, setCollected] = useState(
    () => gameStore.get().collectedShards.includes(index)
  );

  useFrame((state) => {
    if (collected) return;
    const t = state.clock.elapsedTime;

    // Float up & down + spin
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t * 1.8 + index * 0.7) * 0.35;
      meshRef.current.rotation.y += 0.025;
      meshRef.current.rotation.x += 0.012;
    }
    // Pulse ring
    if (ringRef.current) {
      const sc = 1 + Math.sin(t * 2.5 + index) * 0.12;
      ringRef.current.scale.setScalar(sc);
      ringRef.current.position.y = position[1] + Math.sin(t * 1.8 + index * 0.7) * 0.35;
      ringRef.current.rotation.z += 0.03;
    }

    // Collection check
    const dx = playerPos.current.x - position[0];
    const dz = playerPos.current.z - position[2];
    if (Math.hypot(dx, dz) < COLLECT_RADIUS) {
      const { wasNew } = gameStore.collectShard(index);
      if (wasNew) {
        audio.collect();
        setCollected(true);
        window.dispatchEvent(new CustomEvent("game:shard", { detail: index }));
      }
    }
  });

  if (collected) return null;

  return (
    <group position={position}>
      {/* Core octahedron */}
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          wireframe={false}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Inner wireframe shell */}
      <mesh ref={ringRef} rotation-x={Math.PI / 4}>
        <octahedronGeometry args={[0.5, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.35} />
      </mesh>
      {/* Ground glow disc */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -position[1] + 0.05, 0]}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.DoubleSide} />
      </mesh>
      {/* Point light for local glow */}
      <pointLight color={color} intensity={1.5} distance={4} decay={2} />
    </group>
  );
}

export function Shards({
  playerPos,
}: {
  playerPos: React.MutableRefObject<THREE.Vector3>;
}) {
  return (
    <>
      {SHARD_POSITIONS.map((pos, i) => (
        <Shard
          key={i}
          index={i}
          position={pos}
          color={SHARD_COLORS[i % SHARD_COLORS.length]}
          playerPos={playerPos}
        />
      ))}
    </>
  );
}
