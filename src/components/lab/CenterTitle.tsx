import { useEffect, useState } from "react";

const TITLE = "THE_LAB";
const SUB = "// experiments in rendering, systems & late-night code";

export function CenterTitle() {
  const [shown, setShown] = useState("");

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(TITLE.slice(0, i));
      if (i >= TITLE.length) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6 text-center">
      <div className="text-[10px] md:text-xs text-accent text-glow font-mono mb-4 tracking-[0.4em]">
        SATISH.COM.NP
      </div>
      <h1
        className="text-5xl md:text-8xl font-mono font-bold text-primary text-glow tracking-tighter"
        style={{ textShadow: "0 0 20px var(--terminal-green), 0 0 40px var(--terminal-green)" }}
      >
        <span className={shown.length < TITLE.length ? "blink-caret" : ""}>{shown}</span>
      </h1>
      <p className="mt-4 text-xs md:text-sm text-primary/70 font-mono max-w-md">{SUB}</p>
      <div className="mt-8 text-[10px] md:text-xs text-terminal-dim font-mono animate-pulse">
        ↓ engage terminal below ↓
      </div>
    </div>
  );
}
