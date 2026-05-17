import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        navigate({ to: "/login" });
        return;
      }
      setEmail(user.email ?? null);
      const { data: roleRow } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!roleRow) {
        setReady(true);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(true);
      setRows(await fetchProjects());
      setReady(true);
    })();
  }, [navigate]);

  const refresh = async () => setRows(await fetchProjects());

  const startEdit = (p: ProjectRow) => {
    setDraft({ ...p });
    setTagInput(p.tags.join(", "));
    setMsg(null);
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
      setMsg("> saved.");
      reset();
      await refresh();
    } catch (e) {
      setMsg(`! ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("delete this project?")) return;
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

  const signOut = async () => {
    await supabase.auth.signOut();
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
        <p className="text-sm text-terminal-dim">signed in as {email} — not an admin.</p>
        <button onClick={signOut} className="mt-4 text-xs underline">$ logout</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-primary font-mono scanlines">
      <header className="border-b border-primary/30 p-4 md:p-6 flex items-center justify-between text-xs">
        <div>
          <div className="text-glow text-base">// ADMIN_CONSOLE</div>
          <div className="text-terminal-dim">{email}</div>
        </div>
        <div className="flex gap-4">
          <Link to="/" className="hover:text-glow">$ /</Link>
          <button onClick={signOut} className="hover:text-destructive">$ logout</button>
        </div>
      </header>

      <div className="p-4 md:p-6 grid lg:grid-cols-2 gap-6">
        {/* Editor */}
        <section className="border border-primary/30 p-4 bg-black/40">
          <div className="text-glow text-sm mb-3">
            {draft.id ? "// edit_project" : "// new_project"}
          </div>
          <div className="space-y-3 text-xs">
            <Field label="title">
              <input className={inputCls} value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </Field>
            <Field label="slug (a-z0-9-)">
              <input className={inputCls} value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </Field>
            <Field label="description">
              <textarea rows={3} className={inputCls} value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label="tags (comma separated)">
              <input className={inputCls} value={tagInput}
                onChange={(e) => setTagInput(e.target.value)} placeholder="webgl, react, shaders" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="url">
                <input className={inputCls} value={draft.url ?? ""}
                  onChange={(e) => setDraft({ ...draft, url: e.target.value })} />
              </Field>
              <Field label="repo">
                <input className={inputCls} value={draft.repo ?? ""}
                  onChange={(e) => setDraft({ ...draft, repo: e.target.value })} />
              </Field>
            </div>
            <Field label="cover_image url">
              <input className={inputCls} value={draft.cover_image ?? ""}
                onChange={(e) => setDraft({ ...draft, cover_image: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="status">
                <input className={inputCls} value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
              </Field>
              <Field label="year">
                <input type="number" className={inputCls} value={draft.year ?? ""}
                  onChange={(e) => setDraft({ ...draft, year: e.target.value ? Number(e.target.value) : null })} />
              </Field>
              <Field label="sort">
                <input type="number" className={inputCls} value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} />
              </Field>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })} />
              <span>featured</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button disabled={busy} onClick={save}
                className="border border-primary px-3 py-1 hover:bg-primary hover:text-background">
                {busy ? "…" : draft.id ? "$ update" : "$ create"}
              </button>
              <button onClick={reset} className="border border-primary/40 px-3 py-1 text-terminal-dim">
                $ reset
              </button>
              {msg && <span className="self-center">{msg}</span>}
            </div>
          </div>
        </section>

        {/* List */}
        <section className="border border-primary/30 p-4 bg-black/40">
          <div className="text-glow text-sm mb-3">// projects ({rows.length})</div>
          <ul className="text-xs divide-y divide-primary/20">
            {rows.map((p) => (
              <li key={p.id} className="py-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-primary">{p.title} <span className="text-terminal-dim">/ {p.slug}</span></div>
                  <div className="text-terminal-dim truncate">{p.description || "—"}</div>
                  <div className="text-accent text-[10px]">{p.tags.join(" · ")}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(p)} className="text-primary hover:text-glow">edit</button>
                  <button onClick={() => remove(p.id)} className="text-destructive">del</button>
                </div>
              </li>
            ))}
            {rows.length === 0 && (
              <li className="py-4 text-terminal-dim">no projects yet — create one →</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}

const inputCls =
  "w-full bg-black border border-primary/40 px-2 py-1 text-primary outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-terminal-dim">{label}:</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
