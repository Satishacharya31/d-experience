import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Character } from "./Character";
import { Buildings, ZONES, type ZoneId } from "./Buildings";
import { Ground } from "./Ground";

const SPEED = 6;
const JUMP = 7;
const GRAVITY = 18;
const ZONE_RADIUS = 6;

type Keys = {
  w: boolean; a: boolean; s: boolean; d: boolean; space: boolean;
};

function Player({
  keys,
  onZoneChange,
  onInteract,
}: {
  keys: React.MutableRefObject<Keys>;
  onZoneChange: (z: ZoneId | null) => void;
  onInteract: React.MutableRefObject<boolean>;
}) {
  const group = useRef<THREE.Group | null>(null);
  const moving = useRef(false);
  const velY = useRef(0);
  const yaw = useRef(0);
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const camTarget = useRef(new THREE.Vector3());
  const camDesired = useRef(new THREE.Vector3());
  const lastZone = useRef<ZoneId | null>(null);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    let dx = 0, dz = 0;
    if (keys.current.w) dz -= 1;
    if (keys.current.s) dz += 1;
    if (keys.current.a) dx -= 1;
    if (keys.current.d) dx += 1;
    const len = Math.hypot(dx, dz);
    moving.current = len > 0;

    if (len > 0) {
      dx /= len; dz /= len;
      // movement is camera-relative around yaw
      const cy = Math.cos(yaw.current);
      const sy = Math.sin(yaw.current);
      const mx = dx * cy - dz * sy;
      const mz = dx * sy + dz * cy;
      pos.current.x += mx * SPEED * d;
      pos.current.z += mz * SPEED * d;
      // face direction
      const targetYaw = Math.atan2(mx, mz);
      if (group.current) {
        let cur = group.current.rotation.y;
        let diff = targetYaw - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        group.current.rotation.y = cur + diff * Math.min(1, d * 12);
      }
    }

    // jump / gravity
    if (keys.current.space && pos.current.y <= 0.001) velY.current = JUMP;
    velY.current -= GRAVITY * d;
    pos.current.y += velY.current * d;
    if (pos.current.y < 0) { pos.current.y = 0; velY.current = 0; }

    // clamp world
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -52, 52);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -52, 52);

    if (group.current) group.current.position.copy(pos.current);

    // camera follow (3rd person behind by yaw)
    const camDist = 9;
    const camHeight = 5;
    camDesired.current.set(
      pos.current.x - Math.sin(yaw.current) * camDist,
      pos.current.y + camHeight,
      pos.current.z - Math.cos(yaw.current) * camDist,
    );
    camera.position.lerp(camDesired.current, Math.min(1, d * 6));
    camTarget.current.set(pos.current.x, pos.current.y + 1.2, pos.current.z);
    camera.lookAt(camTarget.current);

    // zone detection
    let inside: ZoneId | null = null;
    for (const z of ZONES) {
      const dx2 = pos.current.x - z.position[0];
      const dz2 = pos.current.z - z.position[2];
      if (Math.hypot(dx2, dz2) < ZONE_RADIUS) { inside = z.id; break; }
    }
    if (inside !== lastZone.current) {
      lastZone.current = inside;
      onZoneChange(inside);
    }
    if (onInteract.current && inside) {
      onInteract.current = false;
      window.dispatchEvent(new CustomEvent("world:enter", { detail: inside }));
    }
  });

  // mouse-look yaw
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if ((e.buttons & 1) === 0 && !document.pointerLockElement) return;
      yaw.current -= e.movementX * 0.0035;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return <Character groupRef={group} movingRef={moving} />;
}

export function VoxelWorld({
  onZoneChange,
  interactRef,
}: {
  onZoneChange: (z: ZoneId | null) => void;
  interactRef: React.MutableRefObject<boolean>;
}) {
  const keys = useRef<Keys>({ w: false, a: false, s: false, d: false, space: false });

  useEffect(() => {
    const map: Record<string, keyof Keys> = {
      KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d",
      ArrowUp: "w", ArrowLeft: "a", ArrowDown: "s", ArrowRight: "d",
      Space: "space",
    };
    const down = (e: KeyboardEvent) => {
      const k = map[e.code];
      if (k) { keys.current[k] = true; if (e.code === "Space") e.preventDefault(); }
    };
    const up = (e: KeyboardEvent) => { const k = map[e.code]; if (k) keys.current[k] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  return (
    <div className="fixed inset-0 z-0">
      <Canvas shadows camera={{ position: [0, 6, 10], fov: 60 }} dpr={[1, 2]}>
        <color attach="background" args={["#04070a"]} />
        <fog attach="fog" args={["#04070a", 30, 90]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[20, 30, 10]}
          intensity={1.1}
          color="#bfffd9"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />
        <hemisphereLight args={["#00ff88", "#020405", 0.25]} />
        <Suspense fallback={null}>
          <Ground />
          <Buildings />
          <Player keys={keys} onZoneChange={onZoneChange} onInteract={interactRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
