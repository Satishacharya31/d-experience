import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  fetchProjects,
  upsertProject,
  deleteProject,
  type ProjectRow,
} from "@/lib/projects.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "// ADMIN — THE_LAB" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Draft = Omit<ProjectRow, "id"> & { id?: string };

const emptyDraft = (): Draft => ({
  slug: "",
  title: "",
  description: "",
  tags: [],
  url: null,
  repo: null,
  cover_image: null,
  status: "live",
  year: new Date().getFullYear(),
  featured: false,
  sort_order: 0,
});

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function AdminPage() {
  const navigate = useNavigate();
  const upsertFn = useServerFn(upsertProject);
  const deleteFn = useServerFn(deleteProject);
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [tagInput, setTagInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      navigate({ to: "/login" });
      return;
    }

    const payload = parseJwt(token);
    if (!payload || payload.role !== "admin") {
      setIsAdmin(false);
      setReady(true);
      return;
    }

    setEmail(payload.email ?? "admin");
    setIsAdmin(true);

    // Load projects
    fetchProjects()
      .then((data) => {
        setRows(data);
        setReady(true);
      })
      .catch((err) => {
        console.error("Fetch projects failed, redirecting to login:", err);
        localStorage.removeItem("admin_token");
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const refresh = async () => {
    try {
      const data = await fetchProjects();
      setRows(data);
    } catch (e) {
      setMsg(`! refresh failed: ${(e as Error).message}`);
    }
  };

  const startEdit = (p: ProjectRow) => {
    setDraft({ ...p });
    setTagInput(p.tags.join(", "));
    setMsg(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const reset = () => {
    setDraft(emptyDraft());
    setTagInput("");
  };

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const tags = tagInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        ...draft,
        tags,
        url: draft.url || null,
        repo: draft.repo || null,
        cover_image: draft.cover_image || null,
        year: draft.year ?? null,
      };
      await upsertFn({ data: payload });
      setMsg("> saved successfully.");
      reset();
      await refresh();
    } catch (e) {
      setMsg(`! ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      await refresh();
      if (draft.id === id) reset();
    } catch (e) {
      setMsg(`! ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const signOut = () => {
    localStorage.removeItem("admin_token");
    navigate({ to: "/login" });
  };

  if (!ready) {
    return (
      <main className="min-h-screen bg-background text-primary font-mono p-8 scanlines">
        <div className="text-xs text-terminal-dim">// booting admin shell…</div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-background text-primary font-mono p-8 scanlines">
        <div className="text-xs text-destructive mb-2">// ACCESS_DENIED</div>
        <p className="text-sm text-terminal-dim">Signed in as {email} — not an admin.</p>
        <button onClick={signOut} className="mt-4 text-xs underline">$ logout</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-primary font-mono scanlines pb-12">
      <header className="border-b border-primary/20 p-4 md:p-6 flex items-center justify-between text-xs bg-black/40 backdrop-blur">
        <div>
          <div className="text-glow text-base font-bold">// ADMIN_CONSOLE</div>
          <div className="text-terminal-dim mt-0.5">uplink: {email}</div>
        </div>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-glow text-primary transition-colors">$ / (return_to_world)</Link>
          <button onClick={signOut} className="hover:text-destructive text-primary cursor-pointer transition-colors">$ logout</button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid lg:grid-cols-12 gap-6 mt-4">
        {/* Editor Form - Left column (lg:col-5) */}
        <section className="lg:col-span-5 border border-primary/30 p-5 bg-black/50 backdrop-blur relative">
          <div className="absolute top-0 right-0 bg-primary/10 border-l border-b border-primary/30 px-3 py-1 text-[10px] text-primary">
            {draft.id ? "EDIT_MODE" : "CREATE_MODE"}
          </div>
          <div className="text-glow text-sm font-bold mb-4 border-b border-primary/20 pb-2">
            {draft.id ? "› edit_project_payload" : "› register_new_project"}
          </div>

          <div className="space-y-4 text-xs">
            <Field label="project_title">
              <input className={inputCls} value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Cyberpunk Voxel Engine" />
            </Field>

            <Field label="slug (unique key, e.g. voxel-world)">
              <input className={inputCls} value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="a-z0-9- only" />
            </Field>

            <Field label="description">
              <textarea rows={3} className={inputCls} value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Describe the project..." />
            </Field>

            <Field label="tags (comma separated)">
              <input className={inputCls} value={tagInput}
                onChange={(e) => setTagInput(e.target.value)} placeholder="webgl, react, three.js, shaders" />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="demo_url">
                <input className={inputCls} value={draft.url ?? ""}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://..." />
              </Field>
              <Field label="repository_url">
                <input className={inputCls} value={draft.repo ?? ""}
                  onChange={(e) => setDraft({ ...draft, repo: e.target.value })} placeholder="https://github.com/..." />
              </Field>
            </div>

            <Field label="cover_image_url">
              <input className={inputCls} value={draft.cover_image ?? ""}
                onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })} placeholder="https://..." />
            </Field>

            <div className="grid grid-cols-3 gap-3">
              <Field label="deployment_status">
                <select className={`${inputCls} bg-black h-8`} value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                  <option value="live">live</option>
                  <option value="beta">beta</option>
                  <option value="dev">dev</option>
                  <option value="archived">archived</option>
                </select>
              </Field>
              <Field label="development_year">
                <input type="number" className={inputCls} value={draft.year ?? ""}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="sort_order">
                <input type="number" className={inputCls} value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
              </Field>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none border border-primary/20 p-2 hover:border-primary/50 transition-colors">
              <input type="checkbox" className="accent-primary" checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} />
              <span className="text-[11px] text-primary/80">FEATURED_PROJECT (highlight in portal)</span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button disabled={busy} onClick={save}
                className="border border-primary bg-primary/10 text-primary text-glow font-bold px-4 py-2 hover:bg-primary hover:text-background transition-all disabled:opacity-50 cursor-pointer text-xs uppercase tracking-wider">
                {busy ? "Executing..." : draft.id ? "$ update" : "$ create"}
              </button>
              <button onClick={reset} className="border border-primary/30 px-3 py-2 text-terminal-dim hover:text-primary transition-colors cursor-pointer text-xs">
                $ reset
              </button>
              {msg && <span className={`text-[10px] ${msg.startsWith("!") ? "text-destructive" : "text-primary"}`}>{msg}</span>}
            </div>
          </div>
        </section>

        {/* Database List & Preview Cards - Right column (lg:col-7) */}
        <section className="lg:col-span-7 border border-primary/30 p-5 bg-black/50 backdrop-blur">
          <div className="flex items-baseline justify-between mb-4 border-b border-primary/20 pb-2">
            <div className="text-glow text-sm font-bold">// registered_projects</div>
            <div className="text-xs text-terminal-dim font-bold">Total: {rows.length}</div>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {rows.map((p) => {
              const statusColor = p.status === "live" ? "border-green-400 text-green-400 bg-green-950/20" :
                                  p.status === "beta" ? "border-cyan-400 text-cyan-400 bg-cyan-950/20" :
                                  "border-yellow-500 text-yellow-500 bg-yellow-950/20";
              return (
                <div key={p.id} className="border border-primary/20 hover:border-primary/50 bg-black/30 p-4 transition-all relative group flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-glow text-base font-bold text-primary">{p.title}</span>
                        <span className="text-terminal-dim text-xs">/{p.slug}</span>
                        {p.featured && (
                          <span className="border border-accent text-accent px-1.5 py-0.2 text-[8px] tracking-wide uppercase bg-accent/5">featured</span>
                        )}
                        <span className={`border px-1.5 py-0.2 text-[8px] tracking-wide uppercase font-bold rounded-sm ${statusColor}`}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-primary/70 text-xs mt-1.5 leading-relaxed line-clamp-2">
                        {p.description || "— No description payload provided —"}
                      </p>
                      {p.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {p.tags.map((t) => (
                            <span key={t} className="text-[9px] border border-primary/20 px-2 py-0.5 text-terminal-dim rounded-sm">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 text-right">
                      <button onClick={() => startEdit(p)} className="text-xs text-primary hover:text-glow font-bold underline transition-colors cursor-pointer">edit</button>
                      <button onClick={() => remove(p.id)} className="text-xs text-destructive hover:text-red-400 underline transition-colors cursor-pointer mt-1">del</button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-primary/10 flex items-center justify-between text-[9px] text-terminal-dim">
                    <div>Year: {p.year ?? "N/A"} · Sort Order: {p.sort_order}</div>
                    <div className="flex gap-3">
                      {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="hover:text-primary underline">live_link</a>}
                      {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" className="hover:text-primary underline">repo_link</a>}
                    </div>
                  </div>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="py-12 text-center text-terminal-dim border border-dashed border-primary/20">
                <p className="text-sm">// No projects indexed in Neon DB admins database.</p>
                <p className="text-[10px] mt-2 text-primary/60">Create one using the form on the left to start.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const inputCls =
  "w-full bg-black border border-primary/30 px-3 py-1.5 text-primary text-xs outline-none focus:border-primary focus:border-glow transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-terminal-dim text-[10px] font-bold block mb-1 uppercase tracking-wider">{label}</span>
      <div>{children}</div>
    </label>
  );
}
