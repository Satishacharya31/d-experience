import { useEffect, useState } from "react";

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

// Dynamic rolling hacker telemetry data stream
function useDataStream() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const generate = () => {
      const hex1 = "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase();
      const hex2 = "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase();
      const hex3 = "0x" + Math.floor(Math.random() * 0xffffffff).toString(16).toUpperCase();
      setLines([
        "0x" + Date.now().toString(16).toUpperCase().slice(-10),
        `RX_PORT // 0x1F8B`,
        `TX_GATE // ${hex1}`,
        `SYS_SIG // ${hex2}`,
        `D_STREAM // ${hex3}`
      ]);
    };
    generate();
    const id = setInterval(generate, 1600); // Shift data stream every 1.6s
    return () => clearInterval(id);
  }, []);
  return lines;
}

export function HUD() {
  const fps = useFps();
  const dataLines = useDataStream();

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

      {/* Top-right: active dynamic telemetry data stream */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-20 text-[10px] md:text-xs text-terminal-dim font-mono text-right leading-none pointer-events-none flex flex-col gap-1">
        <div className="text-glow text-accent mb-1">// DATA_STREAM</div>
        {dataLines.map((line, idx) => (
          <div
            key={idx}
            className={`${
              idx === 0
                ? "text-primary text-sm md:text-base font-bold text-glow"
                : "text-primary/40 text-[8px] md:text-[9.5px] tracking-wide"
            }`}
            style={{ textShadow: idx === 0 ? "0 0 5px rgba(0, 255, 136, 0.4)" : "none" }}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Bottom-left: brand */}
      <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-20 text-[10px] md:text-xs text-terminal-dim font-mono pointer-events-none">
        <div>SATISH // THE_LAB</div>
        <div>v0.1.0-alpha</div>
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
