import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ZoneId } from "./Buildings";

type Project = { slug: string; title: string; description: string | null; url: string | null; tags: string[] | null };

export function ZonePanel({ zone, onClose }: { zone: ZoneId; onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (zone !== "projects") return;
    supabase
      .from("projects")
      .select("slug,title,description,url,tags")
      .order("sort_order", { ascending: true })
      .then(({ data }) => data && setProjects(data as Project[]));
  }, [zone]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/85 backdrop-blur-md p-4">
      <div
        className="relative w-full max-w-2xl border border-primary bg-background/95 text-primary font-mono p-6 md:p-8"
        style={{ boxShadow: "0 0 40px oklch(0.88 0.22 145 / 0.35)" }}
      >
        <div className="flex items-center justify-between mb-5 text-xs md:text-sm">
          <span className="text-glow">{titles[zone]}</span>
          <button onClick={onClose} className="text-terminal-dim hover:text-primary">[ esc · close ]</button>
        </div>

        {zone === "about" && (
          <div className="space-y-3 text-sm md:text-base">
            <h2 className="text-2xl md:text-3xl text-glow">Satish</h2>
            <p className="text-primary/80">engineer · tinkerer · signal-chaser</p>
            <p className="text-primary/70 leading-relaxed">
              I build immersive web experiences, rendering systems and late-night tools.
              Stack: typescript · rust · glsl · python. Based in Kathmandu, accepting contract work.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
              {[
                { k: "YEARS", v: "6+" },
                { k: "STACK", v: "TS/Rust/GLSL" },
                { k: "STATUS", v: "AVAILABLE" },
              ].map((s) => (
                <div key={s.k} className="border border-primary/30 p-3">
                  <div className="text-terminal-dim">{s.k}</div>
                  <div className="text-glow">{s.v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {zone === "projects" && (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {projects.length === 0 && <p className="text-terminal-dim text-sm">loading projects...</p>}
            {projects.map((p) => (
              <a
                key={p.slug}
                href={p.url ?? "#"}
                target={p.url ? "_blank" : undefined}
                rel="noreferrer"
                className="block border border-primary/30 hover:border-primary p-4 transition-colors group"
              >
                <div className="flex items-baseline justify-between">
                  <div className="text-glow text-base md:text-lg">{p.title}</div>
                  <div className="text-xs text-terminal-dim">/{p.slug}</div>
                </div>
                {p.description && <p className="text-primary/70 text-sm mt-1">{p.description}</p>}
                {p.tags && p.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {p.tags.map((t) => (
                      <span key={t} className="text-[10px] border border-primary/30 px-2 py-0.5 text-terminal-dim">{t}</span>
                    ))}
                  </div>
                )}
              </a>
            ))}
          </div>
        )}

        {zone === "skills" && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            {[
              "TypeScript", "React", "Three.js / R3F", "GLSL Shaders",
              "Rust", "Python", "Postgres", "WebGL", "Node",
              "TanStack", "Tailwind", "GSAP",
            ].map((s) => (
              <div key={s} className="border border-primary/30 p-3 text-glow">› {s}</div>
            ))}
          </div>
        )}

        {zone === "contact" && (
          <div className="space-y-2 text-sm md:text-base">
            <div>email .... <a className="text-glow underline" href="mailto:hello@satish.com.np">hello@satish.com.np</a></div>
            <div>github ... <a className="text-glow underline" href="https://github.com/satish" target="_blank" rel="noreferrer">github.com/satish</a></div>
            <div>x ........ <span className="text-glow">@satish</span></div>
            <div className="pt-3 text-terminal-dim text-xs">uplink secure · response within 24h</div>
          </div>
        )}
      </div>
    </div>
  );
}
