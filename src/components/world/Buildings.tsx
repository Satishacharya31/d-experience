import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";

export type ZoneId = "about" | "projects" | "skills" | "contact";

export type Zone = {
  id: ZoneId;
  label: string;
  position: [number, number, number];
  color: string;
};

export const ZONES: Zone[] = [
  // Spread out in asymmetric directions so the world feels organic, not grid-like.
  // Each building is 45-60 units from spawn, with staggered angles.
  { id: "about",    label: "ABOUT_TOWER",    position: [-38, 0, -55], color: "#00ff88" },
  { id: "projects", label: "PROJECTS_HUB",   position: [62,  0, -34], color: "#00d4ff" },
  { id: "skills",   label: "SKILLS_ARENA",   position: [44,  0,  58], color: "#ffb800" },
  { id: "contact",  label: "CONTACT_KIOSK",  position: [-58, 0,  38], color: "#ff4477" },
];

// ── Shared animated beacon ──────────────────────────────────────────────────
function Beacon({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (ref.current) {
      ref.current.position.y = 10 + Math.sin(s.clock.elapsedTime * 2) * 0.4;
      ref.current.rotation.y += 0.025;
      ref.current.rotation.x = Math.sin(s.clock.elapsedTime * 1.5) * 0.15;
    }
  });
  return (
    <mesh ref={ref}>
      <octahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={1.5}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Floating ring that orbits a building ─────────────────────────────────────
function OrbitRing({ color, radius = 4, speed = 1, height = 3, thickness = 0.08 }: {
  color: string; radius?: number; speed?: number; height?: number; thickness?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.x = Math.PI / 2 + Math.sin(s.clock.elapsedTime * speed * 0.5) * 0.2;
      ref.current.rotation.z = s.clock.elapsedTime * speed * 0.4;
      ref.current.position.y = height + Math.sin(s.clock.elapsedTime * speed) * 0.3;
    }
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, thickness, 16, 48]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.6}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Holographic label plane ──────────────────────────────────────────────────
function HoloPanel({ color, width = 2, height = 0.8, y = 4 }: {
  color: string; width?: number; height?: number; y?: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (ref.current) {
      ref.current.position.y = y + Math.sin(s.clock.elapsedTime * 1.8) * 0.08;
    }
  });
  return (
    <mesh ref={ref} position={[0, y, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Glowing edge lines for a building ────────────────────────────────────────
function GlowEdges({ color, width, height, depth, y = 0 }: {
  color: string; width: number; height: number; depth: number; y?: number;
}) {
  const edges = useMemo(() => {
    const geo = new THREE.BoxGeometry(width, height, depth);
    return new THREE.EdgesGeometry(geo);
  }, [width, height, depth]);

  return (
    <lineSegments position={[0, y, 0]}>
      <primitive object={edges} attach="geometry" />
      <lineBasicMaterial color={color} transparent opacity={0.35} />
    </lineSegments>
  );
}

// ── Floating data particles around buildings ─────────────────────────────────
function FloatingParticles({ color, count = 12, radius = 5, height = 6 }: {
  color: string; count?: number; radius?: number; height?: number;
}) {
  const ref = useRef<THREE.Group>(null!);
  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      angle: (i / count) * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.5,
      yOffset: Math.random() * height,
      r: radius * (0.6 + Math.random() * 0.4),
      size: 0.06 + Math.random() * 0.08,
    })), [count, radius, height]);

  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.children.forEach((child, i) => {
      const p = particles[i];
      const a = p.angle + t * p.speed;
      child.position.x = Math.cos(a) * p.r;
      child.position.z = Math.sin(a) * p.r;
      child.position.y = p.yOffset + Math.sin(t * p.speed * 2 + p.angle) * 0.5;
    });
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[p.size, 6, 6]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ── ABOUT TOWER ── Sleek cyberpunk skyscraper with setback floors
// ════════════════════════════════════════════════════════════════════════════════
function Tower({ color }: { color: string }) {
  const antennaRef = useRef<THREE.Group>(null!);
  useFrame((s) => {
    if (antennaRef.current) {
      antennaRef.current.rotation.y = s.clock.elapsedTime * 0.8;
    }
  });

  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[4, 4.5, 0.3, 6]} />
        <meshStandardMaterial color="#060d0a" emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Floor 1 - wide base */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[5, 3, 5]} />
        <meshStandardMaterial color="#0a1a14" emissive={color} emissiveIntensity={0.08} metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Floor 1 accent strip */}
      <mesh position={[0, 2.9, 0]}>
        <boxGeometry args={[5.1, 0.08, 5.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
      </mesh>

      {/* Floor 2 - setback */}
      <mesh position={[0, 4.3, 0]} castShadow>
        <boxGeometry args={[4, 2.6, 4]} />
        <meshStandardMaterial color="#0c1f17" emissive={color} emissiveIntensity={0.12} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* Floor 2 accent */}
      <mesh position={[0, 5.5, 0]}>
        <boxGeometry args={[4.1, 0.06, 4.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} />
      </mesh>

      {/* Floor 3 - narrow top */}
      <mesh position={[0, 6.8, 0]} castShadow>
        <boxGeometry args={[2.8, 2.2, 2.8]} />
        <meshStandardMaterial color="#0e2519" emissive={color} emissiveIntensity={0.18} metalness={0.5} roughness={0.4} />
      </mesh>

      {/* Spire / antenna */}
      <mesh position={[0, 8.6, 0]}>
        <cylinderGeometry args={[0.08, 0.35, 1.4, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>

      {/* Rotating antenna rings */}
      <group ref={antennaRef} position={[0, 8.8, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.03, 8, 24]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>

      {/* Window strips (vertical glowing lines) */}
      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <mesh key={x} position={[x, 1.5, 2.51]}>
          <boxGeometry args={[0.12, 2.4, 0.01]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      ))}

      {/* Door - archway style */}
      <mesh position={[0, 0.95, 2.52]}>
        <boxGeometry args={[1.2, 1.9, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.6} toneMapped={false} />
      </mesh>

      {/* Glow edges */}
      <GlowEdges color={color} width={5.05} height={3.05} depth={5.05} y={1.5} />
      <GlowEdges color={color} width={4.05} height={2.65} depth={4.05} y={4.3} />
      <GlowEdges color={color} width={2.85} height={2.25} depth={2.85} y={6.8} />

      <OrbitRing color={color} radius={3.8} speed={0.7} height={5} />
      <FloatingParticles color={color} count={10} radius={4.5} height={8} />
      <Beacon color={color} />
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ── PROJECTS HUB ── Modern tech campus / data center
// ════════════════════════════════════════════════════════════════════════════════
function Hub({ color }: { color: string }) {
  const scanRef = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    if (scanRef.current) {
      // Scanning line going up and down
      const t = (s.clock.elapsedTime * 0.8) % 2;
      scanRef.current.position.y = t < 1 ? t * 3.5 + 0.3 : (2 - t) * 3.5 + 0.3;
      (scanRef.current.material as THREE.MeshStandardMaterial).opacity = 0.3 + Math.sin(s.clock.elapsedTime * 3) * 0.1;
    }
  });

  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[10, 0.2, 8]} />
        <meshStandardMaterial color="#060a10" emissive={color} emissiveIntensity={0.05} />
      </mesh>

      {/* Main building body */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[8, 3, 6]} />
        <meshStandardMaterial color="#0a141a" emissive={color} emissiveIntensity={0.1} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Rooftop — flat with raised accent edge */}
      <mesh position={[0, 3.15, 0]} castShadow>
        <boxGeometry args={[8.4, 0.1, 6.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.4, 0]} castShadow>
        <boxGeometry args={[6, 0.4, 4]} />
        <meshStandardMaterial color="#0c1820" emissive={color} emissiveIntensity={0.15} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Canopy / overhang */}
      <mesh position={[0, 3.05, 3.3]}>
        <boxGeometry args={[8.6, 0.08, 1.2]} />
        <meshStandardMaterial color="#0e1c24" emissive={color} emissiveIntensity={0.2} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Windows - grid pattern */}
      {[-2.8, -1.4, 0, 1.4, 2.8].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.2, 3.01]}>
            <boxGeometry args={[0.9, 1.2, 0.02]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.3} toneMapped={false} />
          </mesh>
          <mesh position={[x, 0.9, 3.01]}>
            <boxGeometry args={[0.9, 0.8, 0.02]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.2} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Entrance doors (3 bays) */}
      {[-2.4, 0, 2.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.85, 3.02]}>
            <boxGeometry args={[1.1, 1.7, 0.02]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {/* Door frame glow */}
          <mesh position={[x, 0.85, 3.03]}>
            <boxGeometry args={[1.2, 1.8, 0.01]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.15} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Scanning line */}
      <mesh ref={scanRef as any} position={[0, 1, 3.04]}>
        <boxGeometry args={[8, 0.04, 0.01]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent opacity={0.4} toneMapped={false} />
      </mesh>

      {/* Side server units */}
      {[-3.5, 3.5].map((x) => (
        <mesh key={x} position={[x, 1, -2]}>
          <boxGeometry args={[0.8, 2, 1.2]} />
          <meshStandardMaterial color="#080e14" emissive={color} emissiveIntensity={0.25} metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      <GlowEdges color={color} width={8.1} height={3.1} depth={6.1} y={1.6} />
      <OrbitRing color={color} radius={5.5} speed={0.5} height={4} thickness={0.06} />
      <FloatingParticles color={color} count={14} radius={6} height={5} />
      <Beacon color={color} />
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ── SKILLS ARENA ── Mystical energy ring with levitating monoliths
// ════════════════════════════════════════════════════════════════════════════════
function Arena({ color }: { color: string }) {
  const coreRef = useRef<THREE.Mesh>(null!);
  const innerRingRef = useRef<THREE.Mesh>(null!);
  const stonesRef = useRef<THREE.Group>(null!);

  const stones = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      return {
        x: Math.cos(a) * 3.8,
        z: Math.sin(a) * 3.8,
        h: 2.5 + (i % 3) * 1,
        phase: i * 0.5,
        angle: a,
      };
    }), []);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.6;
      coreRef.current.rotation.x = Math.sin(t * 0.4) * 0.3;
      coreRef.current.position.y = 3.5 + Math.sin(t * 1.2) * 0.3;
    }
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = t * 0.3;
      innerRingRef.current.position.y = 3.5 + Math.sin(t * 1.2 + 0.5) * 0.2;
    }
    if (stonesRef.current) {
      stonesRef.current.children.forEach((child, i) => {
        child.position.y = stones[i].h / 2 + 0.2 + Math.sin(t * 0.8 + stones[i].phase) * 0.15;
        child.rotation.y = t * 0.1 + stones[i].angle;
      });
    }
  });

  return (
    <group>
      {/* Base platform - glowing hex pad */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.5, 6]} />
        <meshStandardMaterial color="#100e04" emissive={color} emissiveIntensity={0.12} metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Inner circle glow */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 2.2, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.25} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer ring glow */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.2, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.2} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>

      {/* Monolith pillars */}
      <group ref={stonesRef}>
        {stones.map((st, i) => (
          <group key={i} position={[st.x, st.h / 2 + 0.2, st.z]}>
            {/* Main pillar */}
            <mesh castShadow>
              <boxGeometry args={[0.6, st.h, 0.6]} />
              <meshStandardMaterial color="#0a0a05" emissive={color} emissiveIntensity={0.15} metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Accent cap */}
            <mesh position={[0, st.h / 2 + 0.1, 0]}>
              <boxGeometry args={[0.7, 0.12, 0.7]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} />
            </mesh>
            {/* Side accent line */}
            <mesh position={[0.31, 0, 0]}>
              <boxGeometry args={[0.02, st.h * 0.7, 0.02]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.5} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Core crystal — double icosahedron */}
      <mesh ref={coreRef} position={[0, 3.5, 0]} castShadow>
        <icosahedronGeometry args={[0.9, 0]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.2}
          wireframe
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
      {/* Inner solid core */}
      <mesh position={[0, 3.5, 0]}>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Rotating energy ring */}
      <mesh ref={innerRingRef as any} position={[0, 3.5, 0]}>
        <torusGeometry args={[1.4, 0.04, 12, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.6} toneMapped={false} />
      </mesh>

      <OrbitRing color={color} radius={3.2} speed={0.6} height={5} thickness={0.05} />
      <FloatingParticles color={color} count={16} radius={4.5} height={5} />
      <Beacon color={color} />
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ── CONTACT KIOSK ── Futuristic communication terminal / holographic booth
// ════════════════════════════════════════════════════════════════════════════════
function Kiosk({ color }: { color: string }) {
  const screenRef = useRef<THREE.Mesh>(null!);
  const holoRef = useRef<THREE.Group>(null!);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (screenRef.current) {
      // Pulsing screen glow
      (screenRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.5 + Math.sin(t * 2) * 0.2;
    }
    if (holoRef.current) {
      holoRef.current.rotation.y = t * 1.2;
      holoRef.current.position.y = 4.2 + Math.sin(t * 1.5) * 0.15;
    }
  });

  return (
    <group>
      {/* Base platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[3, 3.5, 0.2, 8]} />
        <meshStandardMaterial color="#100610" emissive={color} emissiveIntensity={0.08} />
      </mesh>

      {/* Main booth body — tapered */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 2.8, 3]} />
        <meshStandardMaterial color="#1a0a10" emissive={color} emissiveIntensity={0.12} metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Roof — angular cap */}
      <mesh position={[0, 3.1, 0]} castShadow>
        <boxGeometry args={[3.4, 0.15, 3.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[2, 1.2, 4]} />
        <meshStandardMaterial color="#1a0a10" emissive={color} emissiveIntensity={0.2} metalness={0.6} roughness={0.4} />
      </mesh>

      {/* Antenna spire */}
      <mesh position={[0, 4.4, 0]}>
        <cylinderGeometry args={[0.04, 0.12, 0.8, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* Screen / display panel */}
      <mesh ref={screenRef as any} position={[0, 1.8, 1.52]}>
        <boxGeometry args={[2, 1.4, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      {/* Screen frame */}
      <mesh position={[0, 1.8, 1.51]}>
        <boxGeometry args={[2.15, 1.55, 0.02]} />
        <meshStandardMaterial color="#1a0a10" emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Side accent panels */}
      {[-1.52, 1.52].map((x) => (
        <mesh key={x} position={[x, 1.5, 0]}>
          <boxGeometry args={[0.02, 2, 0.5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.25} toneMapped={false} />
        </mesh>
      ))}

      {/* Corner accent strips */}
      {[[-1.5, -1.5], [-1.5, 1.5], [1.5, -1.5], [1.5, 1.5]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.5, z]}>
          <boxGeometry args={[0.06, 2.8, 0.06]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.4} toneMapped={false} />
        </mesh>
      ))}

      {/* Holographic projector element */}
      <group ref={holoRef} position={[0, 4.2, 0]}>
        <mesh>
          <dodecahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.5}
            wireframe
            transparent
            opacity={0.5}
            toneMapped={false}
          />
        </mesh>
        <mesh>
          <dodecahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} toneMapped={false} />
        </mesh>
      </group>

      <GlowEdges color={color} width={3.05} height={2.85} depth={3.05} y={1.5} />
      <OrbitRing color={color} radius={2.5} speed={0.9} height={3} thickness={0.05} />
      <FloatingParticles color={color} count={8} radius={3.5} height={4} />
      <Beacon color={color} />
    </group>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// ── Buildings (root export) ──────────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════════════
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
            <ringGeometry args={[6, 6.15, 48]} />
            <meshStandardMaterial
              color={z.color}
              emissive={z.color}
              emissiveIntensity={0.5}
              transparent
              opacity={0.35}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          {/* Secondary outer ring */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
            <ringGeometry args={[6.4, 6.5, 48]} />
            <meshStandardMaterial
              color={z.color}
              emissive={z.color}
              emissiveIntensity={0.3}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </>
  );
}
