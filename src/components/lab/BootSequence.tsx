import { useEffect, useState } from "react";

const LINES = [
  { t: "[ OK ] BIOS v3.14.159 — initializing kernel...", d: 120 },
  { t: "[ OK ] Mounting /dev/satish on /lab", d: 80 },
  { t: "[ OK ] Loading WebGL context [GPU: detected]", d: 140 },
  { t: "[ OK ] Compiling GLSL shaders ... 4/4", d: 180 },
  { t: "[ OK ] Allocating particle buffer (4096)", d: 100 },
  { t: "[ OK ] Patching reality matrix ...", d: 220 },
  { t: "[ OK ] CLI daemon listening on :stdin", d: 80 },
  { t: "[ >> ] handshake complete. welcome, operator.", d: 300 },
];

export function BootSequence({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let timerId: any = null;
    let i = 0;
    const next = () => {
      if (cancelled || i >= LINES.length) {
        timerId = setTimeout(() => !cancelled && onDone(), 600);
        return;
      }
      const currentLine = LINES[i];
      setShown((s) => [...s, currentLine.t]);
      setProgress(Math.round(((i + 1) / LINES.length) * 100));
      i++;
      timerId = setTimeout(next, currentLine.d);
    };
    next();
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[100] bg-background text-primary font-mono text-xs md:text-sm p-6 md:p-10 overflow-hidden crt-flicker">
      <div className="grid-bg absolute inset-0 opacity-40" />
      <div className="relative max-w-3xl">
        <div className="mb-6 text-glow text-primary">
          <span className="opacity-60">satish@lab</span>:<span className="text-accent">~</span># ./boot --verbose
        </div>
        {shown.map((line, idx) => (
          <div key={idx} className="text-glow text-primary/90 leading-relaxed">
            {line}
          </div>
        ))}
        <div className="mt-6 w-full max-w-md">
          <div className="flex justify-between text-terminal-dim mb-1">
            <span>SYSTEM_LOAD</span>
            <span>{progress.toString().padStart(3, "0")}%</span>
          </div>
          <div className="h-1 bg-primary/10 border border-primary/30">
            <div
              className="h-full bg-primary text-glow transition-all duration-200"
              style={{ width: `${progress}%`, boxShadow: "0 0 8px currentColor" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
