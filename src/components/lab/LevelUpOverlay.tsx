import { useEffect, useState } from "react";
import { levelTitle } from "@/lib/gameStore";

interface LevelUpOverlayProps {
  level: number;
  onDone: () => void;
}

const STAT_UPGRADES: Record<number, string[]> = {
  2: ["SPEED: +5%", "DOUBLE_JUMP: UNLOCKED", "SCAN_RANGE: +10%"],
  3: ["XP_GAIN: +10%", "DASH: UNLOCKED", "SIGNAL_BOOST: +15%"],
  4: ["SPEED: +10%", "TRIPLE_JUMP: UNLOCKED", "FIREWALL: UPGRADED"],
  5: ["STEALTH: +20%", "OVERCLOCK: UNLOCKED", "NEURAL_LINK: ACTIVE"],
  6: ["SPEED: +15%", "PHANTOM_DASH: UNLOCKED", "GRID_HACK: ACTIVE"],
  7: ["OMNISCAN: ACTIVE", "GOD_MODE: PARTIAL", "MATRIX: REVEALED"],
  8: ["TRANSCENDENCE: ACHIEVED", "REALITY: REWRITTEN", "CYBER_DEITY: CONFIRMED"],
};

const DEFAULT_UPGRADES = ["SKILL_LEVEL: EXPANDED", "NEURAL_BANDWIDTH: +5%", "UPLINK: ENHANCED"];

export function LevelUpOverlay({ level, onDone }: LevelUpOverlayProps) {
  const [phase, setPhase] = useState<"flash" | "show" | "exit">("flash");
  const [visibleLines, setVisibleLines] = useState(0);
  const upgrades = STAT_UPGRADES[level] ?? DEFAULT_UPGRADES;
  const title = levelTitle(level);

  useEffect(() => {
    // Phase 1: Flash (glitch)
    const t1 = setTimeout(() => setPhase("show"), 350);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== "show") return;
    // Reveal lines one by one
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= upgrades.length + 3) clearInterval(interval); // +3 for header lines
    }, 140);
    // Auto-dismiss
    const t2 = setTimeout(() => setPhase("exit"), 4200);
    const t3 = setTimeout(() => onDone(), 4600);
    return () => {
      clearInterval(interval);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [phase, onDone, upgrades.length]);

  return (
    <div
      onClick={onDone}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          phase === "flash"
            ? "rgba(0,255,136,0.15)"
            : "rgba(4,7,10,0.88)",
        backdropFilter: "blur(8px)",
        transition: phase === "exit" ? "opacity 0.4s ease" : "background 0.3s ease",
        opacity: phase === "exit" ? 0 : 1,
        cursor: "pointer",
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,255,136,0.03) 2px, rgba(0,255,136,0.03) 3px)",
        }}
      />

      {/* Corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((p) => (
        <div
          key={p}
          style={{
            position: "absolute",
            width: 32,
            height: 32,
            ...(p === "tl" ? { top: 24, left: 24, borderTop: "2px solid #00ff88", borderLeft: "2px solid #00ff88" } :
              p === "tr" ? { top: 24, right: 24, borderTop: "2px solid #00ff88", borderRight: "2px solid #00ff88" } :
              p === "bl" ? { bottom: 24, left: 24, borderBottom: "2px solid #00ff88", borderLeft: "2px solid #00ff88" } :
              { bottom: 24, right: 24, borderBottom: "2px solid #00ff88", borderRight: "2px solid #00ff88" }),
            opacity: 0.6,
            animation: phase === "show" ? "none" : undefined,
          }}
        />
      ))}

      {/* Main content */}
      {phase !== "flash" && (
        <div
          style={{
            textAlign: "center",
            fontFamily: "monospace",
            padding: "40px 60px",
            border: "1px solid rgba(0,255,136,0.25)",
            background: "rgba(0,255,136,0.03)",
            boxShadow: "0 0 60px rgba(0,255,136,0.12), inset 0 0 40px rgba(0,255,136,0.03)",
            maxWidth: 480,
            width: "90vw",
          }}
        >
          {/* Tag */}
          {visibleLines >= 1 && (
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.3em",
                color: "rgba(0,255,136,0.5)",
                marginBottom: 12,
                animation: "fadeIn 0.3s ease",
              }}
            >
              ▸ SYSTEM_ALERT ◂
            </div>
          )}

          {/* Level label */}
          {visibleLines >= 2 && (
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.2em",
                color: "rgba(0,212,255,0.7)",
                marginBottom: 6,
                animation: "fadeIn 0.3s ease",
              }}
            >
              LEVEL {level} ACHIEVED
            </div>
          )}

          {/* Title */}
          {visibleLines >= 3 && (
            <div
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#00ff88",
                letterSpacing: "0.12em",
                textShadow: "0 0 8px #00ff88, 0 0 24px rgba(0,255,136,0.5), 0 0 48px rgba(0,255,136,0.25)",
                marginBottom: 24,
                animation: "fadeIn 0.3s ease",
              }}
            >
              {title.toUpperCase()}
            </div>
          )}

          {/* Divider */}
          {visibleLines >= 3 && (
            <div style={{ borderTop: "1px solid rgba(0,255,136,0.2)", marginBottom: 16 }} />
          )}

          {/* Stat upgrades */}
          {upgrades.map((stat, i) =>
            visibleLines >= i + 4 ? (
              <div
                key={stat}
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "rgba(0,255,136,0.8)",
                  marginBottom: 6,
                  animation: "fadeIn 0.25s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  justifyContent: "center",
                }}
              >
                <span style={{ color: "rgba(0,255,136,0.35)" }}>▸</span>
                {stat}
              </div>
            ) : null
          )}

          {/* Dismiss hint */}
          {visibleLines >= upgrades.length + 4 && (
            <div
              style={{
                marginTop: 20,
                fontSize: 9,
                color: "rgba(0,255,136,0.3)",
                letterSpacing: "0.15em",
                animation: "fadeIn 0.3s ease",
              }}
            >
              [ CLICK TO CONTINUE ]
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
