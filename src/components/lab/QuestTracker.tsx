import { useEffect, useState, useRef } from "react";
import { gameStore, type GameState, type Quest, xpForLevel, levelTitle } from "@/lib/gameStore";

function formatMs(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const mm = Math.floor((ms % 1000) / 10);
  return `${m > 0 ? m + "m " : ""}${s.toString().padStart(2, "0")}.${mm.toString().padStart(2, "0")}s`;
}

function QuestRow({ quest }: { quest: Quest }) {
  const zoneColors: Record<string, string> = {
    visit_about:    "#00ff88",
    visit_projects: "#00d4ff",
    visit_skills:   "#ffb800",
    visit_contact:  "#ff4477",
    first_jump:     "#88ffaa",
    open_cli:       "#ff88ff",
    collect_all_shards: "#ffff00",
  };
  const color = zoneColors[quest.id] ?? "#00ff88";

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span
        style={{ color: quest.done ? color : "rgba(255,255,255,0.25)", fontSize: 11, flexShrink: 0 }}
      >
        {quest.done ? "◆" : "◇"}
      </span>
      <span
        style={{
          fontSize: 9,
          fontFamily: "monospace",
          color: quest.done ? `${color}cc` : "rgba(255,255,255,0.3)",
          textDecoration: quest.done ? "line-through" : "none",
          letterSpacing: "0.06em",
          flex: 1,
        }}
      >
        {quest.label}
      </span>
      <span style={{ fontSize: 9, color: quest.done ? `${color}88` : "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>
        +{quest.xp}XP
      </span>
    </div>
  );
}

export function QuestTracker() {
  const [gs, setGs] = useState<GameState>(() => gameStore.get());
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const unsub = gameStore.subscribe(setGs);
    return unsub;
  }, []);

  // Speedrun timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (gs.speedrunStart && !gs.speedrunFinished) {
      timerRef.current = setInterval(() => {
        setElapsed(Date.now() - (gs.speedrunStart ?? Date.now()));
      }, 37);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [gs.speedrunStart, gs.speedrunFinished]);

  const xpNeeded = xpForLevel(gs.level);
  const xpPrev = gs.level > 1 ? xpForLevel(gs.level - 1) : 0;
  const xpProgress = Math.min(
    ((gs.xp - xpPrev) / Math.max(xpNeeded - xpPrev, 1)) * 100,
    100
  );

  const shardsCollected = gs.collectedShards.length;
  const totalShards = gs.totalShards;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: 80,
          left: 24,
          zIndex: 21,
          fontSize: 9,
          fontFamily: "monospace",
          color: "rgba(0,255,136,0.5)",
          letterSpacing: "0.1em",
          background: "rgba(4,7,10,0.7)",
          border: "1px solid rgba(0,255,136,0.2)",
          padding: "4px 8px",
          cursor: "pointer",
        }}
      >
        // QUESTS ▶
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 88,
        left: 16,
        zIndex: 21,
        width: 210,
        fontFamily: "monospace",
        pointerEvents: "auto",
      }}
    >
      {/* Panel */}
      <div
        style={{
          background: "rgba(4,7,10,0.82)",
          border: "1px solid rgba(0,255,136,0.2)",
          backdropFilter: "blur(8px)",
          padding: "10px 12px",
          boxShadow: "0 0 20px rgba(0,255,136,0.08)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: "rgba(0,255,136,0.8)", letterSpacing: "0.14em" }}>
            // QUEST_LOG
          </span>
          <button
            onClick={() => setOpen(false)}
            style={{ fontSize: 9, color: "rgba(0,255,136,0.3)", cursor: "pointer", background: "none", border: "none" }}
          >
            ✕
          </button>
        </div>

        {/* XP Bar */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontSize: 8, color: "rgba(0,255,136,0.5)", letterSpacing: "0.1em" }}>
              LV.{gs.level} {levelTitle(gs.level).toUpperCase()}
            </span>
            <span style={{ fontSize: 8, color: "rgba(0,255,136,0.4)" }}>
              {gs.xp}/{xpNeeded}XP
            </span>
          </div>
          <div style={{ height: 3, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.15)" }}>
            <div
              style={{
                height: "100%",
                width: `${xpProgress}%`,
                background: "linear-gradient(90deg, #00ff88, #00d4ff)",
                boxShadow: "0 0 8px rgba(0,255,136,0.6)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Quests */}
        <div style={{ marginBottom: 8 }}>
          {gs.quests.map((q) => (
            <QuestRow key={q.id} quest={q} />
          ))}
        </div>

        {/* Datashard counter */}
        <div
          style={{
            borderTop: "1px solid rgba(0,255,136,0.1)",
            paddingTop: 6,
            marginBottom: 6,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,0,0.7)", letterSpacing: "0.08em" }}>
              ◈ DATASHARDS
            </span>
            <span style={{ fontSize: 9, color: shardsCollected === totalShards ? "#ffff00" : "rgba(255,255,0,0.4)" }}>
              {shardsCollected}/{totalShards}
            </span>
          </div>
          {/* Shard pips */}
          <div style={{ display: "flex", gap: 3, marginTop: 4, flexWrap: "wrap" }}>
            {Array.from({ length: totalShards }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: gs.collectedShards.includes(i)
                    ? "#ffff00"
                    : "rgba(255,255,0,0.12)",
                  border: `1px solid ${gs.collectedShards.includes(i) ? "#ffff0088" : "rgba(255,255,0,0.2)"}`,
                  boxShadow: gs.collectedShards.includes(i) ? "0 0 6px #ffff0088" : "none",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        {/* Speedrun Timer */}
        <div style={{ borderTop: "1px solid rgba(0,255,136,0.1)", paddingTop: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 8, color: "rgba(0,255,136,0.4)", letterSpacing: "0.1em" }}>SPEEDRUN</span>
            {gs.speedrunFinished ? (
              <span style={{ fontSize: 9, color: "#00ff88", fontWeight: "bold", textShadow: "0 0 8px #00ff88" }}>
                ✓ {formatMs(gs.speedrunBest ?? 0)}
              </span>
            ) : gs.speedrunStart ? (
              <span style={{ fontSize: 9, color: "rgba(0,212,255,0.8)", fontVariantNumeric: "tabular-nums" }}>
                {formatMs(elapsed)}
              </span>
            ) : (
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>--:--.--</span>
            )}
          </div>
          {gs.speedrunBest && !gs.speedrunFinished && (
            <div style={{ fontSize: 8, color: "rgba(0,255,136,0.3)", marginTop: 2 }}>
              PB: {formatMs(gs.speedrunBest)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
