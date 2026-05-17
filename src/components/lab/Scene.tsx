import { Canvas, useFrame } from "@react-three/fiber";
import { Icosahedron, Points, PointMaterial } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Core({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  const wire = useRef<THREE.Mesh>(null!);
  const solid = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    [wire.current, solid.current].forEach((m) => {
      if (!m) return;
      m.rotation.x += delta * 0.15;
      m.rotation.y += delta * 0.2;
      // mouse parallax
      m.position.x += (mouse.current.x * 0.4 - m.position.x) * 0.05;
      m.position.y += (-mouse.current.y * 0.4 - m.position.y) * 0.05;
    });
    if (solid.current) {
      const s = 1 + Math.sin(t * 1.5) * 0.04;
      solid.current.scale.setScalar(s);
    }
  });

  return (
    <group>
      <Icosahedron ref={solid} args={[1.4, 1]}>
        <meshStandardMaterial
          color="#0a1a14"
          emissive="#00ff88"
          emissiveIntensity={0.25}
          metalness={0.9}
          roughness={0.2}
          flatShading
        />
      </Icosahedron>
      <Icosahedron ref={wire} args={[1.55, 1]}>
        <meshBasicMaterial color="#7CFFB2" wireframe transparent opacity={0.65} />
      </Icosahedron>
    </group>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null!);
  const positions = useMemo(() => {
    const arr = new Float32Array(2000 * 3);
    for (let i = 0; i < 2000; i++) {
      const r = 3 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.y += d * 0.03;
      ref.current.rotation.x += d * 0.01;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        size={0.015}
        color="#00ff88"
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
      />
    </Points>
  );
}

function Rig({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) {
  useFrame((state) => {
    state.camera.position.x += (mouse.current.x * 0.6 - state.camera.position.x) * 0.04;
    state.camera.position.y += (-mouse.current.y * 0.6 - state.camera.position.y) * 0.04;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

export function Scene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="fixed inset-0 z-0"
      onPointerMove={(e) => {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      }}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 55 }} dpr={[1, 2]}>
        <color attach="background" args={["#050805"]} />
        <fog attach="fog" args={["#050805", 6, 14]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={2} color="#00ff88" />
        <pointLight position={[-5, -3, -5]} intensity={1.5} color="#00d4ff" />
        <Core mouse={mouse} />
        <Particles />
        <Rig mouse={mouse} />
      </Canvas>
    </div>
  );
}
