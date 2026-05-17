import { Q as reactExports, I as jsxRuntimeExports } from "./server-BtD0xwrV.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const LINES = [
  { t: "[ OK ] BIOS v3.14.159 — initializing kernel...", d: 120 },
  { t: "[ OK ] Mounting /dev/satish on /lab", d: 80 },
  { t: "[ OK ] Loading WebGL context [GPU: detected]", d: 140 },
  { t: "[ OK ] Compiling GLSL shaders ... 4/4", d: 180 },
  { t: "[ OK ] Allocating particle buffer (4096)", d: 100 },
  { t: "[ OK ] Patching reality matrix ...", d: 220 },
  { t: "[ OK ] CLI daemon listening on :stdin", d: 80 },
  { t: "[ >> ] handshake complete. welcome, operator.", d: 300 }
];
function BootSequence({ onDone }) {
  const [shown, setShown] = reactExports.useState([]);
  const [progress, setProgress] = reactExports.useState(0);
  reactExports.useEffect(() => {
    let cancelled = false;
    let i = 0;
    const next = () => {
      if (cancelled || i >= LINES.length) {
        setTimeout(() => !cancelled && onDone(), 600);
        return;
      }
      setShown((s) => [...s, LINES[i].t]);
      setProgress(Math.round((i + 1) / LINES.length * 100));
      const d = LINES[i].d;
      i++;
      setTimeout(next, d);
    };
    next();
    return () => {
      cancelled = true;
    };
  }, [onDone]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-[100] bg-background text-primary font-mono text-xs md:text-sm p-6 md:p-10 overflow-hidden crt-flicker", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid-bg absolute inset-0 opacity-40" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-3xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 text-glow text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "opacity-60", children: "satish@lab" }),
        ":",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent", children: "~" }),
        "# ./boot --verbose"
      ] }),
      shown.map((line, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-glow text-primary/90 leading-relaxed", children: line }, idx)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 w-full max-w-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-terminal-dim mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "SYSTEM_LOAD" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            progress.toString().padStart(3, "0"),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 bg-primary/10 border border-primary/30", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "h-full bg-primary text-glow transition-all duration-200",
            style: { width: `${progress}%`, boxShadow: "0 0 8px currentColor" }
          }
        ) })
      ] })
    ] })
  ] });
}
function useHexClock() {
  const [v, setV] = reactExports.useState("");
  reactExports.useEffect(() => {
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
  const [fps, setFps] = reactExports.useState(60);
  reactExports.useEffect(() => {
    let raf = 0;
    let frames = 0;
    let last = performance.now();
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1e3) {
        setFps(Math.round(frames * 1e3 / (now - last)));
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
function HUD() {
  const hex = useHexClock();
  const fps = useFps();
  const [stream, setStream] = reactExports.useState([]);
  reactExports.useEffect(() => {
    const gen = () => Array.from(
      { length: 8 },
      () => Math.random().toString(16).slice(2, 10).toUpperCase()
    );
    setStream(gen());
    const id = setInterval(() => setStream(gen()), 400);
    return () => clearInterval(id);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed top-4 left-4 md:top-6 md:left-6 z-20 text-[10px] md:text-xs text-primary/80 font-mono leading-tight pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-glow text-primary mb-1", children: "// SYS_MONITOR" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "STATUS .... ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "ONLINE" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "FPS ....... ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: fps < 30 ? "text-destructive" : "text-primary", children: fps.toString().padStart(3, "0") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "UPLINK .... ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent", children: "SECURE" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "NODE ...... satish.com.np" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed top-4 right-4 md:top-6 md:right-6 z-20 text-[10px] md:text-xs text-terminal-dim font-mono text-right leading-tight pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-glow text-accent mb-1", children: "// DATA_STREAM" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-primary text-glow text-sm md:text-base mb-2", children: hex }),
      stream.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { opacity: 1 - i * 0.1 }, children: s }, i))
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-4 left-4 md:bottom-6 md:left-6 z-20 text-[10px] md:text-xs text-terminal-dim font-mono pointer-events-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "SATISH // THE_LAB" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        "v0.1.0-alpha · build ",
        (Date.now() % 9999).toString().padStart(4, "0")
      ] })
    ] }),
    ["tl", "tr", "bl", "br"].map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `fixed z-20 w-6 h-6 md:w-8 md:h-8 border-primary/60 pointer-events-none ${p === "tl" ? "top-2 left-2 border-t border-l" : p === "tr" ? "top-2 right-2 border-t border-r" : p === "bl" ? "bottom-2 left-2 border-b border-l" : "bottom-2 right-2 border-b border-r"}`
      },
      p
    ))
  ] });
}
const PROJECTS = [
  { name: "neural-canvas", desc: "GPU-accelerated drawing surface in WGSL" },
  { name: "shader-garden", desc: "Procedural flora rendered in real-time GLSL" },
  { name: "tcp-tomograph", desc: "Live packet visualizer over WebSockets" },
  { name: "lattice-os", desc: "Tiling window manager experiment in Rust" },
  { name: "drift-engine", desc: "2D physics + particle playground" }
];
const ABOUT = [
  "satish — engineer, tinkerer, signal-chaser.",
  "stack: typescript · rust · glsl · python",
  "interests: rendering, systems, ascii art, late-night refactors.",
  "based in kathmandu. accepting contract work."
];
const HELP = [
  "available commands:",
  "  help              — show this list",
  "  ls projects       — list projects",
  "  cat about.txt     — about me",
  "  contact           — reach out",
  "  whoami            — operator id",
  "  clear             — wipe terminal",
  "  matrix            — engage"
];
function CLI() {
  const [input, setInput] = reactExports.useState("");
  const [history, setHistory] = reactExports.useState([
    { kind: "raw", text: "type `help` for commands. arrow keys recall history." }
  ]);
  const [stack, setStack] = reactExports.useState([]);
  const [cursor, setCursor] = reactExports.useState(-1);
  const [open, setOpen] = reactExports.useState(true);
  const inputRef = reactExports.useRef(null);
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);
  reactExports.useEffect(() => {
    const focus = () => inputRef.current?.focus();
    focus();
    const onKey2 = (e) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        focus();
      }
    };
    window.addEventListener("keydown", onKey2);
    return () => window.removeEventListener("keydown", onKey2);
  }, []);
  const run = (raw) => {
    const cmd = raw.trim();
    if (!cmd) return;
    const out = [{ kind: "in", text: cmd }];
    const c = cmd.toLowerCase();
    if (c === "help") HELP.forEach((t) => out.push({ kind: "out", text: t }));
    else if (c === "ls projects" || c === "ls") {
      out.push({ kind: "out", text: "total " + PROJECTS.length });
      PROJECTS.forEach(
        (p) => out.push({ kind: "out", text: `drwxr-xr-x  satish  ${p.name.padEnd(18)} ${p.desc}` })
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
  const onKey = (e) => {
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
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setOpen(true),
        className: "fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 py-2 border border-primary/40 bg-background/80 backdrop-blur text-primary text-xs font-mono text-glow hover:bg-primary/10",
        children: "[ press / to open terminal ]"
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed bottom-0 left-0 right-0 z-30 px-4 pb-6 md:px-10 md:pb-10 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto pointer-events-auto", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: scrollRef,
        className: "max-h-56 md:max-h-72 overflow-y-auto mb-2 px-4 py-3 bg-background/70 backdrop-blur-md border border-primary/30 text-xs md:text-sm font-mono text-primary/90",
        style: { boxShadow: "0 0 30px oklch(0.88 0.22 145 / 0.15)" },
        children: history.map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: l.kind === "in" ? "text-accent text-glow" : l.kind === "err" ? "text-destructive" : l.kind === "raw" ? "text-terminal-dim italic" : "text-primary/90",
            children: l.kind === "in" ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "opacity-50", children: [
                ">",
                " "
              ] }),
              l.text
            ] }) : l.text
          },
          i
        ))
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex items-center gap-2 px-4 py-3 bg-background/80 backdrop-blur-md border border-primary text-glow",
        style: { boxShadow: "0 0 24px oklch(0.88 0.22 145 / 0.3)" },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-primary text-xs md:text-sm font-mono shrink-0", children: [
            "operator@satish.com.np:",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent", children: "~" }),
            "$"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              value: input,
              onChange: (e) => setInput(e.target.value),
              onKeyDown: onKey,
              spellCheck: false,
              autoComplete: "off",
              className: "flex-1 bg-transparent outline-none text-primary font-mono text-xs md:text-sm caret-primary",
              placeholder: "type a command..."
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-3 mt-3 text-[10px] md:text-xs font-mono text-terminal-dim", children: ["help", "ls projects", "cat about.txt", "contact"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => run(c),
        className: "px-2 py-1 border border-primary/20 hover:border-primary hover:text-primary hover:text-glow transition-colors",
        children: [
          "› ",
          c
        ]
      },
      c
    )) })
  ] }) });
}
const TITLE = "THE_LAB";
const SUB = "// experiments in rendering, systems & late-night code";
function CenterTitle() {
  const [shown, setShown] = reactExports.useState("");
  reactExports.useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(TITLE.slice(0, i));
      if (i >= TITLE.length) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-6 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] md:text-xs text-accent text-glow font-mono mb-4 tracking-[0.4em]", children: "SATISH.COM.NP" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "h1",
      {
        className: "text-5xl md:text-8xl font-mono font-bold text-primary text-glow tracking-tighter",
        style: { textShadow: "0 0 20px var(--terminal-green), 0 0 40px var(--terminal-green)" },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: shown.length < TITLE.length ? "blink-caret" : "", children: shown })
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-xs md:text-sm text-primary/70 font-mono max-w-md", children: SUB }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 text-[10px] md:text-xs text-terminal-dim font-mono animate-pulse", children: "↓ engage terminal below ↓" })
  ] });
}
function Cursor() {
  const dot = reactExports.useRef(null);
  const ring = reactExports.useRef(null);
  const pos = reactExports.useRef({ x: 0, y: 0 });
  const trail = reactExports.useRef({ x: 0, y: 0 });
  reactExports.useEffect(() => {
    const move = (e) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
    };
    window.addEventListener("pointermove", move);
    let raf = 0;
    const loop = () => {
      trail.current.x += (pos.current.x - trail.current.x) * 0.15;
      trail.current.y += (pos.current.y - trail.current.y) * 0.15;
      if (dot.current) {
        dot.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
      }
      if (ring.current) {
        ring.current.style.transform = `translate3d(${trail.current.x}px, ${trail.current.y}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: ring,
        className: "fixed top-0 left-0 z-[60] pointer-events-none w-8 h-8 -ml-4 -mt-4 border border-primary/70 rounded-full mix-blend-screen",
        style: { boxShadow: "0 0 12px var(--terminal-green)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: dot,
        className: "fixed top-0 left-0 z-[60] pointer-events-none w-1.5 h-1.5 -ml-[3px] -mt-[3px] bg-primary rounded-full",
        style: { boxShadow: "0 0 8px var(--terminal-green)" }
      }
    )
  ] });
}
const Scene = reactExports.lazy(() => import("./Scene-BPXjYS4v.js").then((m) => ({
  default: m.Scene
})));
function Index() {
  const [booted, setBooted] = reactExports.useState(false);
  const [mounted, setMounted] = reactExports.useState(false);
  reactExports.useEffect(() => setMounted(true), []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative min-h-screen bg-background overflow-hidden scanlines noise", children: [
    mounted && /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: null, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scene, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CenterTitle, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(HUD, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CLI, {}),
    mounted && /* @__PURE__ */ jsxRuntimeExports.jsx(Cursor, {}),
    !booted && /* @__PURE__ */ jsxRuntimeExports.jsx(BootSequence, { onDone: () => setBooted(true) })
  ] });
}
export {
  Index as component
};
