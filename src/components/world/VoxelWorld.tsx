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
import { ProjectileManager } from "./Projectiles";
import { InfiniteProps } from "./InfiniteProps";

// World wraps at this boundary — feels infinite but actually loops.
const WRAP = 120;

const SPEED = 7;
const JUMP = 7;
const DOUBLE_JUMP_IMPULSE = 6.5;
const GRAVITY = 18;
const ZONE_RADIUS = 8;

type Keys = {
  w: boolean; a: boolean; s: boolean; d: boolean; space: boolean; shoot: boolean;
};

// ── Player ─────────────────────────────────────────────────────────────────────
// WASD movement: A/D turns the character, W/S moves forward/back.
// Left mouse drag adjusts the camera/aim yaw independently for fine shooting.
function Player({
  keys,
  onZoneChange,
  onInteract,
  playerPos,
  touchJoy,
  onJump,
  shootQueue,
  mouseDragYaw,
}: {
  keys: React.MutableRefObject<Keys>;
  onZoneChange: (z: ZoneId | null) => void;
  onInteract: React.MutableRefObject<boolean>;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  touchJoy: React.MutableRefObject<{ x: number; y: number }>;
  onJump: () => void;
  shootQueue: React.MutableRefObject<{ pos: THREE.Vector3; dir: THREE.Vector3 }[]>;
  mouseDragYaw: React.MutableRefObject<number>;
}) {
  const group = useRef<THREE.Group | null>(null);
  const moving = useRef(false);
  const velY = useRef(0);
  const charYaw = useRef(0);   // character yaw (WASD driven)
  const camYaw = useRef(0);    // camera follows char yaw + mouse drag offset
  const pos = useRef(new THREE.Vector3(0, 0, 0));
  const camTarget = useRef(new THREE.Vector3());
  const camDesired = useRef(new THREE.Vector3());
  const lastZone = useRef<ZoneId | null>(null);
  const jumpsLeft = useRef(2);
  const wasSpace = useRef(false);
  const wasShoot = useRef(false);
  const walkTime = useRef(0);
  const shootCooldown = useRef(0);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);

    // ── WASD input: A/D turns the character, W/S moves forward/back ──
    let inputForward = 0;
    let inputTurn = 0;
    if (keys.current.w) inputForward += 1;
    if (keys.current.s) inputForward -= 1;
    if (keys.current.a) inputTurn -= 1;
    if (keys.current.d) inputTurn += 1;

    // Touch joystick
    if (touchJoy.current.x !== 0 || touchJoy.current.y !== 0) {
      inputForward = touchJoy.current.y;
      inputTurn = touchJoy.current.x;
    }

    const isMoving = Math.abs(inputForward) > 0.01 || Math.abs(inputTurn) > 0.01;
    moving.current = isMoving;

    // Turn character with A/D
    const turnRate = isMoving ? 2.8 : 1.8;
    if (Math.abs(inputTurn) > 0.01) {
      charYaw.current -= inputTurn * turnRate * d;
    }

    // Move in the direction the character is facing
    if (Math.abs(inputForward) > 0.01) {
      pos.current.x += Math.sin(charYaw.current) * inputForward * SPEED * d;
      pos.current.z += Math.cos(charYaw.current) * inputForward * SPEED * d;
      walkTime.current += d * 9;
    }

    if (group.current) group.current.rotation.y = charYaw.current;

    // ── Jump / double-jump ──
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
        } else {
          velY.current = DOUBLE_JUMP_IMPULSE;
          jumpsLeft.current--;
          audio.doubleJump();
          window.dispatchEvent(new CustomEvent("game:doublejump"));
        }
      }
    } else {
      wasSpace.current = false;
    }

    // ── Shoot — direction uses mouse-aim yaw ──
    shootCooldown.current = Math.max(0, shootCooldown.current - d);
    if (keys.current.shoot && !wasShoot.current && shootCooldown.current <= 0) {
      wasShoot.current = true;
      shootCooldown.current = 0.18;

      // Shoot in the combined aim direction (charYaw + mouse drag offset)
      const aimYaw = charYaw.current + mouseDragYaw.current;
      const dir = new THREE.Vector3(
        Math.sin(aimYaw), 0.04, Math.cos(aimYaw)
      ).normalize();
      const sPos = new THREE.Vector3(
        pos.current.x + dir.x * 1.5,
        pos.current.y + 1.5,
        pos.current.z + dir.z * 1.5,
      );
      shootQueue.current.push({ pos: sPos, dir });
    } else if (!keys.current.shoot) {
      wasShoot.current = false;
    }

    // ── Gravity ──
    velY.current -= GRAVITY * d;
    pos.current.y += velY.current * d;
    if (pos.current.y < 0) { pos.current.y = 0; velY.current = 0; }

    // ── World wrapping ──
    if (pos.current.x > WRAP) pos.current.x -= WRAP * 2;
    if (pos.current.x < -WRAP) pos.current.x += WRAP * 2;
    if (pos.current.z > WRAP) pos.current.z -= WRAP * 2;
    if (pos.current.z < -WRAP) pos.current.z += WRAP * 2;

    if (group.current) group.current.position.copy(pos.current);
    playerPos.current.copy(pos.current);

    // ── Camera: auto-follow behind character, offset by mouse drag yaw ──
    // Mouse drag yaw shifts the camera around the player for aiming;
    // the character's WASD movement is unaffected.
    const totalCamYaw = charYaw.current + mouseDragYaw.current;
    let yawDiff = totalCamYaw - camYaw.current;
    yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
    camYaw.current += yawDiff * Math.min(1, d * (isMoving ? 6 : 4));

    const bobY = moving.current ? Math.sin(walkTime.current) * 0.06 : 0;
    const bobX = moving.current ? Math.cos(walkTime.current * 0.5) * 0.03 : 0;
    // Camera sits behind the player relative to the camera yaw direction.
    camDesired.current.set(
      pos.current.x - Math.sin(camYaw.current) * 10 + bobX,
      pos.current.y + 5.5 + bobY,
      pos.current.z - Math.cos(camYaw.current) * 10,
    );
    camera.position.lerp(camDesired.current, Math.min(1, d * 8));

    // Look slightly ahead in the aim direction
    const aimYaw2 = charYaw.current + mouseDragYaw.current;
    camTarget.current.set(
      pos.current.x + Math.sin(aimYaw2) * 2,
      pos.current.y + 1.4,
      pos.current.z + Math.cos(aimYaw2) * 2,
    );
    camera.lookAt(camTarget.current);

    // ── Zone detection ──
    let inside: ZoneId | null = null;
    for (const z of ZONES) {
      const dx2 = pos.current.x - z.position[0];
      const dz2 = pos.current.z - z.position[2];
      if (Math.hypot(dx2, dz2) < ZONE_RADIUS) { inside = z.id; break; }
    }
    if (inside !== lastZone.current) { lastZone.current = inside; onZoneChange(inside); }
    if (onInteract.current && inside) {
      onInteract.current = false;
      audio.zoneEnter();
      window.dispatchEvent(new CustomEvent("world:enter", { detail: inside }));
    }
  });

  return <Character groupRef={group} movingRef={moving} />;
}

