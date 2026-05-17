import { useEffect, useRef, useState, type KeyboardEvent } from "react";

type Line = { kind: "in" | "out" | "err" | "raw"; text: string };

const PROJECTS = [
  { name: "neural-canvas", desc: "GPU-accelerated drawing surface in WGSL" },
  { name: "shader-garden", desc: "Procedural flora rendered in real-time GLSL" },
  { name: "tcp-tomograph", desc: "Live packet visualizer over WebSockets" },
  { name: "lattice-os", desc: "Tiling window manager experiment in Rust" },
  { name: "drift-engine", desc: "2D physics + particle playground" },
];

const ABOUT = [
  "satish — engineer, tinkerer, signal-chaser.",
  "stack: typescript · rust · glsl · python",
  "interests: rendering, systems, ascii art, late-night refactors.",
  "based in kathmandu. accepting contract work.",
];

const HELP = [
  "available commands:",
  "  help              — show this list",
  "  ls projects       — list projects",
  "  cat about.txt     — about me",
  "  contact           — reach out",
  "  whoami            — operator id",
  "  clear             — wipe terminal",
  "  matrix            — engage",
];

export function CLI() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<Line[]>([
    { kind: "raw", text: "type `help` for commands. arrow keys recall history." },
  ]);
  const [stack, setStack] = useState<string[]>([]);
  const [cursor, setCursor] = useState(-1);
  const [open, setOpen] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const run = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const out: Line[] = [{ kind: "in", text: cmd }];
    const c = cmd.toLowerCase();

    if (c === "help") HELP.forEach((t) => out.push({ kind: "out", text: t }));
    else if (c === "ls projects" || c === "ls") {
      out.push({ kind: "out", text: "total " + PROJECTS.length });
      PROJECTS.forEach((p) =>
        out.push({ kind: "out", text: `drwxr-xr-x  satish  ${p.name.padEnd(18)} ${p.desc}` }),
      );
    } else if (c === "cat about.txt" || c === "about") {
      ABOUT.forEach((t) => out.push({ kind: "out", text: t }));
    } else if (c === "contact") {
      out.push({ kind: "out", text: "email .... hello@satish.com.np" });
      out.push({ kind: "out", text: "github ... github.com/satish" });
      out.push({ kind: "out", text: "x ........ @satish" });
    } else if (c === "whoami") {
      out.push({ kind: "out", text: "operator-7741 // session " + Math.random().toString(16).slice(2, 8) });
    } else if (c === "clear") {
      setHistory([]);
      setStack((s) => [cmd, ...s].slice(0, 50));
      setCursor(-1);
      return;
    } else if (c === "matrix") {
      out.push({ kind: "out", text: "engaging... follow the white rabbit." });
    } else if (c === "sudo rm -rf /") {
      out.push({ kind: "err", text: "nice try, operator." });
    } else {
      out.push({ kind: "err", text: `command not found: ${cmd}. try \`help\`.` });
    }

    setHistory((h) => [...h, ...out]);
    setStack((s) => [cmd, ...s].slice(0, 50));
    setCursor(-1);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      run(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(cursor + 1, stack.length - 1);
      setCursor(next);
      if (stack[next]) setInput(stack[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.max(cursor - 1, -1);
      setCursor(next);
      setInput(next === -1 ? "" : stack[next]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 border border-primary/40 bg-background/80 backdrop-blur text-primary text-xs font-mono text-glow hover:bg-primary/10"
      >
        [ press / to open terminal ]
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 md:px-10 md:pb-10 pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto">
        <div
          ref={scrollRef}
          className="max-h-56 md:max-h-72 overflow-y-auto mb-2 px-4 py-3 bg-background/70 backdrop-blur-md border border-primary/30 text-xs md:text-sm font-mono text-primary/90"
          style={{ boxShadow: "0 0 30px oklch(0.88 0.22 145 / 0.15)" }}
        >
          {history.map((l, i) => (
            <div
              key={i}
              className={
                l.kind === "in"
                  ? "text-accent text-glow"
                  : l.kind === "err"
                    ? "text-destructive"
                    : l.kind === "raw"
                      ? "text-terminal-dim italic"
                      : "text-primary/90"
              }
            >
              {l.kind === "in" ? <><span className="opacity-50">{">"} </span>{l.text}</> : l.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 bg-background/80 backdrop-blur-md border border-primary text-glow"
          style={{ boxShadow: "0 0 24px oklch(0.88 0.22 145 / 0.3)" }}>
          <span className="text-primary text-xs md:text-sm font-mono shrink-0">
            operator@satish.com.np:<span className="text-accent">~</span>$
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-primary font-mono text-xs md:text-sm caret-primary"
            placeholder="type a command..."
          />
        </div>

        {/* Quick links fallback */}
        <div className="flex flex-wrap gap-3 mt-3 text-[10px] md:text-xs font-mono text-terminal-dim">
          {["help", "ls projects", "cat about.txt", "contact"].map((c) => (
            <button
              key={c}
              onClick={() => run(c)}
              className="px-2 py-1 border border-primary/20 hover:border-primary hover:text-primary hover:text-glow transition-colors"
            >
              › {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
