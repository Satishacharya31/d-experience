import * as THREE from "three";
import { useMemo } from "react";

// Voxel-tiled ground with scattered blocks and a glowing grid.
export function Ground() {
  const blocks = useMemo(() => {
    const out: { x: number; z: number; h: number; c: string }[] = [];
    const palette = ["#0d1f15", "#0a1a14", "#0f2419", "#08130d"];
    for (let i = 0; i < 140; i++) {
      const x = (Math.random() - 0.5) * 90;
      const z = (Math.random() - 0.5) * 90;
      // keep clear near origin (spawn) and near building centers
      if (Math.hypot(x, z) < 5) continue;
      if (
        [[-22, -22], [22, -22], [22, 22], [-22, 22]].some(([bx, bz]) => Math.hypot(x - bx, z - bz) < 8)
      )
        continue;
      out.push({
        x,
        z,
        h: 0.3 + Math.random() * 1.4,
        c: palette[Math.floor(Math.random() * palette.length)],
      });
    }
    return out;
  }, []);

  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#040806" />
      </mesh>
      {/* glowing grid overlay */}
      <gridHelper args={[120, 60, "#00ff88", "#0a3a22"]} position={[0, 0.01, 0]} />
      {/* boundary walls (voxel cubes) */}
      {Array.from({ length: 60 }).map((_, i) => {
        const t = (i / 60) * Math.PI * 2;
        const r = 55;
        return (
          <mesh key={i} position={[Math.cos(t) * r, 0.5, Math.sin(t) * r]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#0a1a14" emissive="#00ff88" emissiveIntensity={0.2} />
          </mesh>
        );
      })}
      {/* scattered scenery blocks */}
      {blocks.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]} castShadow receiveShadow>
          <boxGeometry args={[1, b.h, 1]} />
          <meshStandardMaterial color={b.c} />
        </mesh>
      ))}
    </>
  );
}
