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
// Character-relative movement: WASD moves relative to where the character faces.
// Camera is always locked behind the character. Drag rotates the character.
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
  const charYaw = useRef(0);        // character facing direction (radians)
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const camTarget = useRef(new THREE.Vector3());
  const camDesired = useRef(new THREE.Vector3());
  const lastZone = useRef<ZoneId | null>(null);
  const jumpsLeft = useRef(2);
  const wasSpace = useRef(false);
  const walkTime = useRef(0);       // for camera bob
  const { camera } = useThree();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);

    // ── Input: keyboard + touch joystick ──
    // inputZ: +1 = forward (W), -1 = backward (S) relative to character
    // inputX: +1 = strafe right (D), -1 = strafe left (A) relative to character
    let inputX = 0, inputZ = 0;
    if (keys.current.w) inputZ += 1;   // forward
    if (keys.current.s) inputZ -= 1;   // backward
    if (keys.current.a) inputX -= 1;   // strafe left
    if (keys.current.d) inputX += 1;   // strafe right

    // Touch joystick: x = left/right, y = forward/back
    if (touchJoy.current.x !== 0 || touchJoy.current.y !== 0) {
      inputX = touchJoy.current.x;
      inputZ = touchJoy.current.y;
    }

    const inputLen = Math.hypot(inputX, inputZ);
    moving.current = inputLen > 0.01;

    if (moving.current) {
      // Normalize input
      const nx = inputX / inputLen;
      const nz = inputZ / inputLen;

      // Compute forward and right vectors from character yaw
      const fwdX = Math.sin(charYaw.current);
      const fwdZ = Math.cos(charYaw.current);
      const rightX = Math.cos(charYaw.current);
      const rightZ = -Math.sin(charYaw.current);

      // World-space movement = forward * inputZ + right * inputX
      const worldMoveX = fwdX * nz + rightX * nx;
      const worldMoveZ = fwdZ * nz + rightZ * nx;

      pos.current.x += worldMoveX * SPEED * d;
      pos.current.z += worldMoveZ * SPEED * d;

      // Update walk time for camera bob
      walkTime.current += d * 9;
    }

    // Character model always faces the charYaw direction
    if (group.current) {
      group.current.rotation.y = charYaw.current;
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

    // ── Camera (3rd-person, always behind character) ──
    const camDist = 10;
    const camHeight = 5.5;
    // Camera bob when walking
    const bobY = moving.current ? Math.sin(walkTime.current) * 0.06 : 0;
    const bobX = moving.current ? Math.cos(walkTime.current * 0.5) * 0.03 : 0;

    // Camera is positioned BEHIND the character (opposite of forward direction)
    camDesired.current.set(
      pos.current.x - Math.sin(charYaw.current) * camDist + bobX,
      pos.current.y + camHeight + bobY,
      pos.current.z - Math.cos(charYaw.current) * camDist,
    );
    camera.position.lerp(camDesired.current, Math.min(1, d * 5));

    // Look at character's head height
    camTarget.current.set(pos.current.x, pos.current.y + 1.4, pos.current.z);
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

  // ── Mouse drag → rotate character yaw ──
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      // Only rotate when dragging (left mouse button held)
      if ((e.buttons & 1) !== 0) {
        charYaw.current -= e.movementX * 0.005;
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
      <div ref={canvasWrapRef} className="fixed inset-0 z-0" style={{ cursor: 'grab' }} onMouseDown={(e) => { (e.currentTarget as HTMLDivElement).style.cursor = 'grabbing'; }} onMouseUp={(e) => { (e.currentTarget as HTMLDivElement).style.cursor = 'grab'; }}>
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

        {/* Drag hint */}
        {!isTouch && booted && !cliOpen && !isPanelOpen && !levelUpActive && (
          <div
            style={{
              position: "absolute",
              bottom: 16,
              left: "50%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: "rgba(0,255,136,0.3)",
                letterSpacing: "0.15em",
                textAlign: "center",
                padding: "6px 16px",
                border: "1px solid rgba(0,255,136,0.08)",
                background: "rgba(4,7,10,0.5)",
                backdropFilter: "blur(4px)",
                userSelect: "none",
              }}
            >
              WASD / ARROWS TO MOVE · DRAG TO LOOK
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
    </>
  );
}
