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
  mouseDragPitch,
}: {
  keys: React.MutableRefObject<Keys>;
  onZoneChange: (z: ZoneId | null) => void;
  onInteract: React.MutableRefObject<boolean>;
  playerPos: React.MutableRefObject<THREE.Vector3>;
  touchJoy: React.MutableRefObject<{ x: number; y: number }>;
  onJump: () => void;
  shootQueue: React.MutableRefObject<{ pos: THREE.Vector3; dir: THREE.Vector3 }[]>;
  mouseDragYaw: React.MutableRefObject<number>;
  mouseDragPitch: React.MutableRefObject<number>;
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
  const { camera, scene } = useThree();

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
      inputForward = -touchJoy.current.y;
      inputTurn = touchJoy.current.x;
    }

    const isMoving = Math.abs(inputForward) > 0.01 || Math.abs(inputTurn) > 0.01;
    moving.current = isMoving;

    if (isMoving) {
      // Smoothly rotate the character body to align with the camera look direction (view aim) when moving
      const easeSpeed = Math.min(1, d * 5.0); // snappy lerp speed
      charYaw.current += mouseDragYaw.current * easeSpeed;
      mouseDragYaw.current -= mouseDragYaw.current * easeSpeed;
      mouseDragPitch.current += (0 - mouseDragPitch.current) * easeSpeed;
    }

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

    // ── Player Collision Detection with World Objects ──
    // 1. Portfolio Buildings / Towers
    const TOWER_COLLISION_RADIUS = 4.8;
    for (const z of ZONES) {
      const dx = pos.current.x - z.position[0];
      const dz = pos.current.z - z.position[2];
      const dist = Math.hypot(dx, dz);
      if (dist < TOWER_COLLISION_RADIUS) {
        // Push character out along collision normal
        const pushX = dx / dist;
        const pushZ = dz / dist;
        pos.current.x = z.position[0] + pushX * TOWER_COLLISION_RADIUS;
        pos.current.z = z.position[2] + pushZ * TOWER_COLLISION_RADIUS;
      }
    }

    // 2. Procedural infinite Props (Trees, Rocks)
    const pcx = Math.round(pos.current.x / 16); // CELL_SIZE = 16
    const pcz = Math.round(pos.current.z / 16);
    
    // Check 3x3 surrounding cells relative to player cell
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const cx = pcx + dx;
        const cz = pcz + dz;
        
        // Seeded random helper matching InfiniteProps
        const cellRng = (cx: number, cz: number, seed: number) => {
          const h = Math.sin(cx * 127.1 + cz * 311.7 + seed * 74.3) * 43758.5453;
          return h - Math.floor(h);
        };
        
        const buildingExclude = [[-38, -55], [62, -34], [44, 58], [-58, 38]];
        
        const offsetX = (cellRng(cx, cz, 0) - 0.5) * 16 * 0.55;
        const offsetZ = (cellRng(cx, cz, 1) - 0.5) * 16 * 0.55;
        const wx = cx * 16 + offsetX;
        const wz = cz * 16 + offsetZ;
        
        // Skip building zones
        const ok = buildingExclude.every(([ex, ez]) => Math.hypot(wx - ex, wz - ez) > 14);
        if (!ok) continue;

        // Tree trunk / Rock collision check
        const dist = Math.hypot(pos.current.x - wx, pos.current.z - wz);
        const PROP_COLLISION_RADIUS = 0.9; // trunk size
        
        if (dist < PROP_COLLISION_RADIUS) {
          // Push player out along collision normal
          const pushX = (pos.current.x - wx) / dist;
          const pushZ = (pos.current.z - wz) / dist;
          pos.current.x = wx + pushX * PROP_COLLISION_RADIUS;
          pos.current.z = wz + pushZ * PROP_COLLISION_RADIUS;
        }
      }
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

    // ── Shoot — direction matches exact crosshair target raycast ──
    shootCooldown.current = Math.max(0, shootCooldown.current - d);
    if (keys.current.shoot && !wasShoot.current && shootCooldown.current <= 0) {
      wasShoot.current = true;
      shootCooldown.current = 0.18;

      // Automatically snap character body facing direction to target aim immediately on firing!
      const aimYaw = charYaw.current + mouseDragYaw.current;
      charYaw.current = aimYaw;
      mouseDragYaw.current = 0; // reset camera drag offset since body turned to match
      if (group.current) {
        group.current.rotation.y = charYaw.current;
      }

      // Gun muzzle starting position (left arm blaster tip mirrored higher at shoulder level)
      const sPos = new THREE.Vector3();
      if (group.current) {
        // Blaster group position relative to player group is now on the left shoulder level: [-0.5, 1.45, 0.68]
        sPos.set(-0.5, 1.45, 0.68).applyMatrix4(group.current.matrixWorld);
      } else {
        sPos.set(
          pos.current.x - Math.sin(aimYaw) * 0.5,
          pos.current.y + 1.5,
          pos.current.z - Math.cos(aimYaw) * 0.5
        );
      }

      // Raycast from camera center (crosshair) to find 3D hit point
      const raycaster = new THREE.Raycaster();
      camera.updateMatrix();
      camera.updateMatrixWorld(true); // Force up-to-date matrix values
      raycaster.set(camera.position, camera.getWorldDirection(new THREE.Vector3()));
      
      const intersects = raycaster.intersectObjects(scene.children, true);
      let targetPoint = new THREE.Vector3();
      let found = false;
      const playerGroup = group.current;

      for (const hit of intersects) {
        // Exclude player meshes and other bullet/particles
        let isPlayerOrFX = false;
        let p: THREE.Object3D | null = hit.object;
        while (p) {
          if (p === playerGroup || p.name === "bullet" || p.name === "particle") {
            isPlayerOrFX = true;
            break;
          }
          p = p.parent;
        }
        if (!isPlayerOrFX) {
          targetPoint.copy(hit.point);
          found = true;
          break;
        }
      }

      if (!found) {
        // Fallback: 80 units along camera direction
        targetPoint.copy(camera.position).add(
          camera.getWorldDirection(new THREE.Vector3()).multiplyScalar(80)
        );
      }

      // Calculate normalized direction vector from blaster muzzle to the raycast target!
      const dir = new THREE.Vector3().subVectors(targetPoint, sPos).normalize();
      
      // Shift bullet starting point forward cleanly along dir so it fires cleanly from tip
      sPos.add(dir.clone().multiplyScalar(0.65));

      shootQueue.current.push({ pos: sPos, dir });
      audio.shoot();
      window.dispatchEvent(new CustomEvent("game:shoot"));
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

    // ── Camera: Dynamic third-person look view (Yaw & Pitch coordinated tracking) ──
    const totalCamYaw = charYaw.current + mouseDragYaw.current;
    let yawDiff = totalCamYaw - camYaw.current;
    yawDiff = Math.atan2(Math.sin(yawDiff), Math.cos(yawDiff));
    camYaw.current += yawDiff * Math.min(1, d * (isMoving ? 6 : 4));

    const bobY = moving.current ? Math.sin(walkTime.current) * 0.06 : 0;
    const bobX = moving.current ? Math.cos(walkTime.current * 0.5) * 0.03 : 0;

    const yaw = camYaw.current;
    const pitch = mouseDragPitch.current; // vertical aim pitch (-0.6 to 0.8)

    // Camera sits behind the player, orbiting horizontally
    const camX = pos.current.x - Math.sin(yaw) * 10.0 + bobX;
    const camZ = pos.current.z - Math.cos(yaw) * 10.0;
    // Camera height shifts slightly with pitch to frame the player beautifully without clipping ground
    const camY = pos.current.y + 4.0 - pitch * 3.5 + bobY;

    camDesired.current.set(camX, camY, camZ);
    camera.position.lerp(camDesired.current, Math.min(1, d * 8));

    // Target look-at is positioned based on horizontal aim and vertical look pitch
    const aimYaw2 = charYaw.current + mouseDragYaw.current;
    camTarget.current.set(
      pos.current.x + Math.sin(aimYaw2) * 2,
      pos.current.y + 2.0 + pitch * 5.0, // elevates target when looking up, lowers when looking down
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

  // Mouse drag state — left mouse button drag rotates camera/aim yaw & pitch
  // Right mouse button and WASD are NOT affected.
  const mouseDragYaw = useRef(0);        // accumulated yaw offset from mouse drag
  const mouseDragPitch = useRef(0);      // vertical look tilt
  const isDragging = useRef(false);
  const lastMouseX = useRef(0);
  const lastMouseY = useRef(0);

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

  // ── Mouse left-drag → aim yaw & pitch adjustment ──
  // Only left mouse button drag adjusts the view. Right click is untouched.
  // Left click (no drag) fires a shot.
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDragging.current = false; // start assuming click, not drag
        lastMouseX.current = e.clientX;
        lastMouseY.current = e.clientY;
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (e.buttons !== 1) return; // only when left button held
      const dx = e.clientX - lastMouseX.current;
      const dy = e.clientY - lastMouseY.current;
      lastMouseX.current = e.clientX;
      lastMouseY.current = e.clientY;
      if (Math.abs(dx) > 1.5 || Math.abs(dy) > 1.5) {
        isDragging.current = true;
      }
      // Snappier look/aim sensitivity (increased to 0.015)
      mouseDragYaw.current -= dx * 0.015;
      mouseDragPitch.current -= dy * 0.015; // standard non-inverted vertical look (up looks up)
      
      // Clamp vertical look to safe ranges
      mouseDragPitch.current = Math.max(-0.6, Math.min(0.8, mouseDragPitch.current));
      // Clamp horizontal drag to ±2.5 radians so it's always possible to turn back
      mouseDragYaw.current = Math.max(-2.5, Math.min(2.5, mouseDragYaw.current));
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        if (!isDragging.current) {
          // It was a clean click without dragging — fire a shot
          keys.current.shoot = true;
          setTimeout(() => { keys.current.shoot = false; }, 80);
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
              mouseDragPitch={mouseDragPitch}
            />
          </Suspense>
        </Canvas>



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
