import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  fetchProjects,
  upsertProject,
  deleteProject,
  type ProjectRow,
} from "@/lib/projects.functions";
import { FolderGit2, Sparkles, Activity, Plus, Trash2, Edit3, ExternalLink, LogOut, Globe } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard — Admin Console" },
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
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
      setMsg({ type: "error", text: `Refresh failed: ${(e as Error).message}` });
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
      setMsg({ type: "success", text: "Project saved successfully." });
      reset();
      await refresh();
    } catch (e) {
      setMsg({ type: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    setBusy(true);
    try {
      await deleteFn({ data: { id } });
      await refresh();
      if (draft.id === id) reset();
      setMsg({ type: "success", text: "Project deleted." });
    } catch (e) {
      setMsg({ type: "error", text: (e as Error).message });
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
      <main className="min-h-screen bg-white flex items-center justify-center font-sans">
        <div className="text-slate-400 text-sm animate-pulse">Loading dashboard...</div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-8 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-100 p-6 shadow-sm text-center">
          <div className="text-red-500 font-bold text-lg mb-2">Access Denied</div>
          <p className="text-slate-500 text-sm mb-6">Signed in as {email} — not an administrator.</p>
          <button onClick={signOut} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-sm font-medium transition-all">
            Logout
          </button>
        </div>
      </main>
    );
  }

  // Derived Metrics
  const featuredCount = rows.filter(r => r.featured).length;
  const liveCount = rows.filter(r => r.status === "live").length;

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans antialiased">
      {/* SaaS Navigation Header */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="font-bold text-slate-900 tracking-tight">Satish Acharya</div>
            <div className="text-[10px] text-slate-400 font-medium">Uplinked: {email}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <ExternalLink className="h-4 w-4" />
            <span>Visit Portfolio</span>
          </Link>
          <div className="h-4 w-px bg-slate-200" />
          <button onClick={signOut} className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5 cursor-pointer">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Metric Cards Banner */}
        <section className="grid sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{rows.length}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mt-1.5">Total Projects</div>
            </div>
          </div>

          <div className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{featuredCount}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mt-1.5">Featured Showcase</div>
            </div>
          </div>

          <div className="bg-slate-50/60 rounded-xl border border-slate-200/60 p-5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900 leading-none">{liveCount}</div>
              <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider mt-1.5">Active Deployments</div>
            </div>
          </div>
        </section>

        {/* Form and List Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Form (Sleek Slate/Indigo Card) */}
          <section className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-600" />
                <span>{draft.id ? "Edit Project Details" : "Create New Project"}</span>
              </h2>
              {draft.id && (
                <button onClick={reset} className="text-xs text-indigo-600 hover:underline">
                  Clear Draft
                </button>
              )}
            </div>

            <div className="space-y-4">
              <Field label="Project Title">
                <input className={inputCls} value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Cyberpunk Voxel Engine" />
              </Field>

              <Field label="URL Slug (unique routing key)">
                <input className={inputCls} value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="e.g. voxel-world" />
              </Field>

              <Field label="Short Project Description">
                <textarea rows={3} className={inputCls} value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Summarize what this project achieves..." />
              </Field>

              <Field label="Tags (comma separated)">
                <input className={inputCls} value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)} placeholder="webgl, react, three.js, shaders" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Live Demo URL">
                  <input className={inputCls} value={draft.url ?? ""}
                    onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://demo.com" />
                </Field>
                <Field label="GitHub Repository">
                  <input className={inputCls} value={draft.repo ?? ""}
                    onChange={(e) => setDraft({ ...draft, repo: e.target.value })} placeholder="https://github.com/..." />
                </Field>
              </div>

              <Field label="Cover Image URL">
                <input className={inputCls} value={draft.cover_image ?? ""}
                  onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })} placeholder="https://..." />
              </Field>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Deployment Status">
                  <select className={`${inputCls} bg-white h-9`} value={draft.status}
                    onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                    <option value="live">live</option>
                    <option value="beta">beta</option>
                    <option value="dev">dev</option>
                    <option value="archived">archived</option>
                  </select>
                </Field>
                <Field label="Launch Year">
                  <input type="number" className={inputCls} value={draft.year ?? ""}
                    onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })} />
                </Field>
                <Field label="Display Priority">
                  <input type="number" className={inputCls} value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
                </Field>
              </div>

              <label className="flex items-center gap-3 select-none border border-slate-100 rounded-lg p-3 hover:bg-slate-50 transition-colors cursor-pointer">
                <input type="checkbox" className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer" checked={draft.featured}
                  onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} />
                <div>
                  <div className="text-xs font-semibold text-slate-800">Featured Showcase Project</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pins this project to the top display grids in the portfolio.</div>
                </div>
              </label>

              <div className="flex items-center gap-3 pt-3">
                <button disabled={busy} onClick={save}
                  className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg px-5 py-2.5 font-medium transition-all shadow-xs text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 flex items-center gap-1.5">
                  <span>{draft.id ? "Update Project" : "Publish Project"}</span>
                </button>
                <button onClick={reset} className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg px-4 py-2.5 font-medium transition-all text-xs cursor-pointer">
                  Reset
                </button>
              </div>

              {msg && (
                <div className={`text-xs p-3 rounded-lg border mt-2 ${
                  msg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  {msg.text}
                </div>
              )}
            </div>
          </section>

          {/* Right Panel: Project Management Table & Grid (Sleek List View) */}
          <section className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-base">
                <span>Manage Registered Projects</span>
              </h2>
              <span className="text-xs text-slate-400 font-semibold bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">
                {rows.length} Active Records
              </span>
            </div>

            <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
              {rows.map((p) => {
                const statusColor = p.status === "live" ? "bg-emerald-100/70 text-emerald-800 border-emerald-200" :
                                    p.status === "beta" ? "bg-sky-100/70 text-sky-800 border-sky-200" :
                                    "bg-amber-100/70 text-amber-800 border-amber-200";
                return (
                  <div key={p.id} className="border border-slate-200 rounded-xl hover:border-slate-300 bg-white p-4 transition-all relative flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-sm tracking-tight">{p.title}</h3>
                          <span className="text-slate-400 text-xs font-medium">/{p.slug}</span>
                          {p.featured && (
                            <span className="border border-amber-200 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wide uppercase">Featured</span>
                          )}
                          <span className={`border px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wide uppercase ${statusColor}`}>
                            {p.status}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1.5 leading-relaxed line-clamp-2">
                          {p.description || "No description provided."}
                        </p>
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {p.tags.map((t) => (
                              <span key={t} className="text-[9px] font-medium bg-slate-50 border border-slate-200/50 px-2 py-0.5 text-slate-400 rounded-md">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => startEdit(p)} className="h-8 w-8 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 bg-white flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer">
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => remove(p.id)} className="h-8 w-8 rounded-lg border border-red-200 hover:border-red-300 text-red-500 hover:text-red-700 bg-red-50/50 hover:bg-red-50 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <div>
                        Display priority: <span className="text-slate-700 font-bold">{p.sort_order}</span> · Year: <span className="text-slate-700 font-bold">{p.year ?? "N/A"}</span>
                      </div>
                      <div className="flex gap-4">
                        {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700 underline font-bold">Launch Demo</a>}
                        {p.repo && <a href={p.repo} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700 underline font-bold">Source Code</a>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {rows.length === 0 && (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <p className="text-sm font-medium">No database records registered.</p>
                  <p className="text-xs mt-1 text-slate-300">Create a project using the editor panel to get started.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

const inputCls =
  "w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 text-xs outline-none focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-slate-500 text-[10px] font-bold block mb-1.5 uppercase tracking-wider">{label}</span>
      <div>{children}</div>
    </label>
  );
}
