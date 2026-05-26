import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Character } from "./Character";
import { Buildings, ZONES, type ZoneId } from "./Buildings";
import { Ground } from "./Ground";
import { Shards } from "./Shards";
import { Joystick } from "./Joystick";
import { gameStore } from "@/lib/gameStore";
import { audio } from "@/lib/audio";

const SPEED = 6;
const JUMP = 7;
const DOUBLE_JUMP_IMPULSE = 6.5;
const GRAVITY = 18;
const ZONE_RADIUS = 6;

type Keys = {
  w: boolean; a: boolean; s: boolean; d: boolean; space: boolean;
};

// ── Player ─────────────────────────────────────────────────────────────────────
function Player({
  keys,
  onZoneChange,
  onInteract,
  playerPos,
  touchJoy,
  onJump,
}: {
  keys: React.MutableRefObject<Keys>;
  onZoneChange: (z: ZoneId | null) => void;
  onInteract: React.MutableRefObject<boolean>;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  touchJoy: React.MutableRefObject<{ x: number; y: number }>;
  onJump: () => void;
}) {
  const group = useRef<THREE.Group | null>(null);
  const moving = useRef(false);
  const velY = useRef(0);
  const yaw = useRef(0);
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const camTarget = useRef(new THREE.Vector3());
  const camDesired = useRef(new THREE.Vector3());
  const lastZone = useRef<ZoneId | null>(null);
  const jumpsLeft = useRef(2); // double jump counter
  const wasSpace = useRef(false);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);

    // ── Input: keyboard + touch joystick ──
    let dx = 0, dz = 0;
    if (keys.current.w) dz -= 1;
    if (keys.current.s) dz += 1;
    if (keys.current.a) dx -= 1;
    if (keys.current.d) dx += 1;

    // Touch joystick override/blend
    if (touchJoy.current.x !== 0 || touchJoy.current.y !== 0) {
      dx = touchJoy.current.x;
      dz = touchJoy.current.y;
    }

    const len = Math.hypot(dx, dz);
    moving.current = len > 0;

    if (len > 0) {
      dx /= len; dz /= len;
      const cy = Math.cos(yaw.current);
      const sy = Math.sin(yaw.current);
      const mx = dx * cy - dz * sy;
      const mz = dx * sy + dz * cy;
      pos.current.x += mx * SPEED * d;
      pos.current.z += mz * SPEED * d;
      const targetYaw = Math.atan2(mx, mz);
      if (group.current) {
        let cur = group.current.rotation.y;
        let diff = targetYaw - cur;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        group.current.rotation.y = cur + diff * Math.min(1, d * 12);
      }
    }

    // ── Jump / gravity with double jump ──
    const onGround = pos.current.y <= 0.001;
    if (onGround) jumpsLeft.current = 2;

    if (keys.current.space) {
      if (!wasSpace.current && jumpsLeft.current > 0) {
        wasSpace.current = true;
        if (onGround) {
          velY.current = JUMP;
          jumpsLeft.current--;
          audio.jump();
          // First jump quest
          gameStore.completeQuest("first_jump");
          onJump();
        } else if (jumpsLeft.current > 0) {
          velY.current = DOUBLE_JUMP_IMPULSE;
          jumpsLeft.current--;
          audio.doubleJump();
          window.dispatchEvent(new CustomEvent("game:doublejump"));
        }
      }
    } else {
      wasSpace.current = false;
    }

    velY.current -= GRAVITY * d;
    pos.current.y += velY.current * d;
    if (pos.current.y < 0) { pos.current.y = 0; velY.current = 0; }

    // ── World clamp ──
    pos.current.x = THREE.MathUtils.clamp(pos.current.x, -52, 52);
    pos.current.z = THREE.MathUtils.clamp(pos.current.z, -52, 52);

    if (group.current) group.current.position.copy(pos.current);
    playerPos.current.copy(pos.current);

    // ── Camera (3rd-person follow) ──
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

    // ── Zone detection ──
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
      audio.zoneEnter();
      window.dispatchEvent(new CustomEvent("world:enter", { detail: inside }));
    }
  });

  // ── Mouse look (pointer lock & drag) ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (document.pointerLockElement) {
        yaw.current -= e.movementX * 0.0035;
      } else if ((e.buttons & 1) !== 0) {
        yaw.current -= e.movementX * 0.0035;
      }
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return <Character groupRef={group} movingRef={moving} />;
}

