import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ADMIN_EMAIL = "admin@satish.com.np";
const ADMIN_PASSWORD = "satish@com";

export const Route = createFileRoute("/api/public/setup-admin")({
  server: {
    handlers: {
      GET: async () => {
        // Idempotent: bail if any admin already exists.
        const { count } = await supabaseAdmin
          .from("user_roles")
          .select("id", { count: "exact", head: true })
          .eq("role", "admin");

        if ((count ?? 0) > 0) {
          return Response.json({ ok: true, status: "already-initialized" });
        }

        // Try to find existing user with this email first.
        let userId: string | undefined;
        const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
        const match = existing?.users?.find((u) => u.email === ADMIN_EMAIL);
        if (match) {
          userId = match.id;
        } else {
          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
          });
          if (error) {
            return Response.json(
              { ok: false, error: error.message },
              { status: 500 },
            );
          }
          userId = data.user?.id;
        }

        if (!userId) {
          return Response.json({ ok: false, error: "no-user-id" }, { status: 500 });
        }

        const { error: roleError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });

        if (roleError && !roleError.message.includes("duplicate")) {
          return Response.json(
            { ok: false, error: roleError.message },
            { status: 500 },
          );
        }

        return Response.json({ ok: true, status: "initialized", userId });
      },
    },
  },
});
