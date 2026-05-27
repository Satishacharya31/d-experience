import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

const BULLET_SPEED = 35;
const BULLET_LIFETIME = 2.0; // seconds
const MAX_BULLETS = 24;
const MAX_HITS = 12;

type BulletData = {
  id: number;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  age: number;
  alive: boolean;
};

type HitEffect = {
  id: number;
  pos: THREE.Vector3;
  age: number;
  alive: boolean;
  particles: { offset: THREE.Vector3; vel: THREE.Vector3; size: number }[];
};

// Pre-allocate bullet pool to avoid GC pressure
function createPool(): BulletData[] {
  return Array.from({ length: MAX_BULLETS }, (_, i) => ({
    id: i,
    pos: new THREE.Vector3(),
    dir: new THREE.Vector3(0, 0, 1),
    age: Infinity,
    alive: false,
  }));
}

function createHitPool(): HitEffect[] {
  return Array.from({ length: MAX_HITS }, (_, i) => ({
    id: i,
    pos: new THREE.Vector3(),
    age: Infinity,
    alive: false,
    particles: Array.from({ length: 8 }, () => ({
      offset: new THREE.Vector3(),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 4,
      ),
      size: 0.04 + Math.random() * 0.08,
    })),
  }));
}

// ── Single bullet mesh (imperative, no React state) ─────────────────────────────
function BulletMesh({ data }: { data: BulletData }) {
  const groupRef = useRef<THREE.Group>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const trailRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!data.alive) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    groupRef.current.position.copy(data.pos);

    // Rotate bullet to face direction
    if (data.dir.lengthSq() > 0) {
      const angle = Math.atan2(data.dir.x, data.dir.z);
      groupRef.current.rotation.y = angle;
    }

    // Fade out near end of life
    const lifeRatio = 1 - data.age / BULLET_LIFETIME;
    if (lightRef.current) lightRef.current.intensity = 4 * lifeRatio;
    if (trailRef.current) {
      (trailRef.current.material as THREE.MeshStandardMaterial).opacity = 0.5 * lifeRatio;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Core */}
      <mesh>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={6}
          toneMapped={false}
        />
      </mesh>
      {/* Inner white hot */}
      <mesh>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={10}
          toneMapped={false}
        />
      </mesh>
      {/* Trail — elongated along Z (forward direction) */}
      <mesh ref={trailRef} position={[0, 0, -0.5]} scale={[0.06, 0.06, 1.0]}>
        <sphereGeometry args={[1, 4, 4]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={3}
          transparent
          opacity={0.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} color="#00ffff" intensity={4} distance={8} decay={2} />
    </group>
  );
}

// ── Hit-effect spark burst ────────────────────────────────────────────────────
const HIT_DURATION = 0.55;

function HitMesh({ data }: { data: HitEffect }) {
  const groupRef = useRef<THREE.Group>(null!);
  const particleRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flashRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!data.alive) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    groupRef.current.position.copy(data.pos);

    const t = data.age / HIT_DURATION;
    const eased = 1 - t * t; // ease out

    // Flash sphere shrinks quickly
    if (flashRef.current) {
      const s = Math.max(0, (1 - t * 3) * 0.6);
      flashRef.current.scale.setScalar(s);
      (flashRef.current.material as THREE.MeshStandardMaterial).opacity = eased * 0.9;
    }

    // Particles fly outward
    data.particles.forEach((p, i) => {
      const mesh = particleRefs.current[i];
      if (!mesh) return;
      p.offset.x += p.vel.x * delta;
      p.offset.y += p.vel.y * delta - 9 * delta * data.age; // gravity
      p.offset.z += p.vel.z * delta;
      mesh.position.copy(p.offset);
      const s = Math.max(0, eased) * p.size * 2;
      mesh.scale.setScalar(s);
      (mesh.material as THREE.MeshStandardMaterial).opacity = eased * 0.85;
    });
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Flash sphere */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#00ffff"
          emissive="#00ffff"
          emissiveIntensity={5}
          transparent
          opacity={0.9}
          toneMapped={false}
        />
      </mesh>
      {/* Spark particles */}
      {data.particles.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => { particleRefs.current[i] = el; }}
        >
          <sphereGeometry args={[1, 4, 4]} />
          <meshStandardMaterial
            color="#ffee00"
            emissive="#ffaa00"
            emissiveIntensity={4}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── ProjectileManager — reads from shootQueue ref, no React setState ────────────
export function ProjectileManager({
  shootQueue,
}: {
  shootQueue: React.MutableRefObject<{ pos: THREE.Vector3; dir: THREE.Vector3 }[]>;
}) {
  const pool = useRef<BulletData[]>(createPool());
  const hits = useRef<HitEffect[]>(createHitPool());
  const nextSlot = useRef(0);
  const nextHitSlot = useRef(0);

  // Simple world collision spheres for props — populated externally via event
  // The projectile casts a simple sphere sweep per frame against ground + a Y-plane
  const spawnHit = (pos: THREE.Vector3) => {
    const slot = nextHitSlot.current % MAX_HITS;
    nextHitSlot.current++;
    const h = hits.current[slot];
    h.pos.copy(pos);
    h.age = 0;
    h.alive = true;
    // Reset particle offsets
    h.particles.forEach((p) => {
      p.offset.set(0, 0, 0);
      p.vel.set(
        (Math.random() - 0.5) * 8,
        Math.random() * 6 + 2,
        (Math.random() - 0.5) * 8,
      );
    });
  };

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);

    // Drain the shoot queue
    while (shootQueue.current.length > 0) {
      const shot = shootQueue.current.shift()!;
      const slot = nextSlot.current % MAX_BULLETS;
      nextSlot.current++;
      pool.current[slot].pos.copy(shot.pos);
      pool.current[slot].dir.copy(shot.dir);
      pool.current[slot].age = 0;
      pool.current[slot].alive = true;
    }

    // Update all active bullets
    for (const b of pool.current) {
      if (!b.alive) continue;
      b.age += d;
      if (b.age >= BULLET_LIFETIME) {
        b.alive = false;
        // Spawn a fade-out hit at bullet's last position (soft miss)
        spawnHit(b.pos.clone());
        continue;
      }
      // Move bullet
      b.pos.x += b.dir.x * BULLET_SPEED * d;
      b.pos.y += b.dir.y * BULLET_SPEED * d - 3.5 * b.age * d;
      b.pos.z += b.dir.z * BULLET_SPEED * d;

      // ── Ground collision ──
      if (b.pos.y <= 0.1) {
        b.alive = false;
        const hitPos = b.pos.clone();
        hitPos.y = 0.1;
        spawnHit(hitPos);
      }
    }

    // Tick hit effects
    for (const h of hits.current) {
      if (!h.alive) continue;
      h.age += d;
      if (h.age >= HIT_DURATION) {
        h.alive = false;
      }
    }
  });

  return (
    <>
      {pool.current.map((data) => (
        <BulletMesh key={data.id} data={data} />
      ))}
      {hits.current.map((data) => (
        <HitMesh key={data.id} data={data} />
      ))}
    </>
  );
}
