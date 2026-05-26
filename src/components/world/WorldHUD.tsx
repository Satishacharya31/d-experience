import type { ZoneId } from "./Buildings";

export function WorldHUD({ zone, cliOpen }: { zone: ZoneId | null; cliOpen: boolean }) {
  return (
    <>
      {/* controls bottom-center */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-[10px] md:text-xs font-mono text-terminal-dim text-center">
        <div className="flex gap-3 md:gap-4 justify-center flex-wrap px-3">
          <Key k="WASD" label="move" />
          <Key k="MOUSE" label="look" />
          <Key k="SPACE" label="jump" />
          <Key k="E" label="enter" />
          <Key k="`" label={cliOpen ? "close cli" : "open cli"} />
        </div>
      </div>

      {/* zone prompt center-bottom-ish */}
      {zone && (
        <div className="fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="border border-primary px-4 py-2 bg-background/80 backdrop-blur text-primary font-mono text-xs md:text-sm text-glow"
            style={{ boxShadow: "0 0 20px oklch(0.88 0.22 145 / 0.35)" }}>
            › press <span className="text-accent">[E]</span> to enter {zone.toUpperCase()}
          </div>
        </div>
      )}
    </>
  );
}

function Key({ k, label }: { k: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="border border-primary/50 px-1.5 py-0.5 text-primary">{k}</span>
      <span>{label}</span>
    </span>
  );
}
