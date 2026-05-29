import { useEffect, useRef, useCallback } from "react";

interface JoystickOutput {
  x: number; // -1 to 1
  y: number; // -1 to 1
}

interface JoystickProps {
  onMove: (output: JoystickOutput) => void;
  onJump: () => void;
  onInteract: () => void;
}

/** Premium cyberpunk virtual joystick + action buttons for touch screens */
export function Joystick({ onMove, onJump, onInteract }: JoystickProps) {
  const stickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (touchIdRef.current !== null) return;
      const touch = e.changedTouches[0];
      touchIdRef.current = touch.identifier;
      activeRef.current = true;
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!activeRef.current) return;
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      let clientX: number | null = null;
      let clientY: number | null = null;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          clientX = e.changedTouches[i].clientX;
          clientY = e.changedTouches[i].clientY;
          break;
        }
      }
      if (clientX === null || clientY === null) return;

      const dx = clientX - cx;
      const dy = clientY - cy;
      const maxR = rect.width / 2 - 18;
      const dist = Math.hypot(dx, dy);
      const clamped = Math.min(dist, maxR);
      const angle = Math.atan2(dy, dx);

      const nx = (Math.cos(angle) * clamped) / maxR;
      const ny = (Math.sin(angle) * clamped) / maxR;

      if (stickRef.current) {
        stickRef.current.style.transform = `translate(calc(-50% + ${Math.cos(angle) * clamped}px), calc(-50% + ${Math.sin(angle) * clamped}px))`;
      }

      onMove({ x: nx, y: ny });
    },
    [onMove],
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchIdRef.current) {
          touchIdRef.current = null;
          activeRef.current = false;
          if (stickRef.current) {
            stickRef.current.style.transform = "translate(-50%, -50%)";
          }
          onMove({ x: 0, y: 0 });
          break;
        }
      }
    },
    [onMove],
  );

  // Prevent page scroll during joystick drag
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (activeRef.current) e.preventDefault();
    };
    document.addEventListener("touchmove", prevent, { passive: false });
    return () => document.removeEventListener("touchmove", prevent);
  }, []);

  return (
    <div className="fixed inset-0 z-25 pointer-events-none select-none">
      {/* ── Left: Joystick ── */}
      <div className="absolute bottom-10 left-8 pointer-events-auto">
        {/* Outer ring */}
        <div
          ref={baseRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: 110,
            height: 110,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,255,136,0.03) 0%, rgba(0,255,136,0.01) 70%, transparent 100%)",
            border: "1px solid rgba(0,255,136,0.18)",
            position: "relative",
            boxShadow: "0 0 12px rgba(0,255,136,0.05), inset 0 0 12px rgba(0,255,136,0.02)",
            backdropFilter: "blur(2px)",
          }}
        >
          {/* Cross guide lines */}
          <div style={{
            position: "absolute", inset: 0, display: "flex",
            alignItems: "center", justifyContent: "center", pointerEvents: "none",
          }}>
            <div style={{ width: "100%", height: 1, background: "rgba(0,255,136,0.08)", position: "absolute" }} />
            <div style={{ width: 1, height: "100%", background: "rgba(0,255,136,0.08)", position: "absolute" }} />
          </div>
          {/* Corner tick marks */}
          {[0, 90, 180, 270].map((deg) => (
            <div
              key={deg}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 6,
                height: 2,
                background: "rgba(0,255,136,0.2)",
                transformOrigin: "left center",
                transform: `rotate(${deg}deg) translateX(40px) translateY(-50%)`,
              }}
            />
          ))}
          {/* Stick knob */}
          <div
            ref={stickRef}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 38,
              height: 38,
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, rgba(0,255,136,0.3) 0%, rgba(0,180,80,0.12) 60%, rgba(0,80,40,0.05) 100%)",
              border: "1px solid rgba(0,255,136,0.45)",
              boxShadow: "0 0 10px rgba(0,255,136,0.2)",
              transition: "box-shadow 0.1s",
              pointerEvents: "none",
            }}
          />
        </div>
        <div style={{
          textAlign: "center",
          fontSize: 9,
          color: "rgba(0,255,136,0.3)",
          fontFamily: "monospace",
          marginTop: 6,
          letterSpacing: "0.12em",
        }}>
          MOVE
        </div>
      </div>

      {/* ── Right: Action buttons ── */}
      <div className="absolute bottom-10 right-8 pointer-events-auto flex flex-col gap-4 items-end">
        {/* JUMP button */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onJump(); }}
          onClick={onJump}
          className="active:scale-95 active:bg-cyan-500/20 active:border-cyan-400 active:text-cyan-200 transition-all duration-100 flex items-center justify-center outline-none select-none"
          style={{
            width: 65,
            height: 65,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.05) 0%, rgba(0,80,120,0.01) 70%)",
            border: "1px solid rgba(0,212,255,0.22)",
            color: "rgba(0,212,255,0.5)",
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: "bold",
            letterSpacing: "0.1em",
            boxShadow: "0 0 8px rgba(0,212,255,0.03)",
            cursor: "pointer",
            touchAction: "none",
            backdropFilter: "blur(2px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: 16 }}>▲</span>
            <span>JUMP</span>
          </div>
        </button>

        {/* ENTER / INTERACT button */}
        <button
          onTouchStart={(e) => { e.preventDefault(); onInteract(); }}
          onClick={onInteract}
          className="active:scale-95 active:bg-rose-500/20 active:border-rose-400 active:text-rose-200 transition-all duration-100 flex items-center justify-center outline-none select-none"
          style={{
            width: 65,
            height: 65,
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 35% 35%, rgba(255,68,119,0.05) 0%, rgba(120,0,50,0.01) 70%)",
            border: "1px solid rgba(255,68,119,0.22)",
            color: "rgba(255,68,119,0.5)",
            fontFamily: "monospace",
            fontSize: 9,
            fontWeight: "bold",
            letterSpacing: "0.1em",
            boxShadow: "0 0 8px rgba(255,68,119,0.03)",
            cursor: "pointer",
            touchAction: "none",
            backdropFilter: "blur(2px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <span style={{ fontSize: 12 }}>⬡</span>
            <span>ENTER</span>
          </div>
        </button>
      </div>
    </div>
  );
}
