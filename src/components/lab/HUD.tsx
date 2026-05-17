import { useEffect, useState } from "react";

function useHexClock() {
  const [v, setV] = useState("");
  useEffect(() => {
    const tick = () => {
      const n = Date.now();
      setV("0x" + n.toString(16).toUpperCase().slice(-10));
    };
    tick();
    const id = setInterval(tick, 73);
    return () => clearInterval(id);
  }, []);
  return v;
}

function useFps() {
  const [fps, setFps] = useState(60);
  useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

export function HUD() {
  const hex = useHexClock();
  const fps = useFps();
  const [stream, setStream] = useState<string[]>([]);

  useEffect(() => {
    const gen = () =>
      Array.from({ length: 8 }, () =>
        Math.random().toString(16).slice(2, 10).toUpperCase(),
      );
    setStream(gen());
    const id = setInterval(() => setStream(gen()), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Top-left: system status */}
      <div className="fixed top-4 left-4 md:top-6 md:left-6 z-20 text-[10px] md:text-xs text-primary/80 font-mono leading-tight pointer-events-none">
        <div className="text-glow text-primary mb-1">// SYS_MONITOR</div>
        <div>STATUS .... <span className="text-primary">ONLINE</span></div>
        <div>FPS ....... <span className={fps < 30 ? "text-destructive" : "text-primary"}>{fps.toString().padStart(3, "0")}</span></div>
        <div>UPLINK .... <span className="text-accent">SECURE</span></div>
        <div>NODE ...... satish.com.np</div>
      </div>

      {/* Top-right: data stream */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-20 text-[10px] md:text-xs text-terminal-dim font-mono text-right leading-tight pointer-events-none">
        <div className="text-glow text-accent mb-1">// DATA_STREAM</div>
        <div className="text-primary text-glow text-sm md:text-base mb-2">{hex}</div>
        {stream.map((s, i) => (
          <div key={i} style={{ opacity: 1 - i * 0.1 }}>
            {s}
          </div>
        ))}
      </div>

      {/* Bottom-left: brand */}
      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-20 text-[10px] md:text-xs text-terminal-dim font-mono pointer-events-none">
        <div>SATISH // THE_LAB</div>
        <div suppressHydrationWarning>v0.1.0-alpha · build {hex ? (parseInt(hex.slice(-4), 16) % 9999).toString().padStart(4, "0") : "0000"}</div>
      </div>

      {/* Corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((p) => (
        <div
          key={p}
          className={`fixed z-20 w-6 h-6 md:w-8 md:h-8 border-primary/60 pointer-events-none ${
            p === "tl" ? "top-2 left-2 border-t border-l" :
            p === "tr" ? "top-2 right-2 border-t border-r" :
            p === "bl" ? "bottom-2 left-2 border-b border-l" :
            "bottom-2 right-2 border-b border-r"
          }`}
        />
      ))}
    </>
  );
}
