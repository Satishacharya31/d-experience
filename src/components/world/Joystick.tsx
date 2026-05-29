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

/** Apply dead-zone + quadratic curve to a raw -1..1 axis value */
function applyDeadzone(raw: number, dead = 0.12): number {
  const sign = raw >= 0 ? 1 : -1;
  const abs = Math.abs(raw);
  if (abs < dead) return 0;
  // Rescale to 0..1 outside dead-zone, then square for smoother feel
  const rescaled = (abs - dead) / (1 - dead);
  return sign * rescaled * rescaled;
}

/** Premium cyberpunk virtual joystick + action buttons for touch screens */
export function Joystick({ onMove, onJump, onInteract }: JoystickProps) {
  const stickRef = useRef<HTMLDivElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const activeRef = useRef(false);

  // Right-side drag for camera look
  const rightTouchIdRef = useRef<number | null>(null);
  const rightLastXRef = useRef(0);
  const rightLastYRef = useRef(0);

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

      // Raw normalized values
      const rawX = (Math.cos(angle) * clamped) / maxR;
      const rawY = (Math.sin(angle) * clamped) / maxR;

      // Apply dead-zone + curve for even feel
      const nx = applyDeadzone(rawX);
      const ny = applyDeadzone(rawY);

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

  // Right-half screen touch → camera drag
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        // Only track touches on right 55% of screen (and not already joystick)
        if (t.clientX > window.innerWidth * 0.45 && rightTouchIdRef.current === null) {
          rightTouchIdRef.current = t.identifier;
          rightLastXRef.current = t.clientX;
          rightLastYRef.current = t.clientY;
        }
      }
    };
    const onMove = (e: TouchEvent) => {
      if (rightTouchIdRef.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === rightTouchIdRef.current) {
          const dx = t.clientX - rightLastXRef.current;
          const dy = t.clientY - rightLastYRef.current;
          rightLastXRef.current = t.clientX;
          rightLastYRef.current = t.clientY;
          // Dispatch as a synthetic camera drag event
          window.dispatchEvent(new CustomEvent("touch:cameradrag", {
            detail: { dx, dy }
          }));
          break;
        }
      }
    };
    const onEnd = (e: TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === rightTouchIdRef.current) {
          rightTouchIdRef.current = null;
          break;
        }
      }
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --joy-base: min(18vw, 120px);
          --joy-knob: min(7vw, 44px);
          --joy-btn:  min(14vw, 72px);
          --joy-pad:  max(12px, 2vw);
          --joy-gap:  max(8px, 1.5vw);
        }
      `}</style>

      <div className="fixed inset-0 z-25 pointer-events-none select-none">
        {/* ── Left: Joystick ── */}
        <div
          className="absolute pointer-events-auto"
          style={{ bottom: "var(--joy-pad)", left: "var(--joy-pad)" }}
        >
          {/* Outer ring */}
          <div
            ref={baseRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              width: "var(--joy-base)",
              height: "var(--joy-base)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(0,255,136,0.05) 0%, rgba(0,255,136,0.01) 70%, transparent 100%)",
              border: "1.5px solid rgba(0,255,136,0.25)",
              position: "relative",
              boxShadow: "0 0 16px rgba(0,255,136,0.08), inset 0 0 12px rgba(0,255,136,0.03)",
              backdropFilter: "blur(2px)",
            }}
          >
            {/* Cross guide lines */}
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}>
              <div style={{ width: "100%", height: 1, background: "rgba(0,255,136,0.1)", position: "absolute" }} />
              <div style={{ width: 1, height: "100%", background: "rgba(0,255,136,0.1)", position: "absolute" }} />
            </div>
            {/* Corner tick marks */}
            {[0, 90, 180, 270].map((deg) => (
              <div
                key={deg}
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  width: 7,
                  height: 2,
                  background: "rgba(0,255,136,0.25)",
                  transformOrigin: "left center",
                  transform: `rotate(${deg}deg) translateX(calc(var(--joy-base) / 2.75)) translateY(-50%)`,
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
                width: "var(--joy-knob)",
                height: "var(--joy-knob)",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 35%, rgba(0,255,136,0.35) 0%, rgba(0,180,80,0.15) 60%, rgba(0,80,40,0.05) 100%)",
                border: "1.5px solid rgba(0,255,136,0.55)",
                boxShadow: "0 0 12px rgba(0,255,136,0.25)",
                transition: "box-shadow 0.1s",
                pointerEvents: "none",
              }}
            />
          </div>
          <div style={{
            textAlign: "center",
            fontSize: 9,
            color: "rgba(0,255,136,0.35)",
            fontFamily: "monospace",
            marginTop: 4,
            letterSpacing: "0.1em",
          }}>
            MOVE
          </div>
        </div>

        {/* ── Right: Action buttons ── */}
        <div
          className="absolute pointer-events-auto flex flex-col items-end"
          style={{ bottom: "var(--joy-pad)", right: "var(--joy-pad)", gap: "var(--joy-gap)" }}
        >
          {/* JUMP button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onJump(); }}
            onClick={onJump}
            className="active:scale-95 active:bg-cyan-500/20 transition-all duration-100 flex items-center justify-center outline-none select-none"
            style={{
              width: "var(--joy-btn)",
              height: "var(--joy-btn)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.07) 0%, rgba(0,80,120,0.02) 70%)",
              border: "1.5px solid rgba(0,212,255,0.28)",
              color: "rgba(0,212,255,0.65)",
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: "bold",
              letterSpacing: "0.1em",
              cursor: "pointer",
              touchAction: "none",
              backdropFilter: "blur(2px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 18 }}>▲</span>
              <span>JUMP</span>
            </div>
          </button>

          {/* ENTER / INTERACT button */}
          <button
            onTouchStart={(e) => { e.preventDefault(); onInteract(); }}
            onClick={onInteract}
            className="active:scale-95 active:bg-rose-500/20 transition-all duration-100 flex items-center justify-center outline-none select-none"
            style={{
              width: "var(--joy-btn)",
              height: "var(--joy-btn)",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 35% 35%, rgba(255,68,119,0.07) 0%, rgba(120,0,50,0.02) 70%)",
              border: "1.5px solid rgba(255,68,119,0.28)",
              color: "rgba(255,68,119,0.65)",
              fontFamily: "monospace",
              fontSize: 9,
              fontWeight: "bold",
              letterSpacing: "0.1em",
              cursor: "pointer",
              touchAction: "none",
              backdropFilter: "blur(2px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: 14 }}>⬡</span>
              <span>ENTER</span>
            </div>
          </button>
        </div>

        {/* ── Center-right hint: drag to look ── */}
        <div style={{
          position: "absolute",
          right: "var(--joy-pad)",
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
          pointerEvents: "none",
          opacity: 0.25,
        }}>
          <div style={{ fontSize: 18, color: "rgba(0,255,136,0.8)" }}>⟳</div>
          <div style={{ fontSize: 8, color: "rgba(0,255,136,0.8)", fontFamily: "monospace", letterSpacing: "0.08em" }}>DRAG<br/>LOOK</div>
        </div>
      </div>
    </>
  );
}
