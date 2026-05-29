import { useEffect, useState } from "react";
import type { ZoneId } from "./Buildings";

export function WorldHUD({
  zone,
  cliOpen,
  onToggleCli,
}: {
  zone: ZoneId | null;
  cliOpen: boolean;
  onToggleCli?: () => void;
}) {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    setIsTouch(navigator.maxTouchPoints > 0 || "ontouchstart" in window);
  }, []);

  return (
    <>
      {/* CLI toggle button — bottom-left, above joystick area */}
      <div
        className="fixed z-30 pointer-events-none"
        style={{
          bottom: isTouch ? "calc(var(--joy-base, 100px) + var(--joy-pad, 12px) + 36px)" : "56px",
          left: isTouch ? "calc(var(--joy-base, 100px) + var(--joy-pad, 12px) + 8px)" : "16px",
        }}
      >
        <button
          onClick={onToggleCli}
          onTouchStart={(e) => {
            e.preventDefault();
            onToggleCli?.();
          }}
          className="pointer-events-auto cursor-pointer flex items-center gap-1.5 border border-primary/20 bg-background/35 backdrop-blur-sm rounded hover:border-primary/50 hover:bg-background/60 active:scale-95 transition-all text-primary/75 outline-none select-none"
          style={{
            padding: isTouch ? "6px 10px" : "6px 10px",
            fontSize: isTouch ? 9 : 10,
            boxShadow: "0 0 10px rgba(0, 255, 136, 0.05)",
          }}
        >
          {!isTouch && (
            <span className="border border-primary/40 px-1.5 py-0.5 text-primary rounded bg-primary/10 font-bold font-mono" style={{ fontSize: 9 }}>
              `
            </span>
          )}
          <span className="tracking-wider uppercase font-semibold font-mono">
            {cliOpen ? "CLOSE CLI" : "CLI"}
          </span>
        </button>
      </div>

      {/* Zone prompt — center of screen, above joystick */}
      {zone && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none"
          style={{ bottom: isTouch ? "calc(var(--joy-base, 100px) + var(--joy-pad, 12px) + 8px)" : "80px" }}
        >
          <div
            className="border border-primary px-3 py-1.5 bg-background/80 backdrop-blur text-primary font-mono text-glow"
            style={{
              boxShadow: "0 0 20px oklch(0.88 0.22 145 / 0.35)",
              fontSize: isTouch ? 10 : 12,
              letterSpacing: "0.05em",
            }}
          >
            {isTouch ? (
              <>› tap <span style={{ color: "oklch(0.88 0.22 145)" }}>[ENTER]</span> to open · tap outside to close</>
            ) : (
              <>› press <span style={{ color: "oklch(0.88 0.22 145)" }}>[E]</span> to enter {zone.toUpperCase()} · <span style={{ color: "oklch(0.88 0.22 145)" }}>[Q]</span> to exit</>
            )}
          </div>
        </div>
      )}
    </>
  );
}
