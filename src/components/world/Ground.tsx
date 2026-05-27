import * as THREE from "three";
import { useMemo } from "react";
import { TREES, ROCKS } from "@/lib/worldObstacles";

// Natural terrain with subtle height noise, scattered trees, rocks, and a soft path grid.
function Tree({ x, z, scale, tilt, kind }: { x: number; z: number; scale: number; tilt: number; kind: 0 | 1 | 2 }) {
  // 3 silhouettes: pine (stacked cones), broadleaf (sphere-ish icosa), birch (tall cylinder + small top).
  const trunkColor = kind === 2 ? "#d8d2c0" : "#3a2a18";
  const leafA = kind === 0 ? "#1d6b3a" : kind === 1 ? "#2f8a4a" : "#4ea05a";
  const leafB = kind === 0 ? "#16542c" : kind === 1 ? "#246e3a" : "#3d8a48";

  return (
    <group position={[x, 0, z]} rotation={[tilt, Math.random() * Math.PI, tilt * 0.6]} scale={scale}>
      {/* trunk */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.26, 1.8, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.95} />
      </mesh>
      {kind === 0 && (
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
      {kind === 1 && (
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
      {kind === 2 && (
        <>
          <mesh position={[0, 2.4, 0]} castShadow>
            <icosahedronGeometry args={[1.0, 0]} />
            <meshStandardMaterial color={leafA} roughness={0.85} flatShading />
          </mesh>
        </>
      )}
    </group>
  );
}

function Rock({ x, z, scale, rot }: { x: number; z: number; scale: number; rot: number }) {
  return (
    <mesh position={[x, 0.3 * scale, z]} rotation={[0, rot, 0]} scale={scale} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.7, 0]} />
      <meshStandardMaterial color="#5a5d63" roughness={0.95} flatShading />
    </mesh>
  );
}

export function Ground() {
  // Subtle path tiles (cross-shaped) connecting spawn to each building.
  const pathTiles = useMemo(() => {
    const tiles: { x: number; z: number }[] = [];
    for (let i = -20; i <= 20; i += 2) {
      tiles.push({ x: i, z: 0 });
      tiles.push({ x: 0, z: i });
    }
    return tiles;
  }, []);

  // Boundary "stone wall" segments — chunky rocks, not glowing cubes.
  const wall = useMemo(() => {
    const out: { x: number; z: number; s: number }[] = [];
    const r = 54;
    for (let i = 0; i < 80; i++) {
      const t = (i / 80) * Math.PI * 2;
      out.push({
        x: Math.cos(t) * r + (Math.random() - 0.5) * 0.6,
        z: Math.sin(t) * r + (Math.random() - 0.5) * 0.6,
        s: 0.9 + Math.random() * 0.7,
      });
    }
    return out;
  }, []);

  return (
    <>
      {/* Main grass plane — warm natural green, not neon */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[140, 140, 1, 1]} />
        <meshStandardMaterial color="#2d4a2a" roughness={1} />
      </mesh>

      {/* Darker organic patches (dirt / shadow) */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 12 + (i % 4) * 8;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return (
          <mesh key={i} rotation-x={-Math.PI / 2} position={[x, 0.005, z]}>
            <circleGeometry args={[3 + (i % 3), 24]} />
            <meshStandardMaterial color="#243d22" roughness={1} transparent opacity={0.85} />
          </mesh>
        );
      })}

      {/* Stone path tiles to each building */}
      {pathTiles.map((p, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[p.x, 0.012, p.z]}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshStandardMaterial color="#5d5b52" roughness={0.95} />
        </mesh>
      ))}

      {/* Trees */}
      {TREES.map((t, i) => (
        <Tree key={`t${i}`} {...t} />
      ))}

      {/* Rocks */}
      {ROCKS.map((r, i) => (
        <Rock key={`r${i}`} {...r} />
      ))}

      {/* Stone boundary wall */}
      {wall.map((w, i) => (
        <mesh key={`w${i}`} position={[w.x, 0.5 * w.s, w.z]} scale={w.s} castShadow receiveShadow>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#4a4a52" roughness={0.95} flatShading />
        </mesh>
      ))}
    </>
  );
}
