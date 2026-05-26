import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { fetchProjects } from "@/lib/projects.functions";
import type { ZoneId } from "./Buildings";

type Project = { slug: string; title: string; description: string | null; url: string | null; tags: string[] | null };

export function ZonePanel({ zone, onClose }: { zone: ZoneId; onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const getProjects = useServerFn(fetchProjects);

  useEffect(() => {
    if (zone !== "projects") return;
    getProjects()
      .then((data) => data && setProjects(data as Project[]))
      .catch((err) => console.error("Error fetching projects:", err));
  }, [zone, getProjects]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => (e.key === "q" || e.key === "Q") && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const titles: Record<ZoneId, string> = {
    about: "// ABOUT_TOWER",
    projects: "// PROJECTS_HUB",
    skills: "// SKILLS_ARENA",
    contact: "// CONTACT_KIOSK",
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl border border-primary bg-background/95 text-primary font-mono p-6 md:p-8 animate-in zoom-in-95 duration-250 ease-out"
        style={{ boxShadow: "0 0 40px oklch(0.88 0.22 145 / 0.35)" }}
      >
        <div className="flex items-center justify-between mb-5 text-xs md:text-sm">
          <span className="text-glow font-bold">{titles[zone]}</span>
          <button onClick={onClose} className="text-terminal-dim hover:text-primary transition-colors cursor-pointer">[ Q · close ]</button>
        </div>

        {zone === "about" && (
          <div className="space-y-3 text-sm md:text-base animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl md:text-3xl text-glow font-bold">Satish</h2>
            <p className="text-primary/80">engineer · tinkerer · signal-chaser</p>
            <p className="text-primary/70 leading-relaxed text-xs md:text-sm">
              I build immersive web experiences, rendering systems and late-night tools.
              Stack: typescript · rust · glsl · python. Based in Kathmandu, accepting contract work.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-3 text-[10px] md:text-xs">
              {[
                { k: "YEARS", v: "6+" },
                { k: "STACK", v: "TS/Rust/GLSL" },
                { k: "STATUS", v: "AVAILABLE" },
              ].map((s) => (
                <div key={s.k} className="border border-primary/30 p-3 bg-black/20">
                  <div className="text-terminal-dim font-bold">{s.k}</div>
                  <div className="text-glow mt-1">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {zone === "projects" && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {projects.length === 0 && <p className="text-terminal-dim text-xs">scanning database payload...</p>}
            {projects.map((p) => (
              <a
                key={p.slug}
                href={p.url ?? "#"}
                target={p.url ? "_blank" : undefined}
                rel="noreferrer"
                className="block border border-primary/20 hover:border-primary/50 hover:bg-primary/5 p-4 transition-all group"
              >
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="text-glow text-sm md:text-base font-bold text-primary group-hover:text-glow">{p.title}</div>
                  <div className="text-[10px] text-terminal-dim">/{p.slug}</div>
                </div>
                {p.description && <p className="text-primary/70 text-xs mt-1.5 leading-relaxed">{p.description}</p>}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[9px] border border-primary/20 px-2 py-0.5 text-terminal-dim bg-black/10">{t}</span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        {zone === "skills" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs md:text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            {[
              "TypeScript", "React", "Three.js / R3F", "GLSL Shaders",
              "Rust", "Python", "Postgres", "WebGL", "Node",
              "TanStack", "Tailwind", "GSAP",
            ].map((s) => (
              <div key={s} className="border border-primary/30 hover:border-primary/60 p-3 text-glow bg-black/20 transition-all">› {s}</div>
            ))}
          </div>
        )}

        {zone === "contact" && (
          <div className="space-y-3 text-xs md:text-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="border border-primary/20 p-3 bg-black/20 space-y-2">
              <div>email .... <a className="text-glow underline hover:text-glow-accent" href="mailto:hello@satish.com.np">hello@satish.com.np</a></div>
              <div>github ... <a className="text-glow underline hover:text-glow-accent" href="https://github.com/satish" target="_blank" rel="noreferrer">github.com/satish</a></div>
              <div>x ........ <span className="text-glow">@satish</span></div>
            </div>
            <div className="pt-1 text-terminal-dim text-[10px] uppercase tracking-wider">uplink secure · response within 24h</div>
          </div>
        )}
      </div>
    </div>
  );
}
