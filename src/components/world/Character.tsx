import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Low-poly humanoid built from voxel boxes. Animates legs/arms when moving.
// Includes a sci-fi blaster on the right arm.
export function Character({
  groupRef,
  movingRef,
}: {
  groupRef: React.MutableRefObject<THREE.Group | null>;
  movingRef: React.MutableRefObject<boolean>;
}) {
  const lLeg = useRef<THREE.Mesh>(null!);
  const rLeg = useRef<THREE.Mesh>(null!);
  const lArm = useRef<THREE.Mesh>(null!);
  const rArm = useRef<THREE.Group>(null!);
  const gunGlow = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const amp = movingRef.current ? 0.9 : 0;
    const sw = Math.sin(t * 9) * amp;
    if (lLeg.current) lLeg.current.rotation.x = sw;
    if (rLeg.current) rLeg.current.rotation.x = -sw;
    if (lArm.current) lArm.current.rotation.x = -sw * 0.7;
    if (rArm.current) rArm.current.rotation.x = sw * 0.7;
    // Gun barrel glow pulse
    if (gunGlow.current) {
      (gunGlow.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        1.5 + Math.sin(t * 4) * 0.5;
    }
  });

  const skin = "#7CFFB2";
  const suit = "#0a1a14";
  const accent = "#00ff88";
  const gunMetal = "#1a2a20";

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* shadow blob */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.5, 16]} />
        <meshBasicMaterial color="#000" transparent opacity={0.45} />
      </mesh>

      {/* legs */}
      <group position={[0, 0.55, 0]}>
        <mesh ref={lLeg} position={[-0.16, 0, 0]} castShadow>
          <boxGeometry args={[0.22, 0.55, 0.22]} />
          <meshStandardMaterial color={suit} />
        </mesh>
        <mesh ref={rLeg} position={[0.16, 0, 0]} castShadow>
          <boxGeometry args={[0.22, 0.55, 0.22]} />
          <meshStandardMaterial color={suit} />
        </mesh>
      </group>

      {/* torso */}
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[0.6, 0.7, 0.35]} />
        <meshStandardMaterial color={suit} emissive={accent} emissiveIntensity={0.15} />
      </mesh>
      {/* chest light */}
      <mesh position={[0, 1.15, 0.18]}>
        <boxGeometry args={[0.15, 0.15, 0.02]} />
        <meshBasicMaterial color={accent} />
      </mesh>

      {/* left arm */}
      <group position={[0, 1.35, 0]}>
        <mesh ref={lArm} position={[-0.42, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.55, 0.18]} />
          <meshStandardMaterial color={suit} />
        </mesh>
      </group>

      {/* right arm + GUN */}
      <group position={[0.42, 1.15, 0]}>
        <group ref={rArm}>
          {/* Upper arm */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.18, 0.55, 0.18]} />
            <meshStandardMaterial color={suit} />
          </mesh>

          {/* ── Sci-fi blaster ── */}
          {/* Main body */}
          <mesh position={[0.08, -0.3, 0.22]} castShadow>
            <boxGeometry args={[0.12, 0.16, 0.5]} />
            <meshStandardMaterial color={gunMetal} emissive={accent} emissiveIntensity={0.1} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Barrel */}
          <mesh position={[0.08, -0.3, 0.52]}>
            <boxGeometry args={[0.06, 0.08, 0.28]} />
            <meshStandardMaterial color="#0a1208" emissive={accent} emissiveIntensity={0.15} metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Barrel tip glow */}
          <mesh ref={gunGlow} position={[0.08, -0.3, 0.68]}>
            <boxGeometry args={[0.05, 0.05, 0.04]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
          {/* Energy cell */}
          <mesh position={[0.08, -0.36, 0.18]}>
            <boxGeometry args={[0.08, 0.06, 0.12]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} toneMapped={false} />
          </mesh>
          {/* Side accent stripe */}
          <mesh position={[0.15, -0.3, 0.22]}>
            <boxGeometry args={[0.01, 0.05, 0.45]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.0} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* head */}
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color={skin} emissive={accent} emissiveIntensity={0.25} />
      </mesh>
      {/* visor */}
      <mesh position={[0, 1.78, 0.23]}>
        <boxGeometry args={[0.38, 0.12, 0.02]} />
        <meshBasicMaterial color="#001" />
      </mesh>
    </group>
  );
}