// ── VoxelWorld ─────────────────────────────────────────────────────────────────
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
  const keys = useRef<Keys>({ w: false, a: false, s: false, d: false, space: false, shoot: false });
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const touchJoy = useRef({ x: 0, y: 0 });
  const shootQueue = useRef<{ pos: THREE.Vector3; dir: THREE.Vector3 }[]>([]);

  // Mouse drag state — left mouse button drag rotates camera/aim yaw
  // Right mouse button and WASD are NOT affected.
  const mouseDragYaw = useRef(0);        // accumulated yaw offset from mouse drag
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);

  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(navigator.maxTouchPoints > 0 || "ontouchstart" in window);
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    const map: Record<string, keyof Keys> = {
      KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d",
      ArrowUp: "w", ArrowLeft: "a", ArrowDown: "s", ArrowRight: "d",
      Space: "space",
    };
    const down = (e: KeyboardEvent) => {
      const k = map[e.code];
      if (k) { keys.current[k] = true; if (e.code === "Space") e.preventDefault(); }
      if (e.code === "KeyF" || e.code === "KeyE") keys.current.shoot = true;
    };
    const up = (e: KeyboardEvent) => {
      const k = map[e.code]; if (k) keys.current[k] = false;
      if (e.code === "KeyF" || e.code === "KeyE") keys.current.shoot = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ── Mouse left-drag → aim yaw adjustment ──
  // Only left mouse button drag adjusts the view. Right click is untouched.
  // Left click (no drag) fires a shot.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = false; // start assuming click, not drag
        lastMouseX.current = e.clientX;
        // Will fire shoot on mouseup if no drag happened
        keys.current.shoot = true;
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons !== 1) return; // only when left button held
      const dx = e.clientX - lastMouseX.current;
      lastMouseX.current = e.clientX;
      if (Math.abs(dx) > 2) {
        isDragging.current = true;
        keys.current.shoot = false; // dragging, not shooting
      }
      // Sensitivity: 0.003 radians per pixel
      mouseDragYaw.current -= dx * 0.003;
      // Clamp drag to ±2.5 radians so it's always possible to turn back
      mouseDragYaw.current = Math.max(-2.5, Math.min(2.5, mouseDragYaw.current));
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        if (!isDragging.current) {
          // It was a click — fire a shot
          keys.current.shoot = true;
          setTimeout(() => { keys.current.shoot = false; }, 80);
        } else {
          keys.current.shoot = false;
        }
        isDragging.current = false;
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ── Quest: zone visit ──
  useEffect(() => {
    const handler = (e: Event) => {
      const id = (e as CustomEvent<ZoneId>).detail;
      const questMap: Record<ZoneId, import("@/lib/gameStore").QuestId> = {
        about: "visit_about", projects: "visit_projects",
        skills: "visit_skills", contact: "visit_contact",
      };
      const result = gameStore.completeQuest(questMap[id]);
      if (result.levelUp) onLevelUp(result.newLevel);
    };
    window.addEventListener("world:enter", handler as EventListener);
    return () => window.removeEventListener("world:enter", handler as EventListener);
  }, [onLevelUp]);

  // ── Shard level-up ──
  useEffect(() => {
    const handler = () => {
      const result = gameStore.addXp(0);
      if (result.levelUp) onLevelUp(result.newLevel);
      gameStore.tryFinishSpeedrun();
    };
    window.addEventListener("game:shard", handler);
    return () => window.removeEventListener("game:shard", handler);
  }, [onLevelUp]);

  const handleJoyMove = useCallback((out: { x: number; y: number }) => { touchJoy.current = out; }, []);
  const handleTouchJump = useCallback(() => {
    keys.current.space = true;
    setTimeout(() => { keys.current.space = false; }, 120);
  }, []);
  const handleTouchInteract = useCallback(() => { interactRef.current = true; }, [interactRef]);

  return (
    <>
      <div className="fixed inset-0 z-0" style={{ cursor: "crosshair" }}>
        <Canvas shadows camera={{ position: [0, 6, 10], fov: 60 }} dpr={[1, 2]}>
          <color attach="background" args={["#04070a"]} />
          <fog attach="fog" args={["#0c1a14", 60, 200]} />
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[20, 30, 10]} intensity={1.1} color="#bfffd9" castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-60} shadow-camera-right={60}
            shadow-camera-top={60} shadow-camera-bottom={-60}
          />
          <hemisphereLight args={["#00ff88", "#020405", 0.25]} />
          <Suspense fallback={null}>
            <Ground playerPos={playerPos} />
            <Buildings />
            <InfiniteProps playerPos={playerPos} />
            <Shards playerPos={playerPos} />
            <ProjectileManager shootQueue={shootQueue} />
            <Player
              keys={keys}
              onZoneChange={onZoneChange}
              onInteract={interactRef}
              playerPos={playerPos}
              touchJoy={touchJoy}
              onJump={() => {}}
              shootQueue={shootQueue}
              mouseDragYaw={mouseDragYaw}
            />
          </Suspense>
        </Canvas>

        {/* Controls hint */}
        {!isTouch && booted && !cliOpen && !isPanelOpen && !levelUpActive && (
          <div style={{
            position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)",
            pointerEvents: "none", zIndex: 5,
          }}>
            <div style={{
              fontSize: 10, fontFamily: "monospace", color: "rgba(0,255,136,0.35)",
              letterSpacing: "0.15em", textAlign: "center", padding: "6px 16px",
              border: "1px solid rgba(0,255,136,0.08)", background: "rgba(4,7,10,0.6)",
              backdropFilter: "blur(4px)", userSelect: "none",
            }}>
              WASD · MOVE &nbsp;|&nbsp; DRAG · AIM &nbsp;|&nbsp; CLICK / F · SHOOT &nbsp;|&nbsp; SPACE · JUMP
            </div>
          </div>
        )}

        {/* Crosshair */}
        {!isTouch && (
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)", pointerEvents: "none", zIndex: 5,
          }}>
            {/* Outer ring */}
            <div style={{
              width: 24, height: 24, border: "1.5px solid rgba(0,255,136,0.7)",
              borderRadius: "50%", position: "relative",
            }}>
              {/* Center dot */}
              <div style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                width: 3, height: 3, background: "#00ff88", borderRadius: "50%",
              }} />
              {/* Cross hairs */}
              <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(0,255,136,0.5)", transform: "translateY(-50%)" }} />
              <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(0,255,136,0.5)", transform: "translateX(-50%)" }} />
            </div>
          </div>
        )}
      </div>

      {isTouch && (
        <Joystick onMove={handleJoyMove} onJump={handleTouchJump} onInteract={handleTouchInteract} />
      )}
    </>
  );
}
