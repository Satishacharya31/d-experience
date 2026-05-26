import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export type ZoneId = "about" | "projects" | "skills" | "contact";

export type Zone = {
  id: ZoneId;
  label: string;
  position: [number, number, number];
  color: string;
};

export const ZONES: Zone[] = [
  { id: "about", label: "ABOUT_TOWER", position: [-22, 0, -22], color: "#00ff88" },
  { id: "projects", label: "PROJECTS_HUB", position: [22, 0, -22], color: "#00d4ff" },
  { id: "skills", label: "SKILLS_ARENA", position: [22, 0, 22], color: "#ffb800" },
  { id: "contact", label: "CONTACT_KIOSK", position: [-22, 0, 22], color: "#ff4477" },
];

function Beacon({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (ref.current) {
      const y = 8 + Math.sin(s.clock.elapsedTime * 2) * 0.3;
      ref.current.position.y = y;
      ref.current.rotation.y += 0.02;
    }
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Tower({ color }: { color: string }) {
  // ABOUT — tall stacked cubes
  return (
    <group>
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 3, 5]} />
        <meshStandardMaterial color="#0a1a14" emissive={color} emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 4.2, 0]} castShadow>
        <boxGeometry args={[4, 2.4, 4]} />
        <meshStandardMaterial color="#0a1a14" emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 6.4, 0]} castShadow>
        <boxGeometry args={[3, 2, 3]} />
        <meshStandardMaterial color="#0a1a14" emissive={color} emissiveIntensity={0.25} />
      </mesh>
      {/* door */}
      <mesh position={[0, 0.9, 2.51]}>
        <boxGeometry args={[1.1, 1.8, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* wireframe */}
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[5.05, 7.6, 5.05]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
      </mesh>
      <Beacon color={color} />
    </group>
  );
}

function Hub({ color }: { color: string }) {
  // PROJECTS — wide low building with multiple doors
  return (
    <group>
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 2.8, 6]} />
        <meshStandardMaterial color="#0a141a" emissive={color} emissiveIntensity={0.18} />
      </mesh>
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[7, 0.6, 5]} />
        <meshStandardMaterial color="#0a141a" emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {[-2.4, 0, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.9, 3.01]}>
          <boxGeometry args={[1, 1.7, 0.02]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[8.05, 3.65, 6.05]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.25} />
      </mesh>
      <Beacon color={color} />
    </group>
  );
}

function Arena({ color }: { color: string }) {
  // SKILLS — circular ring of monoliths
  const stones = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return [Math.cos(a) * 3.5, Math.sin(a) * 3.5] as const;
  });
  return (
    <group>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[5, 5, 0.2, 8]} />
        <meshStandardMaterial color="#1a1408" emissive={color} emissiveIntensity={0.15} />
      </mesh>
      {stones.map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5 + (i % 3) * 0.4, z]} castShadow>
          <boxGeometry args={[0.8, 3 + (i % 3) * 0.8, 0.8]} />
          <meshStandardMaterial color="#0a0a05" emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 2.5, 0]} castShadow>
        <octahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} wireframe />
      </mesh>
      <Beacon color={color} />
    </group>
  );
}

function Kiosk({ color }: { color: string }) {
  // CONTACT — small terminal booth
  return (
    <group>
      <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2.4, 3]} />
        <meshStandardMaterial color="#1a0a10" emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 2.6, 0]} castShadow>
        <coneGeometry args={[2.2, 1.4, 4]} />
        <meshStandardMaterial color="#1a0a10" emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 1.4, 1.51]}>
        <boxGeometry args={[1.6, 1, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3.05, 2.45, 3.05]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
      </mesh>
      <Beacon color={color} />
    </group>
  );
}

export function Buildings() {
  return (
    <>
      {ZONES.map((z) => (
        <group key={z.id} position={z.position}>
          {z.id === "about" && <Tower color={z.color} />}
          {z.id === "projects" && <Hub color={z.color} />}
          {z.id === "skills" && <Arena color={z.color} />}
          {z.id === "contact" && <Kiosk color={z.color} />}
          {/* zone radius glow disc */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[6, 6.3, 48]} />
            <meshBasicMaterial color={z.color} transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </>
  );
}