// ── VoxelWorld (main export) ──────────────────────────────────────────────────
export function VoxelWorld({
  onZoneChange,
  interactRef,
  onLevelUp,
  booted = true,
  cliOpen = false,
  isPanelOpen = false,
  levelUpActive = false,
}: {
  onZoneChange: (z: ZoneId | null) => void;
  interactRef: React.MutableRefObject<boolean>;
  onLevelUp: (level: number) => void;
  booted?: boolean;
  cliOpen?: boolean;
  isPanelOpen?: boolean;
  levelUpActive?: boolean;
}) {
  const keys = useRef<Keys>({ w: false, a: false, s: false, d: false, space: false });
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const touchJoy = useRef({ x: 0, y: 0 });
  const [isTouch, setIsTouch] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  // Detect touch device
  useEffect(() => {
    const check = () => setIsTouch(navigator.maxTouchPoints > 0 || "ontouchstart" in window);
    check();
  }, []);

  // ── Keyboard handling ──
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

  // ── Pointer lock ──
  useEffect(() => {
    const onChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener("pointerlockchange", onChange);
    return () => document.removeEventListener("pointerlockchange", onChange);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (!document.pointerLockElement && canvasWrapRef.current) {
      canvasWrapRef.current.requestPointerLock();
    }
  }, []);

  // ── Quest: zone visit ──
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<ZoneId>).detail;
      const questMap: Record<ZoneId, import("@/lib/gameStore").QuestId> = {
        about:    "visit_about",
        projects: "visit_projects",
        skills:   "visit_skills",
        contact:  "visit_contact",
      };
      const result = gameStore.completeQuest(questMap[id]);
      if (result.levelUp) onLevelUp(result.newLevel);
    };
    window.addEventListener("world:enter", handler as EventListener);
    return () => window.removeEventListener("world:enter", handler as EventListener);
  }, [onLevelUp]);

  // ── Shard collection level-up check ──
  useEffect(() => {
    const handler = () => {
      const gs = gameStore.get();
      const lvl = gs.level;
      const result = gameStore.addXp(0); // re-evaluate
      if (result.levelUp) onLevelUp(result.newLevel);
      gameStore.tryFinishSpeedrun();
    };
    window.addEventListener("game:shard", handler);
    return () => window.removeEventListener("game:shard", handler);
  }, [onLevelUp]);

  // ── Touch joystick callbacks ──
  const handleJoyMove = useCallback((out: { x: number; y: number }) => {
    touchJoy.current = out;
  }, []);

  const handleTouchJump = useCallback(() => {
    keys.current.space = true;
    setTimeout(() => { keys.current.space = false; }, 120);
  }, []);

  const handleTouchInteract = useCallback(() => {
    interactRef.current = true;
  }, [interactRef]);

  const handleJump = useCallback(() => {
    // called by Player after a jump
  }, []);

  return (
    <>
      <div ref={canvasWrapRef} className="fixed inset-0 z-0" onClick={handleCanvasClick}>
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
            <Shards playerPos={playerPos} />
            <Player
              keys={keys}
              onZoneChange={onZoneChange}
              onInteract={interactRef}
              playerPos={playerPos}
              touchJoy={touchJoy}
              onJump={handleJump}
            />
          </Suspense>
        </Canvas>

        {/* Pointer Lock indicator */}
        {!isLocked && !isTouch && booted && !cliOpen && !isPanelOpen && !levelUpActive && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: "rgba(0,255,136,0.35)",
                letterSpacing: "0.2em",
                textAlign: "center",
                padding: "10px 20px",
                border: "1px solid rgba(0,255,136,0.12)",
                background: "rgba(4,7,10,0.6)",
                backdropFilter: "blur(4px)",
                userSelect: "none",
                animation: "pulse 2.5s ease-in-out infinite",
              }}
            >
              CLICK TO ENGAGE HEADS-UP VIEW
              <br />
              <span style={{ opacity: 0.5 }}>ESC to release mouse</span>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Joystick (touch only) */}
      {isTouch && (
        <Joystick
          onMove={handleJoyMove}
          onJump={handleTouchJump}
          onInteract={handleTouchInteract}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </>
  );
}
