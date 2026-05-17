import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "// LOGIN — THE_LAB" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    navigate({ to: "/admin" });
  };

  return (
    <main className="min-h-screen bg-background text-primary font-mono flex items-center justify-center px-4 scanlines">
      <div className="w-full max-w-sm border border-primary/40 bg-black/60 backdrop-blur p-6">
        <div className="text-xs text-terminal-dim mb-2">// AUTH_GATEWAY</div>
        <h1 className="text-2xl text-glow mb-6">access_terminal<span className="blink-caret">_</span></h1>

        <form onSubmit={onSubmit} className="space-y-4 text-sm">
          <label className="block">
            <span className="text-terminal-dim">email:</span>
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-black border border-primary/40 px-3 py-2 text-primary outline-none focus:border-primary"
              placeholder="user@host"
            />
          </label>
          <label className="block">
            <span className="text-terminal-dim">passphrase:</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-black border border-primary/40 px-3 py-2 text-primary outline-none focus:border-primary"
              placeholder="••••••••"
            />
          </label>
          {err && <div className="text-destructive text-xs">! {err}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full border border-primary text-primary text-glow py-2 hover:bg-primary hover:text-background transition-colors disabled:opacity-50"
          >
            {busy ? "authenticating…" : "$ sudo login"}
          </button>
        </form>

        <div className="mt-6 text-[10px] text-terminal-dim">
          <Link to="/" className="hover:text-primary">← return to lab</Link>
        </div>
      </div>
    </main>
  );
}
