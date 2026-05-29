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
  return (
    <>
      {/* CLI hint key bottom-left corner stacked cleanly above brand */}
      <div className="fixed bottom-14 left-4 md:left-6 z-30 pointer-events-none text-[10px] md:text-xs font-mono">
        <button
          onClick={onToggleCli}
          onTouchStart={(e) => {
            e.preventDefault();
            onToggleCli?.();
          }}
          className="pointer-events-auto cursor-pointer flex items-center gap-1.5 px-2.5 py-1.5 border border-primary/20 bg-background/35 backdrop-blur-sm rounded hover:border-primary/50 hover:bg-background/60 active:scale-95 transition-all text-primary/75 outline-none select-none"
          style={{
            boxShadow: "0 0 10px rgba(0, 255, 136, 0.05)",
          }}
        >
          <span className="border border-primary/40 px-1.5 py-0.5 text-primary rounded bg-primary/10 font-bold font-mono">`</span>
          <span className="tracking-wider uppercase font-semibold text-[9px] md:text-[10px]">{cliOpen ? "close_cli" : "open_cli"}</span>
        </button>
      </div>

      {/* zone prompt center-bottom-ish */}
      {zone && (
        <div className="fixed bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="border border-primary px-4 py-2 bg-background/80 backdrop-blur text-primary font-mono text-xs md:text-sm text-glow"
            style={{ boxShadow: "0 0 20px oklch(0.88 0.22 145 / 0.35)" }}>
            › press <span className="text-accent">[E]</span> to enter {zone.toUpperCase()} · <span className="text-accent">[Q]</span> to exit
          </div>
        </div>
      )}
    </>
  );
}
