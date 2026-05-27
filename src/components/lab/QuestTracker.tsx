import { useState } from "react";

export function QuestTracker() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Sleek circular help button in bottom-right corner */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 40,
          width: 36,
          height: 36,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: 16,
          fontWeight: "bold",
          color: "#00ff88",
          background: "rgba(4,7,10,0.85)",
          border: "1.5px solid rgba(0,255,136,0.5)",
          boxShadow: "0 0 10px rgba(0,255,136,0.25)",
          cursor: "pointer",
          backdropFilter: "blur(6px)",
          outline: "none",
          transition: "transform 0.15s ease, border-color 0.15s ease",
        }}
        className="hover:scale-105 active:scale-95 text-glow"
        title="Controls Help"
      >
        ?
      </button>

      {/* Compact High-tech cyberpunk modal overlay */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(3, 5, 8, 0.78)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setIsOpen(false)} // Close on backdrop click
        >
          {/* Modal Container */}
          <div
            style={{
              background: "rgba(4, 7, 10, 0.94)",
              border: "1.5px solid rgba(0, 255, 136, 0.45)",
              boxShadow: "0 0 30px rgba(0, 255, 136, 0.18)",
              padding: "20px 24px",
              width: "90%",
              maxWidth: "340px",
              fontFamily: "monospace",
              color: "#fff",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent close on card click
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,255,136,0.18)", paddingBottom: 10, marginBottom: 14 }}>
              <span className="text-glow" style={{ fontSize: 10.5, color: "#00ff88", fontWeight: "bold", letterSpacing: "0.15em" }}>
                // SYSTEM_CONTROLS
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  fontSize: 9,
                  color: "rgba(0,255,136,0.5)",
                  cursor: "pointer",
                  background: "rgba(0,255,136,0.06)",
                  border: "1px solid rgba(0,255,136,0.2)",
                  padding: "4px 8px",
                  borderRadius: "2px",
                }}
                className="hover:text-primary transition-colors"
              >
                [✕ CLOSE]
              </button>
            </div>

            {/* Content: Operational Controls */}
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: 9.5 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#00d4ff", width: 95, flexShrink: 0 }}>[W][A][S][D]</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>MOVE CHARACTER</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#00d4ff", width: 95, flexShrink: 0 }}>[DRAG MOUSE]</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>LOOK & ADJUST AIM</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#00d4ff", width: 95, flexShrink: 0 }}>[CLICK / F]</span>
                  <span style={{ color: "#00ff88", fontWeight: "bold" }}>FIRE LASER BLASTER</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#00d4ff", width: 95, flexShrink: 0 }}>[SPACEBAR]</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>JUMP (DBL JUMP OK)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#00d4ff", width: 95, flexShrink: 0 }}>[TILDE ~]</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>OPEN TERMINAL CLI</span>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ color: "#00d4ff", width: 95, flexShrink: 0 }}>[M]</span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>TOGGLE AUDIO MUTE</span>
                </div>
              </div>

              <div style={{ marginTop: 16, fontSize: 8.5, color: "rgba(0, 255, 136, 0.4)", lineHeight: "1.45", borderTop: "1px solid rgba(0,255,136,0.1)", paddingTop: 8 }}>
                * Approach custom towers and press E (or ENTER key) to expand panels.
                <br />
                * Shoot glowing world shards to collect datashards.
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
